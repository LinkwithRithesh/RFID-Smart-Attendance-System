import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/audit-logs/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', '', content)

state_repl = '''
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    apiClient.get("/audit-logs").then(res => {
      if(mounted && res.data?.logs) setLogs(res.data.logs);
      else if(mounted && res.data) setLogs(res.data);
    });
    return () => { mounted = false; };
  }, []);
'''
content = re.sub(r'const \[logs,\s*setLogs\] = useState<AuditLogItem\[\]>\(\(\) => mockService\.getAuditLogs\(\)\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => setLogs\(mockService\.getAuditLogs\(\)\);\s*const unsubscribe = mockService\.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[\]\);', '', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/audit-logs/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
