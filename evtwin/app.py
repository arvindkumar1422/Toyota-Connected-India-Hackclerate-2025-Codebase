from flask import Flask, jsonify, request, render_template, session, redirect, url_for
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import logging
import os
import requests
from typing import List, Dict, Any

from simulator import generate_machine_data, generate_failure_risk, generate_energy_recommendations
from detector import detect_anomalies, generate_historical_data

# Initialize Flask App
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_demo_only') # Use env var or fallback
CORS(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global State
latest_data: List[Dict[str, Any]] = []
latest_anomalies: List[Dict[str, Any]] = []
latest_risks: List[Dict[str, Any]] = []
latest_recs: List[Dict[str, Any]] = []

# User Role Mapping
USER_ROLE_MAP = {
    'ak2730531@gmail.com': 'head',
    'ac6102@srmist.edu.in': 'lead',
    'smoulee77@gmail.com': 'worker',
}

# Configure Logging
logging.basicConfig(
    filename='audit.log', 
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(message)s'
)

def background_data_thread():
    """Generates data in the background and emits to clients."""
    global latest_data, latest_anomalies, latest_risks, latest_recs
    while True:
        try:
            latest_data = generate_machine_data()
            latest_anomalies = detect_anomalies(latest_data)
            latest_risks = generate_failure_risk(latest_data)
            latest_recs = generate_energy_recommendations(latest_data)
            
            socketio.emit('machine_data', {
                'machines': latest_data, 
                'anomalies': latest_anomalies, 
                'risks': latest_risks, 
                'recommendations': latest_recs
            })
            time.sleep(1)
        except Exception as e:
            logging.error(f"Error in background thread: {e}")
            time.sleep(5) # Wait before retrying

@socketio.on('connect')
def handle_connect():
    emit('machine_data', {
        'machines': latest_data, 
        'anomalies': latest_anomalies, 
        'risks': latest_risks, 
        'recommendations': latest_recs
    })

# Start background thread
threading.Thread(target=background_data_thread, daemon=True).start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/post_login')
def post_login():
    # Assume session['user_email'] is set after Firebase login (handled on client side usually, but here we simulate)
    # In a real app, you'd verify the token here.
    email = session.get('user_email')
    role = USER_ROLE_MAP.get(email, 'worker')
    return redirect(url_for(f'dashboard_{role}'))

@app.route('/dashboard/head')
def dashboard_head():
    return render_template('dashboard_head.html')

@app.route('/dashboard/lead')
def dashboard_lead():
    return render_template('dashboard_lead.html')

@app.route('/dashboard/worker')
def dashboard_worker():
    return render_template('dashboard_worker.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/security')
def security():
    return render_template('security.html')

@app.route('/api/audit', methods=['POST'])
def audit_event():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        logging.info(f"AUDIT: {data.get('event')} | user: {data.get('user')} | details: {data.get('details','')}")
        return jsonify({'status': 'logged'})
    except Exception as e:
        logging.error(f"Audit error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/machines')
def get_machines():
    return jsonify({'machines': latest_data})

@app.route('/api/anomalies')
def get_anomalies():
    return jsonify({'anomalies': latest_anomalies})

@app.route('/api/security')
def get_security():
    # Mock security alerts
    return jsonify({'alerts': []})

@app.route('/api/simulate', methods=['POST'])
def simulate():
    return jsonify({'status': 'started'})

@app.route('/api/historical')
def get_historical():
    data, anomalies = generate_historical_data(300)
    return jsonify({'data': data, 'anomalies': anomalies})

@app.route('/api/gemini', methods=['POST'])
def gemini_chat():
    data = request.json
    question = data.get('question', '')
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'answer': "Gemini API key not set."}), 500
    try:
        response = requests.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            params={'key': api_key},
            json={"contents": [{"parts": [{"text": question}]}]}
        )
        if response.ok:
            answer = response.json()['candidates'][0]['content']['parts'][0]['text']
            return jsonify({'answer': answer})
    except Exception as e:
        logging.error(f"Gemini API error: {e}")
        pass
    return jsonify({'answer': "Sorry, I'm unable to reach Gemini right now. Try again later or ask a simple question."}), 200

@app.route('/api/control', methods=['POST'])
def api_control():
    data = request.get_json()
    machine_id = data.get('machine_id')
    action = data.get('action')
    message = data.get('message')
    # Simulate control logic
    if action == 'reduce_power':
        return jsonify({'success': True, 'message': f'Power reduced for {machine_id.upper()}.'})
    elif action == 'shut_down':
        return jsonify({'success': True, 'message': f'{machine_id.upper()} shut down. Power and voltage set to 0.'})
    elif action == 'reset_alarm':
        return jsonify({'success': True, 'message': f'Alarm reset for {machine_id.upper()}.'})
    elif action == 'resolve_recommendation':
        return jsonify({'success': True, 'message': f'Recommendation resolved: {message}'})
    else:
        return jsonify({'success': False, 'message': 'Unknown action.'}), 400

@app.route('/api/gemma', methods=['POST'])
def api_gemma():
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    try:
        ollama_resp = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'gemma:2b',
                'prompt': prompt,
                'stream': False
            },
            timeout=30
        )
        ollama_resp.raise_for_status()
        result = ollama_resp.json()
        answer = result.get('response', '').strip()
        return jsonify({'answer': answer})
    except Exception as e:
        logging.error(f"Gemma API error: {e}")
        return jsonify({'error': 'Failed to communicate with Gemma model'}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000) 