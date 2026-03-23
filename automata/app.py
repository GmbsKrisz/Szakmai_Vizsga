"""
app.py – Flask szerver a Switch Konfigurátor GUI-hoz
Indítás: python app.py
"""

import os
import sys
import importlib
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(__file__))
import config_script

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/run', methods=['POST'])
def api_run():
    importlib.reload(config_script)
    
    # Adatok fogadása a klienstől
    payload = request.get_json()
    if not payload:
        return jsonify({'success': False, 'output': '[ERROR] Érvénytelen kérés, nincs adat!'}), 400
        
    target_ip = payload.get('target_ip', '')
    config_data = payload.get('config', {})

    # Konfigurálás indítása a paraméterekkel
    result = config_script.run(target_ip=target_ip, config_data=config_data)
    return jsonify(result), (200 if result['success'] else 500)

if __name__ == '__main__':
    print("=" * 45)
    print("  Switch Konfigurátor – http://localhost:5000")
    print("=" * 45)
    app.run(host='0.0.0.0', port=5000, debug=False)
