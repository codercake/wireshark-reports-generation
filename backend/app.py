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
import pyshark
import netifaces
import platform
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

def get_default_interface():
    try:
        if platform.system() == 'Darwin':  # macOS
            return 'en0'
        elif os.name == 'posix':  # Linux
            default_gw = netifaces.gateways()['default']
            if default_gw and netifaces.AF_INET in default_gw:
                return default_gw[netifaces.AF_INET][1]
            return 'eth0'
        elif os.name == 'nt':  # Windows
            return 'Ethernet'
        else:
            return 'eth0'
    except Exception as e:
        logger.warning(f"Error detecting default interface: {e}")
        return 'eth0'

# Initialize services
DEFAULT_INTERFACE = get_default_interface()
monitor = None
report_generator = WiresharkReportGenerator()
ddos_detector = DDoSDetector()
traffic_monitor = TrafficMonitor()

### Packet Capture Endpoints ###

@app.route('/start_capture', methods=['POST'])
def start_capture():
    global monitor, traffic_monitor
    try:
        data = request.get_json() if request.is_json else {}
        interface = data.get('interface', DEFAULT_INTERFACE)
        
        logger.info(f"Starting capture on interface: {interface}")
        monitor = NetworkMonitor(interface=interface)
        monitor.start_monitoring()
        traffic_monitor.start_monitoring()
        
        return jsonify({
            'status': 'success',
            'message': f'Capture started on interface {interface}',
            'interface': interface
        })
    except Exception as e:
        logger.error(f"Error starting capture: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop_capture', methods=['POST'])
def stop_capture():
    global monitor, traffic_monitor
    try:
        if monitor:
            monitor.stop_monitoring()
            traffic_monitor.stop_monitoring()
            return jsonify({'status': 'success', 'message': 'Capture stopped'})
        return jsonify({'status': 'error', 'message': 'No active capture'}), 400
    except Exception as e:
        logger.error(f"Error stopping capture: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/packets', methods=['GET'])
def get_packets():
    global monitor
    try:
        if monitor:
            packets = monitor.get_captured_packets()
            return jsonify(packets)
        return jsonify([])
    except Exception as e:
        logger.error(f"Error retrieving packets: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

### Interface Management ###

@app.route('/interfaces', methods=['GET'])
def get_interfaces():
    try:
        available_interfaces = NetworkMonitor.get_available_interfaces()
        return jsonify({
            'status': 'success',
            'default_interface': DEFAULT_INTERFACE,
            'available_interfaces': available_interfaces
        })
    except Exception as e:
        logger.error(f"Error getting interfaces: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'default_interface': DEFAULT_INTERFACE
        }), 500

### Traffic Analysis & DDoS Detection ###

@app.route('/analyze_traffic', methods=['POST'])
def analyze_traffic():
    global monitor, ddos_detector
    try:
        if not monitor:
            return jsonify({'status': 'error', 'message': 'No active capture'}), 400
        
        packets = monitor.get_captured_packets()
        analysis = ddos_detector.detect_ddos(packets)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save analysis results
        analysis_path = f'reports/ddos_analysis_{timestamp}.json'
        with open(analysis_path, 'w') as f:
            json.dump(analysis, f)
        
        return jsonify({
            'status': 'success',
            'analysis': analysis,
            'timestamp': timestamp,
            'saved_path': analysis_path
        })
    except Exception as e:
        logger.error(f"Error analyzing traffic: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_alerts', methods=['GET'])
def get_alerts():
    global traffic_monitor
    try:
        if traffic_monitor:
            alerts = traffic_monitor.get_alerts()
            return jsonify({'status': 'success', 'alerts': alerts})
        return jsonify({'status': 'error', 'message': 'Traffic monitor not initialized'}), 400
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_suspicious_ips', methods=['GET'])
def get_suspicious_ips():
    global traffic_monitor
    try:
        if traffic_monitor:
            suspicious_ips = traffic_monitor.get_suspicious_ips()
            return jsonify({'status': 'success', 'suspicious_ips': suspicious_ips})
        return jsonify({'status': 'error', 'message': 'Traffic monitor not initialized'}), 400
    except Exception as e:
        logger.error(f"Error getting suspicious IPs: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

### Report Generation ###

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

        packet_data = monitor.get_captured_packets() if monitor else []
        if not packet_data:
            return jsonify({'status': 'error', 'message': 'No packets captured.'}), 400

        report_generator.generate_visualizations(packet_data)
        report = (report_generator.generate_traffic_report(packet_data) 
                 if report_data['report_type'] == 'traffic' 
                 else report_generator.generate_security_report(packet_data))
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_path = report_generator.export_to_json(report, f"report_{timestamp}")

        return jsonify({
            'status': 'success',
            'report_path': report_path,
            'report_data': report
        })
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
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
        logger.error(f"Error retrieving reports: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

### Data Export ###

@app.route('/export/<format>', methods=['GET'])
def export_data(format):
    global monitor
    try:
        if not monitor:
            return jsonify({'error': 'No capture data available'}), 400

        packets = monitor.get_captured_packets()
        df = pd.DataFrame(packets)

        if format == 'html':
            return send_file(
                io.BytesIO(df.to_html().encode()),
                mimetype='text/html',
                as_attachment=True,
                download_name='network_capture.html'
            )
        elif format == 'csv':
            return send_file(
                io.BytesIO(df.to_csv(index=False).encode()),
                mimetype='text/csv',
                as_attachment=True,
                download_name='network_capture.csv'
            )
        elif format == 'pdf':
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            
            # Styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                spaceAfter=30
            )
            
            # Add title and metadata
            elements.append(Paragraph("Network Capture Report", title_style))
            elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            elements.append(Paragraph(f"Interface: {DEFAULT_INTERFACE}", styles['Normal']))
            elements.append(Spacer(1, 20))
            
            # Convert DataFrame to table data
            table_data = [df.columns.tolist()] + df.values.tolist()
            table = Table(table_data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(table)
            
            # Add summary
            elements.append(Spacer(1, 20))
            elements.append(Paragraph(f"Total Packets Captured: {len(packets)}", styles['Normal']))
            
            doc.build(elements)
            buffer.seek(0)
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='network_capture.pdf'
            )
        else:
            return jsonify({'error': 'Invalid format'}), 400
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

### Health Check ###

@app.route('/health', methods=['GET'])
def health_check():
    global monitor, traffic_monitor
    return jsonify({
        'status': 'healthy',
        'monitor_active': monitor is not None,
        'ddos_monitor_active': traffic_monitor is not None,
        'default_interface': DEFAULT_INTERFACE,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    os.makedirs('reports', exist_ok=True)
    logger.info(f"Starting server with default interface: {DEFAULT_INTERFACE}")
    app.run(port=5002, debug=True)
