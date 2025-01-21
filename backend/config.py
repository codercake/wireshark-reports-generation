import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')  # Use environment variables for security
    CAPTURE_INTERFACE = os.getenv('CAPTURE_INTERFACE', 'eth0')  # Default interface
    DEFAULT_DURATION = int(os.getenv('DEFAULT_DURATION', 60))   # Default capture duration
    ALLOWED_PROTOCOLS = os.getenv('ALLOWED_PROTOCOLS', 'TCP,UDP,ICMP').split(',')  # Allow comma-separated protocols
    MAX_CAPTURE_DURATION = int(os.getenv('MAX_CAPTURE_DURATION', 300))  # Limit on capture duration
