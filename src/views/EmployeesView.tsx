import React, { useState } from 'react';
import { Employee, AttendanceRecord, JobCard } from '../types';
import { putRecord, deleteRecord, logActivity } from '../services/db';
import {
  UserCheck,
  UserPlus,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Wrench,
  X,
  Phone,
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  jobs: JobCard[];
  onRefresh: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  attendance,
  jobs,
  onRefresh,
}) => {
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Assistant Technician');
  const [salary, setSalary] = useState<number>(30000);

  const todayStr = new Date().toISOString().split('T')[0];

  // Quick mark attendance for today
  const handleMarkAttendance = async (
    emp: Employee,
    status: 'Present' | 'Late' | 'Leave' | 'Absent'
  ) => {
    // Check if marked already for today
    const existing = attendance.find(
      (a) => a.employeeId === emp.id && a.date === todayStr
    );

    const record: AttendanceRecord = {
      id: existing ? existing.id : Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      date: todayStr,
      status,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    await putRecord('attendance', record);
    await logActivity('ATTENDANCE_LOG', `Marked ${emp.name} as ${status} on ${todayStr}`);
    onRefresh();
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const newEmp: Employee = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim() || '03006861765',
      designation: designation.trim(),
      monthlySalary: Number(salary) || 0,
      joinDate: todayStr,
      active: true,
    };

    await putRecord('employees', newEmp);
    await logActivity('NEW_EMPLOYEE', `Added employee ${newEmp.name} (${newEmp.designation})`);

    setName('');
    setPhone('');
    setShowAddEmpModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Staff Directory & Daily Attendance Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Musa Mobile Repairing Center engineering lab and technical staff performance
          </p>
        </div>

        <button
          onClick={() => setShowAddEmpModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {employees.map((emp) => {
          // Count jobs completed by this technician
          const technicianJobs = jobs.filter(
            (j) =>
              j.technician.toLowerCase().includes(emp.name.toLowerCase()) ||
              emp.name.toLowerCase().includes(j.technician.toLowerCase())
          );
          const completedCount = technicianJobs.filter((j) => j.status === 'Delivered').length;

          // Today's attendance status
          const todayStatus = attendance.find(
            (a) => a.employeeId === emp.id && a.date === todayStr
          );

          return (
            <div
              key={emp.id}
              className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-xl border border-slate-800 hover:border-indigo-500/40 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-700 to-[#0353a4] border border-[#d4af37]/60 flex items-center justify-center font-bold text-white text-base shadow">
                      {emp.name.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{emp.name}</h3>
                      <p className="text-[11px] text-[#d4af37] font-semibold">{emp.designation}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      todayStatus?.status === 'Present'
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500'
                        : todayStatus?.status === 'Late'
                        ? 'bg-amber-900/50 text-amber-300 border border-amber-500'
                        : todayStatus?.status === 'Leave'
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-500'
                        : todayStatus?.status === 'Absent'
                        ? 'bg-rose-900/50 text-rose-300 border border-rose-500'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {todayStatus ? todayStatus.status : 'Not Marked'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mt-2 font-mono">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.phone}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Joined: {emp.joinDate}
                  </p>
                </div>

                {/* Repair Performance Stats */}
                <div className="mt-4 p-2.5 rounded-xl bg-[#030b1e] border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Repairs Handled:</span>
                  </div>
                  <span className="font-bold text-white">
                    {completedCount} / {technicianJobs.length} Jobs
                  </span>
                </div>
              </div>

              {/* Mark Today's Attendance Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                  Mark Today ({todayStr})
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                  <button
                    onClick={() => handleMarkAttendance(emp, 'Present')}
                    className="py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 font-semibold"
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(emp, 'Late')}
                    className="py-1 rounded-lg bg-amber-950/60 hover:bg-amber-800 text-amber-300 border border-amber-700/60 font-semibold"
                  >
                    Late
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(emp, 'Leave')}
                    className="py-1 rounded-lg bg-blue-950/60 hover:bg-blue-800 text-blue-300 border border-blue-700/60 font-semibold"
                  >
                    Leave
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(emp, 'Absent')}
                    className="py-1 rounded-lg bg-rose-950/60 hover:bg-rose-800 text-rose-300 border border-rose-700/60 font-semibold"
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance History Table */}
      <div className="glass-panel p-5 rounded-2xl overflow-hidden shadow-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#d4af37]" />
          <span>Recent Staff Attendance Records</span>
        </h3>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Staff Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Check-In Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-500">
                    No attendance records logged yet. Use the buttons above to mark staff.
                  </td>
                </tr>
              ) : (
                attendance
                  .slice()
                  .reverse()
                  .slice(0, 15)
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#030b1e]/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{rec.employeeName}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-900/50 text-emerald-300'
                              : rec.status === 'Late'
                              ? 'bg-amber-900/50 text-amber-300'
                              : rec.status === 'Leave'
                              ? 'bg-blue-900/50 text-blue-300'
                              : 'bg-rose-900/50 text-rose-300'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {rec.checkInTime || '-'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Add New Technical Staff Member</span>
              </h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mian Tariq"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="0300XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Job Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Lab Technician / Screen Specialist"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Monthly Salary (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
