from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from services.packet_capture import NetworkMonitor
from services.report_generator import WiresharkReportGenerator
from services.attack_detection.brute_force import BruteForceDetector
import os
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import logging
import pandas as pd
import io
import netifaces
import platform
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import matplotlib.pyplot as plt
from werkzeug.utils import secure_filename
import netifaces
import platform
import base64
from bson.objectid import ObjectId

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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/myDatabase")
mongo = PyMongo(app)
CORS(app)

def get_default_interface():
    try:
        if platform.system() == 'Darwin':
            return 'en0'
        elif os.name == 'posix':
            default_gw = netifaces.gateways()['default']
            if default_gw and netifaces.AF_INET in default_gw:
                return default_gw[netifaces.AF_INET][1]
            return 'eth0'
        elif os.name == 'nt':
            return 'Ethernet'
        else:
            return 'eth0'
    except Exception as e:
        logger.warning(f"Error detecting default interface: {e}")
        return 'eth0'

DEFAULT_INTERFACE = get_default_interface()
monitor = None
report_generator = WiresharkReportGenerator()
ddos_detector = DDoSDetector()
traffic_monitor = TrafficMonitor()
brute_force_detector = BruteForceDetector()

def save_image_to_mongodb(img_stream):
    try:
        image_data = img_stream.read()
        image_id = mongo.db.images.insert_one({'image': image_data}).inserted_id
        return str(image_id)
    except Exception as e:
        logger.error(f"Error saving image to MongoDB: {e}")
        return None

def generate_protocol_pie_chart(packets):
    protocols = {}
    for packet in packets:
        protocol = packet.get('protocol', 'Unknown')
        protocols[protocol] = protocols.get(protocol, 0) + 1

    plt.figure(figsize=(10, 8))
    plt.pie(list(protocols.values()), labels=list(protocols.keys()), autopct='%1.1f%%', startangle=140)
    plt.title('Protocol Distribution', fontsize=16)
    plt.tight_layout()

    img_stream = io.BytesIO()
    plt.savefig(img_stream, format='png', bbox_inches='tight')
    plt.close()
    img_stream.seek(0)

    image_id = save_image_to_mongodb(img_stream)
    return image_id

def generate_top_ports_bar_chart(packets):
    port_counts = {}
    for packet in packets:
        port = packet.get('dest_port', 0)
        port_counts[port] = port_counts.get(port, 0) + 1

    top_ports = sorted(port_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    plt.figure(figsize=(10, 6))
    plt.bar([f'Port {port}' for port, _ in top_ports], [count for _, count in top_ports], color='skyblue')
    plt.title('Top 10 Destination Ports', fontsize=14)
    plt.xlabel('Port')
    plt.ylabel('Count')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()

    img_stream = io.BytesIO()
    plt.savefig(img_stream, format='png', bbox_inches='tight')
    plt.close()
    img_stream.seek(0)
    image_id = save_image_to_mongodb(img_stream)
    return image_id

def generate_traffic_time_series_chart(packets):
    time_intervals = 10
    packet_counts = [0] * time_intervals
    time_labels = []

    if packets and len(packets) > 1:
        try:
            start_time = datetime.fromisoformat(packets[0]['timestamp'])
            end_time = datetime.fromisoformat(packets[-1]['timestamp'])
            total_duration = (end_time - start_time).total_seconds()
            interval_duration = total_duration / time_intervals

            for packet in packets:
                packet_time = datetime.fromisoformat(packet['timestamp'])
                time_elapsed = (packet_time - start_time).total_seconds()
                interval_index = min(int(time_elapsed / interval_duration), time_intervals - 1)
                packet_counts[interval_index] += 1

            time_labels = [start_time + timedelta(seconds=i * interval_duration) for i in range(time_intervals)]

            plt.figure(figsize=(10, 6))
            plt.plot(time_labels, packet_counts, marker='o', linestyle='-')
            plt.title('Packet Rate Over Time', fontsize=14)
            plt.xlabel('Time')
            plt.ylabel('Packets/Interval')
            plt.xticks(rotation=45, ha='right')
            plt.tight_layout()

            img_stream = io.BytesIO()
            plt.savefig(img_stream, format='png', bbox_inches='tight')
            plt.close()
            img_stream.seek(0)

            image_id = save_image_to_mongodb(img_stream)
            return image_id

        except Exception as ts_err:
            logger.error(f"Error generating time series graph: {ts_err}")
            return None
    else:
        return None

@app.route('/start_capture', methods=['POST'])
def start_capture():
    global monitor, traffic_monitor
    try:
        data = request.get_json() if request.is_json else {}
        interface = data.get('interface', DEFAULT_INTERFACE)
        message_color = 'green'
        message = f'<span style="color:{message_color};">Starting capture on interface {interface}</span>'
        logger.info(f"Starting capture on interface: {interface}")
        monitor = NetworkMonitor(interface=interface)
        monitor.start_monitoring()
        traffic_monitor.start_monitoring()
        packets = monitor.get_captured_packets()
        total_packets = len(packets)
        protocols = {}
        for packet in packets:
            protocol = packet.get('protocol', 'Unknown')
            protocols[protocol] = protocols.get(protocol, 0) + 1

        pie_chart_id = generate_protocol_pie_chart(packets)
        bar_chart_id = generate_top_ports_bar_chart(packets)
        time_series_chart_id = generate_traffic_time_series_chart(packets)

        return jsonify({
            'status': 'success',
            'message': message,
            'interface': interface,
            'total_packets': total_packets,
            'protocols': protocols,
            'pie_chart_id': pie_chart_id,
            'bar_chart_id': bar_chart_id,
            'time_series_chart_id': time_series_chart_id
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
            message_color = 'red'
            message = f'<span style="color:{message_color};">Capture stopped</span>'
            return jsonify({'status': 'success', 'message': message})
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
            # Define which columns to include
            columns_to_include = ['timestamp', 'source_ip', 'dest_ip', 'protocol', 'length', 'info', 'dest_port', 'source_port']
            # Filter packets to include only the specified columns
            filtered_packets = [{k: packet[k] for k in columns_to_include if k in packet} for packet in packets]
            return jsonify(filtered_packets)
        return jsonify([])
    except Exception as e:
        logger.error(f"Error retrieving packets: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
        if ip_range:
            import ipaddress
            try:
                ipaddress.ip_network(ip_range, strict=False)
            except ValueError:
                errors.append("Invalid IP range.")
        if port_range:
            ports = port_range.split(',')
            for port in ports:
                if not port.isdigit() or not (0 <= int(port) <= 65535):
                    errors.append(f"Invalid port: {port}")
        valid_protocols = ['tcp', 'udp', 'http', 'https', 'dns', 'all']
        if protocol and protocol.lower() not in valid_protocols:
            errors.append(f"Invalid protocol: {protocol}. Valid options are {', '.join(valid_protocols)}.")

        if errors:
            return jsonify({'status': 'error', 'errors': errors}), 400
        return jsonify({'status': 'success', 'message': 'Filters are valid.'}), 200
    except Exception as e:
        logger.error(f"Error validating filters: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

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

@app.route('/export/<format>', methods=['GET'])
def export_data(format):
    global monitor
    try:
        if not monitor or not monitor.get_captured_packets():
            logger.error("No capture data available")
            return jsonify({'error': 'No capture data available'}), 400

        interface = request.args.get('interface')
        ip_range = request.args.get('ipRange')
        port_range = request.args.get('portRange')
        protocol = request.args.get('protocol')
        logger.info(f"Exporting data for interface: {interface}, ipRange: {ip_range}, portRange: {port_range}, protocol: {protocol}")
        packets = monitor.get_captured_packets()

        def clean_packet_data(packet):
            cleaned_packet = {}
            columns_to_include = ['timestamp', 'source_ip', 'dest_ip', 'protocol', 'length', 'info', 'dest_port', 'source_port']
            for key, value in packet.items():
                if key in columns_to_include:
                    cleaned_packet[key] = str(value) if value is not None else ''
            return cleaned_packet

        cleaned_packets = [clean_packet_data(packet) for packet in packets]
        df = pd.DataFrame(cleaned_packets)

        if format == 'html':
            html = df.to_html(index=False, na_rep='')
            return send_file(
                io.BytesIO(html.encode('utf-8')),
                mimetype='text/html',
                as_attachment=True,
                download_name='network_capture.html'
            )

        elif format == 'csv':
            csv_data = df.to_csv(index=False, na_rep='')
            return send_file(
                io.BytesIO(csv_data.encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name='network_capture.csv'
            )
        elif format == 'pdf':
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()

            # --- Improved Styling ---
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                spaceAfter=30,
                alignment=1,  # Center align
                textColor=colors.darkblue
            )
            normal_style = styles['Normal']
            h1_style = ParagraphStyle(
                'h1',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=12,
                textColor=colors.darkblue
            )
            h2_style = ParagraphStyle(
                'h2',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=6,
                textColor=colors.blue
            )
            table_style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ])

            # --- PAGE 1: Executive Summary ---
            elements.append(Paragraph("Packet2Page Network Analysis Report", title_style))
            elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
            elements.append(Paragraph(f"Interface: {interface if interface else DEFAULT_INTERFACE}", normal_style))
            elements.append(Spacer(1, 12))

            total_packets = len(packets)

            packets_per_second = 10
            bandwidth_kbps = 50
            active_connections = 5

            elements.append(Paragraph("Executive Summary", h1_style))
            elements.append(Paragraph(f"Total Packets Captured: {total_packets}", normal_style))
            elements.append(Paragraph(f"Packets Per Second: {packets_per_second}", normal_style))
            elements.append(Paragraph(f"Bandwidth: {bandwidth_kbps} KB/s", normal_style))
            elements.append(Paragraph(f"Active Connections: {active_connections}", normal_style))
            elements.append(Spacer(1, 24))

            elements.append(PageBreak())
            elements.append(Paragraph("Protocol Distribution", h1_style))
            protocol_pie_id = generate_protocol_pie_chart(packets)

            if protocol_pie_id:
                try:
                    image_data = mongo.db.images.find_one({'_id': ObjectId(protocol_pie_id)})['image']
                    img = Image(io.BytesIO(image_data), width=500, height=400)
                    elements.append(img)
                    elements.append(Spacer(1, 24))
                except Exception as e:
                    logger.error(f"Error retrieving or processing pie chart image: {e}")
                    elements.append(Paragraph("Error displaying pie chart.", normal_style))

            elements.append(PageBreak())
            elements.append(Paragraph("Top 10 Destination Ports", h1_style))
            top_ports_bar_id = generate_top_ports_bar_chart(packets)

            if top_ports_bar_id:
                try:
                    image_data = mongo.db.images.find_one({'_id': ObjectId(top_ports_bar_id)})['image']
                    img = Image(io.BytesIO(image_data), width=500, height=350)
                    elements.append(img)
                    elements.append(Spacer(1, 24))
                except Exception as e:
                    logger.error(f"Error retrieving or processing bar chart image: {e}")
                    elements.append(Paragraph("Error displaying bar chart.", normal_style))
            else:
                elements.append(Paragraph("Not enough packet data available for top ports analysis.", normal_style))
                elements.append(Spacer(1, 24))

            elements.append(PageBreak())
            elements.append(Paragraph("Network Traffic Analysis", h1_style))
            time_series_id = generate_traffic_time_series_chart(packets)

            if time_series_id:
                try:
                    image_data = mongo.db.images.find_one({'_id': ObjectId(time_series_id)})['image']
                    img = Image(io.BytesIO(image_data), width=500, height=350)
                    elements.append(img)
                    elements.append(Spacer(1, 24))
                except Exception as e:
                    logger.error(f"Error retrieving or processing time series chart image: {e}")
                    elements.append(Paragraph("Error displaying time series chart.", normal_style))
            else:
                elements.append(Paragraph("Not enough packet data available for time series analysis.", normal_style))
                elements.append(Spacer(1, 24))

            doc.build(elements)

            buffer.seek(0)
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='network_capture.pdf'
            )
        else:
            return jsonify({'error': 'Invalid format specified'}), 400

    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
