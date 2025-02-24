from flask import Flask, request, jsonify
from services.ddos_detection.detector import AttackDetector

app = Flask(__name__)
detector = AttackDetector()

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = [
        data['packet_rate'],
        data['avg_packet_size'],
        data['unique_src_ips'],
        data['unique_dst_ports'],
        data['syn_rate'],
        data['ip_entropy'],
        data['connection_ratio']
    ]
    
    prediction = detector.predict(features)
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)
