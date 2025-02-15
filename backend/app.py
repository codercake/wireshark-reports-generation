from flask import Flask, request, jsonify
from flask_cors import CORS
from services.packet_capture import NetworkMonitor
from services.report_generator import WiresharkReportGenerator
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)

monitor = None
report_generator = WiresharkReportGenerator()

@app.route('/start_capture', methods=['POST'])
def start_capture():
    global monitor
    try:
        data = request.get_json()
        interface = data.get('interface', 'eth0')
        monitor = NetworkMonitor(interface=interface)
        monitor.start_monitoring()
        return jsonify({
            'status': 'success',
            'message': f'Capture started on interface {interface}'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/stop_capture', methods=['POST'])
def stop_capture():
    global monitor
    if monitor:
        monitor.stop_monitoring()
        return jsonify({'status': 'success', 'message': 'Capture stopped'})
    return jsonify({'status': 'error', 'message': 'No active capture'}), 400

@app.route('/generate_report', methods=['POST'])
def generate_report():
    global report_generator
    try:
        data = request.get_json()
        report_data = {
            'start_time': data['startTime'],
            'end_time': data['endTime'],
            'report_type': data['reportType']
        }
        
        # Fetch captured packets
        packet_data = monitor.get_captured_packets() if monitor else []
        
        # Check if packets were captured
        if not packet_data:
            logger.warning("No packets captured for report generation.")
            return jsonify({
                'status': 'error',
                'message': 'No packets captured.'
            }), 400
        
        # Generate visualizations
        report_generator.generate_visualizations(packet_data)
        
        # Generate report based on type
        if report_data['report_type'] == 'traffic':
            report = report_generator.generate_traffic_report(packet_data)
        else:
            report = report_generator.generate_security_report(packet_data)
        
        # Export the report to JSON
        report_path = report_generator.export_to_json(report, f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        return jsonify({
            'status': 'success',
            'report_path': report_path,
            'report_data': report
        })
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    global monitor
    return jsonify({
        'status': 'healthy',
        'monitor_active': monitor is not None
    })

if __name__ == '__main__':
    app.run(port=5002, debug=True)
