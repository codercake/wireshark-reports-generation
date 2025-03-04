import pyshark
import threading
import logging
import json
import requests
from datetime import datetime

# Configure logging
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
        self.alerts = []  # Store alerts here

    def start_monitoring(self):
        self.is_monitoring = True
        self.captured_packets = []
        self.alerts = []
        self.packet_buffer = []

        # Initialize the capture with specified options
        self.capture = pyshark.LiveCapture(
            interface=self.interface,
            bpf_filter='ip',  # Capture only IP packets
            display_filter=''   # No display filter initially
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
                    break  # Stop if monitoring is stopped

                self.process_packet(packet)

        except Exception as e:
            logger.error(f"Packet capture error: {e}")

    def process_packet(self, packet):
        try:
            if hasattr(packet, 'ip'):
                source_ip = getattr(packet.ip, 'src', None)
                dest_ip = getattr(packet.ip, 'dst', None)

                if not all([source_ip, dest_ip]):
                    logger.debug("Skipping packet with missing IP information")
                    return

                timestamp = datetime.now()

                # Check if TCP or UDP layers are present
                tcp_present = hasattr(packet, 'tcp')
                udp_present = hasattr(packet, 'udp')

                packet_data = {
                    'protocol': packet.highest_layer,
                    'source_ip': source_ip,
                    'dest_ip': dest_ip,
                    'length': int(packet.length),
                    'packet_type': packet.highest_layer,
                    'source_port': getattr(packet.tcp, 'srcport', None) if tcp_present else getattr(packet.udp, 'srcport', None) if udp_present else None,
                    'dest_port': getattr(packet.tcp, 'dstport', None) if tcp_present else getattr(packet.udp, 'dstport', None) if udp_present else None,
                    'timestamp': timestamp.isoformat(),
                    'request_uri': getattr(packet.http, 'request_uri', None) if hasattr(packet, 'http') else None,
                    'response_code': getattr(packet.http, 'response_code', None) if hasattr(packet, 'http') else None,
                    'flags': getattr(packet.tcp, 'flags', None) if tcp_present else None,
                }

                self.packet_buffer.append(packet_data)
                self.captured_packets.append(packet_data)

                if len(self.packet_buffer) >= 100:
                    self.send_packets_to_express()

                # Attack Detection Integration
                alerts = self.analyze_packet(packet_data)

                # Store alerts
                if alerts:
                    with self.lock:
                        self.alerts.extend(alerts)

        except Exception as e:
            logger.error(f"Error processing packet: {e}")

    def analyze_packet(self, packet_data):
        from backend.services.attack_detection.brute_force import BruteForceDetector
        from backend.services.attack_detection.ddos import DDoSDetector
        from backend.services.attack_detection.sql_injection import SQLInjectionDetector
        from backend.services.attack_detection.tcp_flood import TCPFloodDetector
        from backend.services.attack_detection.port_scanning import PortScanDetector

        brute_force_detector = BruteForceDetector()
        ddos_detector = DDoSDetector()
        sql_injection_detector = SQLInjectionDetector()
        tcp_flood_detector = TCPFloodDetector()
        port_scan_detector = PortScanDetector()

        brute_force_alerts = brute_force_detector.start_detection([packet_data])
        ddos_alerts = ddos_detector.detect_ddos([packet_data])
        sql_injection_alerts = sql_injection_detector.detect_sql_injection([packet_data])
        tcp_flood_alerts = tcp_flood_detector.detect_tcp_flood([packet_data])
        port_scan_alerts = port_scan_detector.detect_port_scan([packet_data])

        # Combine and return alerts
        alerts = []
        alerts.extend(brute_force_alerts)
        alerts.extend(ddos_alerts)
        alerts.extend(sql_injection_alerts)
        alerts.extend(tcp_flood_alerts)
        alerts.extend(port_scan_alerts)

        # Log Alerts
        for alert in alerts:
            logger.warning(f"Alert: {alert}")

        return alerts

    def get_captured_packets(self):
        with self.lock:
            return self.captured_packets

    def send_packets_to_express(self):
        try:
            headers = {'Content-Type': 'application/json'}
            data = json.dumps(self.packet_buffer)  # Convert packet_buffer to JSON string
            response = requests.post(EXPRESS_APP_URL, data=data, headers=headers)

            if response.status_code == 200:
                logger.info('Packets sent to Express app successfully')
            else:
                logger.error(f'Failed to send packets to Express app. Status code: {response.status_code}, Response: {response.text}')

        except requests.exceptions.RequestException as e:
            logger.error(f'Request failed: {e}')
        except Exception as e:
            logger.error(f"Error sending packets: {e}")
        finally:
            self.packet_buffer = []

    def get_alerts(self):
        with self.lock:
            return list(self.alerts)  # Return a copy of the alerts

    @staticmethod
    def get_available_interfaces():
        return pyshark.util.list_interfaces()

# Example Usage:
if __name__ == '__main__':
    # Set up basic logging to console for this standalone execution
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    # Replace 'eth0' with your network interface
    interface_name = 'eth0'
    try:
        monitor = NetworkMonitor(interface=interface_name)
        monitor.start_monitoring()

        input("Press Enter to stop monitoring...\n")
        monitor.stop_monitoring()

        print("Monitoring stopped.")

    except Exception as e:
        logger.error(f"Error during monitoring: {e}")
