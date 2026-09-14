import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', 'import { apiClient } from "@/services/apiClient";\n', content)

# Replace initial state
content = re.sub(r'const \[requests,\s*setRequests\] = useState\(\(\) =>\s*role === "STUDENT" \? mockService\.getODRequests\(studentRoll\) : mockService\.getODRequests\(\)\s*\);', 'const [requests, setRequests] = useState<any[]>([]);\n  const fetchRequests = () => apiClient.get("/od").then(r => setRequests(r.data?.requests || r.data || []));\n  useEffect(() => { fetchRequests(); }, []);', content)

# Replace update effect
content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => \{\s*setRequests\(role === "STUDENT" \? mockService\.getODRequests\(studentRoll\) : mockService\.getODRequests\(\)\);\s*\};\s*const unsubscribe = mockService\.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[role, studentRoll\]\);', '', content)

# Replace submit
content = re.sub(r'mockService\.submitODRequest\(\{.*?\}\);', 'await apiClient.post("/od", { type: reqType, startDate, endDate, reason }); fetchRequests();', content, flags=re.DOTALL)

# Replace status update
content = re.sub(r'mockService\.updateODStatus\(id, status, \{.*?\}\);', 'await apiClient.patch(/od//status, { status, remarks: "Reviewed via institutional portal" }); fetchRequests();', content, flags=re.DOTALL)

# Add async to handlers
content = content.replace('const handleSubmitOD = (e: React.FormEvent) => {', 'const handleSubmitOD = async (e: React.FormEvent) => {')
content = content.replace('const handleStatusUpdate = (id: string, status: "FACULTY_APPROVED" | "APPROVED" | "REJECTED") => {', 'const handleStatusUpdate = async (id: string, status: "FACULTY_APPROVED" | "APPROVED" | "REJECTED") => {')

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
