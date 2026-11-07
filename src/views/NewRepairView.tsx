import React, { useState, useMemo } from 'react';
import { Customer, JobCard, ShopSettings, PhonePhoto, JobFaultItem } from '../types';
import { putRecord, logActivity } from '../services/db';
import { searchSmartCustomerRecords, cleanDigits, SmartSearchResult } from '../services/smartSearch';
import { MobileSecuritySection, MobileSecurityData } from '../components/MobileSecuritySection';
import { FaultLibrarySelector } from '../components/FaultLibrarySelector';
import { PhonePhotoCapture } from '../components/PhonePhotoCapture';
import { MobileColorSelector } from '../components/MobileColorSelector';
import { MobileAccessoriesSelector } from '../components/MobileAccessoriesSelector';
import { MobileModelSelector } from '../components/MobileModelSelector';
import { PHONE_BRANDS, getModelsForBrand, saveCustomModel } from '../services/modelsDatabase';
import {
  Smartphone,
  User,
  Phone,
  Calendar,
  DollarSign,
  Printer,
  CheckCircle,
  Lock,
  Camera,
  Search,
  Sparkles,
  AlertTriangle,
  History,
  Copy,
  Check,
  Plus,
} from 'lucide-react';

interface NewRepairViewProps {
  customers: Customer[];
  jobs: JobCard[];
  settings: ShopSettings;
  onJobCreated: (job: JobCard) => void;
  onCancel: () => void;
}

export const NewRepairView: React.FC<NewRepairViewProps> = ({
  customers,
  jobs,
  settings,
  onJobCreated,
  onCancel,
}) => {
  // Form State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);

  const [company, setCompany] = useState('Samsung');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');

  const [screenCond, setScreenCond] = useState('Good / No Visible Damage');
  const [bodyCond, setBodyCond] = useState('Normal Minor Scratches');
  const [accessories, setAccessories] = useState('Without SIM / Memory Card');

  // Mobile Security Details
  const [securityData, setSecurityData] = useState<MobileSecurityData>({
    securityType: 'No Lock',
    securityValue: '',
    securityNotes: '',
    securityConsent: true,
    securityWiped: false,
    patternVerified: false,
    patternDotsCount: 0,
    patternNodes: [],
  });

  const [photos, setPhotos] = useState<PhonePhoto[]>([]);

  // Complete Fault Library Selection
  const [selectedFaults, setSelectedFaults] = useState<JobFaultItem[]>([]);
  const [fault, setFault] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [technician, setTechnician] = useState(settings.labEngineer || 'استاد اظہر قریشی');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [receivingDate, setReceivingDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState(tomorrowStr);
  const [estimatedCost, setEstimatedCost] = useState<number>(1500);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [warrantyDays, setWarrantyDays] = useState<number>(7);

  // Model Selector & Custom Model State
  const [modelFilterQuery, setModelFilterQuery] = useState('');
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  const [newModelNameInput, setNewModelNameInput] = useState('');

  const selectedBrandId = useMemo(() => {
    const compLower = company.toLowerCase();
    const found = PHONE_BRANDS.find(b => compLower.includes(b.id) || b.name.toLowerCase().includes(compLower));
    return found ? found.id : 'other';
  }, [company]);

  const brandModels = useMemo(() => {
    return getModelsForBrand(selectedBrandId);
  }, [selectedBrandId]);

  const handleAddNewModel = (nameToAdd?: string) => {
    const target = (nameToAdd || newModelNameInput).trim();
    if (!target) return;
    saveCustomModel(selectedBrandId, target);
    setModel(target);
    setNewModelNameInput('');
    setShowNewModelModal(false);
  };

  // Smart Auto-Search System State
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [smartResults, setSmartResults] = useState<SmartSearchResult[]>([]);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<JobCard[]>([]);
  const [imeiPreviousJob, setImeiPreviousJob] = useState<JobCard | null>(null);

  // Run Smart Auto-Search across customers and devices
  const handleSmartSearchChange = (query: string) => {
    setSmartSearchQuery(query);
    if (query.trim().length >= 2) {
      const results = searchSmartCustomerRecords(query, customers, jobs);
      setSmartResults(results);
    } else {
      setSmartResults([]);
    }
  };

  const handleSelectSmartResult = (res: SmartSearchResult) => {
    setCustomerPhone(res.customerPhone);
    setCustomerName(res.customerName);
    setAltPhone(res.altPhone || '');
    setAddress(res.address || 'Muzaffargarh City');
    setSmartSearchQuery('');
    setSmartResults([]);
    setSuggestions([]);

    // Find all past jobs of this customer
    const pastJobs = jobs.filter(
      (j) =>
        (res.customerPhone && j.customerPhone === res.customerPhone) ||
        (res.customerId && j.customerId === res.customerId)
    );
    setSelectedCustomerHistory(pastJobs);

    // If result was a specific job, offer to pre-fill device model
    if (res.type === 'job') {
      if (res.company) setCompany(res.company);
      if (res.model) setModel(res.model);
      if (res.color) setColor(res.color);
      if (res.imei1) {
        setImei1(res.imei1);
        checkExistingImei(res.imei1);
      }
    }
  };

  // Helper when user types phone directly (starts from 2 digits)
  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      const matches = searchSmartCustomerRecords(trimmed, customers, jobs);
      setSmartResults(matches);
      // Also update standard suggestions
      const qDigits = cleanDigits(trimmed);
      setSuggestions(
        customers.filter(
          (c) =>
            cleanDigits(c.phone).includes(qDigits) ||
            c.name.toLowerCase().includes(trimmed.toLowerCase())
        )
      );
    } else {
      setSmartResults([]);
      setSuggestions([]);
    }
  };

  // Helper when user types name directly (starts from 2 letters)
  const handleNameChange = (val: string) => {
    setCustomerName(val);
    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      const matches = searchSmartCustomerRecords(trimmed, customers, jobs);
      setSmartResults(matches);
    } else {
      setSmartResults([]);
    }
  };

  // Check if IMEI already exists in database (alerts repeat repair / warranty)
  const checkExistingImei = (val: string) => {
    setImei1(val);
    const digits = cleanDigits(val);
    if (digits.length >= 4) {
      const existing = jobs.find(
        (j) =>
          (j.imei1 && cleanDigits(j.imei1).endsWith(digits)) ||
          (j.imei1 && cleanDigits(j.imei1) === digits) ||
          (j.imei2 && cleanDigits(j.imei2) === digits)
      );
      setImeiPreviousJob(existing || null);
    } else {
      setImeiPreviousJob(null);
    }
  };

  const handleSelectCustomer = (c: Customer) => {
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    setAltPhone(c.altPhone || '');
    setAddress(c.address || '');
    setSuggestions([]);
    setSmartResults([]);

    const pastJobs = jobs.filter((j) => j.customerPhone === c.phone || j.customerId === c.id);
    setSelectedCustomerHistory(pastJobs);
  };

  const handleReusePastDevice = (pastJob: JobCard) => {
    if (pastJob.company) setCompany(pastJob.company);
    if (pastJob.model) setModel(pastJob.model);
    if (pastJob.color) setColor(pastJob.color);
    if (pastJob.imei1) {
      setImei1(pastJob.imei1);
      checkExistingImei(pastJob.imei1);
    }
  };

  const calculatedBalance = Math.max(0, (estimatedCost || 0) - (advancePaid || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Compile comprehensive fault summary string
    const faultNames = selectedFaults.map((f) => f.nameUrdu);
    let finalFaultStr = '';
    if (faultNames.length > 0) {
      finalFaultStr = faultNames.join('، ');
      if (fault.trim()) {
        finalFaultStr += ` (${fault.trim()})`;
      }
    } else {
      finalFaultStr = fault.trim();
    }

    if (!customerPhone || !customerName || !company || !model || !finalFaultStr) {
      alert('Please fill customer, mobile model, and select at least one fault complaint.');
      return;
    }

    // 1. Customer Upsert (Prevents duplicates)
    let matchedCustomer = customers.find((c) => c.phone.trim() === customerPhone.trim());
    let customerId = matchedCustomer ? matchedCustomer.id : `CUST-${1000 + customers.length + 1}`;

    if (!matchedCustomer) {
      const newCustomer: Customer = {
        id: customerId,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        altPhone: altPhone.trim(),
        address: address.trim() || 'Muzaffargarh City',
        createdAt: new Date().toISOString(),
      };
      await putRecord('customers', newCustomer);
    }

    // 2. Generate Unique Job Card Number
    const nextJobNumber = `MMR-${1000 + jobs.length + 1}`;

    const newJob: JobCard = {
      jobId: nextJobNumber,
      customerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      altPhone: altPhone.trim(),
      company,
      model: model.trim(),
      imei1: imei1.trim(),
      imei2: imei2.trim(),
      color: color.trim(),
      screenCond,
      bodyCond,
      accessories: accessories.trim(),
      fault: finalFaultStr,
      selectedFaults: selectedFaults,
      diagnosis: diagnosis.trim(),
      technician,
      receivingDate: receivingDate || todayStr,
      deliveryDate,
      estimatedCost: Number(estimatedCost) || 0,
      advancePaid: Number(advancePaid) || 0,
      balance: calculatedBalance,
      status: 'Received',
      warrantyDays: Number(warrantyDays) || 7,
      partsUsed: [],
      // Security Details
      securityType: securityData.securityType,
      securityValue: securityData.securityValue,
      securityNotes: securityData.securityNotes,
      securityConsent: securityData.securityConsent,
      securityWiped: securityData.securityWiped,
      hasPatternLock: securityData.securityType === 'Pattern Lock',
      patternLockVerified: securityData.patternVerified,
      patternLockStatus: securityData.patternVerified
        ? 'Lock Verified in Presence (تصدیق شدہ)'
        : securityData.securityType,
      patternDotsCount: securityData.patternDotsCount,
      patternNodes: securityData.patternNodes,
      photos: photos,
    };

    await putRecord('job_cards', newJob);
    await logActivity('NEW_JOB_CARD', `Generated Job Card ${nextJobNumber} for ${customerName}`);

    onJobCreated(newJob);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#d4af37]" />
            <span>New Mobile Receiving & Job Card Token</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Musa Mobile Repairing Center intake form with auto customer match and print receipt
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Customer Details */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>1. Customer Registration & Smart Auto-Search</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              ⚡ نام کے صرف 2 حروف، فون کے 2-4 ہندسے یا IMEI لکھ کر کسٹمر منتخب کریں
            </span>
          </div>

          {/* Dedicated Smart Auto-Search Bar for New Repair */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={smartSearchQuery}
                onChange={(e) => handleSmartSearchChange(e.target.value)}
                placeholder="⚡ Smart Search: کسٹمر نام، فون نمبر (0300...) یا IMEI لکھیں..."
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#030b1e] border-2 border-slate-700 hover:border-slate-600 focus:border-[#d4af37] text-white text-xs font-medium placeholder-slate-400 focus:outline-none transition shadow-inner"
              />
              {smartSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSmartSearchQuery('');
                    setSmartResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Smart Auto Search Dropdown */}
            {smartResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-gradient-to-b from-[#0a192f] to-[#030b1e] border-2 border-[#d4af37]/80 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800">
                <div className="p-2 bg-[#030b1e] text-[10px] text-slate-400 font-bold flex items-center justify-between">
                  <span>مطابقت رکھنے والے کسٹمرز و موبائل فونز:</span>
                  <span className="text-[#d4af37] font-mono">{smartResults.length} پائے گئے</span>
                </div>
                {smartResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleSelectSmartResult(res)}
                    className="p-2.5 hover:bg-[#0353a4]/30 cursor-pointer flex items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{res.customerName}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">({res.customerPhone})</span>
                        {res.matchDetail && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                            {res.matchDetail}
                          </span>
                        )}
                      </div>
                      {res.type === 'job' && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          موبائل: <strong className="text-white">{res.company} {res.model}</strong>
                          {res.imei1 && ` • IMEI: ...${res.imei1.slice(-4)}`}
                          {res.status && ` • اسٹیٹس: ${res.status}`}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded bg-[#d4af37] text-slate-950 font-bold text-[10px] shrink-0">
                      منتخب کریں
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Fields: Phone, Name, Alt Phone, Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Phone */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Phone *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs font-mono focus:border-[#d4af37] focus:outline-none"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {suggestions.length > 0 && !smartResults.length && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0a192f] border border-slate-700 rounded-xl shadow-2xl z-20 max-h-40 overflow-y-auto text-xs">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectCustomer(s)}
                      className="p-2.5 hover:bg-[#0353a4]/40 cursor-pointer border-b border-slate-800 last:border-0"
                    >
                      <p className="font-bold text-white">
                        {s.name}{' '}
                        <span className="text-[#d4af37] font-mono">({s.phone})</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{s.address || 'Muzaffargarh'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mian Tariq"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alternate Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="03XXXXXXXXX"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs font-mono focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City / Address
              </label>
              <input
                type="text"
                placeholder="e.g. Quba Optical, Muzaffargarh"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          {/* Past Repaired Devices of this Customer (Requirement #7 & #10) */}
          {selectedCustomerHistory.length > 0 && (
            <div className="p-3 bg-[#030b1e] rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#d4af37] font-bold flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  <span>اس کسٹمر کے سابقہ ریکارڈ شدہ موبائلز ({selectedCustomerHistory.length}):</span>
                </span>
                <span className="text-slate-400">ماڈل خودکار طور پر فارم میں بھرنے کے لیے کلک کریں</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCustomerHistory.map((pj) => (
                  <button
                    key={pj.jobId}
                    type="button"
                    onClick={() => handleReusePastDevice(pj)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-[#0353a4]/50 border border-slate-700 hover:border-[#d4af37] text-left transition flex items-center gap-2 group cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-white text-[11px] group-hover:text-[#d4af37]">
                        {pj.company} {pj.model}
                      </p>
                      <p className="font-mono text-[9px] text-slate-400">
                        #{pj.jobId} • {pj.status} {pj.imei1 ? `• IMEI: ...${pj.imei1.slice(-4)}` : ''}
                      </p>
                    </div>
                    <Copy className="w-3 h-3 text-[#d4af37] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Section 2: Mobile Specifications */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>2. Mobile Specifications & Physical Checks</span>
            </h3>
          </div>

          {/* Dynamic Company & Model Selector with Search & Other Model */}
          <div className="space-y-4">
            <MobileModelSelector
              company={company}
              onCompanyChange={(newComp) => setCompany(newComp)}
              model={model}
              onModelChange={(newMod) => setModel(newMod)}
              extraCompanies={settings.mobileCompanies}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <MobileColorSelector
                  value={color}
                  onChange={(newColor) => setColor(newColor)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary IMEI 1 (Optional)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="15 Digit IMEI"
                  value={imei1}
                  onChange={(e) => checkExistingImei(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Repeat IMEI Alert Banner */}
          {imeiPreviousJob && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">
                  ⚠️ یہ موبائل فون پہلے موسیٰ لیب میں ریپیئر ہو چکا ہے!
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  سابقہ جاب کارڈ: <strong className="text-white">{imeiPreviousJob.jobId}</strong> ({imeiPreviousJob.company} {imeiPreviousJob.model}) • کسٹمر: {imeiPreviousJob.customerName} • وصولی تاریخ: {imeiPreviousJob.receivingDate} • موجودہ اسٹیٹس: <span className="font-bold text-white">{imeiPreviousJob.status}</span> • سابقہ نقص: {imeiPreviousJob.fault}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Screen & Display Condition
              </label>
              <select
                value={screenCond}
                onChange={(e) => setScreenCond(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              >
                <option value="Good / No Visible Damage">Good / No Visible Damage</option>
                <option value="Cracked Glass (Touch Working)">Cracked Glass (Touch Working)</option>
                <option value="Broken LCD / No Display">Broken LCD / No Display</option>
                <option value="Touch Ghost / Non-Responsive">Touch Ghost / Non-Responsive</option>
                <option value="Vertical Lines / Bleeding Display">Vertical Lines / Bleeding Display</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Body & Housing Condition
              </label>
              <select
                value={bodyCond}
                onChange={(e) => setBodyCond(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              >
                <option value="Normal Minor Scratches">Normal Minor Scratches</option>
                <option value="Heavy Scratches / Dented Frame">Heavy Scratches / Dented Frame</option>
                <option value="Bent Housing / Frame">Bent Housing / Frame</option>
                <option value="Back Glass Broken">Back Glass Broken</option>
                <option value="Water / Moisture Ingress Signs">Water / Moisture Ingress Signs</option>
              </select>
            </div>
          </div>

          {/* Dedicated Complete Mobile Accessories Selector */}
          <div className="pt-2">
            <MobileAccessoriesSelector
              value={accessories}
              onChange={(newAccessories) => setAccessories(newAccessories)}
            />
          </div>
        </div>

        {/* Section 3: Customer Mobile Security & Lock Code */}
        <MobileSecuritySection
          value={securityData}
          onChange={(updated) => setSecurityData(updated)}
        />

        {/* Section 4: Complete Mobile Fault Library & Diagnosis */}
        <FaultLibrarySelector
          selectedFaults={selectedFaults}
          onChange={(updated) => setSelectedFaults(updated)}
          onCostCalculated={(calcTotal) => setEstimatedCost(calcTotal)}
        />

        {/* Section 5: Mobile Phone Inspection Photos */}
        <PhonePhotoCapture
          photos={photos}
          onChange={(newPhotos) => setPhotos(newPhotos)}
        />

        {/* Section 6: Additional Fault Notes, Engineer Assignment & Charges */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>6. Additional Complaint Notes, Engineer Assignment & Financials</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Additional Fault Details / کسٹمر کی زبانی شکایت
              </label>
              <textarea
                rows={2}
                placeholder="لائبریری کے علاوہ مزید تفصیل مثلاً: گرنے کے بعد سکرین بند ہوئی، رات کو چارجنگ پر لگانے کے بعد آن نہیں ہوا..."
                value={fault}
                onChange={(e) => setFault(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Technician Initial Inspection / Diagnosis
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Short on VBUS line, Charging flex connector pins burnt, Requires PM660 replacement..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {/* Entry Date Calendar Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  تاریخ وصولی / Entry Date *
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReceivingDate(todayStr)}
                    className={`text-[9px] px-1.5 py-0.5 rounded transition ${
                      receivingDate === todayStr ? 'bg-yellow-500 text-black font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    آج
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceivingDate(yesterdayStr)}
                    className={`text-[9px] px-1.5 py-0.5 rounded transition ${
                      receivingDate === yesterdayStr ? 'bg-yellow-500 text-black font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    گزشتہ
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={receivingDate}
                onChange={(e) => setReceivingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تاریخ واپسی / Delivery Date *
              </label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                لیب انجینئر / Assigned Engineer *
              </label>
              <select
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              >
                <option value="میاں اظہر قریشی">میاں اظہر قریشی (Lab Engineer)</option>
                <option value="میاں محمد محسن قریشی">میاں محمد محسن قریشی (Proprietor)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Charges (PKR) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs font-mono font-bold focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Advance Payment (PKR)
              </label>
              <input
                type="number"
                min={0}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-emerald-400 text-xs font-mono font-bold focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          {/* Balance Preview */}
          <div className="p-3 bg-[#030b1e] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Remaining Balance Upon Delivery:</span>
            <span className="text-base font-black text-[#d4af37] font-mono">
              PKR {calculatedBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#0353a4] via-[#0466c8] to-blue-600 hover:opacity-90 text-white text-xs font-bold shadow-xl shadow-blue-500/20 border border-blue-400/40 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-[#d4af37]" />
            <span>Generate Job Card & Print Token Receipt</span>
          </button>
        </div>

      </form>

      {/* Add Custom Model Modal */}
      {showNewModelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-yellow-500/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-yellow-400" />
                <span>نیا ماڈل شامل کریں ({company})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModelModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1" dir="rtl">
                ماڈل کا نام / Model Name:
              </label>
              <input
                type="text"
                autoFocus
                value={newModelNameInput}
                onChange={(e) => setNewModelNameInput(e.target.value)}
                placeholder="e.g. Hot 40 Pro / S24 Ultra"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs focus:border-yellow-400 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewModelModal(false)}
                className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold"
              >
                منسوخ
              </button>
              <button
                type="button"
                onClick={() => handleAddNewModel()}
                className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-black transition"
              >
                محفوظ کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
