import re

def fix(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('await apiClient.post(/helpdesk//replies, { message: replyText });', 'await apiClient.post(`/helpdesk/${selectedTicket.id}/replies`, { message: replyMessage });')
    content = content.replace('await apiClient.patch(/helpdesk//status, { status: "RESOLVED", response: resolutionNotes });', 'await apiClient.patch(`/helpdesk/${ticketId}/status`, { status: "RESOLVED", response: statusRemarks });')
    content = content.replace('await apiClient.patch(/od//status, { status, remarks: statusRemarks });', 'await apiClient.patch(`/od/${id}/status`, { status, remarks: statusRemarks });')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx')
fix('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx')
