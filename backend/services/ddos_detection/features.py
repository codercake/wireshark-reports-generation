import numpy as np
from scipy.stats import entropy
from collections import Counter

def calculate_packet_rate(packets, time_window=1):
    if not packets:
        return 0
    
    timestamps = [pkt.get('timestamp', 0) for pkt in packets]
    duration = max(timestamps) - min(timestamps)
    return len(packets) / max(duration, time_window)

def calculate_entropy(data):
    counter = Counter(data)
    probabilities = np.array(list(counter.values())) / len(data)
    return entropy(probabilities)

def extract_features(traffic_data):
    features = {
        'packet_rate': calculate_packet_rate(traffic_data),
        'avg_packet_size': np.mean([pkt.get('length', 0) for pkt in traffic_data]),
        'unique_src_ips': len(set(pkt.get('source_ip') for pkt in traffic_data)),
        'unique_dst_ports': len(set(pkt.get('dest_port') for pkt in traffic_data)),
        'syn_rate': len([pkt for pkt in traffic_data if pkt.get('tcp_flags', {}).get('SYN', False)]) / max(len(traffic_data), 1),
        'ip_entropy': calculate_entropy([pkt.get('source_ip') for pkt in traffic_data]),
        'connection_ratio': len(set((pkt.get('source_ip'), pkt.get('dest_ip')) for pkt in traffic_data)) / max(len(traffic_data), 1)
    }
    return features
