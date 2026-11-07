import React, { useEffect, useState } from 'react';
import { RotatingLogo } from './RotatingLogo';

interface SplashScreenProps {
  onComplete: () => void;
  customLogoUrl?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, customLogoUrl }) => {
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Initializing Musa Database Engine...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Loading Customer Job Cards & Diagnostics Core...');
    }, 450);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Syncing Spare Parts & Inventory Records...');
    }, 950);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Welcome! Musa Mobile Repairing Center Ready.');
    }, 1500);

    const timer4 = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    const timer5 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020713] transition-opacity duration-700 ease-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Lighting */}
      <div className="absolute w-[500px] h-[500px] bg-[#0466c8]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] bg-[#d4af37]/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
        {/* 3D Rotating Logo */}
        <div className="mb-6 transform hover:scale-105 transition">
          <RotatingLogo size="xl" showGlow={true} customLogoUrl={customLogoUrl} />
        </div>

        {/* Brand Names & Dedication */}
        <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white uppercase mb-1">
          MUSA MOBILE REPAIRING CENTER
        </h1>
        <h2 className="text-xl md:text-2xl font-bold font-serif text-[#d4af37] mb-3 tracking-wide">
          موسی موبائل ریپیئرنگ سنٹر
        </h2>

        {/* Dedicated Urdu Calligraphy Card */}
        <div className="w-full bg-gradient-to-r from-[#0353a4]/30 via-[#0a192f] to-[#0353a4]/30 border border-[#d4af37]/40 rounded-2xl p-3.5 mb-4 shadow-lg backdrop-blur-md">
          <p className="font-serif text-sm md:text-base text-amber-200 leading-relaxed font-semibold">
            "یہ ایپلیکیشن موسی موبائل ریپیئرنگ سنٹر کی جانب سے استاد اظہر قریشی کی اپنی کاوش سے تیار کی گئی ہے۔"
          </p>
          <div className="mt-2 pt-1.5 border-t border-[#d4af37]/20 flex items-center justify-center gap-2">
            <span className="text-[11px] font-bold text-slate-300">تیار کردہ:</span>
            <span className="text-xs md:text-sm font-black font-serif text-[#d4af37] tracking-wider">
              استاد اظہر قریشی
            </span>
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-widest text-slate-300 font-semibold mb-4">
          واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی
        </p>

        {/* Clickable Authorized Contact Numbers in Splash */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-xs font-mono font-bold">
          <a
            href="tel:03216861765"
            className="px-3 py-1.5 rounded-xl bg-[#030b1e] border border-amber-500/50 text-amber-300 hover:border-amber-400 transition"
          >
            📞 پروپرائیٹر: 0321-6861765
          </a>
          <a
            href="tel:03006861765"
            className="px-3 py-1.5 rounded-xl bg-[#030b1e] border border-cyan-500/50 text-cyan-300 hover:border-cyan-400 transition"
          >
            📞 لیب انجینئر: 0300-6861765
          </a>
        </div>

        {/* Animated Marquee */}
        <div className="w-full overflow-hidden bg-[#0a192f]/90 border border-[#0353a4]/50 rounded-full py-1.5 px-4 mb-6 shadow-inner">
          <div className="whitespace-nowrap animate-pulse flex items-center justify-center space-x-4 text-xs font-medium text-slate-300">
            <span className="text-[#d4af37] font-bold">⚡ High-Tech Chip Level Mobile Lab</span>
            <span>•</span>
            <span className="text-white">پروپرائیٹر: میاں محمد محسن قریشی</span>
            <span>•</span>
            <span className="text-cyan-400">لیب انجینئر: میاں اظہر قریشی</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-72 bg-[#0a192f] rounded-full h-2.5 overflow-hidden border border-slate-700 p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#0353a4] via-[#d4af37] to-yellow-300 rounded-full transition-all duration-400 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-slate-400 mt-2.5 font-mono">{statusText}</p>

        {/* Quick Skip Button */}
        <button
          onClick={onComplete}
          className="mt-6 px-4 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-white transition"
        >
          Skip Intro →
        </button>
      </div>
    </div>
  );
};
