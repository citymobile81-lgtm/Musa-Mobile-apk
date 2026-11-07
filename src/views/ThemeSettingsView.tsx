import React from 'react';
import { Palette, Check, Sparkles, Shield, Monitor } from 'lucide-react';
import { THEMES, ThemeConfig } from '../services/theme';
import { SHOP_PERSONNEL } from '../data/shopContacts';
import { AppThemeId } from '../types';

interface ThemeSettingsViewProps {
  currentTheme: AppThemeId;
  onThemeSelect: (themeId: AppThemeId) => void;
}

export const ThemeSettingsView: React.FC<ThemeSettingsViewProps> = ({
  currentTheme,
  onThemeSelect,
}) => {
  const themeList = Object.values(THEMES);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-6 rounded-2xl border border-yellow-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>ایپلیکیشن تھیم مینیجر / Theme Customizer</span>
            </div>
            <h2 className="text-2xl font-black text-white">6 خوبصورت پروفیشنل تھیمز (Themes)</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1" dir="rtl">
              اپنی مرضی کی تھیم منتخب کریں، تمام اسکرینز، ڈیش بورڈ، ہیڈر، کارڈز اور رسیدیں خود بخود منتخب کردہ تھیم میں تبدیل ہو جائیں گی۔
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-xl border border-zinc-700 text-xs text-zinc-300">
            <Monitor className="w-4 h-4 text-yellow-400" />
            <span>موبائل اور کمپیوٹر دونوں پر مستقل لاگو ہوگا</span>
          </div>
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themeList.map((theme: ThemeConfig, index: number) => {
          const isSelected = currentTheme === theme.id;
          const isWhiteTheme = theme.id === 'premium_white';

          return (
            <div
              key={theme.id}
              onClick={() => onThemeSelect(theme.id)}
              className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between p-5 ${
                isSelected
                  ? 'border-yellow-400 bg-zinc-900 shadow-xl shadow-yellow-500/20 scale-[1.02]'
                  : isWhiteTheme
                  ? 'border-blue-200/80 bg-zinc-900/60 hover:border-blue-400 hover:bg-zinc-900'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900'
              }`}
            >
              {/* Theme Number Tag */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-[10px] font-mono text-zinc-300">
                Theme {index + 1}
              </div>

              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-yellow-500 text-black text-[11px] font-black rounded-full flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>فعال / Active</span>
                </div>
              )}

              {/* Theme Preview Swatch */}
              <div className="mt-4">
                <div
                  className={`w-full h-24 rounded-xl bg-gradient-to-br ${theme.previewGradient} ${
                    isWhiteTheme ? 'border-2 border-blue-200 shadow-md' : 'border border-white/10'
                  } p-3 flex flex-col justify-between shadow-inner mb-4`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: theme.primaryColor }}
                    ></div>
                    <div
                      className={`text-[10px] font-mono tracking-wider uppercase font-bold ${
                        isWhiteTheme ? 'text-[#0a192f]' : 'text-white/70'
                      }`}
                    >
                      MUSA MOBILE
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-16 rounded-full ${
                        isWhiteTheme ? 'bg-blue-100 border border-blue-200' : 'bg-white/30'
                      }`}
                    ></div>
                    <div
                      className="h-2 w-8 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.secondaryColor }}
                    ></div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: theme.primaryColor }}
                  ></span>
                  <span>{theme.nameEnglish}</span>
                </h3>
                <h4 className="text-sm font-bold text-yellow-400 mt-0.5" dir="rtl">
                  {theme.nameUrdu}
                </h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed" dir="rtl">
                  {theme.description}
                </p>
              </div>

              {/* Button */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onThemeSelect(theme.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isSelected
                      ? 'bg-yellow-500 text-black'
                      : isWhiteTheme
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'منتخب شدہ تھیم (Active)' : 'یہ تھیم لگائیں (Activate)'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strict Authorized Personnel Info Note */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center text-xs text-zinc-400">
        <Shield className="w-4 h-4 text-yellow-500 inline-block mr-1.5" />
        <span>موسیٰ موبائل ریپیئرنگ سنٹر - مظفرگڑھ | پروپرائیٹر: {SHOP_PERSONNEL.mohsin.nameUrdu} (<span dir="ltr">{SHOP_PERSONNEL.mohsin.phone}</span>) | لیب انجینئر: {SHOP_PERSONNEL.azhar.nameUrdu} (<span dir="ltr">{SHOP_PERSONNEL.azhar.phone}</span>)</span>
      </div>
    </div>
  );
};
