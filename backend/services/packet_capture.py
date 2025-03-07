import pyshark
import threading
import logging
import json
import requests
from datetime import datetime
import pyshark
import threading
import logging
import json
import requests
from datetime import datetime
from services.attack_detection.brute_force import BruteForceDetector
from services.attack_detection.ddos import DDoSDetector
from services.attack_detection.sql_injection import SQLInjectionDetector
from services.attack_detection.tcp_flood import TCPFloodDetector
from services.attack_detection.port_scanning import PortScanDetector

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

EXPRESS_APP_URL = 'http://localhost:3001/api/packets'

class NetworkMonitor:
    def __init__(self, interface):
        self.interface = interface
        self.capture = None
        self.captured_packets = []
        self.is_monitoring = False
        self.packet_buffer = []
        self.lock = threading.Lock()
        self.alerts = []
        
        # Initialize detectors
        self.brute_force_detector = BruteForceDetector()
        self.ddos_detector = DDoSDetector()
        self.sql_injection_detector = SQLInjectionDetector()
        self.tcp_flood_detector = TCPFloodDetector()
        self.port_scan_detector = PortScanDetector()

    def start_monitoring(self):
        self.is_monitoring = True
        self.captured_packets = []
        self.alerts = []
        self.packet_buffer = []

        self.capture = pyshark.LiveCapture(
            interface=self.interface,
            bpf_filter='ip',
            display_filter=''
        )
        
        capture_thread = threading.Thread(target=self._capture_packets)
        capture_thread.daemon = True
        capture_thread.start()

    def stop_monitoring(self):
        self.is_monitoring = False
        if self.capture:
            try:
                self.capture.close()
            except Exception as e:
                logger.error(f"Error stopping capture: {e}")
            finally:
                self.capture = None

    def _capture_packets(self):
        try:
            for packet in self.capture.sniff_continuously():
                if not self.is_monitoring:
                    break
                self.process_packet(packet)
        except Exception as e:
            logger.error(f"Packet capture error: {e}")

    def process_packet(self, packet):
        try:
            if hasattr(packet, 'ip'):
                source_ip = getattr(packet.ip, 'src', None)
                dest_ip = getattr(packet.ip, 'dst', None)

                if not all([source_ip, dest_ip]):
                    return

                timestamp = datetime.now()
                tcp_present = hasattr(packet, 'tcp')
                udp_present = hasattr(packet, 'udp')

                # Extract TCP flags if present
                tcp_flags = None
                if tcp_present:
                    tcp_flags = {
                        'syn': bool(int(packet.tcp.flags_syn)),
                        'ack': bool(int(packet.tcp.flags_ack)),
                        'rst': bool(int(packet.tcp.flags_reset)),
                        'fin': bool(int(packet.tcp.flags_fin))
                    }

                packet_data = {
                    'protocol': packet.highest_layer,
                    'source_ip': source_ip,
                    'dest_ip': dest_ip,
                    'length': int(packet.length),
                    'packet_type': packet.highest_layer,
                    'source_port': getattr(packet.tcp, 'srcport', None) if tcp_present else getattr(packet.udp, 'srcport', None) if udp_present else None,
                    'dest_port': getattr(packet.tcp, 'dstport', None) if tcp_present else getattr(packet.udp, 'dstport', None) if udp_present else None,
                    'timestamp': timestamp.isoformat(),
                    'flags': tcp_flags,
                    'window_size': getattr(packet.tcp, 'window_size', None) if tcp_present else None,
                    'request_uri': getattr(packet.http, 'request_uri', None) if hasattr(packet, 'http') else None,
                    'response_code': getattr(packet.http, 'response_code', None) if hasattr(packet, 'http') else None
                }

                self.packet_buffer.append(packet_data)
                self.captured_packets.append(packet_data)

                if len(self.packet_buffer) >= 50:
                    alerts = self.analyze_packets(self.packet_buffer)
                    self.send_packets_to_express()
                    
                    if alerts:
                        with self.lock:
                            self.alerts.extend(alerts)

        except Exception as e:
            logger.error(f"Error processing packet: {e}")

    def analyze_packets(self, packets):
        alerts = []
        alerts.extend(self.brute_force_detector.start_detection(packets))
        alerts.extend(self.ddos_detector.detect_ddos(packets))
        alerts.extend(self.sql_injection_detector.detect_sql_injection(packets))
        alerts.extend(self.tcp_flood_detector.detect_tcp_flood(packets))
        alerts.extend(self.port_scan_detector.detect_port_scan(packets))

        for alert in alerts:
            logger.warning(f"Alert: {alert}")

        return alerts

    def send_packets_to_express(self):
        try:
            headers = {'Content-Type': 'application/json'}
            data = json.dumps(self.packet_buffer)
            response = requests.post(EXPRESS_APP_URL, data=data, headers=headers)

            if response.status_code == 200:
                logger.info('Packets sent to Express app successfully')
            else:
                logger.error(f'Failed to send packets. Status: {response.status_code}, Response: {response.text}')

        except requests.exceptions.RequestException as e:
            logger.error(f'Request failed: {e}')
        except Exception as e:
            logger.error(f"Error sending packets: {e}")
        finally:
            self.packet_buffer = []

    def get_captured_packets(self):
        with self.lock:
            return self.captured_packets

    def get_alerts(self):
        with self.lock:
            return list(self.alerts)

    @staticmethod
    def get_available_interfaces():
        return pyshark.util.list_interfaces()
