import paramiko
import json

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.202', port=22, username='nico', password='P5lento0', timeout=5)

# Check all json files in /home/nico/duoc-sync
stdin, stdout, stderr = c.exec_command('ls -la /home/nico/duoc-sync/*.json')
print("JSON files on server:")
print(stdout.read().decode('utf-8'))

# Check if there is any other file mentioning PEI1108 or subjects
stdin, stdout, stderr = c.exec_command('docker exec postgres_db psql -U admin -d gestion_db -c "\\dt"')
print("Postgres Tables:")
print(stdout.read().decode('utf-8'))

stdin, stdout, stderr = c.exec_command('docker exec postgres_db psql -U admin -d gestion_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\';"')
print("Public tables:")
print(stdout.read().decode('utf-8'))

c.close()
