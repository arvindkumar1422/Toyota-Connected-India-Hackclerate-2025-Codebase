# simulator.py
# Simulates real-time data for two machines: M1 (CNC), M2 (Assembly Robot)
import random
import time
import math
from typing import List, Dict, Any
import datetime

class MachineSimulator:
    def __init__(self, machine_id: str, machine_type: str):
        self.id = machine_id
        self.type = machine_type
        self.tick = 0
        self.status = 'operational'
        self.base_power = 300 if machine_id == 'M1' else 200
        self.base_temp = 50
    
    def generate_data(self) -> Dict[str, Any]:
        self.tick += 1
        
        # Simulate status changes (rarely)
        if random.random() < 0.01:
            self.status = random.choice(['operational', 'idle', 'error'])
        elif self.status == 'error' and random.random() < 0.1:
            self.status = 'operational' # Recover
            
        # Generate data based on status
        if self.status == 'idle':
            power = random.uniform(10, 30)
            temp = max(20, self.base_temp - 10 + random.uniform(-2, 2))
            vibration = random.uniform(0.0, 0.1)
            cycle_time = 0
        elif self.status == 'error':
            power = random.uniform(0, 10)
            temp = self.base_temp + random.uniform(0, 20) # Overheating?
            vibration = random.uniform(0.0, 0.5)
            cycle_time = 0
        else: # operational
            # Add some sine wave trend to power
            trend = 50 * math.sin(self.tick / 10.0)
            power = self.base_power + trend + random.uniform(-20, 20)
            temp = self.base_temp + (power / 20) + random.uniform(-5, 5)
            vibration = random.uniform(0.1, 0.8) + (0.5 if power > 400 else 0)
            cycle_time = random.uniform(30, 60)

        return {
            'id': self.id,
            'type': self.type,
            'power': round(power, 2),
            'voltage': round(random.uniform(215, 235), 2), # Stable voltage
            'temperature': round(temp, 2),
            'vibration': round(vibration, 3),
            'status': self.status,
            'cycle_time': round(cycle_time, 2),
            'timestamp': datetime.datetime.now().isoformat()
        }

# Initialize simulators
simulators = [
    MachineSimulator('M1', 'CNC Machine'),
    MachineSimulator('M2', 'Assembly Robot')
]

def generate_machine_data() -> List[Dict[str, Any]]:
    return [sim.generate_data() for sim in simulators]

def generate_failure_risk(machine_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Simulate a risk score (0-1) for each machine based on parameters
    risks = []
    for m in machine_data:
        # Heuristic: higher temp, vibration, and power = higher risk
        risk = 0.0
        
        # Temperature risk
        if m['temperature'] > 80: risk += 0.4
        elif m['temperature'] > 60: risk += 0.2
        
        # Vibration risk
        if m['vibration'] > 0.8: risk += 0.4
        elif m['vibration'] > 0.5: risk += 0.2
        
        # Status risk
        if m['status'] == 'error': risk = 0.9
        
        # Normalize and clamp
        risk = min(max(risk, 0.0), 1.0)
        risks.append({'id': m['id'], 'risk': round(risk, 2)})
    return risks

def generate_energy_recommendations(machine_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    recs = []
    now = datetime.datetime.now().isoformat()
    for m in machine_data:
        if m['status'] == 'idle' and m['power'] > 25:
            recs.append({'msg': f"Reduce idle power on {m['id']} to save energy.", 'severity': 'medium', 'time': now})
        if m['temperature'] > 75:
            recs.append({'msg': f"Check cooling for {m['id']} (high temp).", 'severity': 'high', 'time': now})
        if m['cycle_time'] > 55 and m['status'] == 'operational':
            recs.append({'msg': f"Optimize cycle time for {m['id']} to improve efficiency.", 'severity': 'low', 'time': now})
            
    if not recs:
        recs.append({'msg': "All systems optimized.", 'severity': 'low', 'time': now})
    return recs 