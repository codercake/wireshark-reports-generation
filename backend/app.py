from flask import Flask, jsonify, request
from flask_cors import CORS  
import pyshark
import threading

app = Flask(__name__)
CORS(app)

#Global variable to store captured packets
captured_packets = []
capture_thread = None  

#Function to capture packets in a separate thread
def capture_packets(interface):
    global captured_packets
    try:
        capture = pyshark.LiveCapture(interface=interface)
        for packet in capture.sniff_continuously(packet_count=10):  
            captured_packets.append({
                'time': packet.sniff_time.isoformat(),
                'protocol': packet.transport_layer,
                'source': packet.ip.src if 'IP' in packet else None,
                'destination': packet.ip.dst if 'IP' in packet else None,
                'length': packet.length,
                'info': str(packet)
            })
    except Exception as e:
        print(f"Error capturing packets: {e}")

def start_capture(interface):
    global capture_thread
    if capture_thread is None or not capture_thread.is_alive():
        capture_thread = threading.Thread(target=capture_packets, args=(interface,))
        capture_thread.start()
    else:
        print("Capture is already running.")

# Route to start capturing packets
@app.route('/api/start_capture', methods=['POST'])
def start_capture_route():
    interface = request.json.get('interface', 'eth0')  
    start_capture(interface)
    return jsonify({"message": f"Started capturing packets on {interface}"}), 200

#Route to get captured packets
@app.route('/api/captured_packets', methods=['GET'])
def get_captured_packets():
    global captured_packets
    #Convert packets to a more readable format
    packets_list = [str(packet) for packet in captured_packets]
    return jsonify(packets_list), 200

#Route to clear captured packets
@app.route('/api/clear_packets', methods=['POST'])
def clear_packets():
    global captured_packets
    captured_packets = []
    return jsonify({"message": "Cleared captured packets"}), 200

#Route for the root URL with a welcome message
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "Welcome to the Packet Capture API",
        "description": "This API allows you to capture network packets.",
        "available_endpoints": [
            "/api/start_capture - Start capturing packets",
            "/api/captured_packets - Get captured packets",
            "/api/clear_packets - Clear captured packets"
        ]
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  