from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from services.packet_capture import NetworkMonitor
from services.report_generator import WiresharkReportGenerator
from services.ddos_detection import DDoSDetector, TrafficMonitor
import os
import json
import time
from datetime import datetime
import logging
import pandas as pd
import io
import pdfkit

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
monitor = None
report_generator = WiresharkReportGenerator()
ddos_detector = DDoSDetector()
traffic_monitor = TrafficMonitor()

### ---- Packet Capture Endpoints ---- ###

@app.route('/start_capture', methods=['POST'])
def start_capture():
    """ Start network packet capture and DDoS monitoring. """
    global monitor, traffic_monitor
    try:
        data = request.get_json()
        interface = data.get('interface', 'en0')
        monitor = NetworkMonitor(interface=interface)
        monitor.start_monitoring()
        traffic_monitor.start_monitoring()
        logger.info(f"Capture started on interface: {interface}")
        return jsonify({'status': 'success', 'message': f'Capture started on interface {interface}'})
    except Exception as e:
        logger.error(f"Error starting capture: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop_capture', methods=['POST'])
def stop_capture():
    """ Stop network packet capture and monitoring. """
    global monitor, traffic_monitor
    if monitor:
        monitor.stop_monitoring()
        traffic_monitor.stop_monitoring()
        return jsonify({'status': 'success', 'message': 'Capture stopped'})
    return jsonify({'status': 'error', 'message': 'No active capture'}), 400

@app.route('/api/packets', methods=['GET'])
def get_packets():
    """ Get captured packets. """
    global monitor
    if monitor:
        packets = monitor.get_captured_packets()
        return jsonify(packets)
    return jsonify([])

### ---- Traffic Analysis & DDoS Detection ---- ###

@app.route('/analyze_traffic', methods=['POST'])
def analyze_traffic():
    """ Analyze captured traffic for potential DDoS attacks. """
    global monitor, ddos_detector
    if not monitor:
        return jsonify({'status': 'error', 'message': 'No active capture'}), 400

    packets = monitor.get_captured_packets()
    analysis = ddos_detector.detect_ddos(packets)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    analysis_path = f'reports/ddos_analysis_{timestamp}.json'

    with open(analysis_path, 'w') as f:
        json.dump(analysis, f)

    # If suspicious IPs are found, log them
    if analysis['suspicious_ips']:
        logger.warning(f"Suspicious IPs detected: {analysis['suspicious_ips']}")

    return jsonify({'status': 'success', 'analysis': analysis, 'saved_path': analysis_path})

@app.route('/get_alerts', methods=['GET'])
def get_alerts():
    """ Get triggered DDoS alerts. """
    global traffic_monitor
    if traffic_monitor:
        alerts = traffic_monitor.get_alerts()
        return jsonify({'status': 'success', 'alerts': alerts})
    return jsonify({'status': 'error', 'message': 'Traffic monitor not initialized'}), 400

@app.route('/get_suspicious_ips', methods=['GET'])
def get_suspicious_ips():
    """ Retrieve flagged suspicious IPs from alerts. """
    global traffic_monitor
    if traffic_monitor:
        alerts = traffic_monitor.get_alerts()
        suspicious_ips = [ip for alert in alerts for ip in alert.get('suspicious_ips', [])]
        return jsonify({'status': 'success', 'suspicious_ips': suspicious_ips})
    return jsonify({'status': 'error', 'message': 'Traffic monitor not initialized'}), 400

### ---- Report Generation Endpoints ---- ###

@app.route('/generate_report', methods=['POST'])
def generate_report():
    """ Generate and export network traffic reports. """
    global report_generator
    try:
        data = request.get_json()
        report_data = {'start_time': data['startTime'], 'end_time': data['endTime'], 'report_type': data['reportType']}

        # Fetch captured packets
        packet_data = monitor.get_captured_packets() if monitor else []

        if not packet_data:
            logger.warning("No packets captured for report generation.")
            return jsonify({'status': 'error', 'message': 'No packets captured.'}), 400

        # Generate report
        report_generator.generate_visualizations(packet_data)
        report = (report_generator.generate_traffic_report(packet_data) 
                  if report_data['report_type'] == 'traffic' 
                  else report_generator.generate_security_report(packet_data))
        
        report_path = report_generator.export_to_json(report, f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}")

        return jsonify({'status': 'success', 'report_path': report_path, 'report_data': report})
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """ Retrieve list of generated reports. """
    try:
        report_files = os.listdir('reports')
        reports = []
        for report_file in report_files:
            if report_file.endswith('.json'):
                with open(os.path.join('reports', report_file), 'r') as f:
                    report_data = json.load(f)
                    report_data['report_path'] = os.path.join('reports', report_file)
                    reports.append(report_data)
        return jsonify(reports)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

### ---- Data Export Endpoints ---- ###

@app.route('/export/<format>', methods=['GET'])
def export_data(format):
    """ Export captured data in various formats (CSV, HTML, PDF). """
    global monitor
    if not monitor:
        return jsonify({'error': 'No capture data available'}), 400

    packets = monitor.get_captured_packets()
    df = pd.DataFrame(packets)

    if format == 'html':
        return send_file(io.BytesIO(df.to_html().encode()), mimetype='text/html', as_attachment=True, download_name='network_capture.html')
    elif format == 'csv':
        return send_file(io.BytesIO(df.to_csv(index=False).encode()), mimetype='text/csv', as_attachment=True, download_name='network_capture.csv')
    elif format == 'pdf':
        pdf = pdfkit.from_string(df.to_html(), False)
        return send_file(io.BytesIO(pdf), mimetype='application/pdf', as_attachment=True, download_name='network_capture.pdf')
    else:
        return jsonify({'error': 'Invalid format'}), 400

### ---- Utility Endpoints ---- ###

@app.route('/health', methods=['GET'])
def health_check():
    """ Check application health status. """
    global monitor, traffic_monitor
    return jsonify({'status': 'healthy', 'monitor_active': monitor is not None, 'ddos_monitor_active': traffic_monitor is not None})

# Ensure the reports directory exists
if __name__ == '__main__':
    os.makedirs('reports', exist_ok=True)
    app.run(port=5002, debug=True)
