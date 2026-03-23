"""
config_script.py – Fix switch konfigurációs szkript
====================================================
ITT SZERKESZD A BEÁLLÍTÁSOKAT!
"""

from netmiko import ConnectHandler
from netmiko.exceptions import NetMikoAuthenticationException, NetMikoTimeoutException
import time

# ══════════════════════════════════════════════════
#  ESZKÖZ ADATOK – IDE ÍRD A SAJÁT ADATOKAT
# ══════════════════════════════════════════════════

DEVICE = {
    'device_type': 'cisco_ios_telnet', # Telnet kapcsolat (cisco_ios helyett)
    'host':        '192.168.1.180', # Switch IP-cím
    'username':    'cisco',       # Felhasználónév
    'password':    'Admin123',       # Jelszó
    'secret':      '',      # Enable jelszó (ha nincs, hagyd üresen: '')
    'port':        23,            # Telnet port (alapértelmezett: 23)
    'timeout':     20,            # Kapcsolat timeout másodpercben
}

# ══════════════════════════════════════════════════
#  A statikus CONFIG_BLOCKS törölve lett. A parancsok
#  mostantól dinamikusan generálódnak a webes bemenetből.
# ══════════════════════════════════════════════════
# ══════════════════════════════════════════════════
#  FUTTATÁS – EZT NE MÓDOSÍTSD
# ══════════════════════════════════════════════════

def run(target_ip=None, config_data=None):
    log = []

    base_commands = []
    
    # A device_type-ot a globális beállításból vesszük, miután kikerült a webről a választó
    device_type = DEVICE.get('device_type', 'cisco_ios_telnet')
    # SG300 ellenőrzés a specifikus parancsokhoz
    is_sg300 = device_type in ['cisco_s300', 'cisco_s300_telnet']

    if config_data:
        # 1. Hostname beállítása
        if config_data.get('hostname'):
            base_commands.append("hostname {}".format(config_data['hostname']))
            
        # 2. VLAN-ok létrehozása és állapotuk
        vlan_list = []
        if config_data.get('vlans'):
            vlan_state = config_data.get('vlan_state', 'up')
            # Vesszővel elválasztott azonosítók feldolgozása
            vlan_list = [v.strip() for v in config_data['vlans'].split(',') if v.strip()]
            for vid in vlan_list:
                base_commands.extend([
                    "vlan {}".format(vid),
                    " exit",
                    "interface vlan {}".format(vid),
                    " no shutdown" if vlan_state == 'up' else " shutdown",
                    " exit"
                ])
                
        # 3. Portok beállítása (Trunk + állapot)
        if config_data.get('ports'):
            port_state = config_data.get('port_state', 'up')
            port_list = [p.strip() for p in config_data['ports'].split(',') if p.strip()]
            for port in port_list:
                base_commands.extend([
                    "interface {}".format(port),
                    " switchport mode trunk"
                ])
                # SG300 esetén a trunk portra rá kell engedni a létrehozott VLAN-okat
                if is_sg300 and vlan_list:
                    base_commands.append(" switchport trunk allowed vlan add {}".format(','.join(vlan_list)))
                
                base_commands.extend([
                    " no shutdown" if port_state == 'up' else " shutdown",
                    " exit"
                ])
    else:
        # Fallback ha teszt célból paraméterek nélkül futtatjuk CLI-ből
        base_commands = [
            'hostname SW-TEST-LOCAL',
            'vlan 99'
        ]

    if not base_commands:
        log.append("[ERROR] Nincs kiválasztva futtatandó parancs! Tölts ki legalább egy mezőt.")
        return {'success': False, 'output': '\n'.join(log)}

    # Készítünk egy másolatot a DEVICE paraméterekből, hogy ne írjuk felül globálisan
    conn_params = DEVICE.copy()
    if target_ip:
        conn_params['host'] = target_ip

    try:
        log.append("[INFO] Csatlakozás: {} @ {}:{} ...".format(conn_params['device_type'], conn_params['host'], conn_params['port']))

        conn = ConnectHandler(**conn_params)

        if conn_params.get('secret'):
            conn.enable()
            log.append("[INFO] Enable módba léptünk.")

        log.append("[INFO] Csatlakozva: {}".format(conn.find_prompt()))
        
        try:
            conn.config_mode()
        except:
            pass

        log.append("[INFO] {} parancs küldése (ANSI kímélő módban)...".format(len(base_commands)))
        log.append("[INFO] Generált parancslista: {}".format(base_commands))
        log.append("[OUTPUT]")
        
        for cmd in base_commands:
            out = conn.send_command_timing(cmd, strip_prompt=False, strip_command=False)
            if out.strip():
                log.extend(out.splitlines())
            # Késleltetés, hogy szegény régebbi firmware ne akadjon meg a gyorsaságunktól (SG300 sajátosság)
            if is_sg300:
                time.sleep(0.5)

        try:
            conn.exit_config_mode()
        except:
            pass

        save = conn.send_command_timing("write memory", strip_prompt=False, strip_command=False)
        log.append("[INFO] Konfiguráció elmentve.")
        log.extend(save.splitlines())

        conn.disconnect()
        log.append("[SIKER] Kész! Kapcsolat bontva.")

        return {'success': True, 'output': '\n'.join(log)}

    except NetMikoAuthenticationException:
        log.append("[ERROR] Hitelesítési hiba – ellenőrizd a felhasználónevet/jelszót!")
        return {'success': False, 'output': '\n'.join(log)}

    except NetMikoTimeoutException:
        log.append("[ERROR] Időtúllépés – a switch nem érhető el. Ellenőrizd az IP-t és a kábelt!")
        return {'success': False, 'output': '\n'.join(log)}

    except Exception as e:
        log.append("[ERROR] {}".format(str(e)))
        return {'success': False, 'output': '\n'.join(log)}


if __name__ == '__main__':
    # Parancssorból is futtatható: python config_script.py
    result = run()
    print(result['output'])
