import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')  
    CAPTURE_INTERFACE = os.getenv('CAPTURE_INTERFACE', 'eth0')  
    DEFAULT_DURATION = int(os.getenv('DEFAULT_DURATION', 60))  
    ALLOWED_PROTOCOLS = os.getenv('ALLOWED_PROTOCOLS', 'TCP,UDP,ICMP').split(',')  
    MAX_CAPTURE_DURATION = int(os.getenv('MAX_CAPTURE_DURATION', 300))  
    MONGO_URI = os.getenv("MONGO_URI") 
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"


