import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/attendance/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', '', content)

state_repl = '''
  const [subjects, setSubjects] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    apiClient.get("/attendance/summary").then(res => { if(mounted) setSubjects(res.data?.subjects || []); });
    apiClient.get("/dashboard/student/stats").then(res => { if(mounted) setOverallStats(res.data); });
    return () => { mounted = false; };
  }, [studentRoll]);
'''
content = re.sub(r'const \[subjects,\s*setSubjects\] = useState\(\(\) => mockService\.getSubjectAttendanceSummary\(studentRoll\)\);\s*const \[overallStats,\s*setOverallStats\] = useState\(\(\) => mockService\.getOverallStudentStats\(studentRoll\)\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => \{\s*setSubjects\(mockService\.getSubjectAttendanceSummary\(studentRoll\)\);\s*setOverallStats\(mockService\.getOverallStudentStats\(studentRoll\)\);\s*\};\s*const unsubscribe = mockService\.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[studentRoll\]\);', '', content)

content = re.sub(r'const logs = mockService\.getAttendanceCalendar\(studentRoll,\s*selectedSubject\.code,\s*7,\s*2026\);', 'const logs = []; // TODO fetch calendar logs from backend', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/attendance/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
