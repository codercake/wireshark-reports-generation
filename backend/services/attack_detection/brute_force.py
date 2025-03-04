from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BruteForceDetector:
    def __init__(self, threshold=10):
        self.threshold = threshold
        self.login_attempts = defaultdict(int)

    def start_detection(self, packets):
        alerts = []
        self.login_attempts.clear()

        for packet in packets:
            try:
                if packet['packet_type'] == 'HTTP':
                    uri = packet.get('request_uri', '')
                    if '/login' in uri or '/auth' in uri:
                        status_code = packet.get('response_code', '0')
                        if status_code and int(status_code) >= 400:
                            source_ip = packet.get('source_ip', None)
                            if source_ip:
                                self.login_attempts[source_ip] += 1
                                if self.login_attempts[source_ip] > self.threshold:
                                    analysis = f"Brute-force attack detected. IP {source_ip} exceeded login attempt threshold."
                                    alerts.append({
                                        "timestamp": datetime.now().isoformat(),
                                        "source": source_ip,
                                        "alert": "Brute-Force Attack Detected",
                                        "details": analysis
                                    })
            except Exception as e:
                logger.error(f"Error processing packet for brute force detection: {e}")
        return alerts
