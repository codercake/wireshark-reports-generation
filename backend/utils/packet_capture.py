import pyshark
import json
from datetime import datetime
import pymongo
import os

def connect_db():
    MONGO_URI = os.getenv("MONGO_URI")
    client = pymongo.MongoClient(MONGO_URI)
    return client.wireshark_db

def capture_packets():
    capture = pyshark.LiveCapture(interface='eth0')
    db = connect_db()
    packets_collection = db.packets

    for packet in capture.sniff_continuously():
        try:
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
    capture_packets()