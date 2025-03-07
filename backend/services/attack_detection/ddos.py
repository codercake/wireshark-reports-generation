from collections import defaultdict
from datetime import datetime
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class DDoSDetector:
    def __init__(self, threshold=200, time_window=60):
        self.threshold = threshold
        self.time_window = time_window  
        self.ip_request_counts: Dict[str, List] = defaultdict(list)
        
    def detect_ddos(self, packets):
        alerts = []
        current_time = datetime.now()
        
        for packet in packets:
            try:
                source_ip = packet.get('source_ip')
                if not source_ip:
                    continue
                    
             
                self.ip_request_counts[source_ip].append(current_time)
                
                
                self.ip_request_counts[source_ip] = [
                    ts for ts in self.ip_request_counts[source_ip]
                    if (current_time - ts).total_seconds() <= self.time_window
                ]
                
              
                packet_size = packet.get('length', 0)
                protocol = packet.get('protocol', '').lower()
                flags = packet.get('flags', '').lower()
                
               
                if (packet_size < 100 and len(self.ip_request_counts[source_ip]) > self.threshold):
                    alerts.append({
                        "timestamp": current_time.isoformat(),
                        "source": source_ip,
                        "alert": "Potential hping3 DDoS Attack",
                        "details": f"High-frequency small packets detected from {source_ip}"
                    })
                
              
                if protocol in ['tcp', 'udp'] and len(self.ip_request_counts[source_ip]) > 50:
                    alerts.append({
                        "timestamp": current_time.isoformat(),
                        "source": source_ip,
                        "alert": "Potential nmap Scan",
                        "details": f"Multiple {protocol.upper()} packets detected from {source_ip}"
                    })
                
              
                if flags and 'syn' in flags and len(self.ip_request_counts[source_ip]) > 100:
                    alerts.append({
                        "timestamp": current_time.isoformat(),
                        "source": source_ip,
                        "alert": "SYN Flood Attack",
                        "details": f"High-frequency SYN packets from {source_ip}"
                    })
                    
            except Exception as e:
                logger.error(f"Error processing packet for DDoS detection: {e}")
                
        return alerts