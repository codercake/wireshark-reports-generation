from flask import Flask, jsonify, request
from flask_cors import CORS
from services.packet_capture import packet_capture
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

@app.route('/api/capture', methods=['POST'])
def start_capture():
    try:
        interface = request.json.get('interface', 'eth0')
        packet_capture.start_capture(interface)
        return jsonify({
            'status': 'success',
            'message': f'Capture started on interface {interface}'
        })
    except Exception as e:
        logging.error(f"Error starting capture: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        stats = packet_capture.get_stats()
        return jsonify(stats)
    except Exception as e:
        logging.error(f"Error getting stats: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/packets', methods=['GET'])
def get_packets():
    try:
        packets = packet_capture.get_packets()
        return jsonify(packets)
    except Exception as e:
        logging.error(f"Error getting packets: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
