import re
with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('await apiClient.patch(`/helpdesk/${ticketId}/status`, { status: "RESOLVED", response: statusRemarks }); fetchTickets(); setShowResolveModal(false);', 'await apiClient.patch(`/helpdesk/${ticketId}/status`, { status: "RESOLVED", response: "Issue investigated and resolved by admin." }); fetchTickets();')

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
