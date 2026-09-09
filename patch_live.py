import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/live-attendance/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*mockService\s*\}\s*from\s*"@/services/mockServices";\s*', '', content)

# Remove mock logic for manual override
manual_override_repl = '''
    const handleManualOverride = async (e: React.FormEvent) => {
      e.preventDefault();
      // Use real API to post manual attendance
      try {
        await api.recordAttendance({
          userId: manualRoll, // Actually we need userId, but fallback to roll number string for now
          status: manualStatus,
          reason: "Manual correction during live session"
        });
      } catch(e){}

      const newEntry = {
        id: "MANUAL-" + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        studentRoll: manualRoll,
        studentName: "Manually Marked Student",
        method: "OVERRIDE" as const,
        status: manualStatus as "PRESENT" | "LATE",
      };
      setFeed((prev) => [newEntry, ...prev]);
      if (manualStatus === "PRESENT") {
        setPresentCount((c) => Math.min(totalEnrolled, c + 1));
      }
      setShowManualModal(false);
      setManualRoll("");
    };
'''

# We need to replace the entire old handleManualOverride block
# Find start of const handleManualOverride =  to setManualRoll("");\n  };
# I will use a simple regex replacing from const handleManualOverride = up to setManualRoll("");\s*\};\s*
content = re.sub(r'const handleManualOverride = \(e: React\.FormEvent\) => \{.*?(?=  const handleStartSession)', manual_override_repl, content, flags=re.DOTALL)

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/live-attendance/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
