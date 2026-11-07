import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import {
  getAllUsers,
  createAppUser,
  updateAppUser,
  deleteAppUser,
  toggleUserActive,
  changePassword,
  getCurrentSessionUser,
} from '../services/auth';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Edit2,
  Trash2,
  Check,
  X,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Briefcase,
} from 'lucide-react';

export const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Technician');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [showNewPass, setShowNewPass] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Technician');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [showEditPass, setShowEditPass] = useState(false);

  // Change Password Form State (for current admin/user)
  const [currentPass, setCurrentPass] = useState('');
  const [changeNewPass, setChangeNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  const currentUserSession = getCurrentSessionUser();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      setUsers(all);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createAppUser({
      username: newUsername,
      name: newName,
      role: newRole,
      phone: newPhone,
      password: newPassword,
      notes: newNotes,
      active: newActive,
    });

    if (res.success) {
      showFeedback(res.message, 'success');
      setShowAddModal(false);
      // Reset form
      setNewUsername('');
      setNewName('');
      setNewRole('Technician');
      setNewPhone('');
      setNewPassword('');
      setNewNotes('');
      setNewActive(true);
      await loadUsers();
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleStartEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditNotes(user.notes || '');
    setEditActive(user.active);
    setEditNewPassword('');
    setShowEditPass(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await updateAppUser(editingUser.id, {
      name: editName,
      username: editUsername,
      role: editRole,
      phone: editPhone,
      notes: editNotes,
      active: editActive,
      newPassword: editNewPassword.trim() ? editNewPassword : undefined,
    });

    if (res.success) {
      showFeedback(res.message, 'success');
      setEditingUser(null);
      await loadUsers();
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    const nextStatus = !user.active;
    const res = await toggleUserActive(user.id, nextStatus);
    if (res.success) {
      showFeedback(res.message, 'success');
      await loadUsers();
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.isOwner || user.username === 'admin') {
      showFeedback('بنیادی مالک ایڈمن اکاؤنٹ کو ڈیلیٹ نہیں کیا جا سکتا۔', 'error');
      return;
    }

    if (
      !confirm(
        `کیا آپ واقعی صارف "${user.name}" (${user.username}) کا اکاؤنٹ مستقل طور پر ڈیلیٹ کرنا چاہتے ہیں؟`
      )
    ) {
      return;
    }

    const res = await deleteAppUser(user.id);
    if (res.success) {
      showFeedback(res.message, 'success');
      await loadUsers();
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeNewPass !== confirmNewPass) {
      showFeedback('نیا پاس ورڈ اور تصدیقی پاس ورڈ مماثل نہیں ہیں۔', 'error');
      return;
    }

    const res = await changePassword(currentPass, changeNewPass);
    if (res.success) {
      showFeedback(res.message, 'success');
      setShowChangePassModal(false);
      setCurrentPass('');
      setChangeNewPass('');
      setConfirmNewPass('');
      await loadUsers();
    } else {
      showFeedback(res.message, 'error');
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-5 border border-slate-700/80">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>User Management & Account Security (صارفین اور سکیورٹی اکاؤنٹس)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ایپلیکیشن کا مالک نئے یوزرز، پاس ورڈز، اور لاگ اِن اجازت نامے خود بنا اور تبدیل کر سکتا ہے
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChangePassModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>پاس ورڈ تبدیل کریں</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>نیا صارف اکاؤنٹ بنائیں (New User)</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 text-right transition animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
          }`}
          dir="rtl"
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Users Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">صارف کا نام (Name)</th>
              <th className="py-2.5 px-3">یوزر نیم (User ID)</th>
              <th className="py-2.5 px-3">عہدہ (Role)</th>
              <th className="py-2.5 px-3">رابطہ فون (Phone)</th>
              <th className="py-2.5 px-3">اسٹیٹس (Status)</th>
              <th className="py-2.5 px-3 text-center">ایکشنز (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => {
              const isCurrent = currentUserSession?.username === u.username;
              return (
                <tr key={u.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">
                          {u.name}
                        </span>
                        {u.isOwner && (
                          <span className="text-[9px] text-[#d4af37] font-semibold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>مالک دکان (Owner)</span>
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[9px] text-emerald-400 font-mono">
                            (موجودہ لاگ اِن اکاؤنٹ)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-300">
                    @{u.username}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.role === 'Admin'
                          ? 'bg-amber-500/20 text-[#d4af37] border-amber-500/40'
                          : u.role === 'Lab Engineer'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {u.phone || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      disabled={u.isOwner}
                      onClick={() => handleToggleStatus(u)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                        u.active
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      } ${u.isOwner ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                      title={u.isOwner ? 'بنیادی اکاؤنٹ ہمیشہ ایکٹو رہتا ہے' : 'اسٹیٹس تبدیل کریں'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{u.active ? 'فعال (Active)' : 'غیر فعال (Inactive)'}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(u)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#d4af37] transition"
                        title="ترمیم کریں / Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!u.isOwner && u.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition"
                          title="اکاؤنٹ ڈیلیٹ کریں / Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD NEW USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="glass-panel max-w-md w-full rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 border-2 border-[#d4af37]/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#d4af37]" />
                <span>نیا صارف اکاؤنٹ بنائیں (Add New User)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  مکمل نام (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: میاں اظہر قریشی / محمد زبیر"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-medium focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    یوزر نیم (User ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: azhar, lab1"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-amber-300 font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    عہدہ (Role) *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-semibold focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="Admin">Admin (ایڈمن)</option>
                    <option value="Lab Engineer">Lab Engineer (لیب انجینئر)</option>
                    <option value="Technician">Technician (ٹیکنیشن)</option>
                    <option value="Cashier">Cashier (کیشیئر)</option>
                    <option value="Staff">Staff (اسٹاف)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  پاس ورڈ (Password) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="کم از کم 4 حروف یا ہندسے..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    فون نمبر (Phone Number)
                  </label>
                  <input
                    type="text"
                    placeholder="03001234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    اکاؤنٹ اسٹیٹس (Status)
                  </label>
                  <select
                    value={newActive ? 'true' : 'false'}
                    onChange={(e) => setNewActive(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-semibold focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="true">Active (فعال)</option>
                    <option value="false">Inactive (غیر فعال)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  اضافی نوٹس (Notes / Details)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: لیب سیکشن انچارج..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0466c8] hover:bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>محفوظ کریں (Save User)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="glass-panel max-w-md w-full rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 border-2 border-blue-500/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <span>صارف اکاؤنٹ میں ترمیم کریں (Edit: @{editingUser.username})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  مکمل نام (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-medium focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    یوزر نیم (User ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingUser.isOwner}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-amber-300 font-mono font-bold focus:border-[#d4af37] focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    عہدہ (Role) *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-semibold focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="Admin">Admin (ایڈمن)</option>
                    <option value="Lab Engineer">Lab Engineer (لیب انجینئر)</option>
                    <option value="Technician">Technician (ٹیکنیشن)</option>
                    <option value="Cashier">Cashier (کیشیئر)</option>
                    <option value="Staff">Staff (اسٹاف)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>نیا پاس ورڈ سیٹ کریں (اختیاری):</span>
                  </span>
                  <span className="text-[10px] text-slate-500">اگر تبدیل کرنا ہو</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPass ? 'text' : 'password'}
                    placeholder="خالی چھوڑیں اگر پرانا پاس ورڈ ہی رکھنا ہو"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showEditPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    فون نمبر (Phone Number)
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    اکاؤنٹ اسٹیٹس (Active/Inactive)
                  </label>
                  <select
                    disabled={editingUser.isOwner}
                    value={editActive ? 'true' : 'false'}
                    onChange={(e) => setEditActive(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-semibold focus:border-[#d4af37] focus:outline-none disabled:opacity-60"
                  >
                    <option value="true">Active (فعال)</option>
                    <option value="false">Inactive (غیر فعال)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  نوٹس (Notes)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>تبدیلی محفوظ کریں (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE OWN PASSWORD */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="glass-panel max-w-md w-full rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 border-2 border-amber-500/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#d4af37]" />
                <span>پاس ورڈ تبدیل کریں (Change Password)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeOwnPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  موجودہ پاس ورڈ (Current Password) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="موجودہ پاس ورڈ درج کریں..."
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  نیا پاس ورڈ (New Password) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="نیا پاس ورڈ (کم از کم 4 حروف)..."
                  value={changeNewPass}
                  onChange={(e) => setChangeNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  نئے پاس ورڈ کی تصدیق (Confirm New Password) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="نیا پاس ورڈ دوبارہ درج کریں..."
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-slate-950 font-bold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>پاس ورڈ اپڈیٹ کریں</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
