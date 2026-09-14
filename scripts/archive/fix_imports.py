import re
def add_import(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'import { apiClient }' not in content:
        content = content.replace('import { useAuth } from "@/context/AuthContext";', 'import { useAuth } from "@/context/AuthContext";\nimport { apiClient } from "@/services/apiClient";')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

add_import('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/analytics/page.tsx')
add_import('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/audit-logs/page.tsx')
add_import('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/attendance/page.tsx')
