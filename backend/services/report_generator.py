import matplotlib
matplotlib.use('Agg')  # Use the 'Agg' backend, which doesn't require a GUI
import matplotlib.pyplot as plt
from datetime import datetime
import json
import os
from fpdf import FPDF
from collections import defaultdict, Counter
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WiresharkReportGenerator:
    def __init__(self, output_dir="reports"):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        self.suspicious_ports = [23, 1433, 7547, 4444]
        self.blacklisted_ips = self._load_blacklisted_ips()

    def generate_traffic_report(self, packet_data):
        return {
            'timestamp': datetime.now().isoformat(),
            'total_packets': len(packet_data),
            'protocol_distribution': self._analyze_protocols(packet_data),
            'ip_statistics': self._analyze_ip_addresses(packet_data),
            'port_statistics': self._analyze_ports(packet_data)
        }

    def generate_security_report(self, packet_data):
        suspicious_packets = self._identify_suspicious_packets(packet_data)
        port_scan_attempts = self._detect_port_scans(packet_data)
        unusual_traffic_patterns = self._analyze_traffic_patterns(packet_data)
        dos_attacks = self._detect_dos_attacks(packet_data)

        return {
            'timestamp': datetime.now().isoformat(),
            'suspicious_packets': suspicious_packets,
            'port_scan_attempts': port_scan_attempts,
            'unusual_traffic_patterns': unusual_traffic_patterns,
            'dos_attacks': dos_attacks
        }

    def export_to_pdf(self, report_data, filename, packet_data=None):
        if packet_data:
            self.generate_visualizations(packet_data)
        report_path = os.path.join(self.output_dir, f"{filename}.pdf")
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.set_font(size=16, style='B')
        pdf.cell(200, 10, txt="Network Traffic Report", ln=1, align='C')
        pdf.set_font(size=12)
        pdf.cell(200, 10, txt=f"Generated: {report_data['timestamp']}", ln=1)
        pdf.ln(10)

        if 'total_packets' in report_data:
            self._add_traffic_report_content(pdf, report_data)
        else:
            self._add_security_report_content(pdf, report_data)

        self._add_visualizations_to_pdf(pdf)
        pdf.output(report_path)
        return report_path

    def export_to_json(self, report_data, filename):
        report_path = os.path.join(self.output_dir, f"{filename}.json")
        with open(report_path, 'w') as f:
            json.dump(report_data, f, indent=4)
        return report_path

    def generate_visualizations(self, packet_data):
        self._create_protocol_pie_chart(packet_data)
        self._create_traffic_timeline(packet_data)
        self._create_port_distribution(packet_data)

    def _analyze_protocols(self, packet_data):
        protocols = Counter()
        for packet in packet_data:
            protocols[packet.get('protocol', 'Unknown')] += 1
        return dict(protocols)

    def _analyze_ip_addresses(self, packet_data):
        src_ips = Counter()
        dst_ips = Counter()
        for packet in packet_data:
            src_ips[packet.get('source_ip')] += 1
            dst_ips[packet.get('dest_ip')] += 1
        return {'source_ips': dict(src_ips), 'dest_ips': dict(dst_ips)}

    def _analyze_ports(self, packet_data):
        src_ports = Counter()
        dst_ports = Counter()
        for packet in packet_data:
            src_ports[packet.get('source_port')] += 1
            dst_ports[packet.get('dest_port')] += 1
        return {'source_ports': dict(src_ports), 'dest_ports': dict(dst_ports)}

    def _identify_suspicious_packets(self, packet_data):
        return [pkt for pkt in packet_data if self._is_suspicious(pkt)]

    def _is_suspicious(self, packet):
        if packet.get('dest_port') in self.suspicious_ports:
            return True
        if packet.get('source_ip') in self.blacklisted_ips:
            return True
        flags = packet.get('flags', [])
        if 'SYN' in flags and 'FIN' in flags:
            return True
        return False

    def _detect_port_scans(self, packet_data, port_threshold=5, time_window=10):
        scan_candidates = defaultdict(lambda: defaultdict(set))
        for pkt in packet_data:
            if not all(key in pkt for key in ['source_ip', 'dest_ip', 'dest_port', 'timestamp']):
                continue
            try:
                ts = datetime.fromisoformat(pkt['timestamp']) if isinstance(pkt['timestamp'], str) else pkt['timestamp']
                key = (pkt['source_ip'], pkt['dest_ip'])
                scan_candidates[key]['ports'].add(pkt['dest_port'])
                scan_candidates[key]['timestamps'].append(ts)
            except:
                continue

        port_scans = []
        for (src, dst), data in scan_candidates.items():
            if len(data['ports']) >= port_threshold:
                times = sorted(data['timestamps'])
                window = (times[-1] - times[0]).total_seconds()
                if window <= time_window:
                    port_scans.append({
                        'source': src,
                        'target': dst,
                        'ports': len(data['ports']),
                        'duration': f"{window:.1f}s"
                    })
        return port_scans

    def _analyze_traffic_patterns(self, packet_data):
        try:
            timestamps = [datetime.fromisoformat(p['timestamp']) if isinstance(p['timestamp'], str) else p['timestamp']
                          for p in packet_data if 'timestamp' in p]
            if not timestamps:
                return {}

            timestamps.sort()
            bins = pd.date_range(start=timestamps[0], end=timestamps[-1], freq='1min')
            hist = pd.cut(pd.Series(timestamps), bins=bins).value_counts().sort_index()

            if len(hist) < 2:
                return {}

            mean = hist.mean()
            std = hist.std()
            threshold = mean + 3 * std
            spikes = hist[hist > threshold]

            return {
                'traffic_spikes': len(spikes),
                'max_spike': hist.max(),
                'average': mean,
                'std_deviation': std
            }
        except Exception as e:
            logger.error(f"Error in _analyze_traffic_patterns: {e}")
            return {}

    def _create_protocol_pie_chart(self, packet_data):
        protocols = self._analyze_protocols(packet_data)
        try:
            plt.figure(figsize=(10, 8))
            plt.pie(protocols.values(), labels=protocols.keys(), autopct='%1.1f%%')
            plt.title('Protocol Distribution')
            plt.savefig(os.path.join(self.output_dir, 'protocol_distribution.png'))
            plt.close()
        except Exception as e:
            logger.error(f"Error in _create_protocol_pie_chart: {e}")

    def _create_traffic_timeline(self, packet_data):
        timestamps = [p.get('timestamp') for p in packet_data if p.get('timestamp')]
        if not timestamps:
            return
        try:
            ts_series = pd.to_datetime(pd.Series(timestamps))
            counts = ts_series.dt.floor('1min').value_counts().sort_index()
            plt.figure(figsize=(12, 6))
            counts.plot(kind='line', marker='o')
            plt.title('Traffic Timeline')
            plt.xlabel('Time')
            plt.ylabel('Packets per Minute')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(os.path.join(self.output_dir, 'traffic_timeline.png'))
            plt.close()
        except Exception as e:
            logger.error(f"Error in _create_traffic_timeline: {e}")

    def _create_port_distribution(self, packet_data, top_n=10):
        ports = [p.get('dest_port') for p in packet_data if p.get('dest_port')]
        if not ports:
            return
        try:
            port_counts = Counter(ports)
            common = port_counts.most_common(top_n)
            plt.figure(figsize=(12, 6))
            plt.bar([str(p[0]) for p in common], [p[1] for p in common])
            plt.title(f'Top {top_n} Destination Ports')
            plt.xlabel('Port Number')
            plt.ylabel('Packet Count')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(os.path.join(self.output_dir, 'port_distribution.png'))
            plt.close()
        except Exception as e:
            logger.error(f"Error in _create_port_distribution: {e}")

    def _load_blacklisted_ips(self):
        return {'192.168.1.666', '10.0.0.13'}

    def _add_traffic_report_content(self, pdf, report):
        pdf.set_font(style='B')
        pdf.cell(200, 10, txt="Traffic Summary", ln=1)
        pdf.set_font(style='')
        pdf.cell(200, 10, txt=f"Total Packets: {report['total_packets']}", ln=1)
        pdf.ln(5)

    def _add_security_report_content(self, pdf, report):
        pdf.set_font(style='B')
        pdf.cell(200, 10, txt="Security Summary", ln=1)
        pdf.set_font(style='')
        pdf.cell(200, 10, txt=f"Suspicious Packets: {len(report['suspicious_packets'])}", ln=1)
        pdf.cell(200, 10, txt=f"Port Scan Attempts: {len(report['port_scan_attempts'])}", ln=1)
        pdf.ln(5)

    def _add_visualizations_to_pdf(self, pdf):
        for img in ['protocol_distribution.png', 'traffic_timeline.png', 'port_distribution.png']:
            img_path = os.path.join(self.output_dir, img)
            if os.path.exists(img_path):
                pdf.add_page()
                pdf.image(img_path, x=10, y=10, w=190)

    def _detect_dos_attacks(self, packet_data, time_window=60, threshold=1000):
        ip_counts = defaultdict(int)
        time_counts = defaultdict(list)

        for packet in packet_data:
            source_ip = packet.get('source_ip')
            timestamp = packet.get('timestamp')

            if not source_ip or not timestamp:
                continue

            try:
                ts = datetime.fromisoformat(timestamp)
                ip_counts[source_ip] += 1
                time_counts[source_ip].append(ts)
            except ValueError as e:
                logger.error(f"Error parsing timestamp: {e}")
                continue

        anomalous_ips = []
        for ip, timestamps in time_counts.items():
            if ip_counts[ip] > threshold:
                start_time = min(timestamps)
                end_time = max(timestamps)
                duration = (end_time - start_time).total_seconds()

                if duration <= time_window:
                    anomalous_ips.append({
                        'ip': ip,
                        'count': ip_counts[ip],
                        'start_time': start_time.isoformat(),
                        'end_time': end_time.isoformat()
                    })

        return anomalous_ips

# pcapfile = 'your_pcap_file.pcap'
# try:
#     extraction = pcapkit.extract(fin=pcapfile, store=False, nofile=True, tcp=True, strict=True)
#     # Process extracted data here
# except Exception as e:
#     logger.error(f"Error generating report: {e}")
