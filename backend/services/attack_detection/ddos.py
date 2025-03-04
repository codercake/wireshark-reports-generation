from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DDoSDetector:
    def __init__(self, threshold=200):
        self.threshold = threshold
        self.ip_request_counts = defaultdict(int)

    def detect_ddos(self, packets):
        alerts = []
        self.ip_request_counts.clear()
        for packet in packets:
            try:
                source_ip = packet.get('source_ip', None)
                if source_ip:
                    self.ip_request_counts[source_ip] += 1
            except Exception as e:
                logger.error(f"Error processing packet for DDoS detection: {e}")

        for ip, count in self.ip_request_counts.items():
            if count > self.threshold:
                analysis = f"DDoS attack detected. High traffic from IP: {ip}"
                alerts.append({
                    "timestamp": datetime.now().isoformat(),
                    "source": ip,
                    "alert": "DDoS Attack Detected",
                    "details": analysis
                })
        return alerts
