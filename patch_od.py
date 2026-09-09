import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', 'import { apiClient } from "@/services/apiClient";\n', content)

state_repl = '''
  const [requests, setRequests] = useState<any[]>([]);
  const fetchRequests = () => {
    apiClient.get("/od").then(res => setRequests(res.data?.requests || res.data || []));
  };

  useEffect(() => {
    fetchRequests();
  }, [role, studentRoll]);
'''
content = re.sub(r'const \[requests,\s*setRequests\] = useState<ODRequest\[\]>\(\(\) =>\s*role === "STUDENT" \? mockService\.getODRequests\(studentRoll\) : mockService\.getODRequests\(\)\s*\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => \{\s*setRequests\(role === "STUDENT" \? mockService\.getODRequests\(studentRoll\) : mockService\.getODRequests\(\)\);\s*\};\s*const unsubscribe = mockService\.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[role, studentRoll\]\);', '', content)

content = re.sub(r'mockService\.submitODRequest\(\{[^}]+\}\);', 'await apiClient.post("/od", { type: reqType, startDate, endDate, reason }); fetchRequests();', content)
content = re.sub(r'mockService\.updateODStatus\(id, status, \{\s*approvedBy: "HOD_USER",\s*remarks: statusRemarks,\s*\}\);', 'await apiClient.patch(/od//status, { status, remarks: statusRemarks }); fetchRequests();', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
