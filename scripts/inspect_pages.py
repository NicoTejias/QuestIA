import paramiko

host = "192.168.0.202"
user = "nico"
password = "P5lento0"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("curl -s http://localhost:9222/json/list")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
