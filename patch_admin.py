import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/admin/management/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove mock imports
content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', '', content)
content = re.sub(r'import\s+\{\s*Faculty,\s*Course\s*\}\s*from\s*"@/services/mockData";\s*', '', content)

# Replace mock state initialization
state_repl = '''
  const [faculty, setFaculty] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const loadFaculty = useCallback(async () => {
    setLoadingFaculty(true);
    try {
      const res = await api.getUsers({ role: "FACULTY", limit: 1000 });
      if (res.success) setFaculty(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFaculty(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const res = await api.getCoursesByDepartment();
      if (res.success) setCourses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  }, []);
'''
content = re.sub(r'// Mock Faculty & Courses \(Untouched\)\s*const \[faculty[^;]+;\s*const \[courses[^;]+;', state_repl, content)

# Replace sync effect
sync_effect_repl = '''
  useEffect(() => {
    loadFaculty();
    loadCourses();
  }, [loadFaculty, loadCourses]);
'''
content = re.sub(r'// Sync mock faculty and courses subscriptions\s*useEffect\(\(\) => \{\s*const update = \(\) => \{\s*setFaculty\(mockService.getFaculty\(\)\);\s*setCourses\(mockService.getCourses\(\)\);\s*\};\s*const unsubscribe = mockService.subscribe\(update\);\s*return \(\) => unsubscribe\(\);\s*\}, \[\]\);', sync_effect_repl, content)

# Fix courses table rendering
# mock course has c.code, c.name, c.department, c.credits, c.semester
# api course has c.code, c.name, c.department?.name, c.credits
content = re.sub(r'\{c\.department\}', '{c.department?.name || c.departmentName || "General"}', content)
content = re.sub(r'\{c\.semester\}', '{c.semester || 1}', content)
content = re.sub(r'\{c\.credits \* 15\}', '{(c.credits || 3) * 15}', content)
content = re.sub(r'\{c\.credits\} Credits', '{c.credits || 3} Credits', content)

# Fix faculty table rendering
# f.department
content = re.sub(r'\{f\.department\}', '{f.departmentName || f.department?.name || "General"}', content)
content = re.sub(r'\{f\.assignedCourses\.join\([^)]+\)\}', '{(f.assignedCourses || []).join(", ")}', content)
content = re.sub(r'\{f\.designation\}', '{f.designation || "Assistant Professor"}', content)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/admin/management/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
