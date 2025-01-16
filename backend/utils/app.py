from flask import Flask, jsonify, request
from flask_cors import CORS
import pyshark
import subprocess
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

def get_available_interfaces():
    try:
        # For MacOS
        result = subprocess.run(['networksetup', '-listallhardwareports'], 
                              capture_output=True, text=True)
        interfaces = ['en0', 'Wi-Fi', 'en1', 'lo0'] 
        return interfaces
    except:
        return ['en0', 'Wi-Fi']  

def capture_live_traffic(interface='en0', duration=60):
    capture = pyshark.LiveCapture(interface=interface)
    packets = []
    
    start_time = datetime.now()
    while (datetime.now() - start_time).seconds < duration:
        try:
            capture.sniff(packet_count=1)
            for packet in capture:
                if hasattr(packet, 'ip'):
                    packet_info = {
                        'timestamp': packet.sniff_time.isoformat(),
                        'src_ip': packet.ip.src,
                        'dst_ip': packet.ip.dst,
                        'protocol': packet.transport_layer if hasattr(packet, 'transport_layer') else 'Unknown',
                        'src_port': packet[packet.transport_layer].srcport if hasattr(packet, 'transport_layer') else 'N/A',
                        'dst_port': packet[packet.transport_layer].dstport if hasattr(packet, 'transport_layer') else 'N/A',
                        'length': packet.length,
                        'info': packet.info if hasattr(packet, 'info') else 'N/A'
                    }
                    packets.append(packet_info)
        except Exception as e:
            print(f"Packet capture error: {e}")
            continue
            
    return packets

def generate_tshark_report(interface='en0', duration=60, ip_filter=''):
    tshark_command = [
        'tshark',
        '-i', interface,
        '-a', f'duration:{duration}',
        '-f', 'ip', 
        '-T', 'fields',
        '-E', 'separator=,',
        '-e', 'frame.time',
        '-e', 'ip.src',
        '-e', 'ip.dst',
        '-e', 'tcp.srcport',
        '-e', 'tcp.dstport',
        '-e', 'ip.proto',
        '-e', '_ws.col.Info',
        '-l' 
    ]
    
    if ip_filter:
        tshark_command.extend(['-f', f'host {ip_filter}'])
    
    process = subprocess.Popen(tshark_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, error = process.communicate()
    
    return output.decode().split('\n')

@app.route('/')
def home():
    interfaces = get_available_interfaces()
    return jsonify({
        "status": "online",
        "message": "Wireshark Report API Running",
        "available_interfaces": interfaces,
        "endpoints": {
            "/api/capture": "Capture live network packets",
            "/api/generate_report": "Generate network analysis report",
            "/api/status": "Check API status"
        }
    })

@app.route('/api/capture', methods=['GET', 'POST'])
def start_capture():
    if request.method == 'GET':
        return jsonify({
            "status": "ready",
            "usage": {
                "method": "POST",
                "parameters": {
                    "interface": f"Network interface (default: en0, available: {get_available_interfaces()})",
                    "duration": "Capture duration in seconds (default: 60)"
                }
            }
        })

    data = request.get_json(force=True) if request.data else {}
    interface = data.get('interface', 'en0')
    duration = int(data.get('duration', 60))
    
    packets = capture_live_traffic(interface, duration)
    
    return jsonify({
        'status': 'success',
        'capture_time': datetime.now().isoformat(),
        'interface': interface,
        'duration': duration,
        'packet_count': len(packets),
        'packets': packets
    })

@app.route('/api/generate_report', methods=['GET', 'POST'])
def generate_report():
    if request.method == 'GET':
        return jsonify({
            "status": "ready",
            "usage": {
                "method": "POST",
                "parameters": {
                    "interface": f"Network interface (default: en0, available: {get_available_interfaces()})",
                    "duration": "Capture duration in seconds (default: 60)",
                    "ip_filter": "Optional IP filter"
                }
            }
        })

    data = request.get_json(force=True) if request.data else {}
    interface = data.get('interface', 'en0')
    duration = int(data.get('duration', 60))
    ip_filter = data.get('ip_filter', '')
    
    try:
        lines = generate_tshark_report(interface, duration, ip_filter)
        packets = []
        
        for line in lines:
            if line:
                fields = line.split(',')
                if len(fields) >= 6:
                    packet = {
                        'timestamp': fields[0],
                        'src_ip': fields[1],
                        'dst_ip': fields[2],
                        'src_port': fields[3],
                        'dst_port': fields[4],
                        'protocol': fields[5],
                        'info': fields[6] if len(fields) > 6 else 'N/A'
                    }
                    packets.append(packet)
        
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'interface': interface,
            'duration': duration,
            'filter_applied': ip_filter,
            'packet_count': len(packets),
            'packets': packets
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/status')
def status():
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'interfaces_available': get_available_interfaces()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
