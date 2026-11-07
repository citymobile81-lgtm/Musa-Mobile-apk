import { AppThemeId } from '../types';

export interface ThemeConfig {
  id: AppThemeId;
  nameUrdu: string;
  nameEnglish: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  accentBorder: string;
  badgeStyle: string;
  previewGradient: string;
}

export const THEMES: Record<AppThemeId, ThemeConfig> = {
  black_gold: {
    id: 'black_gold',
    nameUrdu: 'پریمیئم بلیک اینڈ گولڈ',
    nameEnglish: 'Premium Black & Gold',
    description: 'شاہانہ سیاہ اور سنہری اسٹائل - پریمیم تاثر',
    primaryColor: '#eab308', // gold-500
    secondaryColor: '#ca8a04',
    bgColor: '#09090b',
    cardBg: '#18181b',
    textColor: '#fef08a',
    accentBorder: 'border-yellow-500/40',
    badgeStyle: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    previewGradient: 'from-zinc-950 via-zinc-900 to-amber-950'
  },
  royal_blue: {
    id: 'royal_blue',
    nameUrdu: 'رائل بلیو اینڈ وائٹ',
    nameEnglish: 'Royal Blue & White',
    description: 'شاہی نیلا اور چمکدار سفید - پروفیشنل انداز',
    primaryColor: '#2563eb', // blue-600
    secondaryColor: '#1d4ed8',
    bgColor: '#0b132b',
    cardBg: '#1c2541',
    textColor: '#bfdbfe',
    accentBorder: 'border-blue-500/40',
    badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    previewGradient: 'from-slate-950 via-blue-950 to-indigo-950'
  },
  gradient: {
    id: 'gradient',
    nameUrdu: 'ملٹی کلر گریڈینٹ',
    nameEnglish: 'Multi-Color Gradient',
    description: 'رنگین اور خوبصورت جدید گریڈینٹ',
    primaryColor: '#ec4899', // pink-500
    secondaryColor: '#8b5cf6',
    bgColor: '#0f0c29',
    cardBg: '#24243e',
    textColor: '#fbcfe8',
    accentBorder: 'border-pink-500/40',
    badgeStyle: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/50',
    previewGradient: 'from-purple-950 via-pink-950 to-rose-950'
  },
  dark_neon: {
    id: 'dark_neon',
    nameUrdu: 'ڈارک نیون سائبر',
    nameEnglish: 'Dark Neon Cyber',
    description: 'سائبر پنک نیون سائین اور گہرا اندھیرا',
    primaryColor: '#06b6d4', // cyan-500
    secondaryColor: '#0891b2',
    bgColor: '#020617',
    cardBg: '#0f172a',
    textColor: '#a5f3fc',
    accentBorder: 'border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    previewGradient: 'from-black via-slate-950 to-cyan-950'
  },
  green_luxury: {
    id: 'green_luxury',
    nameUrdu: 'گرین اینڈ بلیک لگژری',
    nameEnglish: 'Green & Black Luxury',
    description: 'زمردی سبز اور گہرا سیاہ لگژری انداز',
    primaryColor: '#10b981', // emerald-500
    secondaryColor: '#059669',
    bgColor: '#022c22',
    cardBg: '#064e3b',
    textColor: '#a7f3d0',
    accentBorder: 'border-emerald-500/40',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    previewGradient: 'from-zinc-950 via-emerald-950 to-teal-950'
  },
  premium_white: {
    id: 'premium_white',
    nameUrdu: 'پریمیئم وائٹ تھیم (Pure White)',
    nameEnglish: 'Theme 6 – Premium White Theme',
    description: 'مکمل سفید پس منظر، شاہانہ نیوی بلیو اور سنہری تفصیلات، جدید نرم شیڈوز اور پریمیم احساس',
    primaryColor: '#0353a4', // rich navy blue
    secondaryColor: '#d4af37', // metallic gold
    bgColor: '#f8fafc',
    cardBg: '#ffffff',
    textColor: '#0a192f',
    accentBorder: 'border-blue-200 shadow-md shadow-blue-500/10',
    badgeStyle: 'bg-blue-50 text-blue-900 border-blue-200',
    previewGradient: 'from-white via-slate-50 to-blue-50'
  }
};

const THEME_STORAGE_KEY = 'musa_active_app_theme';

export function getActiveThemeId(): AppThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppThemeId;
    if (saved && THEMES[saved]) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load theme preference', e);
  }
  return 'black_gold';
}

export function setActiveThemeId(themeId: AppThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    applyThemeToDOM(themeId);
  } catch (e) {
    console.error('Failed to save theme preference', e);
  }
}

export function applyThemeToDOM(themeId: AppThemeId): void {
  const root = document.documentElement;
  const theme = THEMES[themeId] || THEMES.black_gold;
  
  // Set data-theme attribute on both html and body
  root.setAttribute('data-theme', themeId);
  document.body.setAttribute('data-theme', themeId);
  document.body.className = `theme-${themeId}`;
  
  root.style.setProperty('--app-primary', theme.primaryColor);
  root.style.setProperty('--app-secondary', theme.secondaryColor);
  root.style.setProperty('--app-bg', theme.bgColor);
  root.style.setProperty('--app-card', theme.cardBg);
}
