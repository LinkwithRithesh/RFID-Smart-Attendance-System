const fs = require('fs');

const file = `D:\\RFID-Smart-Attendance-System\\frontend\\src\\app\\admin\\timetable\\page.tsx`;
let content = fs.readFileSync(file, 'utf8');

// Ensure apiClient is imported
if (!content.includes('import { apiClient }')) {
  content = content.replace(
    'import { Loader2',
    'import { apiClient } from "@/services/apiClient";\nimport { Loader2'
  );
}

// Replace fetchMetadata
content = content.replace(
  /const fetchMetadata = async \(\) => \{[\s\S]*?\}\s*\} catch\(e\) \{\s*console\.error\(e\);\s*\}\s*\};/,
  `const fetchMetadata = async () => {
    try {
      const [deptRes, subjRes, facRes] = await Promise.all([
        apiClient.get("/departments"),
        apiClient.get("/subjects"),
        apiClient.get("/users?role=FACULTY&limit=100")
      ]);
      
      if(!deptRes.error && deptRes.data) setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      if(!subjRes.error && subjRes.data) setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
      if(!facRes.error && facRes.data) {
        setFaculties(facRes.data.users ? facRes.data.users : (Array.isArray(facRes.data) ? facRes.data : []));
      }
    } catch(e) {
      console.error(e);
    }
  };`
);

// Replace fetchSlots
content = content.replace(
  /const fetchSlots = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/,
  `const fetchSlots = async () => {
    try {
      const res = await apiClient.get("/timetable");
      if (!res.error && res.data) {
        setSlots(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };`
);

// Replace handleSave
content = content.replace(
  /const res = await fetch\(url, \{[\s\S]*?body: JSON\.stringify\(payload\)\s*\}\);\s*const data = await res\.json\(\);\s*if\(!res\.ok\) \{[\s\S]*?return;\s*\}/,
  `let res;
      if (editId) {
        res = await apiClient.patch(\`/timetable/\${editId}\`, payload);
      } else {
        res = await apiClient.post("/timetable", payload);
      }
      
      if(res.error) {
         alert(res.error || 'Failed to save timetable slot');
         return;
      }`
);

// Cleanup the unused fetch method stuff
content = content.replace(
  `const url = editId \n        ? \`http://localhost:5000/api/v1/timetable/\${editId}\` \n        : "http://localhost:5000/api/v1/timetable";\n      const method = editId ? "PATCH" : "POST";`,
  ``
);

// Replace handleDelete
content = content.replace(
  /await fetch\(`http:\/\/localhost:5000\/api\/v1\/timetable\/\$\{id\}`,\s*\{\s*method: "DELETE",\s*headers: \{ Authorization: `Bearer \$\{token\}` \}\s*\}\);/,
  `await apiClient.delete(\`/timetable/\${id}\`);`
);

// Replace token dependency in useEffect to avoid infinite loops if it changes improperly, though it's ok.
content = content.replace(
  `useEffect(() => {\n    if (token) {\n      fetchSlots();\n      fetchMetadata();\n    }\n  }, [token]);`,
  `useEffect(() => {\n    fetchSlots();\n    fetchMetadata();\n  }, []); // Run once, apiClient handles tokens natively`
);

fs.writeFileSync(file, content);
console.log('Admin timetable API calls converted to apiClient');
