import { RepairReminder } from '../types';
import { getAllRecords, putRecord, deleteRecord, logActivity } from './db';
import { alarmAudioEngine } from './reminderAlarmAudio';

const LOCAL_STORAGE_KEY = 'musa_repair_reminders_store';

// Helper to get fallback from localStorage
function getLocalReminders(): RepairReminder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReminders(list: RepairReminder[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Fetch all reminders from IndexedDB (with localStorage backup)
export async function getAllReminders(): Promise<RepairReminder[]> {
  try {
    const fromDb = await getAllRecords<RepairReminder>('reminders');
    if (fromDb && fromDb.length > 0) {
      saveLocalReminders(fromDb);
      return fromDb;
    }
  } catch (err) {
    console.warn('Could not read reminders from IndexedDB, using local storage fallback:', err);
  }
  return getLocalReminders();
}

// Save or update reminder
export async function saveReminder(reminder: RepairReminder): Promise<void> {
  // Update local storage
  const current = getLocalReminders();
  const index = current.findIndex((r) => r.id === reminder.id);
  if (index >= 0) {
    current[index] = reminder;
  } else {
    current.unshift(reminder);
  }
  saveLocalReminders(current);

  // Update IndexedDB
  try {
    await putRecord('reminders', reminder);
  } catch (err) {
    console.warn('Failed to save reminder in IndexedDB, preserved in localStorage:', err);
  }

  await logActivity('REMINDER_SAVED', `Reminder for ${reminder.customerName} (${reminder.deviceModel}) saved.`);
  window.dispatchEvent(new Event('musa-reminders-updated'));
}

// Delete reminder
export async function deleteReminder(id: string): Promise<void> {
  const current = getLocalReminders().filter((r) => r.id !== id);
  saveLocalReminders(current);

  try {
    await deleteRecord('reminders', id);
  } catch (err) {
    console.warn('Failed to delete reminder from IndexedDB:', err);
  }

  await logActivity('REMINDER_DELETED', `Deleted reminder ${id}`);
  window.dispatchEvent(new Event('musa-reminders-updated'));
}

// Snooze reminder by X minutes
export async function snoozeReminder(id: string, minutes: number = 5): Promise<RepairReminder | null> {
  const all = await getAllReminders();
  const reminder = all.find((r) => r.id === id);
  if (!reminder) return null;

  const now = new Date();
  const snoozeTime = new Date(now.getTime() + minutes * 60 * 1000).toISOString();

  const updated: RepairReminder = {
    ...reminder,
    status: 'snoozed',
    snoozeUntil: snoozeTime,
    snoozeCount: (reminder.snoozeCount || 0) + 1,
  };

  alarmAudioEngine.stopAlarm();
  await saveReminder(updated);
  return updated;
}

// Mark reminder as completed
export async function completeReminder(id: string): Promise<RepairReminder | null> {
  const all = await getAllReminders();
  const reminder = all.find((r) => r.id === id);
  if (!reminder) return null;

  const updated: RepairReminder = {
    ...reminder,
    status: 'completed',
  };

  alarmAudioEngine.stopAlarm();
  await saveReminder(updated);
  return updated;
}

// Dismiss reminder alarm without deleting
export async function dismissReminderAlarm(id: string): Promise<void> {
  alarmAudioEngine.stopAlarm();
  const all = await getAllReminders();
  const reminder = all.find((r) => r.id === id);
  if (!reminder) return;

  if (reminder.repeat && reminder.intervalMinutes > 0) {
    // Reschedule for next interval
    const nextDue = new Date(Date.now() + reminder.intervalMinutes * 60 * 1000).toISOString();
    await saveReminder({
      ...reminder,
      status: 'active',
      dueTime: nextDue,
      lastTriggered: new Date().toISOString(),
    });
  } else {
    await saveReminder({
      ...reminder,
      status: 'dismissed',
      lastTriggered: new Date().toISOString(),
    });
  }
}

// Automatically complete any reminders for a job when job is marked Ready for Delivery or Delivered
export async function autoCompleteRemindersForJob(jobId: string): Promise<void> {
  const all = await getAllReminders();
  const matches = all.filter((r) => r.jobId === jobId && (r.status === 'active' || r.status === 'snoozed'));
  for (const match of matches) {
    await completeReminder(match.id);
  }
}
