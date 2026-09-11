import paramiko

host = "192.168.0.202"
user = "nico"
password = "P5lento0"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

# Ver qué procesos node o chromium quedaron corriendo
stdin, stdout, stderr = client.exec_command("ps aux | grep -iE 'node|extract' | grep -v grep")
print("PROCESOS EN UBUNTU:\n" + stdout.read().decode('utf-8', errors='replace'))

# Matar procesos extract si quedaron
client.exec_command("pkill -f extract_2026")

# Ver pestañas abiertas en chromium
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:9222/json/list")
print("PESTAÑAS CHROMIUM:\n" + stdout.read().decode('utf-8', errors='replace'))

client.close()
