import pyshark
import json
import sys
import requests
from datetime import datetime

def get_packet_info(packet):
    packet_info = {
        'protocol': packet.highest_layer,
        'length': packet.length,
        'timestamp': datetime.now().isoformat(),
        'packet_type': packet.highest_layer
    }
    
    # Handle IP layer
    if hasattr(packet, 'ip'):
        packet_info.update({
            'source_ip': packet.ip.src,
            'dest_ip': packet.ip.dst
        })
    
    # Handle Transport layer (TCP/UDP)
    if hasattr(packet, 'transport_layer'):
        transport = packet[packet.transport_layer]
        packet_info.update({
            'source_port': transport.srcport,
            'dest_port': transport.dstport
        })
    
    return packet_info

def capture_packets(interface='en0'):
    print(f"Starting packet capture on interface: {interface}")
    capture = pyshark.LiveCapture(interface=interface)
    
    for packet in capture.sniff_continuously():
        try:
            packet_data = get_packet_info(packet)
            print(f"Captured packet: {packet_data}")
            
            response = requests.post('http://localhost:5001/api/packets', json=packet_data)
            print(f"Sent to server: {response.status_code}")
            
        except Exception as e:
            print(f"Error processing packet: {str(e)}")
            continue

if __name__ == '__main__':
    interface = sys.argv[1] if len(sys.argv) > 1 else 'en0'
    capture_packets(interface)
