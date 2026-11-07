import React, { useState } from 'react';
import { ShopSettings } from '../types';
import { saveSettings, logActivity } from '../services/db';
import { RotatingLogo } from '../components/RotatingLogo';
import { LogoManagementSection } from '../components/LogoManagementSection';
import { UserManagementSection } from '../components/UserManagementSection';
import {
  Sliders,
  Store,
  Phone,
  MapPin,
  Smartphone,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Upload,
  Image,
  Users,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface SettingsViewProps {
  settings: ShopSettings;
  onSettingsSaved: (newSettings: ShopSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsSaved,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopUrdu, setShopUrdu] = useState(settings.shopUrdu);
  const [proprietor, setProprietor] = useState(settings.proprietor || 'میاں محمد محسن قریشی');
  const [labEngineer, setLabEngineer] = useState(settings.labEngineer || 'میاں اظہر قریشی');
  const [address, setAddress] = useState(settings.address || 'Near Water Plant, Opposite Quba Optical, Muzaffargarh City, Pakistan');
  const [phone, setPhone] = useState(settings.phone || '03216861765');
  const [phone2, setPhone2] = useState(settings.phone2 || '03006861765');
  const [termsUrdu, setTermsUrdu] = useState(settings.termsUrdu || '');
  const [termsEn, setTermsEn] = useState(settings.termsEn || '');

  // Mobile Companies Manager
  const [companies, setCompanies] = useState<string[]>(settings.mobileCompanies || []);
  const [newCompanyInput, setNewCompanyInput] = useState('');

  const handleAddCompany = () => {
    const val = newCompanyInput.trim();
    if (val && !companies.includes(val)) {
      setCompanies([...companies, val]);
      setNewCompanyInput('');
    }
  };

  const handleRemoveCompany = (c: string) => {
    setCompanies(companies.filter((item) => item !== c));
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeLogo =
      settings.customLogoUrl || localStorage.getItem('musa_custom_official_logo') || '';

    const updated: ShopSettings = {
      ...settings,
      shopName: shopName.trim(),
      shopUrdu: shopUrdu.trim(),
      proprietor: proprietor.trim(),
      labEngineer: labEngineer.trim(),
      address: address.trim(),
      phone: phone.trim(),
      phone2: phone2.trim(),
      termsUrdu: termsUrdu.trim(),
      termsEn: termsEn.trim(),
      mobileCompanies: companies,
      customLogoUrl: activeLogo,
    };

    await saveSettings(updated);
    await logActivity('UPDATE_SETTINGS', 'Updated shop branding and system settings');
    onSettingsSaved(updated);
    alert('Shop configurations and mobile companies updated successfully!');
  };

  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'logo' | 'general'>('all');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#d4af37]" />
            <span>Shop Configuration, Users & Branding</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ایڈمن و یوزرز، دکان کا لوگو، رسیدوں کی سیٹنگز اور موبائل برانڈز کا مکمل انتظام
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#030b1e] border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-amber-500/20 text-[#d4af37] border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Login (صارفین)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'logo'
                ? 'bg-amber-500/20 text-[#d4af37] border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Logo (لوگو)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-amber-500/20 text-[#d4af37] border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop Profile (دکان)</span>
          </button>
        </div>
      </div>

      {/* 1. User Management & Account Security Section */}
      {(activeTab === 'users' || activeTab === 'all') && (
        <UserManagementSection />
      )}

      {/* 2. Dedicated Comprehensive Logo Management Section */}
      {(activeTab === 'logo' || activeTab === 'all') && (
        <LogoManagementSection
          settings={settings}
          onLogoUpdated={(updated) => onSettingsSaved(updated)}
        />
      )}

      {(activeTab === 'general' || activeTab === 'all') && (
        <form onSubmit={handleSaveAllSettings} className="space-y-6">
        
        {/* Branding Profile */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2 border-b border-slate-800 pb-2">
            <Store className="w-4 h-4" />
            <span>1. Business Identity & Shop Personnel</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Business Name (English) *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-bold focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Business Name (Urdu) *
              </label>
              <input
                type="text"
                required
                value={shopUrdu}
                onChange={(e) => setShopUrdu(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-[#d4af37] font-serif font-bold text-sm focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Proprietor Name *
              </label>
              <input
                type="text"
                required
                value={proprietor}
                onChange={(e) => setProprietor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Chief Lab Engineer *
              </label>
              <input
                type="text"
                required
                value={labEngineer}
                onChange={(e) => setLabEngineer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Shop Contact 1 (پروپرائیٹر رابطہ) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Shop Contact 2 (لیب انجینئر رابطہ) *
              </label>
              <input
                type="text"
                required
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1 font-semibold">
                Shop Address (English / Urdu) *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            {/* Application Creator Dedication Banner */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-[#d4af37]/40 space-y-1">
              <p className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                <span>دستخط و تخلیقی اعزاز (Application Origin & Dedication)</span>
              </p>
              <p className="text-sm font-serif font-bold text-white" dir="rtl">
                "یہ ایپلیکیشن موسی موبائل ریپیئرنگ سنٹر کی جانب سے استاد اظہر قریشی کی اپنی کاوش سے تیار کی گئی ہے۔"
              </p>
              <p className="text-xs font-bold text-amber-400 mt-1" dir="rtl">
                تیار کردہ: استاد اظہر قریشی
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Companies Dropdown Manager */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2 border-b border-slate-800 pb-2">
            <Smartphone className="w-4 h-4" />
            <span>2. Mobile Brand Dropdown Options</span>
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add new brand (e.g. Nothing Phone, Asus ROG, Realme)..."
              value={newCompanyInput}
              onChange={(e) => setNewCompanyInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCompany}
              className="px-4 py-2 bg-[#0466c8] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {companies.map((c) => (
              <span
                key={c}
                className="px-3 py-1 rounded-full bg-[#030b1e] border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCompany(c)}
                  className="text-slate-400 hover:text-rose-400 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Receipt Terms & Conditions */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2 border-b border-slate-800 pb-2">
            <span>3. Receipt Terms & Conditions</span>
          </h3>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Urdu Terms (Print on Customer Invoice)
            </label>
            <textarea
              rows={2}
              value={termsUrdu}
              onChange={(e) => setTermsUrdu(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-serif focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              English Terms (Print on Customer Invoice)
            </label>
            <textarea
              rows={2}
              value={termsEn}
              onChange={(e) => setTermsEn(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration Settings</span>
          </button>
        </div>

      </form>
      )}
    </div>
  );
};
