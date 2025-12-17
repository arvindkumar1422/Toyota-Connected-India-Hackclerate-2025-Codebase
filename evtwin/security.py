# security.py
# Monitors for cybersecurity events
import time

def get_security_alerts():
    # Returns a list of mock security alerts
    return [
        {'timestamp': time.time(), 'type': 'Unauthorized Access', 'details': 'Failed login attempt'},
        {'timestamp': time.time(), 'type': 'Data Tampering', 'details': 'Checksum mismatch detected'},
        {'timestamp': time.time(), 'type': 'Network Anomaly', 'details': 'Unusual traffic spike'},
        {'timestamp': time.time(), 'type': 'Suspicious API Call', 'details': 'Access to restricted endpoint'},
        {'timestamp': time.time(), 'type': 'Login Security', 'details': 'MFA challenge issued'}
    ] 