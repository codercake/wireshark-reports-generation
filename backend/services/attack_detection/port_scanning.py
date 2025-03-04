from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PortScanDetector:
    def __init__(self, threshold=5):
        self.threshold = threshold
        self.ip_port_access = defaultdict(set)

    def detect_port_scan(self, packets):
        alerts = []
        self.ip_port_access.clear()

        for packet in packets:
            try:
                if packet['packet_type'] == 'TCP':
                    source_ip = packet.get('source_ip', None)
                    dest_port = packet.get('dest_port', None)

                    if source_ip and dest_port:
                        self.ip_port_access[source_ip].add(dest_port)
            except Exception as e:
                logger.error(f"Error processing packet for port scan detection: {e}")

        for ip, ports in self.ip_port_access.items():
            if len(ports) > self.threshold:
                analysis = f"Port scan detected. IP {ip} accessed {len(ports)} different ports."
                alerts.append({
                    "timestamp": datetime.now().isoformat(),
                    "source": ip,
                    "alert": "Port Scan Detected",
                    "details": analysis
                })

        return alerts
