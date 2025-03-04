from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

class PacketCapture:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/wireshark_data"))
        self.db = self.client['wireshark_data']
        self.collection = self.db['packets']

    def save_packet(self, packet_info):
        self.collection.insert_one(packet_info)

    def get_packets(self, query=None):
        if query:
            return list(self.collection.find(query))
        else:
            return list(self.collection.find())
