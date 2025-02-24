from scapy.all import rdpcap, TCP, Raw, IP
from collections import defaultdict
import time

class BruteForceDetector:
    def __init__(self):
        self.auth_attempts = defaultdict(list)
        self.threshold = 3
        self.time_window = 300

    def analyze_packet(self, packet) -> dict:
        if packet.haslayer(TCP) and packet.haslayer(Raw):
            if packet[TCP].dport in (80, 443): 
                payload = str(packet[Raw].load)

                if "POST" in payload and ("login" in payload.lower() or "auth" in payload.lower()):
                    src_ip = packet[IP].src
                    timestamp = time.time()

                    #clean up old attempts
                    self.auth_attempts[src_ip] = [t for t in self.auth_attempts[src_ip] 
                                                   if timestamp - t < self.time_window]
                    
                    self.auth_attempts[src_ip].append(timestamp)
                    
        #check if threshold is placed
                    if len(self.auth_attempts[src_ip]) >= self.threshold:
                        return {
                            "attack_type": "Brute Force Attempt",
                            "source_ip": src_ip,
                            "attempts": len(self.auth_attempts[src_ip]),
                            "timestamp": timestamp
                        }
        return None

    def start_detection(self, pcap_file: str) -> list:
        alerts = []
        try:
            packets = rdpcap(pcap_file)
            for packet in packets:
                result = self.analyze_packet(packet)
                if result:
                    alerts.append(result)
        except Exception as e:
            print(f"Error reading pcap file: {e}")
        
        return alerts
