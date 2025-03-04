from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class TCPFloodDetector:
    def __init__(self, threshold=300):
        self.threshold = threshold
        self.ip_syn_counts = defaultdict(int)

    def detect_tcp_flood(self, packets):
        alerts = []
        self.ip_syn_counts.clear()
        for packet in packets:
            try:
                if packet['packet_type'] == 'TCP':
                    tcp_flags = packet.get('flags', '')  # Assuming 'flags' is a string
                    if 'S' in tcp_flags:
                        source_ip = packet.get('source_ip', None)
                        if source_ip:
                            self.ip_syn_counts[source_ip] += 1
            except Exception as e:
                logger.error(f"Error processing packet for TCP flood detection: {e}")

        for ip, count in self.ip_syn_counts.items():
            if count > self.threshold:
                analysis = f"TCP flood attack detected. High SYN traffic from IP: {ip}"
                alerts.append({
                    "timestamp": datetime.now().isoformat(),
                    "source": ip,
                    "alert": "TCP Flood Detected",
                    "details": analysis
                })
        return alerts
