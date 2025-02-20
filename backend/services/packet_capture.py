import pyshark
import requests
import json
import logging
import threading
from datetime import datetime
import netifaces

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_default_interface():
    try:
        if os.name == 'posix':
            default_gw = netifaces.gateways()['default']
            if default_gw and netifaces.AF_INET in default_gw:
                return default_gw[netifaces.AF_INET][1]
            return 'eth0'
        elif os.name == 'nt':
            return 'Ethernet'
        else:
            return 'en0'
    except Exception as e:
        logger.warning(f"Error detecting default interface: {e}")
        return 'eth0'

class NetworkMonitor:
    def __init__(self, interface=None):
        self.interface = interface or get_default_interface()
        self.capture = None
        self.is_running = False
        self.packet_buffer = []
        self.captured_packets = []
        self.express_url = 'http://localhost:5001/api/packets/batch'
        self.capture_thread = None
        logger.info(f"Initialized NetworkMonitor with interface: {self.interface}")

    def start_monitoring(self):
        if self.is_running:
            logger.warning("Monitoring is already running")
            return

        self.is_running = True
        
        def capture_thread():
            logger.info(f"Starting packet capture on interface: {self.interface}")
            try:
                self.capture = pyshark.LiveCapture(interface=self.interface)
                for packet in self.capture.sniff_continuously():
                    if not self.is_running:
                        break
                    self.process_packet(packet)
            except Exception as e:
                logger.error(f"Capture error: {e}")
                self.is_running = False
            finally:
                if self.packet_buffer:
                    self.send_packets_to_express()
                logger.info("Capture thread terminated")
        
        self.capture_thread = threading.Thread(target=capture_thread)
        self.capture_thread.daemon = True
        self.capture_thread.start()
        logger.info("Monitoring started successfully")

    def stop_monitoring(self):
        if not self.is_running:
            logger.warning("Monitoring is not running")
            return

        self.is_running = False
        if self.capture:
            self.capture.close()
        
        if self.capture_thread:
            self.capture_thread.join(timeout=2)
        
        if self.packet_buffer:
            self.send_packets_to_express()
        
        logger.info("Packet capture stopped successfully")

    def process_packet(self, packet):
        try:
            if hasattr(packet, 'ip'):
                source_ip = getattr(packet.ip, 'src', None)
                dest_ip = getattr(packet.ip, 'dst', None)
                
                if not all([source_ip, dest_ip]):
                    logger.debug("Skipping packet with missing IP information")
                    return

                packet_data = {
                    'protocol': packet.highest_layer,
                    'source_ip': source_ip,
                    'dest_ip': dest_ip,
                    'length': int(packet.length),
                    'packet_type': packet.highest_layer,
                    'source_port': getattr(packet.tcp, 'srcport', None) if hasattr(packet, 'tcp') else None,
                    'dest_port': getattr(packet.tcp, 'dstport', None) if hasattr(packet, 'tcp') else None,
                    'timestamp': datetime.now().isoformat()
                }

                self.packet_buffer.append(packet_data)
                self.captured_packets.append(packet_data)
                
                if len(self.packet_buffer) >= 100:
                    self.send_packets_to_express()
                
        except Exception as e:
            logger.error(f"Error processing packet: {e}")

    def send_packets_to_express(self):
        if not self.packet_buffer:
            return

        try:
            response = requests.post(
                self.express_url,
                json=self.packet_buffer,
                headers={'Content-Type': 'application/json'},
                timeout=5  # Add timeout
            )
            
            if response.status_code == 201:
                logger.info(f"Successfully sent {len(self.packet_buffer)} packets to Express")
                self.packet_buffer = []
            else:
                logger.error(f"Failed to send packets. Status: {response.status_code}, Response: {response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending packets to Express: {e}")

    def get_captured_packets(self):
        return self.captured_packets

    def get_interface_info(self):
        return {
            'current_interface': self.interface,
            'is_running': self.is_running,
            'captured_packets_count': len(self.captured_packets),
            'buffered_packets_count': len(self.packet_buffer)
        }

    @staticmethod
    def get_available_interfaces():
        try:
            capture = pyshark.LiveCapture()
            return capture.interfaces
        except Exception as e:
            logger.error(f"Error getting available interfaces: {e}")
            return []
