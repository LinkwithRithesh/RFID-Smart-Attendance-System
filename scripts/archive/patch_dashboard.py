import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', '', content)

state_repl = '''
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.get("/dashboard/student/stats").then(r => mounted && setStats(r.data)),
      apiClient.get("/attendance/summary").then(r => mounted && setSubjects(r.data?.subjects || []))
    ]).finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [studentRoll]);
'''
content = re.sub(r'const \[stats,\s*setStats\] = useState\(\(\) => mockService\.getOverallStudentStats\(studentRoll\)\);\s*const \[subjects,\s*setSubjects\] = useState\(\(\) => mockService\.getSubjectAttendanceSummary\(studentRoll\)\);', state_repl, content)

content = re.sub(r'useEffect\(\(\) => \{\s*const update = \(\) => \{\s*setStats\(mockService\.getOverallStudentStats\(studentRoll\)\);\s*setSubjects\(mockService\.getSubjectAttendanceSummary\(studentRoll\)\);\s*\};\s*const unsubscribe = mockService\.subscribe\(update\);\s*', 'useEffect(() => {\n', content)
content = re.sub(r'return \(\) => unsubscribe\(\);\s*\}, \[\]\);', '}, []);', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
