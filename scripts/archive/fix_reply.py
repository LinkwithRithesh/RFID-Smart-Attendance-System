import re
with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const handleReply = (e: React.FormEvent) => {', 'const handleReply = async (e: React.FormEvent) => {')
content = content.replace('const handleReply = () => {', 'const handleReply = async () => {')

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
