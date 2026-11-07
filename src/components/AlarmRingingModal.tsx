import React, { useState } from 'react';
import { RepairReminder } from '../types';
import { alarmAudioEngine } from '../services/reminderAlarmAudio';
import { snoozeReminder, dismissReminderAlarm, completeReminder } from '../services/reminderService';
import { RotatingLogo } from './RotatingLogo';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Smartphone,
  AlertTriangle,
  Volume2,
  X,
  Phone,
  Wrench,
  Check,
} from 'lucide-react';

interface AlarmRingingModalProps {
  activeAlarm: RepairReminder | null;
  onClose: () => void;
  onJobStatusChange?: (jobId: string, newStatus: string) => void;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  activeAlarm,
  onClose,
  onJobStatusChange,
}) => {
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeAlarm) return null;

  const handleStop = async () => {
    setIsProcessing(true);
    await dismissReminderAlarm(activeAlarm.id);
    alarmAudioEngine.stopAlarm();
    setIsProcessing(false);
    onClose();
  };

  const handleSnooze = async () => {
    setIsProcessing(true);
    await snoozeReminder(activeAlarm.id, snoozeMinutes);
    alarmAudioEngine.stopAlarm();
    setIsProcessing(false);
    onClose();
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    await completeReminder(activeAlarm.id);
    if (onJobStatusChange && activeAlarm.jobId) {
      onJobStatusChange(activeAlarm.jobId, 'Ready for Delivery');
    }
    alarmAudioEngine.stopAlarm();
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      {/* Pulsing Alert Backdrop Glow */}
      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />

      <div className="relative glass-panel max-w-lg w-full rounded-3xl border-2 border-red-500/80 bg-gradient-to-b from-[#180808] via-[#0a192f] to-[#030b1e] p-5 sm:p-7 shadow-[0_0_60px_rgba(239,68,68,0.4)] my-auto space-y-5">
        
        {/* Top Header with Rotating Logo & Flashing Bell */}
        <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
          <div className="flex items-center gap-3">
            <RotatingLogo size="sm" showGlow={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Repair Alert & Alarm
                </h3>
              </div>
              <p className="text-xs font-serif text-[#d4af37]">موسی موبائل ریپیئرنگ سنٹر — فوری الرٹ</p>
            </div>
          </div>

          <button
            onClick={handleStop}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Dismiss Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROMINENT REQUIRED URDU ALERT MESSAGE (User Requirement #10) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-amber-950/80 to-red-950/90 border-2 border-red-500/60 shadow-lg text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 animate-bounce">
            <Volume2 className="w-7 h-7 text-[#d4af37]" />
          </div>
          <p
            className="text-base sm:text-lg font-black text-amber-200 font-serif leading-relaxed"
            dir="rtl"
          >
            "استاد جی! آپ نے یہ موبائل فون ابھی تک مرمت نہیں کیا۔ براہ کرم اس پر کام مکمل کریں۔"
          </p>
          <p className="text-[11px] text-slate-300 font-medium">
            Pending repair reminder schedule reached. Please take immediate action.
          </p>
        </div>

        {/* DEVICE & CUSTOMER DETAILS CARD */}
        <div className="p-4 rounded-2xl bg-[#030b1e]/90 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#d4af37]" />
              <span className="font-bold text-white text-sm">
                {activeAlarm.deviceCompany} {activeAlarm.deviceModel}
              </span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-bold">
              {activeAlarm.jobId || 'Repair Job'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Customer (کسٹمر)</p>
              <p className="font-bold text-white text-sm">{activeAlarm.customerName}</p>
              {activeAlarm.customerPhone && (
                <a
                  href={`tel:${activeAlarm.customerPhone}`}
                  className="font-mono text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>{activeAlarm.customerPhone}</span>
                </a>
              )}
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">IMEI Number</p>
              <p className="font-mono text-xs text-slate-200 font-medium">
                {activeAlarm.imei || 'N/A'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Scheduled Interval</p>
              <p className="font-mono text-xs text-amber-400 font-bold">
                Every {activeAlarm.intervalMinutes} mins {activeAlarm.repeat ? '(Repeat Active)' : ''}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Wrench className="w-3 h-3 text-rose-400" />
              <span>Reported Fault (مرمت کا مسئلہ):</span>
            </p>
            <p className="text-xs text-rose-300 font-medium mt-0.5 bg-rose-950/40 p-2 rounded-xl border border-rose-900/50">
              {activeAlarm.fault}
            </p>
          </div>
        </div>

        {/* SNOOZE TIME SELECTOR */}
        <div className="p-3 rounded-2xl bg-[#0a192f] border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Snooze Time (سنوز کا وقت):</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[5, 10, 15, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSnoozeMinutes(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  snoozeMinutes === mins
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* THREE ACTION BUTTONS: SNOOZE, STOP, COMPLETE (Requirement #9) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          
          {/* 1. SNOOZE BUTTON */}
          <button
            type="button"
            onClick={handleSnooze}
            disabled={isProcessing}
            className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Snooze ({snoozeMinutes}m)</span>
          </button>

          {/* 2. STOP ALARM BUTTON */}
          <button
            type="button"
            onClick={handleStop}
            disabled={isProcessing}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <BellOff className="w-4 h-4 text-rose-400" />
            <span>Stop (الارم بند)</span>
          </button>

          {/* 3. COMPLETE BUTTON */}
          <button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
            <span>Complete (مرمت مکمل)</span>
          </button>

        </div>

      </div>
    </div>
  );
};
