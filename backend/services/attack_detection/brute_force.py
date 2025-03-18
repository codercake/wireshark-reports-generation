from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BruteForceDetector:
    def __init__(self, threshold=3, time_window=60):
        """
        Initialize the brute force detector.
        :param threshold: Number of failed attempts to trigger an alert.
        :param time_window: Time window in seconds to monitor failed attempts.
        """
        self.threshold = threshold
        self.time_window = time_window

    def start_detection(self, packets):
        """
        Detect brute force attacks based on captured packets.
        :param packets: List of packet data.
        :return: List of alerts for brute force detection.
        """
        failed_attempts = {}
        alerts = []

        for packet in packets:
            if packet.get('protocol') == 'http' and 'login_failed' in packet.get('info', '').lower():
                source_ip = packet.get('source_ip')
                timestamp = datetime.fromisoformat(packet['timestamp'])

                if source_ip not in failed_attempts:
                    failed_attempts[source_ip] = []
                failed_attempts[source_ip].append(timestamp)

                # Remove timestamps outside the time window
                failed_attempts[source_ip] = [
                    t for t in failed_attempts[source_ip]
                    if (timestamp - t).total_seconds() <= self.time_window
                ]

                # Trigger alert if threshold is exceeded
                if len(failed_attempts[source_ip]) >= self.threshold:
                    alerts.append({
                        'source_ip': source_ip,
                        'attempts': len(failed_attempts[source_ip]),
                        'time_window': self.time_window,
                        'alert': 'Brute force attack detected!'
                    })

        return alerts
