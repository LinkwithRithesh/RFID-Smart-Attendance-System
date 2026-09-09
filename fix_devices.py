import re

def fix(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Restore devices page
    content = content.replace('await apiClient.post(/devices//command, { command: "TEST_BUZZER" });', 'await apiClient.post(`/devices/${code}/command`, { command: "TEST_BUZZER" });')
    content = content.replace('await apiClient.post(/devices//command, { command: "RESTART" });', 'await apiClient.post(`/devices/${id}/command`, { command: "RESTART" });')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/devices/page.tsx')
