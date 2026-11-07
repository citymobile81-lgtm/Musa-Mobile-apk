import React, { useEffect, useState } from 'react';
import { Smartphone, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { SHOP_PERSONNEL } from '../data/shopContacts';

interface WelcomeScreenProps {
  onFinish: () => void;
  shopLogo?: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFinish, shopLogo }) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const activeLogo = shopLogo || localStorage.getItem('musa_custom_official_logo') || null;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 flex flex-col items-center justify-center p-6 text-white text-center selection:bg-amber-500 selection:text-black">
      {/* Background animated rings and glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-3xl animate-pulse pointer-events-none"></div>

      <div className="relative max-w-lg w-full flex flex-col items-center animate-fade-in space-y-6">
        
        {/* Animated Gold Ring Logo with 360 Spin */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-600 opacity-70 blur-md animate-pulse"></div>
          <div className="relative w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-200 shadow-2xl shadow-yellow-500/30">
            <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center border-4 border-yellow-400">
              {activeLogo ? (
                <img 
                  src={activeLogo} 
                  alt="Musa Mobile Official Logo" 
                  className="w-full h-full object-cover animate-[spin_8s_linear_infinite]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-600/30 to-black flex flex-col items-center justify-center p-3 animate-[spin_10s_linear_infinite]">
                  <Smartphone className="w-12 h-12 text-yellow-400 mb-1" />
                  <span className="text-xs font-black tracking-widest text-yellow-300">MUSA</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Messages (English & Urdu as specified) */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Authenticated System Access</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300">
            WELCOME TO MUSA MOBILE
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-yellow-300" dir="rtl">
            موسی موبائل ریپیئرنگ سنٹر میں خوش آمدید
          </p>

          <p className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wide pt-1 animate-bounce" dir="rtl">
            خوش آمدید میاں صاحب!
          </p>
        </div>

        {/* Authorized Persons Banner */}
        <div className="w-full p-4 bg-zinc-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-sm space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-black/40 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 block text-[10px]">پروپرائیٹر / Proprietor</span>
              <span className="font-bold text-yellow-300 text-sm">{SHOP_PERSONNEL.mohsin.nameUrdu}</span>
              <span dir="ltr" className="text-zinc-300 font-mono text-[11px] block mt-0.5">{SHOP_PERSONNEL.mohsin.phone}</span>
            </div>
            <div className="p-2.5 bg-black/40 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 block text-[10px]">لیب انجینئر / Lab Engineer</span>
              <span className="font-bold text-yellow-300 text-sm">{SHOP_PERSONNEL.azhar.nameUrdu}</span>
              <span dir="ltr" className="text-zinc-300 font-mono text-[11px] block mt-0.5">{SHOP_PERSONNEL.azhar.phone}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">
            Near Water Plant, Opposite Quba Optical, Muzaffargarh City
          </p>
        </div>

        {/* Countdown and Skip Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onFinish}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold rounded-xl shadow-lg shadow-yellow-500/20 flex items-center gap-2 text-sm transition"
          >
            <span>ڈیش بورڈ میں داخل ہوں / Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-400">
            خودکار منتقلی: {secondsLeft} سیکنڈ
          </span>
        </div>

      </div>
    </div>
  );
};
