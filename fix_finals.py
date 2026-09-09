import re
with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const handleReply = () => {', 'const handleReply = async () => {')
content = content.replace('const handleReply = (e: React.FormEvent) => {', 'const handleReply = async (e: React.FormEvent) => {')
content = content.replace('const handleReply = (e: any) => {', 'const handleReply = async (e: any) => {')

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const handleStatusUpdate = (id: string, status: "FACULTY_APPROVED" | "APPROVED" | "REJECTED") => {', 'const handleStatusUpdate = async (id: string, status: "FACULTY_APPROVED" | "APPROVED" | "REJECTED") => {')
content = content.replace('await apiClient.patch(/od//status, { status, remarks: "Reviewed via institutional portal" }); fetchRequests();', 'await apiClient.patch(`/od/${id}/status`, { status, remarks: "Reviewed via institutional portal" }); fetchRequests();')

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
