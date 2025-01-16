import pyshark
import json
from datetime import datetime
import pymongo
import os
import sys

def connect_db():
    MONGO_URI = os.getenv("MONGO_URI")
    client = pymongo.MongoClient(MONGO_URI)
    return client.wireshark_db

def capture_packets(interface='eth0', duration=60):
    capture = pyshark.LiveCapture(interface=interface)
    db = connect_db()
    packets_collection = db.packets
    
    start_time = datetime.now()
    while (datetime.now() - start_time).seconds < int(duration):
        try:
            capture.sniff(packet_count=1)
            for packet in capture:
                if hasattr(packet, 'ip'):
                    packet_data = {
                        'timestamp': datetime.now(),
                        'protocol': packet.transport_layer,
                        'source_ip': packet.ip.src,
                        'dest_ip': packet.ip.dst,
                        'length': int(packet.length),
                    }
                    packets_collection.insert_one(packet_data)
                    print(json.dumps(packet_data, default=str))
        except Exception as e:
            print(f"Error processing packet: {e}")
            continue

if __name__ == "__main__":
    interface = sys.argv[1] if len(sys.argv) > 1 else 'eth0'
    duration = sys.argv[2] if len(sys.argv) > 2 else '60'
    capture_packets(interface, duration)
