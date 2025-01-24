from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

import subprocess
import os

app = Flask(__name__)

@app.route('/start_capture', methods=['POST'])
def start_capture():
    try:
        data = request.get_json()
        interface = data.get('interface', 'eth0')
        
        capture_process = subprocess.Popen([
            'python3',
            os.path.join(os.path.dirname(__file__), 'services/packet_capture.py'),
            interface
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        stdout, stderr = capture_process.communicate()
        
        if capture_process.returncode == 0:
            return jsonify({
                'status': 'success',
                'message': f'Capture started on interface {interface}',
                'output': stdout.decode()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Capture failed: {stderr.decode()}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
