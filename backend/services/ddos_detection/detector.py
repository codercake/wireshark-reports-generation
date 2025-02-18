from .features import extract_features
import numpy as np

class DDoSDetector:
    def __init__(self):
        self.PACKET_RATE_THRESHOLD = 1000
        self.SYN_RATE_THRESHOLD = 0.8
        self.ENTROPY_THRESHOLD = 0.7
        self.CONNECTION_RATIO_THRESHOLD = 0.3

    def detect_ddos(self, traffic_data):
        analysis = {
            'is_attack': False,
            'confidence': 0.0,
            'attack_type': None,
            'indicators': [],
            'metrics': {}
        }

        features = extract_features(traffic_data)
        analysis['metrics'] = features

        # Check for high packet rate
        if features['packet_rate'] > self.PACKET_RATE_THRESHOLD:
            analysis['indicators'].append('High packet rate detected')
            analysis['confidence'] += 0.4

        # Check for SYN flood
        if features['syn_rate'] > self.SYN_RATE_THRESHOLD:
            analysis['indicators'].append('SYN flood indicators present')
            analysis['confidence'] += 0.3
            analysis['attack_type'] = 'SYN Flood'

        # Check IP entropy
        if features['ip_entropy'] < self.ENTROPY_THRESHOLD:
            analysis['indicators'].append('Low IP entropy indicating DDoS')
            analysis['confidence'] += 0.2

        # Check connection ratio
        if features['connection_ratio'] < self.CONNECTION_RATIO_THRESHOLD:
            analysis['indicators'].append('Abnormal connection patterns')
            analysis['confidence'] += 0.1

        analysis['is_attack'] = analysis['confidence'] > 0.5
        
        return analysis
