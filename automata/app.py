from flask import Flask, render_template, request, jsonify
import socket
import time

app = Flask(__name__)

def read_until(sock, expected_bytes, timeout=5):
    sock.settimeout(timeout)
    buffer = b""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            chunk = sock.recv(1024)
            if not chunk: break
            buffer += chunk
            if expected_bytes in buffer: break
        except socket.timeout: break
    return buffer

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/deploy', methods=['POST'])
def deploy():
    data = request.json
    ip, user, pwd = data.get('ip'), data.get('username'), data.get('password')
    full_log = ""
    
    def send_and_wait(sock, cmd_bytes, wait_time=1.0):
        nonlocal full_log
        if cmd_bytes: sock.sendall(cmd_bytes)
        time.sleep(wait_time)
        sock.settimeout(0.5)
        while True:
            try:
                chunk = sock.recv(4096)
                if not chunk: break
                full_log += chunk.decode('ascii', errors='ignore')
            except socket.timeout: break

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(10)
        s.connect((ip, 23))
        
        send_and_wait(s, b"", 2.0)
        
        # 1-3. Belépések
        send_and_wait(s, user.encode('ascii'), 0.5)
        send_and_wait(s, b"\t", 0.5)
        send_and_wait(s, pwd.encode('ascii'), 0.5)
        send_and_wait(s, b"\r\n", 1.5)
        
        send_and_wait(s, b"\x1a\r\n", 1.5)
        send_and_wait(s, b"lcli\r\n", 1.5)
        
        send_and_wait(s, user.encode('ascii') + b"\r\n", 1.0)
        send_and_wait(s, pwd.encode('ascii') + b"\r\n", 1.5)
        
        # 4. Konfig mód
        send_and_wait(s, b"configure\r\n", 1.5)
        
        # --- ALAP KONFIGOK ÉS DEFAULT GATEWAY ---
        if data.get('hostname'):
            send_and_wait(s, f"hostname {data['hostname']}\r\n".encode('ascii'), 0.5)
            
        if data.get('defaultGateway'):
            send_and_wait(s, f"ip default-gateway {data['defaultGateway']}\r\n".encode('ascii'), 0.5)
            
        if data.get('newUsername') and data.get('newPassword'):
            new_u, new_p = data.get('newUsername'), data.get('newPassword')
            send_and_wait(s, f"username {new_u} password {new_p} level 15\r\n".encode('ascii'), 1.0)
            if new_u.lower() != user.lower():
                send_and_wait(s, f"no username {user}\r\n".encode('ascii'), 1.0)

        # --- VLAN LÉTREHOZÁS ---
        if data.get('vlanId'):
            send_and_wait(s, b"vlan database\r\n", 0.5)
            send_and_wait(s, f"vlan {data['vlanId']}\r\n".encode('ascii'), 0.5)
            send_and_wait(s, b"exit\r\n", 0.5)
            if data.get('vlanName'):
                send_and_wait(s, f"interface vlan {data['vlanId']}\r\n".encode('ascii'), 0.5)
                send_and_wait(s, f"name {data['vlanName']}\r\n".encode('ascii'), 0.5)
                send_and_wait(s, b"exit\r\n", 0.5)
                
        # --- PORT SECURITY ---
        if data.get('portNumber'):
            port_val = data['portNumber'].strip()
            if '-' in port_val:
                send_and_wait(s, f"interface range ethernet {port_val}\r\n".encode('ascii'), 0.5)
            else:
                send_and_wait(s, f"interface ethernet {port_val}\r\n".encode('ascii'), 0.5)
                
            send_and_wait(s, b"switchport mode access\r\n", 0.5)
            
            if data.get('vlanId'):
                send_and_wait(s, f"switchport access vlan {data['vlanId']}\r\n".encode('ascii'), 0.5)
                
            if data.get('portSecurity'):
                send_and_wait(s, b"port security\r\n", 0.5)
                mac_limit = data.get('macLimit', '1')
                send_and_wait(s, f"port security max {mac_limit}\r\n".encode('ascii'), 0.5)

            send_and_wait(s, b"exit\r\n", 0.5)

        # --- HASZNÁLATON KÍVÜLI PORTOK LELÖVÉSE (SHUTDOWN) ---
        if data.get('shutdownPorts'):
            shut_ports = data['shutdownPorts'].strip()
            if '-' in shut_ports:
                send_and_wait(s, f"interface range ethernet {shut_ports}\r\n".encode('ascii'), 0.5)
            else:
                send_and_wait(s, f"interface ethernet {shut_ports}\r\n".encode('ascii'), 0.5)
            
            send_and_wait(s, b"shutdown\r\n", 0.5)
            send_and_wait(s, b"exit\r\n", 0.5)

        # --- IP CSERE (NINJA MÓD - MINDIG EZ AZ UTOLSÓ) ---
        if data.get('newIp') and data.get('newMask'):
            send_and_wait(s, b"interface vlan 1\r\n", 0.5)
            
            ninja_combo = f"no ip address\r\nip address {data.get('newIp')} {data.get('newMask')}\r\n"
            s.sendall(ninja_combo.encode('ascii'))
            
            return jsonify({
                "status": "success", 
                "log": full_log + f"\n\n[NINJA MÓD AKTIVÁLVA]\nRégi IP törölve, új IP beállítva: {data.get('newIp')}\n\nA kapcsolat itt szándékosan megszakadt.\n\nFONTOS:\nMivel a megszakadás miatt a script nem tudta elmenteni a beállításokat (copy run start), most írd át a weboldalon az IP-t {data.get('newIp')}-re, és nyomj egy 'Konfiguráció Beküldése' gombot üres mezőkkel, hogy lefuthasson a mentés is!"
            })

        # --- MENTÉS ÉS KILÉPÉS (Ha nem volt IP csere) ---
        send_and_wait(s, b"end\r\n", 0.5)
        send_and_wait(s, b"copy running-config startup-config\r\n", 2.0)
        send_and_wait(s, b"\r\n", 3.0) 
        
        s.close()
        return jsonify({"status": "success", "log": full_log})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e) + "\n\nLOG:\n" + full_log})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)