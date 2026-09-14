import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/analytics/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', '', content)

state_repl = '''
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  useEffect(() => {
    let mounted = true;
    apiClient.get("/analytics/anomalies").then(res => {
      if(mounted && res.data) setAnomalies(res.data);
    });
    return () => { mounted = false; };
  }, []);
'''
content = re.sub(r'const \[anomalies,\s*setAnomalies\] = useState<AnomalyItem\[\]>\(\(\) => mockService\.getAnomalies\(\)\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => setAnomalies\(mockService\.getAnomalies\(\)\);\s*const unsubscribe = mockService\.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[\]\);', '', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/analytics/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
