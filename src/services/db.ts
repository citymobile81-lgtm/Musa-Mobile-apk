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
  ActivityLog,
  RepairReminder,
} from '../types';

const DB_NAME = 'MusaMobileRepairDB_v2';
const DB_VERSION = 4;

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'MUSA MOBILE REPAIRING CENTER',
  shopUrdu: 'موسی موبائل ریپیئرنگ سنٹر',
  proprietor: 'میاں محمد محسن قریشی',
  labEngineer: 'میاں اظہر قریشی',
  address: 'Near Water Plant, Opposite Quba Optical, Muzaffargarh City, Pakistan.',
  phone: '03216861765',
  phone2: '03006861765',
  altPhone: '03006861765',
  theme: 'black_gold',
  creatorUrdu: 'یہ ایپلیکیشن موسی موبائل ریپیئرنگ سنٹر کی جانب سے تیار کی گئی ہے۔',
  creatorTag: 'موسیٰ موبائل ریپیئرنگ سینٹر',
  termsUrdu: '1. ڈیلیوری کے وقت رسید دکھانا لازمی ہے۔ 2. سم یا میموری کارڈ کی دکان ذمہ دار نہ ہوگی۔ 3. 30 دن کے اندر فون وصول فرمائیں۔',
  termsEn: '1. Original receipt required at pickup. 2. Not responsible for unregistered SIM/SD cards. 3. Please claim within 30 days.',
  googleClientId: localStorage.getItem('musa_gdrive_client_id') || '',
  autoDailyBackupEnabled: true,
  mobileCompanies: [
    'Samsung',
    'Apple iPhone',
    'Vivo',
    'Oppo',
    'Xiaomi',
    'Redmi',
    'Realme',
    'Tecno',
    'Infinix',
    'Nokia',
    'Itel',
    'Huawei',
    'OnePlus',
    'Motorola',
    'Google Pixel',
    'Honor',
    'Other',
  ],
};

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'میاں محمد محسن قریشی',
    phone: '03216861765',
    designation: 'Proprietor & Managing Director',
    monthlySalary: 0,
    joinDate: '2023-01-01',
    active: true,
  },
  {
    id: 2,
    name: 'میاں اظہر قریشی',
    phone: '03006861765',
    designation: 'Chief Lab Engineer (Chip Level Repair)',
    monthlySalary: 50000,
    joinDate: '2023-02-01',
    active: true,
  },
];

let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('phone', 'phone', { unique: true });
        store.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('job_cards')) {
        const store = db.createObjectStore('job_cards', { keyPath: 'jobId' });
        store.createIndex('customerPhone', 'customerPhone', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('receivingDate', 'receivingDate', { unique: false });
      }

      if (!db.objectStoreNames.contains('inventory')) {
        const store = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
        store.createIndex('partName', 'partName', { unique: false });
      }

      if (!db.objectStoreNames.contains('purchases')) {
        db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('expenses')) {
        const store = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains('employees')) {
        db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('attendance')) {
        const store = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('employeeId', 'employeeId', { unique: false });
      }

      if (!db.objectStoreNames.contains('payments')) {
        const store = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
        store.createIndex('jobId', 'jobId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('reminders')) {
        const store = db.createObjectStore('reminders', { keyPath: 'id' });
        store.createIndex('jobId', 'jobId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('dueTime', 'dueTime', { unique: false });
      }
    };

    req.onsuccess = async (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      await initializeDefaultData(dbInstance);
      resolve(dbInstance);
    };

    req.onerror = () => {
      reject(req.error);
    };
  });
}

async function initializeDefaultData(db: IDBDatabase) {
  // Check settings
  const settingsTx = db.transaction('settings', 'readwrite');
  const settingsStore = settingsTx.objectStore('settings');
  const getSettingsReq = settingsStore.get('general');
  getSettingsReq.onsuccess = () => {
    if (!getSettingsReq.result) {
      settingsStore.put({ key: 'general', value: DEFAULT_SETTINGS });
    }
  };

  // Check employees
  const empTx = db.transaction('employees', 'readwrite');
  const empStore = empTx.objectStore('employees');
  const countReq = empStore.count();
  countReq.onsuccess = () => {
    if (countReq.result === 0) {
      DEFAULT_EMPLOYEES.forEach((emp) => empStore.put(emp));
    }
  };
}

// Generic CRUD methods
export async function getAllRecords<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function putRecord<T>(storeName: string, item: T): Promise<IDBValidKey> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecord(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSettings(): Promise<ShopSettings> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('general');
    req.onsuccess = () => {
      if (req.result && req.result.value) {
        const val = req.result.value;
        const cleaned: ShopSettings = {
          ...DEFAULT_SETTINGS,
          ...val,
          proprietor: val.proprietor && val.proprietor.includes('محسن') ? val.proprietor : 'میاں محمد محسن قریشی',
          labEngineer: val.labEngineer && val.labEngineer.includes('اظہر') ? val.labEngineer : 'میاں اظہر قریشی',
          phone: '03216861765',
          phone2: '03006861765',
          altPhone: '03006861765',
          address: val.address || 'Near Water Plant, Opposite Quba Optical, Muzaffargarh City, Pakistan.',
        };
        // Clean out any legacy unwanted properties
        delete (cleaned as any).accessoriesMgr;
        delete (cleaned as any).partsManager;
        delete (cleaned as any).serviceManager;
        delete (cleaned as any).phone3;
        resolve(cleaned);
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    req.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: ShopSettings): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const req = store.put({ key: 'general', value: settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function logActivity(action: string, details: string) {
  try {
    const log: ActivityLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    await putRecord('logs', log);
  } catch {
    // quiet fail
  }
}

// Complete Database Export & Import for JSON & Cloud Backup
export async function exportAllDataJSON(): Promise<string> {
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
  ]);

  const backupData = {
    appName: 'MUSA MOBILE REPAIRING CENTER',
    version: '2.0',
    exportTimestamp: new Date().toISOString(),
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
    },
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importDataFromJSON(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    const {
      customers = [],
      jobCards = [],
      inventory = [],
      purchases = [],
      sales = [],
      expenses = [],
      employees = [],
      attendance = [],
      payments = [],
      settings,
    } = parsed.data;

    // Save records
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

    await logActivity('RESTORE_DATA', `Restored ${jobCards.length} jobs, ${customers.length} customers, ${inventory.length} parts`);

    return {
      success: true,
      message: `Successfully restored ${customers.length} customers, ${jobCards.length} job cards, and ${inventory.length} spare parts!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Restore failed: ${errorMsg}` };
  }
}
