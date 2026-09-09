import re

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/admin/management/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_addition = '''
  const [newMobile, setNewMobile] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentMobile, setNewParentMobile] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
'''
content = content.replace('  const [formError, setFormError] = useState<string | null>(null);', '  const [formError, setFormError] = useState<string | null>(null);' + state_addition)

add_modal_reset = '''
    setNewMobile("");
    setNewParentName("");
    setNewParentMobile("");
    setNewAddress("");
'''
content = content.replace('setNewAdmissionYear(new Date().getFullYear());', 'setNewAdmissionYear(new Date().getFullYear());' + add_modal_reset)

api_create_user = '''
          phone: newMobile.trim() || undefined,
          profile: {
            rollNumber: newRoll.trim(),
            courseId: Number(newCourseId),
            currentSemester: Number(newSemester),
            admissionYear: Number(newAdmissionYear),
            parentName: newParentName.trim() || undefined,
            parentPhone: newParentMobile.trim() || undefined,
            address: newAddress.trim() || undefined,
          },
'''
content = re.sub(r'profile:\s*\{\s*rollNumber:\s*newRoll\.trim\(\),\s*courseId:\s*Number\(newCourseId\),\s*currentSemester:\s*Number\(newSemester\),\s*admissionYear:\s*Number\(newAdmissionYear\),\s*\},', api_create_user.strip(), content)

edit_logic = '''
  const handleEditStudentClick = async (s: StudentRow) => {
    try {
      const res = await api.getUserProfile(s.id);
      if (res.success) {
        setEditStudentId(s.id);
        setNewName(res.data.fullName || "");
        setNewEmail(res.data.email || "");
        setNewMobile(res.data.phone || "");
        setNewRfid(res.data.rfidCardId || "");
        setNewRoll(res.data.profile?.rollNumber || "");
        setNewDeptId(res.data.departmentId || departments[0]?.id || 1);
        setNewCourseId(res.data.profile?.courseId || courses[0]?.id || 1);
        setNewSemester(res.data.profile?.currentSemester || 1);
        setNewAdmissionYear(res.data.profile?.admissionYear || new Date().getFullYear());
        setNewParentName(res.data.profile?.parentName || "");
        setNewParentMobile(res.data.profile?.parentPhone || "");
        setNewAddress(res.data.profile?.address || "");
        setFormError(null);
        setShowEditModal(true);
      }
    } catch (e: any) {
      alert("Failed to load student details");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editStudentId) return;

    setSubmitting(true);
    try {
      await api.updateUserProfile(editStudentId, {
        phone: newMobile.trim() || undefined,
        email: newEmail.trim() || undefined,
        parentName: newParentName.trim() || undefined,
        parentPhone: newParentMobile.trim() || undefined,
        address: newAddress.trim() || undefined,
      });

      await api.updateUser(editStudentId, {
        name: newName.trim(),
        rfidTag: newRfid.trim() || undefined,
        status: "ACTIVE",
      });

      setShowEditModal(false);
      await loadStudents();
    } catch (err: any) {
      setFormError(err.message || "Failed to update student.");
    } finally {
      setSubmitting(false);
    }
  };
'''
content = content.replace('  const handleDeleteStudent =', edit_logic + '\n  const handleDeleteStudent =')

new_fields_jsx = '''
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Student Mobile</label>
                    <input type="text" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Name</label>
                    <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Mobile</label>
                    <input type="text" value={newParentMobile} onChange={(e) => setNewParentMobile(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Address</label>
                    <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                </div>
'''
content = content.replace('<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">', new_fields_jsx + '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">', 1)

edit_modal_jsx = '''
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 text-slate-800 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Edit Student Details</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 font-bold" type="button">X</button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateStudent} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                    <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Student Mobile</label>
                    <input type="text" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Name</label>
                    <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Mobile</label>
                    <input type="text" value={newParentMobile} onChange={(e) => setNewParentMobile(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Address</label>
                    <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold">{submitting ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
'''
content = content.replace('      </DashboardShell>', edit_modal_jsx + '      </DashboardShell>')

with open('D:/RFID-Smart-Attendance-System/Website/frontend/src/app/admin/management/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
