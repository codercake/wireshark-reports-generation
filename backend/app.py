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
import pyshark
import traceback
ALLOWED_EXTENSIONS = {'pcap', 'cap', 'pcapng'}


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
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Utility function to check file extension
@app.route('/upload_pcap', methods=['POST'])
def upload_pcap():
    """
    Handles PCAP file upload, performs analysis, and generates a report.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Perform PCAP analysis
            logger.info(f"Analyzing PCAP file: {filepath}")
            packets = analyze_pcap(filepath)
            
            if not packets:
                logger.error("No packets were extracted from the PCAP file")
                return jsonify({'error': 'No packets could be extracted from the PCAP file'}), 400

            logger.info(f"Successfully extracted {len(packets)} packets from PCAP file")
            
            # Generate report data
            report_data = generate_report_data(packets)

            # Generate PDF report
            pdf_buffer = generate_pdf_report(report_data)

            # Return the PDF as a response
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='network_analysis_report.pdf'
            )

        except Exception as e:
            logger.exception(f"Error processing PCAP file: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            # Clean up the uploaded file
            try:
                os.remove(filepath)
            except OSError as e:
                logger.warning(f"Error deleting file {filepath}: {e}")

    else:
        return jsonify({'error': 'Invalid file type. Allowed types: pcap, cap'}), 400

def analyze_pcap(filepath):
    """
    Analyzes the PCAP file using pyshark.

    Args:
        filepath (str): Path to the PCAP file.

    Returns:
        list: A list of dictionaries, where each dictionary represents a packet
              and contains relevant information.
    """
    try:
        logger.info(f"Opening PCAP file: {filepath}")
        # Ensure the file exists
        if not os.path.exists(filepath):
            logger.error(f"PCAP file not found: {filepath}")
            raise FileNotFoundError(f"PCAP file not found: {filepath}")
            
        # Use keep_packets=False to avoid memory issues with large files
        capture = pyshark.FileCapture(filepath, keep_packets=False)
        packets_data = []
        
        # Set a counter to log progress
        packet_count = 0
        
        for packet in capture:
            try:
                packet_count += 1
                if packet_count % 100 == 0:
                    logger.info(f"Processed {packet_count} packets")
                
                # Extract timestamp
                timestamp = str(packet.sniff_time) if hasattr(packet, 'sniff_time') else datetime.now().isoformat()
                
                # Extract basic packet info
                packet_info = {
                    'timestamp': timestamp,
                    'length': int(packet.length) if hasattr(packet, 'length') else 0,
                    'protocol': packet.highest_layer if hasattr(packet, 'highest_layer') else 'Unknown',
                    'info': str(packet) if hasattr(packet, '__str__') else 'No summary available',
                    'source_ip': 'N/A',
                    'destination_ip': 'N/A',
                    'source_port': 'N/A',
                    'destination_port': 'N/A'
                }
                
                # Extract IP information if available
                if hasattr(packet, 'ip'):
                    packet_info['source_ip'] = packet.ip.src
                    packet_info['destination_ip'] = packet.ip.dst
                
                # Extract port information if available
                if hasattr(packet, 'tcp'):
                    packet_info['source_port'] = packet.tcp.srcport
                    packet_info['destination_port'] = packet.tcp.dstport
                elif hasattr(packet, 'udp'):
                    packet_info['source_port'] = packet.udp.srcport
                    packet_info['destination_port'] = packet.udp.dstport
                
                packets_data.append(packet_info)
                
            except AttributeError as e:
                logger.warning(f"Skipping packet due to AttributeError: {e}")
                continue
            except Exception as e:
                logger.error(f"An unexpected error occurred while processing a packet: {e}")
                continue

        logger.info(f"Completed processing PCAP file. Total packets processed: {packet_count}")
        capture.close()
        
        if not packets_data:
            logger.warning("No packets were successfully processed from the PCAP file")
            
        return packets_data

    except FileNotFoundError as e:
        logger.error(f"PCAP file not found: {e}")
        raise
    except Exception as e:
        logger.error(f"Error during PCAP analysis: {e}")
        logger.error(traceback.format_exc())
        raise

def generate_pdf_report(report_data):
    """
    Generates a PDF report from the analyzed packet data.
    
    Args:
        report_data (dict): Dictionary containing report data.
        
    Returns:
        io.BytesIO: A buffer containing the PDF data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        alignment=1,  # Center align
        textColor=colors.darkblue
    )
    
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
    
    # Title
    elements.append(Paragraph("Network Traffic Analysis Report", title_style))
    elements.append(Spacer(1, 20))
    
    # Summary section
    elements.append(Paragraph("Summary", h1_style))
    elements.append(Paragraph(f"Total Packets Analyzed: {report_data['total_packets']}", styles['Normal']))
    elements.append(Spacer(1, 10))
    
    # Protocol Distribution
    elements.append(Paragraph("Protocol Distribution", h2_style))
    protocol_data = []
    protocol_data.append(["Protocol", "Count"])
    for protocol, count in report_data['protocol_counts'].items():
        protocol_data.append([protocol, str(count)])
    
    protocol_table = Table(protocol_data, colWidths=[300, 100])
    protocol_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(protocol_table)
    elements.append(Spacer(1, 20))
    
    # Top Source IPs
    elements.append(Paragraph("Top Source IP Addresses", h2_style))
    source_ip_data = []
    source_ip_data.append(["IP Address", "Packet Count"])
    for ip, count in report_data['top_source_ips'].items():
        source_ip_data.append([ip, str(count)])
    
    source_ip_table = Table(source_ip_data, colWidths=[300, 100])
    source_ip_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(source_ip_table)
    elements.append(Spacer(1, 20))
    
    # Top Destination IPs
    elements.append(Paragraph("Top Destination IP Addresses", h2_style))
    dest_ip_data = []
    dest_ip_data.append(["IP Address", "Packet Count"])
    for ip, count in report_data['top_dest_ips'].items():
        dest_ip_data.append([ip, str(count)])
    
    dest_ip_table = Table(dest_ip_data, colWidths=[300, 100])
    dest_ip_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(dest_ip_table)
    elements.append(PageBreak())
    
    # Visualizations
    elements.append(Paragraph("Visualizations", h1_style))
    
    # Add protocol distribution chart if available
    if report_data['pie_chart_id']:
        try:
            pie_chart_data = mongo.db.images.find_one({'_id': ObjectId(report_data['pie_chart_id'])})
            if pie_chart_data and 'image' in pie_chart_data:
                img_data = pie_chart_data['image']
                img_stream = io.BytesIO(img_data)
                img = Image(img_stream, width=400, height=300)
                elements.append(Paragraph("Protocol Distribution Chart", h2_style))
                elements.append(img)
                elements.append(Spacer(1, 20))
        except Exception as e:
            logger.error(f"Error adding pie chart to PDF: {e}")
    
    # Add bar chart if available
    if report_data['bar_chart_id']:
        try:
            bar_chart_data = mongo.db.images.find_one({'_id': ObjectId(report_data['bar_chart_id'])})
            if bar_chart_data and 'image' in bar_chart_data:
                img_data = bar_chart_data['image']
                img_stream = io.BytesIO(img_data)
                img = Image(img_stream, width=400, height=300)
                elements.append(Paragraph("Top Ports Chart", h2_style))
                elements.append(img)
                elements.append(Spacer(1, 20))
        except Exception as e:
            logger.error(f"Error adding bar chart to PDF: {e}")
    
    # Add time series chart if available
    if report_data['time_series_chart_id']:
        try:
            time_series_data = mongo.db.images.find_one({'_id': ObjectId(report_data['time_series_chart_id'])})
            if time_series_data and 'image' in time_series_data:
                img_data = time_series_data['image']
                img_stream = io.BytesIO(img_data)
                img = Image(img_stream, width=400, height=300)
                elements.append(Paragraph("Traffic Over Time Chart", h2_style))
                elements.append(img)
        except Exception as e:
            logger.error(f"Error adding time series chart to PDF: {e}")
    
    # Build the PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_report_data(packets):
    """
    Generates report data from the analyzed packets.

    Args:
        packets (list): A list of packet dictionaries.

    Returns:
        dict: A dictionary containing report data like packet counts,
              protocol distribution, etc.
    """
    logger.info("Starting to generate report data...")
    
    if not packets:
        # Return a minimal report structure if no packets are available
        logger.warning("No packets available for report generation")
        return {
            'total_packets': 0,
            'protocol_counts': {},
            'top_source_ips': {},
            'top_dest_ips': {},
            'pie_chart_id': None,
            'bar_chart_id': None,
            'time_series_chart_id': None
        }
    
    total_packets = len(packets)
    logger.info(f"Processing {total_packets} packets for report")
    
    # Protocol counts
    protocol_counts = {}
    for packet in packets:
        protocol = packet.get('protocol', 'Unknown')
        protocol_counts[protocol] = protocol_counts.get(protocol, 0) + 1
    
    # Top source IPs
    source_ips = {}
    for packet in packets:
        source_ip = packet.get('source_ip', 'Unknown')
        if source_ip != 'N/A' and source_ip != 'Unknown':
            source_ips[source_ip] = source_ips.get(source_ip, 0) + 1
    
    # Top destination IPs
    dest_ips = {}
    for packet in packets:
        dest_ip = packet.get('destination_ip', 'Unknown')
        if dest_ip != 'N/A' and dest_ip != 'Unknown':
            dest_ips[dest_ip] = dest_ips.get(dest_ip, 0) + 1
    
    # Generate charts
    logger.info("Generating protocol pie chart...")
    pie_chart_id = generate_protocol_pie_chart(packets)
    
    logger.info("Generating top ports bar chart...")
    bar_chart_id = generate_top_ports_bar_chart(packets)
    
    logger.info("Generating traffic time series chart...")
    time_series_chart_id = generate_traffic_time_series_chart(packets)
    
    # Sort the IP dictionaries by count (descending) and take top 10
    top_source_ips = dict(sorted(source_ips.items(), key=lambda x: x[1], reverse=True)[:10])
    top_dest_ips = dict(sorted(dest_ips.items(), key=lambda x: x[1], reverse=True)[:10])
    
    logger.info("Report data generation complete")
    
    return {
        'total_packets': total_packets,
        'protocol_counts': protocol_counts,
        'top_source_ips': top_source_ips,
        'top_dest_ips': top_dest_ips,
        'pie_chart_id': pie_chart_id,
        'bar_chart_id': bar_chart_id,
        'time_series_chart_id': time_series_chart_id
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
