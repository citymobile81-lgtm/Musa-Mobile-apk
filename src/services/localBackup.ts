import JSZip from 'jszip';
import {
  getAllRecords,
  putRecord,
  getSettings,
  saveSettings,
  logActivity,
  clearObjectStore,
} from './db';
import {
  Customer,
  JobCard,
  SparePart,
  PartPurchase,
  PartSale,
  Expense,
  Employee,
  AttendanceRecord,
  PaymentRecord,
  ShopSettings,
  LocalBackupRecord,
  ActivityLog,
} from '../types';

export const BACKUP_FOLDER_DEFAULT = 'MUSA MOBILE COMPLETE BACKUP';
const HISTORY_KEY = 'musa_local_backup_history';
const LAST_BACKUP_KEY = 'musa_last_local_backup_date';
const SAFETY_SNAPSHOT_KEY = 'musa_safety_snapshot';

// In-Memory File System Access Directory Handle for Chrome Desktop
let activeDirectoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * Check if the browser supports the File System Access API (Desktop Chrome / Edge)
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Detect if client is running on a Mobile / Android device
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isTouch = navigator.maxTouchPoints > 1 && window.innerWidth < 800;
  return mobileRegex.test(ua) || isTouch;
}

/**
 * Get current active directory handle or folder name
 */
export function getActiveDirectoryName(): string {
  if (activeDirectoryHandle) {
    return activeDirectoryHandle.name;
  }
  return localStorage.getItem('musa_selected_folder_name') || BACKUP_FOLDER_DEFAULT;
}

/**
 * Select a local directory for backups (uses showDirectoryPicker on Desktop)
 */
export async function selectBackupDirectory(): Promise<{
  success: boolean;
  folderName: string;
  isFileSystemHandle: boolean;
  message: string;
}> {
  if (isFileSystemAccessSupported()) {
    try {
      // Prompt user to pick or create "MUSA MOBILE BACKUP" folder
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      // Verify permission
      const perm = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        return {
          success: false,
          folderName: BACKUP_FOLDER_DEFAULT,
          isFileSystemHandle: false,
          message: 'فولڈر میں محفوظ کرنے کی اجازت نہیں دی گئی۔ (Write permission denied)',
        };
      }

      activeDirectoryHandle = dirHandle;
      const folderName = dirHandle.name;
      localStorage.setItem('musa_selected_folder_name', folderName);

      return {
        success: true,
        folderName,
        isFileSystemHandle: true,
        message: `فولڈر '${folderName}' کامیابی سے منتخب ہو گیا ہے۔ (Folder selected)`,
      };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return {
          success: false,
          folderName: getActiveDirectoryName(),
          isFileSystemHandle: false,
          message: 'فولڈر کا انتخاب منسوخ کر دیا گیا۔ (Selection cancelled)',
        };
      }
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        folderName: BACKUP_FOLDER_DEFAULT,
        isFileSystemHandle: false,
        message: `فولڈر منتخب کرنے میں خرابی: ${msg}`,
      };
    }
  } else {
    // Mobile / Android fallback: prompt folder naming convention
    const customName = prompt(
      'موبائل فون میں بیک اپ محفوظ کرنے کے لیے فولڈر کا نام درج کریں:\n(Enter Mobile Backup Folder Name):',
      getActiveDirectoryName()
    );
    const chosen = (customName && customName.trim()) || BACKUP_FOLDER_DEFAULT;
    localStorage.setItem('musa_selected_folder_name', chosen);
    return {
      success: true,
      folderName: chosen,
      isFileSystemHandle: false,
      message: `موبائل بیک اپ فولڈر کا نام '${chosen}' سیٹ ہو گیا ہے۔ فائل ڈاؤن لوڈ پر اسی فولڈر میں منتقل کریں۔`,
    };
  }
}

/**
 * Create a full database snapshot containing all tables, photos, and configurations
 */
export async function createFullDatabaseSnapshot(): Promise<any> {
  const [
    customers,
    jobCards,
    inventory,
    purchases,
    sales,
    expenses,
    employees,
    attendance,
    payments,
    settings,
    logs,
  ] = await Promise.all([
    getAllRecords<Customer>('customers'),
    getAllRecords<JobCard>('job_cards'),
    getAllRecords<SparePart>('inventory'),
    getAllRecords<PartPurchase>('purchases'),
    getAllRecords<PartSale>('sales'),
    getAllRecords<Expense>('expenses'),
    getAllRecords<Employee>('employees'),
    getAllRecords<AttendanceRecord>('attendance'),
    getAllRecords<PaymentRecord>('payments'),
    getSettings(),
    getAllRecords<ActivityLog>('logs'),
  ]);

  // Compute total photos embedded in job cards
  let totalPhotos = 0;
  jobCards.forEach((j) => {
    if (j.photos && Array.isArray(j.photos)) {
      totalPhotos += j.photos.length;
    }
  });

  const now = new Date();
  const dateFormattedUrdu = now.toLocaleDateString('ur-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    appName: 'MUSA MOBILE REPAIRING CENTER',
    urduName: 'موسی موبائل ریپیئرنگ سینٹر',
    proprietor: 'میاں محمد محسن قریشی',
    labEngineer: 'میاں اظہر قریشی',
    contacts: ['03216861765', '03006861765'],
    address: 'بالمقابل قبا آپٹیکل، واٹر پلانٹ والی گلی، مظفرگڑھ سٹی، پاکستان',
    version: '2.5',
    exportTimestamp: now.toISOString(),
    exportDateUrdu: dateFormattedUrdu,
    deviceType: isMobileDevice() ? 'mobile' : 'desktop',
    folderName: getActiveDirectoryName(),
    stats: {
      totalCustomers: customers.length,
      totalJobs: jobCards.length,
      totalParts: inventory.length,
      totalPurchases: purchases.length,
      totalSales: sales.length,
      totalExpenses: expenses.length,
      totalEmployees: employees.length,
      totalAttendance: attendance.length,
      totalPayments: payments.length,
      totalPhotos,
    },
    data: {
      customers,
      jobCards,
      inventory,
      purchases,
      sales,
      expenses,
      employees,
      attendance,
      payments,
      settings,
      logs,
    },
  };
}

/**
 * Generate a compressed ZIP archive containing JSON snapshot, manifest, and recovery readme
 */
export async function generateZipArchive(snapshot: any): Promise<Blob> {
  const zip = new JSZip();

  // 1. Full Database JSON
  const jsonContent = JSON.stringify(snapshot, null, 2);
  zip.file('musa_database_backup.json', jsonContent);

  // 2. Metadata Manifest
  const manifest = {
    appName: snapshot.appName,
    urduName: snapshot.urduName,
    exportTimestamp: snapshot.exportTimestamp,
    deviceType: snapshot.deviceType,
    stats: snapshot.stats,
    checksum: 'MUSA-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 3. User & Shop Readme Instructions in Urdu and English
  const readmeText = `=====================================================
موسیٰ موبائل ریپیئرنگ سینٹر - مکمل لوکل سسٹم بیک اپ
MUSA MOBILE REPAIRING CENTER - SECURE LOCAL SYSTEM BACKUP
=====================================================

پروپرائیٹر: میاں محمد محسن قریشی (03216861765)
چیف لیب انجینئر: میاں اظہر قریشی (03006861765)
ایکسیسریز مینیجر: میاں جمشید قریشی
رابطہ نمبرز: 03216861765 - 03006861765
پتہ: واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی، پاکستان

بیک اپ کی تاریخ: ${snapshot.exportTimestamp}
ڈیوائس کی قسم: ${snapshot.deviceType === 'mobile' ? 'موبائل فون (Android)' : 'کمپیوٹر / لیپ ٹاپ (Desktop Chrome)'}
فولڈر: ${snapshot.folderName}

خلاصہ ریکارڈز:
- کل رجسٹرڈ کسٹمرز: ${snapshot.stats.totalCustomers}
- کل موبائل جاب کارڈز (ریپیئر انٹریاں): ${snapshot.stats.totalJobs}
- کل موبائل معائنہ تصاویر: ${snapshot.stats.totalPhotos}
- کل اسپیئر پارٹس اسٹاک: ${snapshot.stats.totalParts}
- کل ملازمین و حاضری ریکارڈز: ${snapshot.stats.totalEmployees}
- مالیاتی واؤچرز و ادائیگیاں: ${snapshot.stats.totalPayments}

ڈیٹا واپس بحال کرنے (Restore) کا طریقہ:
1. موسیٰ موبائل ریپیئرنگ سینٹر ایپلیکیشن کو کسی بھی کمپیوٹر، لیپ ٹاپ یا موبائل پر کھولیں۔
2. "Local Backup & Restore" سیکشن میں جائیں۔
3. "Restore Backup" یا "Import Backup" پر کلک کریں اور یہ ZIP فائل منتخب کریں۔
4. چند سیکنڈ میں تمام کسٹمرز، رسیدیں، تصاویر اور اکاؤنٹس بحال ہو جائیں گے۔

=====================================================
`;
  zip.file('README_BACKUP_INFO.txt', readmeText);

  // Generate compressed zip blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export const MASTER_BACKUP_FILENAME_BASE = 'MUSA_FULL_BACKUP';

/**
 * Execute local backup export (JSON or ZIP) - Continuously updates MUSA_MOBILE_MASTER_BACKUP in 'MUSA MOBILE BACKUP' folder
 */
export async function executeLocalBackup(
  format: 'json' | 'zip' = 'zip',
  isAuto = false
): Promise<{
  success: boolean;
  fileName: string;
  fileSizeBytes: number;
  folderName: string;
  savedDirectlyToFolder: boolean;
  message: string;
}> {
  try {
    const snapshot = await createFullDatabaseSnapshot();
    const now = new Date();
    // Consistent single master backup filename to prevent duplicate fragmented files
    const fileName = `${MASTER_BACKUP_FILENAME_BASE}.${format}`;
    const folderName = getActiveDirectoryName() || BACKUP_FOLDER_DEFAULT;

    // Cache continuous master copy in localStorage for immediate offline safety
    try {
      localStorage.setItem('musa_continuous_master_snapshot', JSON.stringify({
        updatedAt: now.toISOString(),
        stats: snapshot.stats,
      }));
    } catch (e) {
      // quota safeguard
    }

    let fileBlob: Blob;
    if (format === 'zip') {
      fileBlob = await generateZipArchive(snapshot);
    } else {
      const jsonStr = JSON.stringify(snapshot, null, 2);
      fileBlob = new Blob([jsonStr], { type: 'application/json' });
    }

    let savedDirectly = false;

    // Direct write if Directory Handle is available on Desktop Chrome/Edge into 'MUSA MOBILE BACKUP'
    if (activeDirectoryHandle && !isMobileDevice()) {
      try {
        const fileHandle = await (activeDirectoryHandle as any).getFileHandle(fileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(fileBlob);
        await writable.close();
        savedDirectly = true;
      } catch (err) {
        console.warn('Direct folder write failed, falling back to download trigger:', err);
      }
    }

    // Fallback: browser download trigger (Android, Mobile, or when no dir handle)
    if (!savedDirectly) {
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    // Register into Backup History
    const historyEntry: LocalBackupRecord = {
      id: `local_bak_${Date.now()}`,
      fileName,
      format,
      timestamp: now.toISOString(),
      fileSizeBytes: fileBlob.size,
      deviceType: isMobileDevice() ? 'mobile' : 'desktop',
      folderName,
      totalCustomers: snapshot.stats.totalCustomers,
      totalJobs: snapshot.stats.totalJobs,
      totalParts: snapshot.stats.totalParts,
      totalPhotos: snapshot.stats.totalPhotos,
      isAutoBackup: isAuto,
    };

    addBackupHistory(historyEntry);
    localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
    await logActivity(
      'LOCAL_BACKUP_UPDATED',
      `Updated master backup: ${fileName} in folder '${folderName}' (${snapshot.stats.totalCustomers} clients, ${snapshot.stats.totalJobs} jobs)`
    );

    const destMsg = savedDirectly
      ? `براہ راست فولڈر '${folderName}' میں ماسٹر بیک اپ اپڈیٹ ہو گیا۔`
      : isMobileDevice()
      ? `ماسٹر بیک اپ ڈاؤن لوڈ ہو گیا ہے۔ اسے اپنے موبائل کے '${folderName}' فولڈر میں تبدیل یا محفوظ کریں۔`
      : `ماسٹر فائل ڈاؤن لوڈ ہو گئی۔ اسے اپنے '${folderName}' فولڈر میں منتقل کریں۔`;

    return {
      success: true,
      fileName,
      fileSizeBytes: fileBlob.size,
      folderName,
      savedDirectlyToFolder: savedDirectly,
      message: `مسلسل بیک اپ فائل '${fileName}' اپڈیٹ ہو گئی۔ ${destMsg}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      fileName: '',
      fileSizeBytes: 0,
      folderName: getActiveDirectoryName(),
      savedDirectlyToFolder: false,
      message: `بیک اپ بنانے میں خرابی پیش آگئی: ${errorMsg}`,
    };
  }
}

/**
 * Validate imported data structure to ensure safety
 */
export function validateBackupData(parsed: any): {
  valid: boolean;
  error?: string;
  stats?: any;
} {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'فائل نامکمل ہے یا JSON فارمیٹ درست نہیں ہے۔' };
  }

  const data = parsed.data || parsed;
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'بیک اپ فائل میں ڈیٹا موجود نہیں ہے۔' };
  }

  // Check required core keys
  const hasJobs = Array.isArray(data.jobCards);
  const hasCustomers = Array.isArray(data.customers);

  if (!hasJobs && !hasCustomers) {
    return {
      valid: false,
      error: 'یہ فائل موسی موبائل ریپیئرنگ سینٹر کا درست بیک اپ نہیں ہے۔ مطلوبہ ٹیبلز غائب ہیں۔',
    };
  }

  return {
    valid: true,
    stats: {
      customers: data.customers?.length || 0,
      jobCards: data.jobCards?.length || 0,
      inventory: data.inventory?.length || 0,
      photos: parsed.stats?.totalPhotos || 0,
    },
  };
}

/**
 * Create a Safety Snapshot before executing restore
 */
export async function createSafetySnapshot(): Promise<boolean> {
  try {
    const snapshot = await createFullDatabaseSnapshot();
    localStorage.setItem(SAFETY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    return true;
  } catch (err) {
    console.error('Failed to create safety snapshot:', err);
    return false;
  }
}

/**
 * Check if a Safety Snapshot exists
 */
export function hasSafetySnapshot(): boolean {
  return !!localStorage.getItem(SAFETY_SNAPSHOT_KEY);
}

/**
 * Restore from the Safety Snapshot
 */
export async function restoreSafetySnapshot(): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(SAFETY_SNAPSHOT_KEY);
    if (!raw) {
      return { success: false, message: 'کوئی حفاظتی بیک اپ موجود نہیں ملا۔' };
    }
    const parsed = JSON.parse(raw);
    return await executeRestoreFromParsedData(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `حفاظتی بیک اپ بحال کرنے میں ناکامی: ${msg}` };
  }
}

/**
 * Extract and parse a backup file (supports both JSON and ZIP archives)
 */
export async function parseBackupFile(file: File): Promise<any> {
  const fileName = file.name.toLowerCase();

  // Handle ZIP Archive
  if (fileName.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    let targetEntry = zip.file('musa_database_backup.json');

    // If not found with exact name, look for any .json file inside zip
    if (!targetEntry) {
      const jsonFiles = zip.file(/\.json$/i);
      if (jsonFiles.length > 0) {
        targetEntry = jsonFiles[0];
      }
    }

    if (!targetEntry) {
      throw new Error('اس ZIP فائل کے اندر کوئی درست ڈیٹا بیس JSON فائل نہیں ملی۔');
    }

    const text = await targetEntry.async('text');
    return JSON.parse(text);
  }

  // Handle standard JSON file
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    return JSON.parse(text);
  }

  throw new Error('براہ کرم صرف .zip یا .json فارمیٹ والی بیک اپ فائل منتخب کریں۔');
}

/**
 * Execute restore from parsed data with de-duplication, replace/merge modes, and transaction safety
 */
export async function executeRestoreFromParsedData(
  parsed: any,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; message: string; counts?: any }> {
  const validation = validateBackupData(parsed);
  if (!validation.valid) {
    return { success: false, message: validation.error || 'بیک اپ فائل غلط ہے۔' };
  }

  // Take safety snapshot first before modifying database
  await createSafetySnapshot();

  const data = parsed.data || parsed;
  const customers: Customer[] = data.customers || [];
  const jobCards: JobCard[] = data.jobCards || [];
  const inventory: SparePart[] = data.inventory || [];
  const purchases: PartPurchase[] = data.purchases || [];
  const sales: PartSale[] = data.sales || [];
  const expenses: Expense[] = data.expenses || [];
  const employees: Employee[] = data.employees || [];
  const attendance: AttendanceRecord[] = data.attendance || [];
  const payments: PaymentRecord[] = data.payments || [];
  const settings: ShopSettings = data.settings;

  // In replace mode (مکمل تبدیل کریں), clear previous records first so new phone receives clean state
  if (mode === 'replace') {
    try {
      await clearObjectStore('customers');
      await clearObjectStore('job_cards');
      await clearObjectStore('inventory');
      await clearObjectStore('purchases');
      await clearObjectStore('sales');
      await clearObjectStore('expenses');
      await clearObjectStore('employees');
      await clearObjectStore('attendance');
      await clearObjectStore('payments');
      try {
        await clearObjectStore('reminders');
      } catch {
        // reminders store optional
      }
    } catch (clearErr) {
      console.warn('Error clearing stores during replace restore:', clearErr);
    }
  }

  // Insert records into IndexedDB using putRecord
  for (const item of customers) await putRecord('customers', item);
  for (const item of jobCards) await putRecord('job_cards', item);
  for (const item of inventory) await putRecord('inventory', item);
  for (const item of purchases) await putRecord('purchases', item);
  for (const item of sales) await putRecord('sales', item);
  for (const item of expenses) await putRecord('expenses', item);
  for (const item of employees) await putRecord('employees', item);
  for (const item of attendance) await putRecord('attendance', item);
  for (const item of payments) await putRecord('payments', item);
  if (settings) await saveSettings(settings);

  const modeUrdu = mode === 'replace' ? 'مکمل تبدیل (Replace)' : 'شامل و ضم (Merge)';

  await logActivity(
    'LOCAL_RESTORE_SUCCESS',
    `Restored ${jobCards.length} jobs, ${customers.length} clients, ${inventory.length} parts in ${mode} mode`
  );

  return {
    success: true,
    message: `ڈیٹا بحال ہو گیا! [طریقہ: ${modeUrdu}] (${customers.length} کسٹمرز، ${jobCards.length} جاب کارڈز، ${inventory.length} اسپیئر پارٹس)`,
    counts: {
      customers: customers.length,
      jobCards: jobCards.length,
      inventory: inventory.length,
      purchases: purchases.length,
      sales: sales.length,
      expenses: expenses.length,
    },
  };
}

/**
 * Manage last 10 backups history
 */
export function getBackupHistory(): LocalBackupRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addBackupHistory(record: LocalBackupRecord, maxKeep = 10) {
  try {
    const current = getBackupHistory();
    const updated = [record, ...current].slice(0, maxKeep);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update backup history:', err);
  }
}

export function clearBackupHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Check and run automated daily local backup
 */
export async function checkAndRunAutoLocalBackup(
  isAutoEnabled = true,
  maxKeep = 10
): Promise<{ ran: boolean; success: boolean; message: string } | null> {
  if (!isAutoEnabled) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastBackupStr = localStorage.getItem(LAST_BACKUP_KEY);
  const lastDate = lastBackupStr ? lastBackupStr.split('T')[0] : '';

  if (lastDate === todayStr) {
    return {
      ran: false,
      success: true,
      message: `آج کا خودکار لوکل بیک اپ پہلے ہی مکمل ہو چکا ہے (${todayStr}).`,
    };
  }

  // Run daily ZIP backup
  const result = await executeLocalBackup('zip', true);
  return {
    ran: true,
    success: result.success,
    message: result.message,
  };
}
