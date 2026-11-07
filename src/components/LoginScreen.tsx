import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone,
  PhoneCall,
  MapPin,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { 
  verifyLogin, 
  generatePasswordRecoveryOTP, 
  verifyOTPAndResetPassword, 
  changePassword,
  saveRememberedCredentials,
  getRememberedCredentials,
  clearRememberedCredentials
} from '../services/auth';
import { SHOP_PERSONNEL } from '../data/shopContacts';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
  shopLogo?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, shopLogo }) => {
  const activeLogo = shopLogo || localStorage.getItem('musa_custom_official_logo') || null;
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved credentials on mount if available
  React.useEffect(() => {
    const creds = getRememberedCredentials();
    if (creds && creds.username) {
      setUsername(creds.username);
      setPassword(creds.password);
      setRememberMe(true);
    }
  }, []);

  // Recovery / Mode states
  const [mode, setMode] = useState<'login' | 'forgot' | 'change'>('login');
  
  // Forgot / OTP states
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtpDisplay, setGeneratedOtpDisplay] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // Change password states
  const [currentPass, setCurrentPass] = useState('');
  const [changeNewPass, setChangeNewPass] = useState('');
  const [changeSuccessMessage, setChangeSuccessMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await verifyLogin(username, password);
      if (result.success) {
        if (rememberMe) {
          saveRememberedCredentials(username, password);
        } else {
          clearRememberedCredentials();
        }
        onLoginSuccess(username);
      } else {
        setErrorMessage(result.message || 'Musa Mobile کی طرف سے اطلاع: آپ کا پاس ورڈ غلط ہے، دوبارہ کوشش کریں۔');
      }
    } catch {
      setErrorMessage('لاگ ان کی تصدیق کے دوران خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = () => {
    setErrorMessage('');
    setOtpSuccessMessage('');
    const res = generatePasswordRecoveryOTP();
    if (res && res.otp) {
      setGeneratedOtpDisplay(res.otp);
      setOtpSuccessMessage(`سیکورٹی کوڈ (OTP) تیار کر لیا گیا ہے: ${res.otp}`);
    } else {
      setErrorMessage('صارف کا نام درست نہیں ہے۔');
    }
  };

  const handleResetWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 4) {
      setErrorMessage('نیا پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('پاس ورڈ کی تصدیق مماثل نہیں ہے۔');
      return;
    }

    const res = await verifyOTPAndResetPassword(otpCode, newPassword);
    if (res.success) {
      setOtpSuccessMessage(res.message);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setOtpCode('');
        setGeneratedOtpDisplay(null);
      }, 1500);
    } else {
      setErrorMessage(res.message || 'OTP کوڈ درست نہیں ہے۔');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setChangeSuccessMessage('');

    if (changeNewPass.length < 4) {
      setErrorMessage('نیا پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔');
      return;
    }

    const res = await changePassword(currentPass, changeNewPass);
    if (res.success) {
      setChangeSuccessMessage(res.message);
      setTimeout(() => {
        setMode('login');
        setCurrentPass('');
        setChangeNewPass('');
      }, 1500);
    } else {
      setErrorMessage(res.message || 'موجودہ پاس ورڈ غلط ہے۔');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 flex flex-col items-center justify-center p-4 text-white font-sans selection:bg-amber-500 selection:text-black">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-40"></div>

      {/* Main Container Card */}
      <div className="relative w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center">
        
        {/* Animated Gold Ring with 360 Rotating Shop Logo */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-600 opacity-60 blur-sm animate-pulse"></div>
          <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-yellow-600 via-amber-400 to-yellow-200 shadow-xl shadow-yellow-500/20">
            <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center border-2 border-yellow-400/80">
              {activeLogo ? (
                <img 
                  src={activeLogo} 
                  alt="Musa Mobile Logo" 
                  className="w-full h-full object-cover animate-[spin_12s_linear_infinite]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-black flex flex-col items-center justify-center text-center p-2 animate-[spin_16s_linear_infinite]">
                  <Smartphone className="w-8 h-8 text-yellow-400 mb-0.5" />
                  <span className="text-[10px] font-black text-yellow-300 leading-tight">MUSA</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Brand Titles */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500">
            MUSA MOBILE
          </h1>
          <p className="text-base sm:text-lg font-bold text-yellow-400/95 tracking-wide mt-0.5" dir="rtl">
            موسی موبائل ریپیئرنگ سنٹر
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] text-yellow-200">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
            <span>پروفیشنل موبائل لیب سسٹم</span>
          </div>
        </div>

        {/* Error / Feedback Message Box */}
        {errorMessage && (
          <div className="w-full mb-5 p-3.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-shake text-right" dir="rtl">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback Box */}
        {(otpSuccessMessage || changeSuccessMessage) && (
          <div className="w-full mb-5 p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5 text-right" dir="rtl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{otpSuccessMessage || changeSuccessMessage}</span>
          </div>
        )}

        {/* 1. LOGIN MODE FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 text-right" dir="rtl">
                صارف کا نام / User ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/70" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 focus:border-yellow-400 rounded-xl text-white text-sm outline-none transition focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 text-right" dir="rtl">
                پاس ورڈ / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-700/80 focus:border-yellow-400 rounded-xl text-white text-sm outline-none transition focus:ring-2 focus:ring-yellow-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-400 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / Save Password Checkbox */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border border-zinc-700 text-yellow-500 focus:ring-yellow-400 cursor-pointer accent-amber-500"
                />
                <span className="text-zinc-200 font-medium">Remember Me / Save Password</span>
              </label>
              <span className="text-[10px] text-amber-400 font-serif" dir="rtl">
                پاس ورڈ محفوظ رکھیں
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg shadow-yellow-500/25 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>لاگ ان تصدیق ہو رہی ہے...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>لاگ ان کریں / LOGIN</span>
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('forgot');
                }}
                className="hover:text-yellow-400 transition flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Forgot Password?</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('change');
                }}
                className="hover:text-yellow-400 transition flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. FORGOT PASSWORD / OTP MODE */}
        {mode === 'forgot' && (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-yellow-300">OTP Password Recovery</h3>
              <button
                onClick={() => {
                  setErrorMessage('');
                  setMode('login');
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                واپس لاگ ان
              </button>
            </div>

            {!generatedOtpDisplay ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300 text-right leading-relaxed" dir="rtl">
                  پاس ورڈ ری سیٹ کرنے کے لیے اپنا یوزر نیم درج کریں اور "Generate OTP" دبائیں:
                </p>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-sm"
                />
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-xs transition"
                >
                  Generate Recovery OTP
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetWithOTP} className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <span className="text-xs text-zinc-300 block mb-1">آپ کا ون ٹائم پاس ورڈ (OTP) کوڈ:</span>
                  <span className="text-2xl font-mono font-black text-yellow-300 tracking-widest">{generatedOtpDisplay}</span>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 text-right" dir="rtl">OTP کوڈ درج کریں:</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-center font-mono text-base tracking-widest text-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 text-right" dir="rtl">نیا پاس ورڈ:</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="کم از کم 4 حروف"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 text-right" dir="rtl">نئے پاس ورڈ کی تصدیق:</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="دوبارہ لکھیں"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition mt-2"
                >
                  پاس ورڈ محفوظ کریں
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. CHANGE PASSWORD MODE */}
        {mode === 'change' && (
          <form onSubmit={handleChangePasswordSubmit} className="w-full space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-yellow-300">Change Password</h3>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('login');
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                واپس لاگ ان
              </button>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1 text-right" dir="rtl">موجودہ پاس ورڈ:</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1 text-right" dir="rtl">نیا پاس ورڈ:</label>
              <input
                type="password"
                required
                value={changeNewPass}
                onChange={(e) => setChangeNewPass(e.target.value)}
                placeholder="کم از کم 4 حروف"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-xs transition mt-2"
            >
              پاس ورڈ تبدیل کریں
            </button>
          </form>
        )}

        {/* Strict Authorized Personnel Info Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 w-full text-center space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
            <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
            <span>Near Water Plant, Opposite Quba Optical, Muzaffargarh</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[11px] text-yellow-400/90 font-mono">
            <span className="flex items-center gap-1"><PhoneCall className="w-2.5 h-2.5" /> <span dir="ltr">{SHOP_PERSONNEL.mohsin.phone}</span> ({SHOP_PERSONNEL.mohsin.nameUrdu})</span>
            <span>•</span>
            <span className="flex items-center gap-1"><PhoneCall className="w-2.5 h-2.5" /> <span dir="ltr">{SHOP_PERSONNEL.azhar.phone}</span> ({SHOP_PERSONNEL.azhar.nameUrdu})</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium pt-1">
            {SHOP_PERSONNEL.mohsin.nameEn} (Proprietor) & {SHOP_PERSONNEL.azhar.nameEn} (Chief Lab Engineer)
          </p>
        </div>

      </div>
    </div>
  );
};
