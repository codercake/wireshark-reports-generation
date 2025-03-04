import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class NetworkAttackDetector:
    def __init__(self):
        self.scaler = StandardScaler()
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.packet_history = defaultdict(list)
        self.window_size = 100  # Number of packets to analyze at once
        
    def extract_features(self, packets):
        """Extract relevant features from packets for attack detection."""
        features = []
        for packet in packets:
            try:
                feature_dict = {
                    'packet_size': packet.get('length', 0),
                    'protocol': self._encode_protocol(packet.get('protocol', '')),
                    'tcp_flags': self._encode_tcp_flags(packet.get('tcp_flags', {})),
                    'src_port': packet.get('src_port', 0),
                    'dst_port': packet.get('dst_port', 0),
                    'time_delta': packet.get('time_delta', 0),
                }
                features.append(feature_dict)
            except Exception as e:
                logger.error(f"Error extracting features: {e}")
                continue
                
        return pd.DataFrame(features)
    
    def _encode_protocol(self, protocol):
        """Encode protocol as numeric value."""
        protocol_map = {'TCP': 1, 'UDP': 2, 'ICMP': 3, 'HTTP': 4, 'DNS': 5}
        return protocol_map.get(protocol.upper(), 0)
    
    def _encode_tcp_flags(self, flags):
        """Encode TCP flags as numeric value."""
        if not flags:
            return 0
        flag_value = 0
        flag_weights = {'SYN': 1, 'ACK': 2, 'FIN': 4, 'RST': 8, 'PSH': 16, 'URG': 32}
        for flag, weight in flag_weights.items():
            if flags.get(flag, False):
                flag_value += weight
        return flag_value

    def detect_ddos(self, packets):
        """Detect DDoS attacks using Isolation Forest."""
        if not packets:
            return {'detected': False, 'confidence': 0, 'details': 'No packets to analyze'}
            
        df = self.extract_features(packets)
        if len(df) < self.window_size:
            return {'detected': False, 'confidence': 0, 'details': 'Insufficient data'}
            
        # Calculate request rate per source IP
        source_counts = defaultdict(int)
        for packet in packets:
            source_counts[packet.get('src_ip', '')] += 1
            
        X = self.scaler.fit_transform(df[['packet_size', 'time_delta']])
        scores = self.isolation_forest.fit_predict(X)
        
        # Calculate anomaly percentage
        anomaly_ratio = (scores == -1).sum() / len(scores)
        
        threshold = 0.2  # Adjust based on your needs
        is_ddos = anomaly_ratio > threshold
        
        return {
            'detected': is_ddos,
            'confidence': float(anomaly_ratio),
            'details': f"Anomaly ratio: {anomaly_ratio:.2f}"
        }

    def detect_port_scan(self, packets):
        """Detect port scanning attacks."""
        if not packets:
            return {'detected': False, 'confidence': 0, 'details': 'No packets to analyze'}
            
        source_ports = defaultdict(set)
        scan_threshold = 10  # Number of different ports accessed to consider it a scan
        
        for packet in packets:
            src_ip = packet.get('src_ip', '')
            dst_port = packet.get('dst_port', 0)
            source_ports[src_ip].add(dst_port)
            
        suspicious_ips = {
            ip: len(ports) 
            for ip, ports in source_ports.items() 
            if len(ports) > scan_threshold
        }
        
        if suspicious_ips:
            max_ports = max(suspicious_ips.values())
            confidence = min(max_ports / (scan_threshold * 2), 1.0)
            return {
                'detected': True,
                'confidence': confidence,
                'details': f"Suspicious IPs: {suspicious_ips}"
            }
            
        return {'detected': False, 'confidence': 0, 'details': 'No port scanning detected'}

    def detect_sql_injection(self, packets):
        """Detect potential SQL injection attacks in HTTP packets."""
        sql_patterns = [
            "SELECT", "UNION", "INSERT", "UPDATE", "DELETE", "DROP",
            "OR '1'='1", "OR 1=1", "--", "/*", "*/", "EXEC(",
            "CHAR(", "VARCHAR(", "CAST(", "CONVERT("
        ]
        
        suspicious_packets = []
        for packet in packets:
            if packet.get('protocol') == 'HTTP':
                payload = packet.get('payload', '').upper()
                if any(pattern in payload for pattern in sql_patterns):
                    suspicious_packets.append(packet)
        
        if suspicious_packets:
            confidence = min(len(suspicious_packets) / len(packets), 1.0)
            return {
                'detected': True,
                'confidence': confidence,
                'details': f"Found {len(suspicious_packets)} suspicious SQL patterns"
            }
            
        return {'detected': False, 'confidence': 0, 'details': 'No SQL injection detected'}

    def detect_brute_force(self, packets):
        """Detect potential brute force attacks."""
        auth_attempts = defaultdict(lambda: {'count': 0, 'timestamps': []})
        window_seconds = 60  # Time window to analyze
        threshold = 10  # Number of attempts to consider as suspicious
        
        for packet in packets:
            if packet.get('protocol') == 'HTTP' and 'login' in packet.get('payload', '').lower():
                src_ip = packet.get('src_ip', '')
                timestamp = packet.get('timestamp', 0)
                
                auth_attempts[src_ip]['count'] += 1
                auth_attempts[src_ip]['timestamps'].append(timestamp)
                
                # Remove old timestamps
                recent_timestamps = [
                    ts for ts in auth_attempts[src_ip]['timestamps']
                    if timestamp - ts <= window_seconds
                ]
                auth_attempts[src_ip]['timestamps'] = recent_timestamps
                auth_attempts[src_ip]['count'] = len(recent_timestamps)
        
        suspicious_ips = {
            ip: data['count']
            for ip, data in auth_attempts.items()
            if data['count'] >= threshold
        }
        
        if suspicious_ips:
            max_attempts = max(suspicious_ips.values())
            confidence = min(max_attempts / (threshold * 2), 1.0)
            return {
                'detected': True,
                'confidence': confidence,
                'details': f"Suspicious IPs: {suspicious_ips}"
            }
            
        return {'detected': False, 'confidence': 0, 'details': 'No brute force attacks detected'}

    def analyze_packets(self, packets):
        """Comprehensive packet analysis for all types of attacks."""
        results = {
            'ddos': self.detect_ddos(packets),
            'port_scan': self.detect_port_scan(packets),
            'sql_injection': self.detect_sql_injection(packets),
            'brute_force': self.detect_brute_force(packets)
        }
        
        detected_attacks = [
            attack_type 
            for attack_type, result in results.items() 
            if result['detected']
        ]
        
        return {
            'detected_attacks': detected_attacks,
            'analysis_results': results,
            'timestamp': pd.Timestamp.now().isoformat()
        }