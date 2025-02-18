import pyshark
import requests
import json
import logging
import threading
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NetworkMonitor:
    def __init__(self, interface='en0'):
        self.interface = interface
        self.capture = None
        self.is_running = False
        self.packet_buffer = []
        self.captured_packets = []
        self.express_url = 'http://localhost:5001/api/packets/batch'

    def start_monitoring(self):
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
            finally:
                # Send remaining packets only if the capture was stopped correctly
                if self.packet_buffer:
                    self.send_packets_to_express()
        
        self.capture_thread = threading.Thread(target=capture_thread)
        self.capture_thread.daemon = True  # Set the thread as a daemon
        self.capture_thread.start()

    def stop_monitoring(self):
        self.is_running = False
        if self.capture:
            self.capture.close()
        logger.info("Packet capture stopped")
        
        # Send remaining packets after stopping the capture
        if self.packet_buffer:
            self.send_packets_to_express()

    def process_packet(self, packet):
        try:
            if hasattr(packet, 'ip'):
                # Safely access fields using getattr to avoid NoneType errors
                source_ip = getattr(packet.ip, 'src', None)
                dest_ip = getattr(packet.ip, 'dst', None)
                
                # Check for None values before proceeding
                if source_ip is None or dest_ip is None:
                    logger.warning("Source or Destination IP is None")
                    return  # Skip processing this packet
                
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
                # Append to buffers
                self.packet_buffer.append(packet_data)
                self.captured_packets.append(packet_data)
                logger.info(f"Captured packet: {packet_data}")  # Log captured packet
                
                # Send packets to express if buffer reaches a certain size
                if len(self.packet_buffer) >= 100:
                    self.send_packets_to_express()
        except Exception as e:
            logger.error(f"Error processing packet: {e}")

    def send_packets_to_express(self):
        if self.packet_buffer:
            try:
                response = requests.post(
                    self.express_url,
                    json=self.packet_buffer,
                    headers={'Content-Type': 'application/json'}
                )
                if response.status_code == 201:
                    logger.info(f"Successfully sent {len(self.packet_buffer)} packets to Express")
                    self.packet_buffer = []  # Clear the buffer after sending
                else:
                    logger.error(f"Failed to send packets. Status: {response.status_code}")
            except Exception as e:
                logger.error(f"Error sending packets to Express: {e}")

    def get_captured_packets(self):
        return self.captured_packets
