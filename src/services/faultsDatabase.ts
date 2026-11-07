export interface RepairFaultItem {
  id: string;
  nameEnglish: string;
  nameUrdu: string;
  defaultPrice: number;
  category: 'screen' | 'power' | 'network' | 'board' | 'audio' | 'camera' | 'software' | 'body';
}

export const COMPREHENSIVE_FAULTS: RepairFaultItem[] = [
  { id: 'lcd_touch', nameEnglish: 'LCD Screen / Folder / Touch Replacement', nameUrdu: 'ایل سی ڈی اسکرین / فولڈر / ٹچ تبدیلی', defaultPrice: 3500, category: 'screen' },
  { id: 'glass_oca', nameEnglish: 'Glass Change / OCA Lamination', nameUrdu: 'گلاس چینج / او سی اے لیمینیشن', defaultPrice: 1800, category: 'screen' },
  { id: 'battery', nameEnglish: 'Battery Replacement (Original/High Capacity)', nameUrdu: 'بیٹری تبدیلی (اوریجنل)', defaultPrice: 2000, category: 'power' },
  { id: 'charging_port', nameEnglish: 'Charging Port / Base / Sub-Board / Type-C', nameUrdu: 'چارجنگ جیک / پورٹ / سب بورڈ تبدیلی', defaultPrice: 700, category: 'power' },
  { id: 'charging_ic', nameEnglish: 'Charging IC / U2 / Tristar / Fast Charging', nameUrdu: 'چارجنگ آئی سی / یو 2 ریپئر', defaultPrice: 2200, category: 'board' },
  { id: 'power_ic', nameEnglish: 'Power IC (PMIC) / Dead Shorting / Auto Restart', nameUrdu: 'پاور آئی سی / ڈیڈ شارٹنگ / ری سٹارٹ مسئلہ', defaultPrice: 2800, category: 'board' },
  { id: 'dead_recovery', nameEnglish: 'Dead Phone Shorting Removal (VPH/VDD/Lines)', nameUrdu: 'ڈیڈ موبائل شارٹنگ ریکوری و ٹریسنگ', defaultPrice: 3000, category: 'board' },
  { id: 'water_damage', nameEnglish: 'Water / Liquid Damage Treatment & Ultrasonic Cleaning', nameUrdu: 'پانی گرا ہوا فون واش و صفائی / الٹراسونک', defaultPrice: 1500, category: 'board' },
  { id: 'cpu_reballing', nameEnglish: 'CPU Reballing / Double Decker RAM Reball', nameUrdu: 'سی پی یو ری بالنگ / ڈبل ڈیکر', defaultPrice: 5500, category: 'board' },
  { id: 'emmc_ufs', nameEnglish: 'eMMC / UFS Memory IC / Storage Upgrade / Reball', nameUrdu: 'میموری آئی سی / ای ایم ایم سی ری بالنگ', defaultPrice: 4500, category: 'board' },
  { id: 'motherboard_trace', nameEnglish: 'Motherboard Trace Jumpers / Line Break Fix', nameUrdu: 'مدر بورڈ وائر جمپرنگ / ٹریس ریپئرنگ', defaultPrice: 1500, category: 'board' },
  { id: 'network_baseband', nameEnglish: 'Network IC / Baseband / No Service / Searching', nameUrdu: 'نیٹ ورک آئی سی / بیس بینڈ / سروس فالٹ', defaultPrice: 2500, category: 'network' },
  { id: 'sim_reader', nameEnglish: 'SIM Tray / Reader Connector Repair', nameUrdu: 'سم سلاٹ / ریڈر پن ریپئر', defaultPrice: 1000, category: 'network' },
  { id: 'wifi_bluetooth', nameEnglish: 'Wi-Fi / Bluetooth IC / Weak Range Repair', nameUrdu: 'وائی فائی / بلوٹوتھ آئی سی مسئلہ', defaultPrice: 2000, category: 'network' },
  { id: 'audio_ic', nameEnglish: 'Audio IC / Codec / Sound Problem', nameUrdu: 'آڈیو آئی سی / آواز کا مسئلہ', defaultPrice: 2200, category: 'audio' },
  { id: 'speaker_ringer', nameEnglish: 'Loudspeaker / Ringer / Buzzer Replacement', nameUrdu: 'رنگر / سپیکر تبدیلی', defaultPrice: 600, category: 'audio' },
  { id: 'ear_speaker', nameEnglish: 'Ear Speaker / Receiver / Low Volume Fix', nameUrdu: 'کان والا سپیکر / دھیمی آواز کا علاج', defaultPrice: 500, category: 'audio' },
  { id: 'mic_repair', nameEnglish: 'Microphone (Digital / Analog Mic) Repair', nameUrdu: 'مائیک تبدیلی (مائکروفون)', defaultPrice: 600, category: 'audio' },
  { id: 'camera_back', nameEnglish: 'Rear / Main Camera Replacement (Blur/Shaking)', nameUrdu: 'بیک کیمرہ تبدیلی / بلر یا شیکنگ حل', defaultPrice: 2200, category: 'camera' },
  { id: 'camera_front', nameEnglish: 'Front Selfie Camera Replacement', nameUrdu: 'فرنٹ سیلفی کیمرہ تبدیلی', defaultPrice: 1500, category: 'camera' },
  { id: 'camera_lens', nameEnglish: 'Camera Outer Glass Lens Replacement', nameUrdu: 'کیمرہ بیرونی شیشہ تبدیلی', defaultPrice: 500, category: 'camera' },
  { id: 'body_housing', nameEnglish: 'Full Body Housing / Middle Ring Frame Replacement', nameUrdu: 'مکمل ہاؤسنگ / فریم باڈی تبدیلی', defaultPrice: 2500, category: 'body' },
  { id: 'back_glass', nameEnglish: 'Back Glass / Battery Cover Replacement', nameUrdu: 'بیک کور / پچھلا شیشہ تبدیلی', defaultPrice: 1200, category: 'body' },
  { id: 'power_volume_flex', nameEnglish: 'Power / Volume Button Switch Flex Cable', nameUrdu: 'پاور و والیوم بٹن پتا تبدیلی', defaultPrice: 700, category: 'body' },
  { id: 'fingerprint_faceid', nameEnglish: 'Fingerprint Sensor / Face ID Cable Repair', nameUrdu: 'فنگر پرنٹ سنسر / فیس آئی ڈی مرمت', defaultPrice: 1800, category: 'body' },
  { id: 'vibrator_taptic', nameEnglish: 'Vibration Motor / Taptic Engine Replacement', nameUrdu: 'وائبریٹر موٹر تبدیلی', defaultPrice: 500, category: 'body' },
  { id: 'software_flash', nameEnglish: 'Software Flashing / Firmware Reinstall / Unbrick', nameUrdu: 'سافٹ ویئر فلیشنگ / ہینگ آن لوگو حل', defaultPrice: 1200, category: 'software' },
  { id: 'frp_google_lock', nameEnglish: 'FRP Bypass / Google Account Unlock', nameUrdu: 'گوگل اکاؤنٹ لاگ ان / ایف آر پی ان لاک', defaultPrice: 1500, category: 'software' },
  { id: 'country_network_lock', nameEnglish: 'Country Lock / Sim Network Unlock Pin', nameUrdu: 'کنٹری نیٹ ورک سم ان لاک', defaultPrice: 2000, category: 'software' },
  { id: 'general_diagnostic', nameEnglish: 'Complete Diagnostic / Motherboard Checking Fee', nameUrdu: 'مکمل چیکنگ فیس / فالٹ ڈائیگنوسٹک', defaultPrice: 500, category: 'board' }
];

export interface SelectedFaultState {
  faultId: string;
  name: string;
  price: number;
}
