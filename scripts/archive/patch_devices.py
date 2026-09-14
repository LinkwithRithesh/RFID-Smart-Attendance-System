import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/devices/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', 'import { apiClient } from "@/services/apiClient";\n', content)

state_repl = '''
  const [devices, setDevices] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = () => {
    setLoading(true);
    apiClient.get("/devices").then(res => {
      setDevices(res.data?.devices || res.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDevices();
  }, []);
'''
content = re.sub(r'const \[devices,\s*setDevices\] = useState<IoTDevice\[\]>\(\(\) => mockService\.getIoTDevices\(\)\);\s*const \[classrooms\] = useState\(\(\) => mockService\.getClassrooms\(\)\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => setDevices\(mockService\.getIoTDevices\(\)\);\s*const unsubscribeStore = mockService\.subscribe\(update\);\s*return \(\) => unsubscribeStore\(\);\s*\}, \[\]\);', '', content)

content = re.sub(r'await mockService\.testBuzzer\(code\);', 'await apiClient.post(/devices//command, { command: "TEST_BUZZER" });', content)
content = re.sub(r'await mockService\.restartDevice\(id, \{\s*deviceType: d\.type,\s*location: d\.location,\s*\}\);', 'await apiClient.post(/devices//command, { command: "RESTART" });', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/devices/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
