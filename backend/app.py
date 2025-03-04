from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
from services.packet_capture import NetworkMonitor
from services.report_generator import WiresharkReportGenerator
from services.attack_detection.brute_force import BruteForceDetector  # Corrected import
import os
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import json
from datetime import datetime
import logging
import pandas as pd
import io
import netifaces
import platform
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import matplotlib.pyplot as plt
from werkzeug.utils import secure_filename
import netifaces
import platform

load_dotenv()

class TrafficMonitor:
    def __init__(self):
        self.ip_data = {}
        self.threshold = 100
        self.alerts = []
        self.is_monitoring = False

    def start_monitoring(self):
        self.is_monitoring = True

    def stop_monitoring(self):
        self.is_monitoring = False

    def get_alerts(self):
        return self.alerts

    def get_suspicious_ips(self):
        suspicious_ips = []
        for ip, data in self.ip_data.items():
            if data.get('request_count', 0) > self.threshold:
                suspicious_ips.append(ip)
        return suspicious_ips

class DDoSDetector:
    def __init__(self):
        self.threshold = 100

    def detect_ddos(self, packets):
        return {"detected": False, "analysis": "No threats detected"}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/myDatabase")
mongo = PyMongo(app)
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
brute_force_detector = BruteForceDetector()

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

        # Capture the visual data for PDF
        packets = monitor.get_captured_packets()
        total_packets = len(packets)
        protocols = {}
        for packet in packets:
            protocol = packet.get('protocol', 'Unknown')
            protocols[protocol] = protocols.get(protocol, 0) + 1

        # Generate pie chart
        plt.figure(figsize=(8, 6))
        plt.pie(list(protocols.values()), labels=list(protocols.keys()), autopct='%1.1f%%', startangle=140)
        plt.title('Protocol Distribution')
        plt.savefig('protocol_pie.png', bbox_inches='tight')
        plt.close()

        # Generate top destination ports bar chart
        port_counts = {}
        for packet in packets:
            port = packet.get('destination_port', 0)
            port_counts[port] = port_counts.get(port, 0) + 1

        top_ports = sorted(port_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        plt.figure(figsize=(8, 6))
        plt.bar([f'Port {port}' for port, _ in top_ports], [count for _, count in top_ports], color='skyblue')
        plt.title('Top 10 Destination Ports')
        plt.xlabel('Port')
        plt.ylabel('Count')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig('top_ports_bar.png', bbox_inches='tight')
        plt.close()

        # Return data and file paths for frontend to export as PDF
        return jsonify({
            'status': 'success',
            'message': f'Capture started on interface {interface}',
            'interface': interface,
            'total_packets': total_packets,
            'protocols': protocols,
            'pie_chart': 'protocol_pie.png',
            'bar_chart': 'top_ports_bar.png'
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

@app.route('/validate_filters', methods=['POST'])
def validate_filters():
    try:
        data = request.get_json()
        ip_range = data.get('ipRange', '')
        port_range = data.get('portRange', '')
        protocol = data.get('protocol', '')

        errors = []

        # Validate IP Range
        if ip_range:
            import ipaddress
            try:
                ipaddress.ip_network(ip_range, strict=False)
            except ValueError:
                errors.append("Invalid IP range.")

        # Validate Port Range
        if port_range:
            ports = port_range.split(',')
            for port in ports:
                if not port.isdigit() or not (0 <= int(port) <= 65535):
                    errors.append(f"Invalid port: {port}")

        # Validate Protocol
        valid_protocols = ['tcp', 'udp', 'http', 'https', 'dns', 'all']
        if protocol and protocol.lower() not in valid_protocols:
            errors.append(f"Invalid protocol: {protocol}. Valid options are {', '.join(valid_protocols)}.")

        if errors:
            return jsonify({'status': 'error', 'errors': errors}), 400

        return jsonify({'status': 'success', 'message': 'Filters are valid.'}), 200

    except Exception as e:
        logger.error(f"Error validating filters: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

### Brute Force Detection ###

@app.route('/analyze_brute_force', methods=['POST'])
def analyze_brute_force():
    global monitor
    try:
        if not monitor:
            return jsonify({'status': 'error', 'message': 'No active capture'}), 400

        packets = monitor.get_captured_packets()
        alerts = brute_force_detector.start_detection(packets)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        analysis_path = f'reports/brute_force_analysis_{timestamp}.json'
        with open(analysis_path, 'w') as f:
            json.dump(alerts, f)

        return jsonify({
            'status': 'success',
            'alerts': alerts,
            'timestamp': timestamp,
            'saved_path': analysis_path
        })
    except Exception as e:
        logger.error(f"Error analyzing brute force attempts: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

### Data Export ###

@app.route('/export/<format>', methods=['GET'])
def export_data(format):
    global monitor
    try:
        if not monitor or not monitor.get_captured_packets():
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
            
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                spaceAfter=30
            )

            # Add Title and metadata to report
            elements.append(Paragraph("Network Capture Report", title_style))
            elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            elements.append(Paragraph(f"Interface: {DEFAULT_INTERFACE}", styles['Normal']))
            elements.append(Spacer(1, 20))

            # Capture the visual data for PDF
            packets = monitor.get_captured_packets()
            total_packets = len(packets)
            protocols = {}
            for packet in packets:
                protocol = packet.get('protocol', 'Unknown')
                protocols[protocol] = protocols.get(protocol, 0) + 1

            # Generate pie chart
            plt.figure(figsize=(8, 6))
            plt.pie(list(protocols.values()), labels=list(protocols.keys()), autopct='%1.1f%%', startangle=140)
            plt.title('Protocol Distribution')
            plt.savefig('protocol_pie.png', bbox_inches='tight')
            plt.close()

            # Generate top destination ports bar chart
            port_counts = {}
            for packet in packets:
                port = packet.get('destination_port', 0)
                port_counts[port] = port_counts.get(port, 0) + 1

            top_ports = sorted(port_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            plt.figure(figsize=(8, 6))
            plt.bar([f'Port {port}' for port, _ in top_ports], [count for _, count in top_ports], color='skyblue')
            plt.title('Top 10 Destination Ports')
            plt.xlabel('Port')
            plt.ylabel('Count')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig('top_ports_bar.png', bbox_inches='tight')
            plt.close()

            # Include charts in the report
            elements.append(Image('protocol_pie.png', width=400, height=300))
            elements.append(Spacer(1, 20))
            elements.append(Image('top_ports_bar.png', width=500, height=350))
            elements.append(Spacer(1, 20))

            # Total Packets info
            elements.append(Paragraph(f"Total Packets Captured: {total_packets}", styles['Normal']))
            elements.append(Spacer(1, 20))
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

@app.route('/health', methods=['GET'])
def health_check():
    global monitor, traffic_monitor, brute_force_detector
    return jsonify({
        'status': 'healthy',
        'monitor_active': monitor is not None,
        'ddos_monitor_active': traffic_monitor is not None,
        'brute_force_detector_active': brute_force_detector is not None,
        'default_interface': DEFAULT_INTERFACE,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/submit_form', methods=['POST'])
def submit_form():
    try:
        data = request.form  # Access form data using request.form
        name = data.get('name', 'Anonymous')
        email = data.get('email', 'No email provided')
        comment = data.get('comment', '')

        logger.info(f"Form data received: Name={name}, Email={email}, Comment={comment}")

        return render_template('form_submission.html', name=name, email=email, comment=comment)  # Render a template
    except Exception as e:
        logger.error(f"Error handling form submission: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/form')
def display_form():
    return render_template('form.html')

if __name__ == '__main__':
    os.makedirs('reports', exist_ok=True)
    logger.info(f"Starting server with default interface: {DEFAULT_INTERFACE}")
    app.run(port=5002, debug=True)
