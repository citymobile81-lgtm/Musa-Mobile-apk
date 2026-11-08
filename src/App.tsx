import React, { useState, useEffect } from 'react';
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
  RepairReminder,
  AppThemeId,
} from './types';
import {
  openDatabase,
  getAllRecords,
  putRecord,
  getSettings,
  DEFAULT_SETTINGS,
  exportAllDataJSON,
} from './services/db';
import { checkAndRunAutoDailyBackup } from './services/googleDrive';
import { RotatingLogo } from './components/RotatingLogo';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { SmartCustomerAutoSearchBar } from './components/SmartCustomerAutoSearchBar';
import { CustomerFullRecordModal } from './components/CustomerFullRecordModal';
import { SmartSearchResult } from './services/smartSearch';
import { isAuthenticated, logoutUser } from './services/auth';
import { getActiveThemeId, setActiveThemeId, applyThemeToDOM } from './services/theme';
import { SHOP_PERSONNEL } from './data/shopContacts';

// Operational Views
import { DashboardView } from './views/DashboardView';
import { NewRepairView } from './views/NewRepairView';
import { JobCardsView } from './views/JobCardsView';
import { RemindersView } from './views/RemindersView';
import { RepairReportsView } from './views/RepairReportsView';
import { CustomerView } from './views/CustomerView';
import { CustomerUdharView } from './views/CustomerUdharView';
import { InventoryView } from './views/InventoryView';
import { PurchasesAndSalesView } from './views/PurchasesAndSalesView';
import { ExpensesView } from './views/ExpensesView';
import { CustomerPaymentsView } from './views/CustomerPaymentsView';
import { EmployeesView } from './views/EmployeesView';
import { ReportsView } from './views/ReportsView';
import { WarrantyView } from './views/WarrantyView';
import { GoogleDriveBackupView } from './views/GoogleDriveBackupView';
import { LocalBackupView } from './views/LocalBackupView';
import { SettingsView } from './views/SettingsView';
import { ThemeSettingsView } from './views/ThemeSettingsView';
import { checkAndRunAutoLocalBackup, executeLocalBackup } from './services/localBackup';
import { getAllReminders, autoCompleteRemindersForJob } from './services/reminderService';
import { alarmAudioEngine } from './services/reminderAlarmAudio';

import {
  Menu,
  Moon,
  Sun,
  Languages,
  PlusCircle,
  LayoutDashboard,
  Smartphone,
  Download,
  Share2,
  IdCard,
  Bell,
  Users,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Wallet,
  FileText,
  ShieldCheck,
  UserCheck,
  Cloud,
  Sliders,
  X,
  PhoneCall,
  HardDrive,
  Palette,
  DollarSign,
  LogOut,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [isAuth, setIsAuth] = useState<boolean>(() => isAuthenticated());
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [appTheme, setAppTheme] = useState<AppThemeId>(() => getActiveThemeId());
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUrdu, setIsUrdu] = useState(false);

  /**
   * Seamlessly switches view and automatically closes the navigation drawer
   * on all devices (mobile, tablet, and desktop) for unobstructed full-screen experience.
   */
  const navigateToView = (view: string) => {
    setCurrentView(view);
    // Auto-close menu navigation on selection
    setSidebarOpen(false);
  };

  const [themeSuccessNotification, setThemeSuccessNotification] = useState<string | null>(null);

  const handleSelectTheme = (newTheme: AppThemeId) => {
    setAppTheme(newTheme);
    setActiveThemeId(newTheme);
    setThemeSuccessNotification('مبارک ہو! آپ کا منتخب کردہ تھیم کامیابی سے ایکٹیو ہو گیا ہے۔');
    setTimeout(() => {
      setThemeSuccessNotification(null);
    }, 4500);
  };

  useEffect(() => {
    applyThemeToDOM(appTheme);
  }, [appTheme]);

  // Core Database State
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [inventory, setInventory] = useState<SparePart[]>([]);
  const [purchases, setPurchases] = useState<PartPurchase[]>([]);
  const [sales, setSales] = useState<PartSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Receipt Modal State
  const [activeReceiptJob, setActiveReceiptJob] = useState<JobCard | null>(null);

  // Smart Customer Full Record Modal State
  const [showFullRecordModal, setShowFullRecordModal] = useState(false);
  const [fullRecordCustomer, setFullRecordCustomer] = useState<Customer | null>(null);
  const [fullRecordActiveJob, setFullRecordActiveJob] = useState<JobCard | null>(null);
  const [fullRecordCustomerJobs, setFullRecordCustomerJobs] = useState<JobCard[]>([]);

  const handleSelectSearchResult = (result: SmartSearchResult) => {
    // 1. Locate all jobs for this customer
    const relatedJobs = jobs.filter(
      (j) =>
        (result.customerPhone && j.customerPhone === result.customerPhone) ||
        (result.customerId && j.customerId === result.customerId)
    );

    // 2. Active job
    const active =
      result.type === 'job' && result.rawJob
        ? result.rawJob
        : relatedJobs.find((j) => j.jobId === result.jobId) || relatedJobs[0] || null;

    // 3. Customer info
    let cust = customers.find(
      (c) =>
        (result.customerId && c.id === result.customerId) ||
        (result.customerPhone && c.phone === result.customerPhone)
    );

    if (!cust) {
      cust = {
        id: result.customerId || (active ? active.customerId : 'CUST'),
        name: result.customerName,
        phone: result.customerPhone,
        altPhone: result.altPhone,
        address: result.address || 'Muzaffargarh City',
        createdAt: result.receivingDate || new Date().toISOString(),
      };
    }

    setFullRecordCustomer(cust);
    setFullRecordActiveJob(active);
    setFullRecordCustomerJobs(relatedJobs);
    setShowFullRecordModal(true);
  };

  // Smart Repair Reminders & Alarms State
  const [activeAlarm, setActiveAlarm] = useState<RepairReminder | null>(null);
  const [activeRemindersCount, setActiveRemindersCount] = useState<number>(0);

  // Background Reminder Checker (Runs every 4 seconds)
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const all = await getAllReminders();
        const activeCount = all.filter((r) => r.status === 'active' || r.status === 'snoozed').length;
        setActiveRemindersCount(activeCount);

        const now = Date.now();
        for (const rem of all) {
          if (rem.status === 'active' || rem.status === 'snoozed') {
            const dueTimestamp =
              rem.status === 'snoozed' && rem.snoozeUntil
                ? new Date(rem.snoozeUntil).getTime()
                : new Date(rem.dueTime).getTime();

            // Check if due and not triggered within last 40 seconds
            const lastTrig = rem.lastTriggered ? new Date(rem.lastTriggered).getTime() : 0;
            if (dueTimestamp <= now && now - lastTrig > 40000) {
              setActiveAlarm(rem);
              alarmAudioEngine.startAlarm(rem.ringtoneType, rem.customRingtoneUrl);
              alarmAudioEngine.sendSystemNotification(
                '⚠️ MUSA MOBILE REPAIR ALARM!',
                `استاد جی! آپ نے یہ موبائل فون ابھی تک مرمت نہیں کیا۔ براہ کرم اس پر کام مکمل کریں۔\nکسٹمر: ${rem.customerName} (${rem.deviceCompany} ${rem.deviceModel})`
              );
              break;
            }
          }
        }
      } catch (err) {
        console.warn('Alarm scheduler error:', err);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update job status from alarm modal
  const handleJobStatusFromAlarm = async (jobId: string, newStatus: string) => {
    try {
      const match = jobs.find((j) => j.jobId === jobId);
      if (match) {
        const updated = { ...match, status: newStatus as any };
        await putRecord('job_cards', updated);
        await autoCompleteRemindersForJob(jobId);
        loadDatabase();
      }
    } catch (err) {
      console.warn('Failed to update job from alarm:', err);
    }
  };

  // Auto-backup Alert Banner State
  const [autoBackupNotice, setAutoBackupNotice] = useState<string | null>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Responsive sidebar collapse on small screens
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Load all IndexedDB records
  const loadDatabase = async () => {
    try {
      await openDatabase();
      const [
        loadedSettings,
        loadedCustomers,
        loadedJobs,
        loadedInventory,
        loadedPurchases,
        loadedSales,
        loadedExpenses,
        loadedEmployees,
        loadedAttendance,
        loadedPayments,
      ] = await Promise.all([
        getSettings(),
        getAllRecords<Customer>('customers'),
        getAllRecords<JobCard>('job_cards'),
        getAllRecords<SparePart>('inventory'),
        getAllRecords<PartPurchase>('purchases'),
        getAllRecords<PartSale>('sales'),
        getAllRecords<Expense>('expenses'),
        getAllRecords<Employee>('employees'),
        getAllRecords<AttendanceRecord>('attendance'),
        getAllRecords<PaymentRecord>('payments'),
      ]);

      setSettings(loadedSettings);
      setCustomers(loadedCustomers);
      setJobs(loadedJobs);
      setInventory(loadedInventory);
      setPurchases(loadedPurchases);
      setSales(loadedSales);
      setExpenses(loadedExpenses);
      setEmployees(loadedEmployees);
      setAttendance(loadedAttendance);
      setPayments(loadedPayments);

      // Check automated daily local backup (Mobile / Desktop folder)
      checkAndRunAutoLocalBackup(loadedSettings.autoLocalBackupEnabled ?? true).then((res) => {
        if (res && res.ran && res.success) {
          setAutoBackupNotice(`آج کا خودکار لوکل بیک اپ بن کر محفوظ ہو گیا ہے۔ (${new Date().toLocaleDateString()})`);
        }
      });

      // Check automated daily cloud backup
      checkAndRunAutoDailyBackup(loadedSettings.autoDailyBackupEnabled).then((result) => {
        if (result && result.ran) {
          setAutoBackupNotice(
            result.success
              ? `Automated Daily Google Drive Cloud Backup completed successfully.`
              : `Daily Auto-Backup: ${result.message}`
          );
        }
      });
    } catch (err) {
      console.error('Failed to load database:', err);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Language & Theme Toggle handlers
  const handleToggleLanguage = () => {
    const nextUrdu = !isUrdu;
    setIsUrdu(nextUrdu);
    document.documentElement.dir = nextUrdu ? 'rtl' : 'ltr';
  };

  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const handleQuickBackupDownload = async () => {
    const res = await executeLocalBackup('zip');
    if (res.success) {
      setAutoBackupNotice(res.message);
    }
  };

  // 1. Animated Splash Screen
  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => setShowSplash(false)}
        customLogoUrl={settings.customLogoUrl}
      />
    );
  }

  // 2. Professional Locked Login Screen
  if (!isAuth) {
    return (
      <LoginScreen
        shopLogo={settings.customLogoUrl}
        onLoginSuccess={() => {
          setIsAuth(true);
          setShowWelcome(true);
        }}
      />
    );
  }

  // 3. Animated 5-second Welcome Screen upon successful login
  if (showWelcome) {
    return (
      <WelcomeScreen
        shopLogo={settings.customLogoUrl}
        onFinish={() => setShowWelcome(false)}
      />
    );
  }

  return (
    <div
      data-theme={appTheme}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 theme-${appTheme} ${
        appTheme === 'premium_white' || !isDarkMode ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#030b1e] text-slate-100'
      }`}
    >

      {/* Theme Activated Green Notification Bar (User Requirement #5) */}
      {themeSuccessNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white font-black text-xs sm:text-sm py-2.5 px-6 rounded-2xl shadow-2xl border-2 border-emerald-300/80 flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span dir="rtl">{themeSuccessNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setThemeSuccessNotification(null)}
            className="hover:bg-emerald-700/80 p-1 rounded-full text-white/90 hover:text-white shrink-0 ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Auto Backup Notification Bar */}
      {autoBackupNotice && (
        <div className="bg-emerald-900/90 text-emerald-100 text-xs px-4 py-1.5 text-center font-medium border-b border-emerald-700 flex items-center justify-center gap-2 z-40">
          <span>{autoBackupNotice}</span>
          <button
            onClick={() => setAutoBackupNotice(null)}
            className="ml-3 font-bold hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-[#0a192f]/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          
          {/* Left Brand & Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-[#030b1e] hover:bg-[#0353a4]/40 text-slate-300 border border-slate-700 focus:outline-none transition"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Persistent 3D Rotating Logo */}
            <div
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <RotatingLogo size="sm" showGlow={true} customLogoUrl={settings.customLogoUrl} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-wide text-white group-hover:text-[#d4af37] transition">
                    MUSA MOBILE
                  </span>
                  <span className="text-xs font-serif font-bold text-[#d4af37]">
                    موسیٰ ریپیئرنگ
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                  <span className="text-slate-400">Muzaffargarh</span>
                  <span>•</span>
                  <a href={SHOP_PERSONNEL.mohsin.callUrl} className="hover:text-amber-400 text-amber-300 font-bold transition flex items-center gap-0.5">
                    <span>پروپرائیٹر:</span>
                    <span dir="ltr">{SHOP_PERSONNEL.mohsin.phone}</span>
                  </a>
                  <span>•</span>
                  <a href={SHOP_PERSONNEL.azhar.callUrl} className="hover:text-cyan-400 text-cyan-300 font-bold transition flex items-center gap-0.5">
                    <span>لیب انجینئر:</span>
                    <span dir="ltr">{SHOP_PERSONNEL.azhar.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Center Smart Auto Search Bar */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-4">
            <SmartCustomerAutoSearchBar
              customers={customers}
              jobs={jobs}
              onSelectResult={handleSelectSearchResult}
              placeholder="🔍 Smart Auto Search: نام کے 2-3 حروف، فون، یا IMEI لکھیں..."
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Smart Repair Alarm Quick Header Button */}

            {/* Quick "New Repair" Button */}
            <button
              onClick={() => setCurrentView('newRepair')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0353a4] to-[#0466c8] hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs shadow-md border border-blue-400/30 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">New Repair</span>
            </button>

            {/* Language Urdu / English Switch */}
            <button
              onClick={handleToggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-[#030b1e] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-[#d4af37] flex items-center gap-1 transition"
              title="Switch Urdu (RTL) / English"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'English' : 'اردو'}</span>
            </button>

            {/* 6 Themes Switcher */}
            <button
              onClick={() => setCurrentView('themes')}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                currentView === 'themes'
                  ? 'bg-yellow-500 text-black border-yellow-400'
                  : 'bg-[#030b1e] hover:bg-slate-800 border-slate-700 text-yellow-300'
              }`}
              title="6 Professional Themes (پریمیئم تھیمز)"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">تھیمز (Themes)</span>
            </button>

            {/* Lock / Logout System */}
            <button
              onClick={() => {
                logoutUser();
                setIsAuth(false);
              }}
              className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-300 transition"
              title="سسٹم لاک کریں / Lock & Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Live Time */}
            <div className="hidden xl:flex flex-col text-right pl-2 border-l border-slate-800 font-mono text-[11px] text-[#d4af37] font-bold">
              <span>{currentTime}</span>
            </div>

          </div>

        </div>

        {/* Continuous Animated Scrolling Marquee Sub-Bar */}
        <div className="bg-[#030b1e] border-t border-slate-800/80 py-1 px-4 overflow-hidden text-[11px] shadow-inner hidden md:block">
          <div className="animate-continuous-marquee text-slate-300 font-medium">
            <span className="text-[#d4af37] font-bold">★ MUSA MOBILE REPAIRING CENTER ★</span>{' '}
            موسی موبائل ریپیئرنگ سنٹر — واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی | رابطہ نمبرز: پروپرائیٹر میاں محمد محسن قریشی (03006861765) | چیف لیب انجینئر میاں اظہر قریشی (03216861765) | 20 سالہ قابلِ اعتماد سروس، معیاری اسپیئر پارٹس و جدید ترین لیب!
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT: SIDEBAR + CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`bg-[#0a192f]/95 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-20 overflow-y-auto ${
            sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0'
          }`}
        >
          <div className="p-4 space-y-5 w-64">
            
            {/* Core Operations */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Core Operations
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => navigateToView('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'dashboard'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#d4af37]" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => navigateToView('newRepair')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'newRepair'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>New Mobile Receiving</span>
                </button>

                <button
                  onClick={() => navigateToView('jobCards')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'jobCards'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <IdCard className="w-4 h-4 text-cyan-400" />
                  <span>Repair Job Cards</span>
                </button>

                <button
                  onClick={() => navigateToView('udhar')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'udhar'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Customer Udhar / کھاتہ بقایا جات</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                    Ledger
                  </span>
                </button>

                <button
                  onClick={() => navigateToView('reminders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'reminders'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Smart Reminders & Alarms</span>
                  </div>
                  {activeRemindersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold">
                      {activeRemindersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigateToView('repairReports')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'repairReports'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                  <span>REPAIR REPORT & PDF PRINT</span>
                </button>
              </nav>
            </div>

            {/* Customers */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Customers & Accounts
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => navigateToView('customers')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'customers'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Customer Directory</span>
                </button>

                <button
                  onClick={() => navigateToView('customerPayments')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'customerPayments'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-teal-400" />
                  <span>Payments & Ledger</span>
                </button>
              </nav>
            </div>

            {/* Inventory & Parts */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Parts & Inventory
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => navigateToView('inventory')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'inventory'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Boxes className="w-4 h-4 text-yellow-400" />
                  <span>Parts Stock & Inventory</span>
                </button>

                <button
                  onClick={() => navigateToView('partsPurchase')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'partsPurchase'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-orange-400" />
                  <span>Parts Purchase (Inward)</span>
                </button>

                <button
                  onClick={() => navigateToView('partsSales')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'partsSales'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-lime-400" />
                  <span>Walk-In Parts Sales (POS)</span>
                </button>
              </nav>
            </div>

            {/* Financials & Reports */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Finance & Reports
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => navigateToView('expenses')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'expenses'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-rose-400" />
                  <span>Shop Expenses</span>
                </button>

                <button
                  onClick={() => navigateToView('reports')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'reports'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <span>Daily / Monthly Reports</span>
                </button>

                <button
                  onClick={() => navigateToView('warranty')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'warranty'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Warranty Tracker</span>
                </button>
              </nav>
            </div>

            {/* Staff Management */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Staff & Lab Personnel
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => navigateToView('employees')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'employees'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Employees & Attendance</span>
                </button>
              </nav>
            </div>

            {/* Data Backup & Security */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center justify-between">
                <span>Backup & Security</span>
                <span className="text-[#d4af37] font-serif text-[11px]">بیک اپ و ڈیٹا سیکیورٹی</span>
              </p>
              <nav className="space-y-1">

                <button
                  onClick={() => navigateToView('localBackup')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'localBackup'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-[#d4af37]" />
                    <span>Local Backup & Restore</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] font-bold">
                    ZIP/JSON
                  </span>
                </button>

                <button
                  onClick={() => navigateToView('gdriveSync')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'gdriveSync'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Cloud className="w-4 h-4 text-amber-500" />
                  <span>Google Drive Cloud Sync</span>
                </button>

                <button
                  onClick={() => navigateToView('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'settings'
                      ? 'bg-[#0353a4]/50 text-white border-l-4 border-[#d4af37]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Shop & Brand Settings</span>
                </button>

                <button
                  onClick={() => navigateToView('themes')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentView === 'themes'
                      ? 'bg-yellow-500 text-black font-bold'
                      : 'text-yellow-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-yellow-400" />
                    <span>6 Themes Customizer (ایپ تھیمز)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
                    6 Styles
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    logoutUser();
                    setIsAuth(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-950/80 border border-red-500/30 transition mt-2"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>سسٹم لاک کریں / Lock & Logout</span>
                </button>
              </nav>
            </div>

            {/* Shop Personnel Card - Strict Authorized Contacts */}
            <div className="p-3 bg-[#030b1e] rounded-2xl border border-amber-500/30 text-[11px] space-y-1.5">
              <p className="text-yellow-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>مجاز عہدیداران / Authorized Personnel</span>
              </p>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-zinc-400 text-[10px]">پروپرائیٹر / Proprietor:</p>
                <p className="text-white font-bold">میاں محمد محسن قریشی</p>
                <p className="text-yellow-400 font-mono text-[10px]">0321-6861765</p>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-zinc-400 text-[10px]">لیب انجینئر / Lab Engineer:</p>
                <p className="text-white font-bold">میاں اظہر قریشی</p>
                <p className="text-cyan-400 font-mono text-[10px]">0300-6861765</p>
              </div>
            </div>

          </div>
        </aside>

        {/* MOBILE BACKDROP OVERLAY TO AUTO-CLOSE MENU DRAWER WHEN TAPPING OUTSIDE */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-10 lg:hidden backdrop-blur-xs transition-opacity duration-300"
            aria-hidden="true"
          />
        )}

        {/* MAIN ROUTE CONTENT VIEW */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentView === 'dashboard' && (
            <DashboardView
              customers={customers}
              jobs={jobs}
              inventory={inventory}
              expenses={expenses}
              settings={settings}
              onNavigate={(view) => setCurrentView(view)}
              onOpenReceipt={(job) => setActiveReceiptJob(job)}
              onQuickBackup={handleQuickBackupDownload}
            />
          )}

          {currentView === 'newRepair' && (
            <NewRepairView
              customers={customers}
              jobs={jobs}
              settings={settings}
              onJobCreated={(job) => {
                loadDatabase();
                setActiveReceiptJob(job);
                setCurrentView('jobCards');
              }}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'jobCards' && (
            <JobCardsView
              jobs={jobs}
              inventory={inventory}
              settings={settings}
              onRefresh={loadDatabase}
              onOpenReceipt={(job) => setActiveReceiptJob(job)}
            />
          )}

          {currentView === 'customers' && (
            <CustomerView
              customers={customers}
              jobs={jobs}
              onRefresh={loadDatabase}
              onOpenReceipt={(job) => setActiveReceiptJob(job)}
              onNewRepairForCustomer={(c) => {
                setCurrentView('newRepair');
              }}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onRefresh={loadDatabase}
            />
          )}

          {currentView === 'partsPurchase' && (
            <PurchasesAndSalesView
              mode="purchase"
              inventory={inventory}
              purchases={purchases}
              sales={sales}
              onRefresh={loadDatabase}
            />
          )}

          {currentView === 'partsSales' && (
            <PurchasesAndSalesView
              mode="sale"
              inventory={inventory}
              purchases={purchases}
              sales={sales}
              onRefresh={loadDatabase}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              onRefresh={loadDatabase}
            />
          )}

          {currentView === 'customerPayments' && (
            <CustomerPaymentsView
              jobs={jobs}
              payments={payments}
              onRefresh={loadDatabase}
              onOpenReceipt={(job) => setActiveReceiptJob(job)}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              jobs={jobs}
              expenses={expenses}
              sales={sales}
              settings={settings}
            />
          )}

          {currentView === 'warranty' && (
            <WarrantyView
              jobs={jobs}
              onOpenReceipt={(job) => setActiveReceiptJob(job)}
            />
          )}

          {currentView === 'employees' && (
            <EmployeesView
              employees={employees}
              attendance={attendance}
              jobs={jobs}
              onRefresh={loadDatabase}
            />
          )}

          {currentView === 'localBackup' && (
            <LocalBackupView
              settings={settings}
              onRefreshAllData={loadDatabase}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}

          {currentView === 'gdriveSync' && (
            <GoogleDriveBackupView
              settings={settings}
              onRefreshAllData={loadDatabase}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}

          {currentView === 'reminders' && (
            <RemindersView
              jobs={jobs}
              onRefreshJobs={loadDatabase}
            />
          )}

          {currentView === 'repairReports' && (
            <RepairReportsView
              jobs={jobs}
              settings={settings}
              onOpenReceipt={(job) => setActiveReceiptJob(job)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsSaved={(newSettings) => setSettings(newSettings)}
            />
          )}

          {currentView === 'udhar' && (
            <CustomerUdharView
              jobCards={jobs}
              onUpdateJobCard={async (updatedJob) => {
                await putRecord('job_cards', updatedJob);
                await loadDatabase();
              }}
            />
          )}

          {currentView === 'themes' && (
            <ThemeSettingsView
              currentTheme={appTheme}
              onThemeSelect={handleSelectTheme}
            />
          )}
        </main>

      </div>

      {/* PROFESSIONAL APPLICATION FOOTER WITH 3 CONTACT NUMBERS & DEDICATION */}
      <footer className="bg-[#030b1e] border-t border-slate-800 py-3.5 px-4 text-xs z-10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          
          {/* Shop Name & Exact Calligraphic Dedication */}
          <div className="space-y-1">
            <p className="text-[#d4af37] font-serif text-sm font-bold" dir="rtl">
              "یہ ایپلیکیشن موسی موبائل ریپیئرنگ سنٹر کی جانب سے استاد اظہر قریشی کی اپنی کاوش سے تیار کی گئی ہے۔"
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[11px] text-slate-400">
              <span className="text-white font-semibold">موسیٰ موبائل ریپیئرنگ سینٹر</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">تیار کردہ: استاد اظہر قریشی</span>
              <span>•</span>
              <span>واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی</span>
            </div>
          </div>

          {/* Authorized Clickable Phone Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-yellow-400" />
              <span>براہ راست رابطہ:</span>
            </span>
            <a
              href={SHOP_PERSONNEL.mohsin.callUrl}
              className="px-3 py-1 rounded-xl bg-[#0a192f] hover:bg-[#0353a4] border border-amber-500/40 hover:border-amber-400 text-yellow-300 font-mono font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              <span>پروپرائیٹر:</span>
              <span dir="ltr">{SHOP_PERSONNEL.mohsin.phone}</span>
            </a>
            <a
              href={SHOP_PERSONNEL.azhar.callUrl}
              className="px-3 py-1 rounded-xl bg-[#0a192f] hover:bg-[#0353a4] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              <span>لیب انجینئر:</span>
              <span dir="ltr">{SHOP_PERSONNEL.azhar.phone}</span>
            </a>
          </div>

        </div>
      </footer>

      {/* PRINTABLE RECEIPT MODAL */}
      <PrintReceiptModal
        job={activeReceiptJob}
        settings={settings}
        onClose={() => setActiveReceiptJob(null)}
      />

      {/* EMERGENCY SMART REPAIR ALARM MODAL */}
      <AlarmRingingModal
        activeAlarm={activeAlarm}
        onClose={() => setActiveAlarm(null)}
        onJobStatusChange={handleJobStatusFromAlarm}
      />

      {/* SMART CUSTOMER & DEVICE FULL RECORD MODAL */}
      <CustomerFullRecordModal
        isOpen={showFullRecordModal}
        onClose={() => setShowFullRecordModal(false)}
        customer={fullRecordCustomer}
        activeJob={fullRecordActiveJob}
        allJobsOfCustomer={fullRecordCustomerJobs}
        onOpenReceipt={(job) => {
          setShowFullRecordModal(false);
          setActiveReceiptJob(job);
        }}
        onNavigateToJobCards={(jobId) => {
          setShowFullRecordModal(false);
          setCurrentView('jobCards');
        }}
        onNavigateToNewRepair={(cust) => {
          setShowFullRecordModal(false);
          setCurrentView('newRepair');
        }}
        onNavigateToReminders={(job) => {
          setShowFullRecordModal(false);
          setCurrentView('reminders');
        }}
      />

    </div>
  );
}
