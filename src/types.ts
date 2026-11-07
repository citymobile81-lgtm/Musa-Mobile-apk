export type JobStatus =
  | 'Received'
  | 'Under Inspection'
  | 'Waiting for Parts'
  | 'Under Repair'
  | 'Ready for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Unrepairable';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  address?: string;
  createdAt: string;
  notes?: string;
}

export interface PhonePhoto {
  id: string;
  title: string;
  dataUrl: string;
  timestamp: string;
}

export type SecurityType =
  | 'Pattern Lock'
  | 'PIN Code'
  | 'Password Lock'
  | 'No Lock'
  | 'Other';

export interface JobFaultItem {
  id: string;
  category: string;
  nameUrdu: string;
  nameEn?: string;
  cost?: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes?: string;
}

export interface JobCard {
  jobId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  company: string;
  model: string;
  imei1?: string;
  imei2?: string;
  color?: string;
  screenCond?: string;
  bodyCond?: string;
  accessories?: string;
  fault: string;
  selectedFaults?: JobFaultItem[];
  diagnosis?: string;
  technician: string;
  receivingDate: string;
  deliveryDate?: string;
  completionDate?: string;
  estimatedCost: number;
  advancePaid: number;
  balance: number;
  status: JobStatus;
  partsUsed?: string[];
  warrantyDays?: number;
  technicianNotes?: string;
  // Security Details
  securityType?: SecurityType;
  securityValue?: string;
  securityNotes?: string;
  securityConsent?: boolean;
  securityWiped?: boolean;
  hasPatternLock?: boolean;
  patternLockVerified?: boolean;
  patternLockStatus?: string;
  patternDotsCount?: number;
  patternNodes?: number[];
  photos?: PhonePhoto[];
  // Compatibility & financial tracking extensions
  id?: string;
  cost?: number;
  phoneModel?: string;
  issue?: string;
  jobCardNumber?: string;
  date?: string;
  createdAt?: string;
  paymentHistory?: UdharPaymentLog[];
}

export interface SparePart {
  id: number;
  partName: string;
  models: string;
  purchasePrice: number;
  wholesalePrice?: number;
  retailPrice: number;
  quantity: number;
  minAlert: number;
  supplierName?: string;
  supplierContact?: string;
}

export interface PartPurchase {
  id: number;
  partId?: number;
  partName: string;
  supplierName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  invoiceNo?: string;
}

export interface PartSale {
  id: number;
  partId?: number;
  partName: string;
  customerName: string;
  customerPhone?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
}

export interface Expense {
  id: number;
  category: 'Shop Rent' | 'Electricity Bill' | 'Technician Salary' | 'Spare Parts Purchase' | 'Tools / Equipment' | 'Tea & Refreshments' | 'Other Utility';
  amount: number;
  notes?: string;
  date: string;
  payee?: string;
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  designation: string;
  monthlySalary: number;
  joinDate: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  status: 'Present' | 'Late' | 'Leave' | 'Absent';
  checkInTime?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: number;
  jobId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer';
  notes?: string;
}

export type AppThemeId =
  | 'black_gold'
  | 'royal_blue'
  | 'gradient'
  | 'dark_neon'
  | 'green_luxury'
  | 'premium_white';

export interface UdharPaymentLog {
  id: string;
  jobId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  amountPaid?: number;
  amount?: number;
  remainingBalance?: number;
  date: string;
  receiptNumber?: string;
  notes?: string;
  receivedBy?: string;
}

export interface UdharReminder {
  id: string;
  jobId: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  outstandingAmount: number;
  reminderDate: string;
  reminderTime: string;
  notes?: string;
  status: 'pending' | 'sent' | 'paid';
  lastSent?: string;
}

export interface ShopSettings {
  shopName: string;
  shopUrdu: string;
  proprietor: string;
  labEngineer: string;
  address: string;
  phone: string;
  phone2?: string;
  altPhone?: string;
  theme?: AppThemeId;
  creatorUrdu?: string;
  creatorTag?: string;
  termsUrdu?: string;
  termsEn?: string;
  googleClientId?: string;
  autoDailyBackupEnabled: boolean;
  autoLocalBackupEnabled?: boolean;
  maxLocalBackupsToKeep?: number;
  selectedLocalFolderName?: string;
  mobileCompanies: string[];
  customLogoUrl?: string;
}

export interface RepairReminder {
  id: string;
  jobId: string;
  customerName: string;
  customerPhone?: string;
  deviceCompany: string;
  deviceModel: string;
  imei?: string;
  fault: string;
  dueTime: string; // ISO string
  intervalMinutes: number; // 5, 10, 15, 30, 60 or custom
  repeat: boolean;
  ringtoneType: 'urgent' | 'alarm' | 'bell' | 'chime' | 'custom';
  customRingtoneUrl?: string;
  customRingtoneName?: string;
  status: 'active' | 'snoozed' | 'completed' | 'dismissed';
  notes?: string;
  createdAt: string;
  lastTriggered?: string;
  snoozeUntil?: string;
  snoozeCount?: number;
}

export interface LocalBackupRecord {
  id: string;
  fileName: string;
  format: 'json' | 'zip';
  timestamp: string;
  fileSizeBytes: number;
  deviceType: 'mobile' | 'desktop';
  folderName: string;
  totalCustomers: number;
  totalJobs: number;
  totalParts: number;
  totalPhotos: number;
  isAutoBackup: boolean;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  action: string;
  details: string;
}

export type UserRole =
  | 'Admin'
  | 'Lab Engineer'
  | 'Technician'
  | 'Cashier'
  | 'Staff';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  isOwner?: boolean;
}
