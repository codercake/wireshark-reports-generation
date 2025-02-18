import subprocess
import json
from datetime import datetime
import pyshark
from scapy.all import rdpcap

def process_pcap_file(pcap_path):
    """Process pcap file using tshark and return structured data"""
    command = [
        'tshark',
        '-r', pcap_path,
        '-T', 'fields',
        '-E', 'separator=,',
        '-e', 'frame.time_epoch',
        '-e', 'ip.src',
        '-e', 'ip.dst',
        '-e', 'tcp.srcport',
        '-e', 'tcp.dstport',
        '-e', 'frame.len',
        '-e', 'tcp.flags',
        '-e', 'ip.proto'
    ]
    
    try:
        output = subprocess.check_output(command, universal_newlines=True)
        return parse_tshark_output(output)
    except subprocess.CalledProcessError as e:
        raise Exception(f"Error processing pcap file: {str(e)}")

def parse_tshark_output(output):
    """Parse tshark output into structured packet data"""
    packets = []
    for line in output.strip().split('\n'):
        if line:
            fields = line.split(',')
            if len(fields) >= 8:
                packet = {
                    'timestamp': float(fields[0]),
                    'source_ip': fields[1],
                    'dest_ip': fields[2],
                    'source_port': int(fields[3]) if fields[3] else None,
                    'dest_port': int(fields[4]) if fields[4] else None,
                    'length': int(fields[5]) if fields[5] else 0,
                    'tcp_flags': parse_tcp_flags(fields[6]),
                    'protocol': int(fields[7]) if fields[7] else 0
                }
                packets.append(packet)
    return packets

def parse_tcp_flags(flags_str):
    """Parse TCP flags from tshark output"""
    flags = {
        'SYN': False,
        'ACK': False,
        'FIN': False,
        'RST': False,
        'PSH': False,
        'URG': False
    }
    
    if flags_str:
        flags_val = int(flags_str, 16) if '0x' in flags_str else int(flags_str)
        flags['SYN'] = bool(flags_val & 0x02)
        flags['ACK'] = bool(flags_val & 0x10)
        flags['FIN'] = bool(flags_val & 0x01)
        flags['RST'] = bool(flags_val & 0x04)
        flags['PSH'] = bool(flags_val & 0x08)
        flags['URG'] = bool(flags_val & 0x20)
    
    return flags

def extract_packet_features(packets, window_size=60):
    """Extract relevant features for DDoS detection"""
    features = {
        'total_packets': len(packets),
        'unique_ips': len(set(p['source_ip'] for p in packets)),
        'packet_sizes': [p['length'] for p in packets],
        'protocols': [p['protocol'] for p in packets],
        'tcp_flags': [p['tcp_flags'] for p in packets if p.get('tcp_flags')],
        'time_window': window_size
    }
    
    # Add derived features
    if features['total_packets'] > 0:
        features['avg_packet_size'] = sum(features['packet_sizes']) / features['total_packets']
        features['packets_per_second'] = features['total_packets'] / window_size
        
        # Calculate SYN ratio
        syn_count = sum(1 for flags in features['tcp_flags'] if flags.get('SYN', False))
        features['syn_ratio'] = syn_count / features['total_packets']
    
    return features

def analyze_live_capture(interface='en0', duration=60):
    """Capture and analyze live traffic"""
    capture = pyshark.LiveCapture(interface=interface)
    packets = []
    
    start_time = datetime.now()
    
    try:
        capture.sniff(timeout=duration)
        for packet in capture:
            if hasattr(packet, 'ip'):
                packet_data = {
                    'timestamp': float(packet.sniff_timestamp),
                    'source_ip': packet.ip.src,
                    'dest_ip': packet.ip.dst,
                    'length': int(packet.length),
                    'protocol': int(packet.ip.proto)
                }
                
                if hasattr(packet, 'tcp'):
                    packet_data.update({
                        'source_port': int(packet.tcp.srcport),
                        'dest_port': int(packet.tcp.dstport),
                        'tcp_flags': parse_tcp_flags(packet.tcp.flags)
                    })
                
                packets.append(packet_data)
    except Exception as e:
        print(f"Capture error: {e}")
    finally:
        capture.close()
    
    return packets

def save_packet_data(packets, output_file):
    """Save processed packet data to JSON file"""
    with open(output_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'packet_count': len(packets),
            'packets': packets
        }, f, indent=2)
