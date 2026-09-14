import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', 'import { apiClient } from "@/services/apiClient";\n', content)

state_repl = '''
  const [tickets, setTickets] = useState<any[]>([]);
  const fetchTickets = () => {
    apiClient.get("/helpdesk").then(res => {
      setTickets(res.data?.tickets || res.data || []);
    });
  };

  useEffect(() => {
    fetchTickets();
  }, [role, userId]);
'''
content = re.sub(r'const \[tickets,\s*setTickets\] = useState<HelpDeskTicket\[\]>\(\(\) =>\s*role === "ADMIN"\s*\?\s*mockService\.getTickets\("ADMIN", ""\)\s*:\s*mockService\.getTickets\(role as any, userId\)\s*\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => \{\s*const all = mockService\.getTickets\(role as any, userId\);\s*setTickets\(all\);\s*if \(selectedTicket\) \{\s*const refresh = all\.find\(\(t\) => t\.id === selectedTicket\.id\);\s*if \(refresh\) setSelectedTicket\(refresh\);\s*\}\s*\};\s*const unsubscribe = mockService\.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[role, userId, selectedTicket\]\);', '', content)

content = re.sub(r'const created = mockService\.createTicket\(\{[^}]+\}\);', 'const created = await apiClient.post("/helpdesk", { subject: newSubject, category: newCategory, description: newDesc, priority: newPriority }); fetchTickets();', content)
content = re.sub(r'setTickets\(mockService\.getTickets\(role as any, userId\)\);', '', content)

content = re.sub(r'mockService\.replyToTicket\(selectedTicket\.id, \{[^}]+\}\);', 'await apiClient.post(/helpdesk//replies, { message: replyText }); fetchTickets();', content)
content = re.sub(r'mockService\.updateTicketStatus\(ticketId, "RESOLVED", \{[^}]+\}\);', 'await apiClient.patch(/helpdesk//status, { status: "RESOLVED", response: resolutionNotes }); fetchTickets(); setShowResolveModal(false);', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/helpdesk/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
