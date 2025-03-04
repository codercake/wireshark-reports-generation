import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SQLInjectionDetector:
    def __init__(self):
        self.sql_keywords = ['SELECT', 'UPDATE', 'INSERT', 'DELETE', 'FROM', 'WHERE', 'DROP', 'ALTER', 'UNION', ';']
        self.pattern = re.compile(r'\b(' + '|'.join(self.sql_keywords) + r')\b', re.IGNORECASE)

    def detect_sql_injection(self, packets):
        alerts = []
        for packet in packets:
            try:
                if packet['packet_type'] == 'HTTP':
                    uri = packet.get('request_uri', '')
                    if uri and self.pattern.search(uri):
                        alerts.append({
                            'timestamp': datetime.now().isoformat(),
                            'source': packet.get('source_ip', 'N/A'),
                            'dest': packet.get('dest_ip', 'N/A'),
                            'alert': 'Potential SQL Injection in URI',
                            'details': f'Detected SQL keyword in URI: {uri}'
                        })
            except Exception as e:
                logger.error(f"Error processing packet for SQL injection detection: {e}")
        return alerts
