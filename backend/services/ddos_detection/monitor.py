import time
from threading import Thread, Event
from .detector import DDoSDetector

class TrafficMonitor:
    def __init__(self, alert_threshold=0.7):
        self.detector = DDoSDetector()
        self.alert_threshold = alert_threshold
        self.stop_event = Event()
        self.monitoring_thread = None
        self.alerts = []

    def start_monitoring(self, callback=None):
        """ Start traffic monitoring in a separate thread. """
        def monitor_traffic():
            while not self.stop_event.is_set():
                try:
                    current_traffic = self.get_current_traffic()
                    analysis = self.detector.detect_ddos(current_traffic)
                    
                    if analysis['confidence'] > self.alert_threshold:
                        alert = {
                            'timestamp': time.time(),
                            'suspicious_ips': analysis.get('suspicious_ips', []),
                            'severity': 'HIGH' if analysis['confidence'] > 0.8 else 'MEDIUM'
                        }
                        self.alerts.append(alert)

                        if callback:
                            callback(alert)

                        # Print or log the alert
                        print(f"[ALERT] Suspicious traffic detected! IPs: {alert['suspicious_ips']}")

                    time.sleep(10)  # Check every 10 seconds
                except Exception as e:
                    print(f"Monitoring error: {e}")
                    time.sleep(5)

        self.monitoring_thread = Thread(target=monitor_traffic, daemon=True)
        self.monitoring_thread.start()

    def stop_monitoring(self):
        """ Stop the monitoring thread. """
        self.stop_event.set()
        if self.monitoring_thread:
            self.monitoring_thread.join()

    def get_current_traffic(self):
        """ Placeholder for fetching live network traffic data. Implement this! """
        return []

    def get_alerts(self):
        """ Retrieve stored alerts. """
        return self.alerts
