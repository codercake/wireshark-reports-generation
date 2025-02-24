from pymongo import MongoClient
from config import MONGO_URI

class PacketCapture:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client['your_database_name']
        self.collection = self.db['packet_capture']

    def save_packet(self, packet_info):
        self.collection.insert_one(packet_info)

    def get_packets(self):
        return list(self.collection.find())
