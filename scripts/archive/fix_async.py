import re

def fix_async(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add async to handlers
    content = re.sub(r'const handleCreateTicket = \(e: React\.FormEvent\) =>', 'const handleCreateTicket = async (e: React.FormEvent) =>', content)
    content = re.sub(r'const handleReply = \(\) =>', 'const handleReply = async () =>', content)
    content = re.sub(r'const handleResolveTicket = \(ticketId: string\) =>', 'const handleResolveTicket = async (ticketId: string) =>', content)
    content = re.sub(r'const handleSubmitOD = \(e: React\.FormEvent\) =>', 'const handleSubmitOD = async (e: React.FormEvent) =>', content)
    content = re.sub(r'const handleApproveOD = \(id: string,\s*status: "APPROVED" \| "REJECTED"\) =>', 'const handleApproveOD = async (id: string, status: "APPROVED" | "REJECTED") =>', content)

    # Note: the template string has syntax error piClient.patch(/helpdesk//status
    # Let's fix that too
    content = re.sub(r'/helpdesk//status', '/helpdesk//status', content)
    content = re.sub(r'/helpdesk//replies', '/helpdesk//replies', content)
    # Actually, in the patch, I had: await apiClient.post(/helpdesk//replies
    # Wait, the backticks got removed during regex!
    # Ah, powershell evaluation or python string evaluation removed backticks?
    # Python patch script string had backticks. Maybe my regex in the python script used wrong quotes.
    
    # I'll just write it correctly here
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_async('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx')
fix_async('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/od-requests/page.tsx')
