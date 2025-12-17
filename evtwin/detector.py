# detector.py
# Rule-based anomaly detection for machine data
from typing import List, Dict, Any, Tuple
import random
import time

def detect_anomalies(machine_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    anomalies = []
    for m in machine_data:
        # Power Spike: > 450W (assuming 400W is high load)
        if m['power'] > 450:
            anomalies.append({'id': m['id'], 'type': 'Power Spike', 'value': m['power']})
        
        # Voltage Drop: < 210V (assuming 220-240V is normal)
        if m['voltage'] < 210:
            anomalies.append({'id': m['id'], 'type': 'Voltage Drop', 'value': m['voltage']})
        
        # High Temperature: > 85C
        if m['temperature'] > 85:
            anomalies.append({'id': m['id'], 'type': 'High Temperature', 'value': m['temperature']})
        
        # Idle Power Waste: Status is idle but power > 25W
        if m['status'] == 'idle' and m['power'] > 25:
            anomalies.append({'id': m['id'], 'type': 'Idle Power Waste', 'value': m['power']})
        
        # Vibration Anomaly: > 1.0
        if m['vibration'] > 1.0:
            anomalies.append({'id': m['id'], 'type': 'Vibration Anomaly', 'value': m['vibration']})
        
        # Cycle Time Deviation: > 70s (assuming 60s is max normal)
        if m['cycle_time'] > 70:
            anomalies.append({'id': m['id'], 'type': 'Cycle Time Deviation', 'value': m['cycle_time']})
            
    return anomalies

def generate_historical_data(num_points: int = 1000) -> Tuple[List[List[Dict[str, Any]]], List[Dict[str, Any]]]:
    data = []
    anomalies = []
    t0 = int(time.time()) - num_points
    
    # Use the simulator logic for consistency if possible, but for now keep it simple
    # to avoid circular imports or complex refactoring of this helper function.
    for i in range(num_points):
        machines = [
            {
                'id': 'M1',
                'type': 'CNC Machine',
                'power': random.uniform(100, 500),
                'voltage': random.uniform(210, 240),
                'temperature': random.uniform(30, 80),
                'vibration': random.uniform(0.1, 1.0),
                'status': random.choice(['operational', 'idle', 'error']),
                'cycle_time': random.uniform(30, 60),
                'timestamp': t0 + i
            },
            {
                'id': 'M2',
                'type': 'Assembly Robot',
                'power': random.uniform(80, 400),
                'voltage': random.uniform(210, 240),
                'temperature': random.uniform(30, 85),
                'vibration': random.uniform(0.1, 1.2),
                'status': random.choice(['operational', 'idle', 'error']),
                'cycle_time': random.uniform(20, 50),
                'timestamp': t0 + i
            }
        ]
        data.append(machines)
        for m in machines:
            for a in detect_anomalies([m]):
                a['timestamp'] = t0 + i
                anomalies.append(a)
    return data, anomalies 