import React, { useState, useEffect } from 'react';
import { JobCard, RepairReminder } from '../types';
import { cleanDigits } from '../services/smartSearch';
import {
  getAllReminders,
  saveReminder,
  deleteReminder,
  snoozeReminder,
  completeReminder,
} from '../services/reminderService';
import { alarmAudioEngine } from '../services/reminderAlarmAudio';
import {
  Bell,
  Clock,
  Plus,
  Play,
  Square,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Repeat,
  Volume2,
  Upload,
  ShieldCheck,
  Check,
  Search,
  Wrench,
  X,
  Phone,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface RemindersViewProps {
  jobs: JobCard[];
  onTriggerAlarm?: (reminder: RepairReminder) => void;
  onRefreshJobs?: () => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  jobs,
  onTriggerAlarm,
  onRefreshJobs,
}) => {
  const [reminders, setReminders] = useState<RepairReminder[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'snoozed' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<RepairReminder | null>(null);

  // Form State
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceCompany, setDeviceCompany] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [fault, setFault] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(15);
  const [repeat, setRepeat] = useState(true);
  const [ringtoneType, setRingtoneType] = useState<'urgent' | 'alarm' | 'bell' | 'chime' | 'custom'>('urgent');
  const [customRingtoneUrl, setCustomRingtoneUrl] = useState<string>('');
  const [customRingtoneName, setCustomRingtoneName] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Audio preview playing state
  const [previewingRingtone, setPreviewingRingtone] = useState<string | null>(null);

  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Load reminders
  const loadReminders = async () => {
    const list = await getAllReminders();
    setReminders(list);
  };

  useEffect(() => {
    loadReminders();
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const handleUpdate = () => loadReminders();
    window.addEventListener('musa-reminders-updated', handleUpdate);
    return () => window.removeEventListener('musa-reminders-updated', handleUpdate);
  }, []);

  // Request Notification Permission
  const handleRequestPermission = async () => {
    const perm = await alarmAudioEngine.requestNotificationPermission();
    setNotificationPermission(perm);
  };

  // Open modal for new reminder
  const handleOpenCreateModal = (prefillJob?: JobCard) => {
    setEditingReminder(null);
    const now = new Date();
    // Default 15 minutes in future
    const defaultTime = new Date(now.getTime() + 15 * 60 * 1000);
    // Format YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${defaultTime.getFullYear()}-${pad(defaultTime.getMonth() + 1)}-${pad(
      defaultTime.getDate()
    )}T${pad(defaultTime.getHours())}:${pad(defaultTime.getMinutes())}`;

    if (prefillJob) {
      setSelectedJobId(prefillJob.jobId);
      setCustomerName(prefillJob.customerName);
      setCustomerPhone(prefillJob.customerPhone || '');
      setDeviceCompany(prefillJob.company);
      setDeviceModel(prefillJob.model);
      setImei(prefillJob.imei1 || '');
      setFault(prefillJob.fault || '');
    } else {
      setSelectedJobId('');
      setCustomerName('');
      setCustomerPhone('');
      setDeviceCompany('');
      setDeviceModel('');
      setImei('');
      setFault('');
    }

    setDueTime(localIso);
    setIntervalMinutes(15);
    setRepeat(true);
    setRingtoneType('urgent');
    setCustomRingtoneUrl('');
    setCustomRingtoneName('');
    setNotes('');
    setShowCreateModal(true);
  };

  // Populate form when selecting a job from dropdown
  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const found = jobs.find((j) => j.jobId === jobId);
    if (found) {
      setCustomerName(found.customerName);
      setCustomerPhone(found.customerPhone || '');
      setDeviceCompany(found.company);
      setDeviceModel(found.model);
      setImei(found.imei1 || '');
      setFault(found.fault || '');
    }
  };

  // Handle Edit existing reminder
  const handleEditReminder = (rem: RepairReminder) => {
    setEditingReminder(rem);
    setSelectedJobId(rem.jobId || '');
    setCustomerName(rem.customerName);
    setCustomerPhone(rem.customerPhone || '');
    setDeviceCompany(rem.deviceCompany);
    setDeviceModel(rem.deviceModel);
    setImei(rem.imei || '');
    setFault(rem.fault);
    
    // Format dueTime to local input
    try {
      const d = new Date(rem.dueTime);
      const pad = (n: number) => String(n).padStart(2, '0');
      const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
      setDueTime(localIso);
    } catch {
      setDueTime('');
    }

    setIntervalMinutes(rem.intervalMinutes || 15);
    setRepeat(rem.repeat ?? true);
    setRingtoneType(rem.ringtoneType || 'urgent');
    setCustomRingtoneUrl(rem.customRingtoneUrl || '');
    setCustomRingtoneName(rem.customRingtoneName || '');
    setNotes(rem.notes || '');
    setShowCreateModal(true);
  };

  // Handle Custom MP3 / WAV Upload
  const handleCustomRingtoneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      alert('برائے مہربانی درست آڈیو فائل (MP3 / WAV) منتخب کریں۔');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomRingtoneUrl(dataUrl);
      setCustomRingtoneName(file.name);
      setRingtoneType('custom');
      // Preview uploaded audio for 2 seconds
      alarmAudioEngine.previewRingtone('custom', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Save Reminder form submit
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !deviceModel.trim()) {
      alert('براہ کرم کسٹمر کا نام اور موبائل ماڈل درج کریں۔');
      return;
    }

    const finalDueTime = dueTime ? new Date(dueTime).toISOString() : new Date().toISOString();

    const newReminder: RepairReminder = {
      id: editingReminder ? editingReminder.id : `REM-${Date.now()}`,
      jobId: selectedJobId.trim() || (editingReminder?.jobId ?? ''),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deviceCompany: deviceCompany.trim(),
      deviceModel: deviceModel.trim(),
      imei: imei.trim(),
      fault: fault.trim(),
      dueTime: finalDueTime,
      intervalMinutes: Number(intervalMinutes) || 15,
      repeat,
      ringtoneType,
      customRingtoneUrl: ringtoneType === 'custom' ? customRingtoneUrl : undefined,
      customRingtoneName: ringtoneType === 'custom' ? customRingtoneName : undefined,
      status: editingReminder ? editingReminder.status : 'active',
      notes: notes.trim(),
      createdAt: editingReminder ? editingReminder.createdAt : new Date().toISOString(),
    };

    await saveReminder(newReminder);
    setShowCreateModal(false);
    loadReminders();
  };

  // Play audio test
  const handleTestRingtone = (type: 'urgent' | 'alarm' | 'bell' | 'chime' | 'custom', customUrl?: string) => {
    if (previewingRingtone === type) {
      alarmAudioEngine.stopAlarm();
      setPreviewingRingtone(null);
    } else {
      setPreviewingRingtone(type);
      alarmAudioEngine.previewRingtone(type, customUrl || customRingtoneUrl);
      setTimeout(() => setPreviewingRingtone(null), 3300);
    }
  };

  // Filtered Reminders List
  const pendingJobsCount = jobs.filter(
    (j) => j.status === 'Received' || j.status === 'Under Repair' || j.status === 'Under Inspection'
  ).length;

  // Search state within the Create Reminder Modal
  const [modalJobSearch, setModalJobSearch] = useState('');

  // Smart Filtered Reminders List (2-3 chars name, 2-4 digits phone or IMEI, model)
  const filteredReminders = reminders.filter((rem) => {
    if (activeTab === 'active' && rem.status !== 'active') return false;
    if (activeTab === 'snoozed' && rem.status !== 'snoozed') return false;
    if (activeTab === 'completed' && rem.status !== 'completed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const qDigits = cleanDigits(searchQuery);

      const matchCust = rem.customerName.toLowerCase().includes(q);
      const matchPhone = qDigits.length >= 2 && cleanDigits(rem.customerPhone).includes(qDigits);
      const matchModel = `${rem.deviceCompany} ${rem.deviceModel}`.toLowerCase().includes(q);
      const matchImei = qDigits.length >= 2 && cleanDigits(rem.imei).includes(qDigits);
      const matchJob = rem.jobId?.toLowerCase().includes(q);
      const matchFault = rem.fault?.toLowerCase().includes(q);

      return matchCust || matchPhone || matchModel || matchImei || matchJob || matchFault;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-[#d4af37] border border-[#d4af37]/40 shadow-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Smart Repair Reminder & Alarm System</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-serif font-bold">
                  سمارٹ ریمائنڈر و الارم
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-serif">
                موبائل فونز کی بر وقت مرمت اور یاد دہانی کے لیے خودکار الارم اور نوٹیفکیشن سسٹم
              </p>
            </div>
          </div>
        </div>

        {/* Actions: Request Permission & Create Reminder */}
        <div className="flex flex-wrap items-center gap-2.5">
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition"
              title="Allow notifications on Android & Desktop"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>الارم نوٹیفکیشن فعال کریں (Enable Alerts)</span>
            </button>
          )}

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>نیا ریمائنڈر بنائیں (New Reminder)</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS (INCLUDING PENDING REPAIRS - User Requirement #11) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* 1. Pending Repairs in Lab */}
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Pending Repairs</span>
            <Wrench className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{pendingJobsCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">مرمت کے منتظر فونز</p>
        </div>

        {/* 2. Active Scheduled Reminders */}
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Active Alarms</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">
            {reminders.filter((r) => r.status === 'active').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">فعال ریمائنڈرز</p>
        </div>

        {/* 3. Snoozed Reminders */}
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-blue-500 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Snoozed</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-300">
            {reminders.filter((r) => r.status === 'snoozed').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">موخر شدہ الارمز</p>
        </div>

        {/* 4. Completed Reminders */}
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {reminders.filter((r) => r.status === 'completed').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">مکمل شدہ فونز</p>
        </div>

      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="glass-panel p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(
            [
              { key: 'active', label: 'Active Alarms (فعال الارم)', count: reminders.filter((r) => r.status === 'active').length },
              { key: 'snoozed', label: 'Snoozed (سنوز شدہ)', count: reminders.filter((r) => r.status === 'snoozed').length },
              { key: 'completed', label: 'Completed (مکمل)', count: reminders.filter((r) => r.status === 'completed').length },
              { key: 'all', label: 'All Records (تمام)', count: reminders.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, model, IMEI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#030b1e] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* REMINDERS LIST / GRID */}
      {filteredReminders.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-[#d4af37] mx-auto flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">کوئی ریمائنڈر نہیں ملا (No Reminders Found)</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            موبائل فون مرمت کے لیے نیا ریمائنڈر بنائیں تاکہ مقررہ وقت پر آواز اور نوٹیفکیشن کے ذریعے یاد دہانی مل سکے۔
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-[#0466c8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>ابھی نیا ریمائنڈر بنائیں</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((rem) => {
            const isDue = new Date(rem.dueTime).getTime() <= Date.now() && rem.status !== 'completed';
            const dueDisplay = new Date(rem.dueTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateDisplay = new Date(rem.dueTime).toLocaleDateString();

            return (
              <div
                key={rem.id}
                className={`glass-panel p-5 rounded-2xl border transition shadow-lg space-y-3.5 relative overflow-hidden ${
                  rem.status === 'completed'
                    ? 'border-emerald-500/40 opacity-70 bg-emerald-950/10'
                    : rem.status === 'snoozed'
                    ? 'border-blue-500/50 bg-[#0a192f]'
                    : isDue
                    ? 'border-red-500 bg-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
                    : 'border-amber-500/40 bg-[#030b1e]/90 hover:border-amber-400'
                }`}
              >
                {/* Status Badge & Due Time */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        rem.status === 'completed'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                          : rem.status === 'snoozed'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-500/50'
                          : isDue
                          ? 'bg-red-900/80 text-red-200 border border-red-500 animate-pulse'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-500/50'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      <span>{rem.status}</span>
                    </span>

                    {rem.jobId && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {rem.jobId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#d4af37]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dueDisplay}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({dateDisplay})</span>
                  </div>
                </div>

                {/* Device & Customer Core Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-extrabold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#d4af37]" />
                      <span>
                        {rem.deviceCompany} {rem.deviceModel}
                      </span>
                    </p>
                    {rem.imei && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        IMEI: {rem.imei}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">
                      کسٹمر: <strong>{rem.customerName}</strong>
                    </span>
                    {rem.customerPhone && (
                      <a
                        href={`tel:${rem.customerPhone}`}
                        className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{rem.customerPhone}</span>
                      </a>
                    )}
                  </div>

                  {/* Fault Description */}
                  <div className="pt-1">
                    <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-xl border border-rose-900/40 line-clamp-2">
                      <strong className="text-rose-400">مرمت کا نقص:</strong> {rem.fault}
                    </p>
                  </div>
                </div>

                {/* Alarm Settings Chips (Interval, Sound, Repeat) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400 font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-amber-400" />
                    <span>ہر {rem.intervalMinutes} منٹ</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-indigo-400" />
                    <span className="capitalize">{rem.ringtoneType}</span>
                  </span>

                  {rem.repeat && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                      Repeat Active
                    </span>
                  )}
                </div>

                {/* ACTION BUTTONS (Snooze, Test Ring, Complete, Edit, Delete) */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    
                    {/* Ring Test Button */}
                    <button
                      type="button"
                      onClick={() => handleTestRingtone(rem.ringtoneType, rem.customRingtoneUrl)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Test Audio"
                    >
                      <Play className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Test Ring</span>
                    </button>

                    {/* Snooze 10m */}
                    {rem.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await snoozeReminder(rem.id, 10);
                          loadReminders();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1 transition"
                        title="Snooze 10 mins"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Snooze (10m)</span>
                      </button>
                    )}

                    {/* Complete Button */}
                    {rem.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await completeReminder(rem.id);
                          loadReminders();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditReminder(rem)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('کیا آپ واقعی یہ ریمائنڈر ڈیلیٹ کرنا چاہتے ہیں؟')) {
                          await deleteReminder(rem.id);
                          loadReminders();
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-200 rounded-lg hover:bg-rose-950/50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          CREATE / EDIT REMINDER MODAL
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="glass-panel max-w-xl w-full rounded-3xl border border-[#d4af37]/50 bg-[#0a192f] p-5 sm:p-7 shadow-2xl space-y-4 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-[#d4af37]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingReminder ? 'Edit Repair Reminder' : 'Create New Repair Reminder'}
                  </h3>
                  <p className="text-xs text-slate-400 font-serif">
                    مرمت کی یاد دہانی اور الارم کا شیڈول مقرر کریں
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4 text-xs">
              
              {/* Option to Select from Existing Pending Job Cards with Smart Auto-Search */}
              {jobs.length > 0 && !editingReminder && (
                <div className="p-3 rounded-2xl bg-[#030b1e] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Smart Job Auto-Search (فوری جاب کارڈ تلاش کریں):</span>
                    </label>
                    <span className="text-[10px] text-slate-400">نام، فون یا IMEI کے 2-4 ہندسے</span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="سرچ کریں: نام، فون (0300..)، ماڈل یا IMEI..."
                      value={modalJobSearch}
                      onChange={(e) => setModalJobSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#0a192f] border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>

                  {modalJobSearch.trim().length >= 2 && (
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-[#0a192f] p-1.5 rounded-xl border border-slate-700">
                      {jobs
                        .filter((j) => {
                          const q = modalJobSearch.trim().toLowerCase();
                          const qD = cleanDigits(modalJobSearch);
                          const mName = j.customerName.toLowerCase().includes(q);
                          const mPhone = qD.length >= 2 && cleanDigits(j.customerPhone).includes(qD);
                          const mModel = `${j.company} ${j.model}`.toLowerCase().includes(q);
                          const mImei =
                            qD.length >= 2 &&
                            (cleanDigits(j.imei1).includes(qD) || cleanDigits(j.imei2).includes(qD));
                          const mId = j.jobId.toLowerCase().includes(q);
                          return mName || mPhone || mModel || mImei || mId;
                        })
                        .map((j) => (
                          <div
                            key={j.jobId}
                            onClick={() => {
                              handleSelectJob(j.jobId);
                              setModalJobSearch('');
                            }}
                            className="p-2 hover:bg-[#0353a4]/50 cursor-pointer rounded-lg flex items-center justify-between text-[11px] transition"
                          >
                            <div>
                              <span className="font-bold text-white">{j.customerName}</span>
                              <span className="text-slate-400 ml-1.5">({j.company} {j.model})</span>
                              {j.imei1 && (
                                <span className="text-[10px] text-amber-400 font-mono ml-1">
                                  ...{j.imei1.slice(-4)}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[#d4af37] text-[10px] font-bold">
                              {j.jobId}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  <select
                    value={selectedJobId}
                    onChange={(e) => handleSelectJob(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a192f] border border-slate-700 rounded-xl text-white font-medium focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- منتخب شدہ جاب: {selectedJobId || 'یا دستی اندراج'} --</option>
                    {jobs
                      .filter((j) => j.status !== 'Delivered')
                      .map((j) => (
                        <option key={j.jobId} value={j.jobId}>
                          {j.jobId} - {j.customerName} ({j.company} {j.model}) - {j.fault}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Customer & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Customer Name (کسٹمر کا نام) *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#030b1e] border border-slate-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    placeholder="مثلاً: محمد احمد"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Customer Phone (موبائل نمبر)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#030b1e] border border-slate-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none"
                    placeholder="0300-1234567"
                  />
                </div>
              </div>

              {/* Device Company, Model & IMEI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Company / Brand (کمپنی)</label>
                  <input
                    type="text"
                    value={deviceCompany}
                    onChange={(e) => setDeviceCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-[#030b1e] border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                    placeholder="Samsung, Vivo, etc."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mobile Model (ماڈل) *</label>
                  <input
                    type="text"
                    required
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#030b1e] border border-slate-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    placeholder="A32, Y20, Note 12"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">IMEI Number (اختیاری)</label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full px-3 py-2 bg-[#030b1e] border border-slate-700 rounded-xl text-white font-mono text-[11px] focus:border-amber-400 focus:outline-none"
                    placeholder="8694020..."
                  />
                </div>
              </div>

              {/* Reported Fault */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Reported Fault / Repair Problem (مرمت کا مسئلہ) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={fault}
                  onChange={(e) => setFault(e.target.value)}
                  className="w-full px-3 py-2 bg-[#030b1e] border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  placeholder="خرابی کی تفصیل درج کریں..."
                />
              </div>

              {/* Reminder Due Time & Interval Presets (Requirements #4 & #5) */}
              <div className="p-3.5 rounded-2xl bg-[#030b1e] border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Reminder Due Time (الارم کا وقت):</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="px-3 py-1.5 bg-[#0a192f] border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Preset Intervals Buttons (5, 10, 15, 30, 60 min or custom) */}
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold mb-1.5">
                    Quick Intervals (ہر چند منٹ بعد یاد دہانی):
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[5, 10, 15, 30, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setIntervalMinutes(mins)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                          intervalMinutes === mins
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-[#0a192f] text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        {mins} منٹ
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] text-slate-400">Custom:</span>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-[#0a192f] border border-slate-700 rounded-xl text-white font-mono text-xs text-center"
                      />
                      <span className="text-[10px] text-slate-400">mins</span>
                    </div>
                  </div>
                </div>

                {/* Repeat Reminder Checkbox (Requirement #6) */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={repeat}
                    onChange={(e) => setRepeat(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200 font-bold">
                    Repeat Reminder (الارم بار بار بجتا رہے، جب تک کہ ہم اسے بند یا مکمل نہ کریں)
                  </span>
                </label>
              </div>

              {/* Ringtone Selection & Custom Audio Upload (Requirements #7 & #8) */}
              <div className="p-3.5 rounded-2xl bg-[#030b1e] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Ringtone Selection (الارم کی رنگ ٹون):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestRingtone(ringtoneType, customRingtoneUrl)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-[#d4af37]" />
                    <span>آواز ٹیسٹ کریں</span>
                  </button>
                </div>

                {/* Ringtone Preset Radio Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'urgent', name: 'Urgent Siren (تیز سائرن)' },
                      { id: 'alarm', name: 'Digital Alarm (ڈیجیٹل الارم)' },
                      { id: 'bell', name: 'Brass Bell (دھاتی گھنٹی)' },
                      { id: 'chime', name: 'Melodic Chime (مترنم چائم)' },
                    ] as const
                  ).map((tone) => (
                    <label
                      key={tone.id}
                      className={`p-2 rounded-xl border cursor-pointer text-center transition flex flex-col items-center gap-1 ${
                        ringtoneType === tone.id
                          ? 'border-amber-400 bg-amber-500/10 text-white font-bold'
                          : 'border-slate-800 bg-[#0a192f] text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ringtone"
                        value={tone.id}
                        checked={ringtoneType === tone.id}
                        onChange={() => setRingtoneType(tone.id)}
                        className="hidden"
                      />
                      <span className="text-[11px]">{tone.name}</span>
                    </label>
                  ))}
                </div>

                {/* Custom Audio Upload (MP3 / WAV) */}
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-[11px]">یا اپنی مرضی کی MP3 / WAV رنگ ٹون لگائیں:</p>
                    {customRingtoneName && (
                      <p className="text-[10px] text-emerald-400 font-mono">
                        منتخب کردہ فائل: {customRingtoneName}
                      </p>
                    )}
                  </div>
                  <label className="px-3 py-1.5 bg-[#0353a4] hover:bg-blue-600 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>اپلوڈ آڈیو (MP3/WAV)</span>
                    <input
                      type="file"
                      accept="audio/*, .mp3, .wav, .ogg, .m4a"
                      onChange={handleCustomRingtoneUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* SUBMIT & CANCEL BUTTONS */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  منسوخ کریں (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  {editingReminder ? 'اپڈیٹ کریں (Update)' : 'ریمائنڈر محفوظ کریں (Save Reminder)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
