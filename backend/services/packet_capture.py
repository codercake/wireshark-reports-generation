import pyshark
import json
from datetime import datetime
from typing import List, Dict
import threading
import queue

class PacketCapture:
    def __init__(self):
        self.packet_queue = queue.Queue()
        self.is_capturing = False
        self.capture_thread = None
        self.stats = {
            "totalPackets": 0,
            "totalBytes": 0,
            "packetsPerSec": 0,
            "protocols": {},
            "packetSizes": {}
        }

    def packet_handler(self, packet):
        try:
            packet_data = {
                "timestamp": str(datetime.now()),
                "protocol": packet.highest_layer,
                "source": packet.ip.src if hasattr(packet, 'ip') else "unknown",
                "destination": packet.ip.dst if hasattr(packet, 'ip') else "unknown",
                "length": int(packet.length),
                "info": packet.info if hasattr(packet, 'info') else ""
            }
            
            self.packet_queue.put(packet_data)
            self.update_stats(packet_data)
            
        except Exception as e:
            print(f"Error processing packet: {e}")

    def update_stats(self, packet_data: Dict):
        self.stats["totalPackets"] += 1
        self.stats["totalBytes"] += packet_data["length"]
        
        # Update protocol distribution
        protocol = packet_data["protocol"]
        self.stats["protocols"][protocol] = self.stats["protocols"].get(protocol, 0) + 1
        
        # Update packet size distribution
        size_category = self.get_size_category(packet_data["length"])
        self.stats["packetSizes"][size_category] = self.stats["packetSizes"].get(size_category, 0) + 1

    @staticmethod
    def get_size_category(size: int) -> str:
        if size <= 64: return "0-64"
        elif size <= 128: return "65-128"
        elif size <= 256: return "129-256"
        elif size <= 512: return "257-512"
        else: return "513+"

    def start_capture(self, interface: str = 'eth0'):
        if not self.is_capturing:
            self.is_capturing = True
            self.capture_thread = threading.Thread(target=self._capture_packets, args=(interface,))
            self.capture_thread.start()

    def _capture_packets(self, interface: str):
        capture = pyshark.LiveCapture(interface=interface)
        for packet in capture.sniff_continuously():
            if not self.is_capturing:
                break
            self.packet_handler(packet)

    def stop_capture(self):
        self.is_capturing = False
        if self.capture_thread:
            self.capture_thread.join()

    def get_stats(self) -> Dict:
        return self.stats

    def get_packets(self) -> List[Dict]:
        packets = []
        while not self.packet_queue.empty():
            packets.append(self.packet_queue.get())
        return packets

packet_capture = PacketCapture()
