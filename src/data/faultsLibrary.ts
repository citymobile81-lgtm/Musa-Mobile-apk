export interface FaultCategory {
  id: string;
  code: string;
  titleUrdu: string;
  titleEn: string;
  iconName: string;
  badgeColor: string;
  faults: {
    id: string;
    urdu: string;
    en: string;
    defaultCost?: number;
  }[];
}

export const FAULT_CATEGORIES: FaultCategory[] = [
  {
    id: 'display',
    code: 'A',
    titleUrdu: 'ڈسپلے اور ٹچ اسکرین',
    titleEn: 'Display & Touch Screen',
    iconName: 'Smartphone',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    faults: [
      { id: 'disp_1', urdu: 'LCD خراب', en: 'Faulty LCD' },
      { id: 'disp_2', urdu: 'OLED خراب', en: 'Faulty OLED' },
      { id: 'disp_3', urdu: 'AMOLED خراب', en: 'Faulty AMOLED' },
      { id: 'disp_4', urdu: 'ڈسپلے ٹوٹا ہوا', en: 'Broken Display Glass / Panel' },
      { id: 'disp_5', urdu: 'ڈسپلے بلیک', en: 'Black Screen / No Display' },
      { id: 'disp_6', urdu: 'ڈسپلے وائٹ', en: 'White Screen of Death' },
      { id: 'disp_7', urdu: 'ڈسپلے پر لائنیں', en: 'Vertical / Horizontal Lines on Screen' },
      { id: 'disp_8', urdu: 'ڈسپلے فلکرنگ', en: 'Display Screen Flickering' },
      { id: 'disp_9', urdu: 'ڈسپلے لائٹ نہیں', en: 'No Backlight / Dim Display' },
      { id: 'disp_10', urdu: 'ٹچ کام نہیں کرتا', en: 'Touch Screen Unresponsive' },
      { id: 'disp_11', urdu: 'ٹچ آدھا کام کرتا ہے', en: 'Partial Touch Dead Zones' },
      { id: 'disp_12', urdu: 'گھوسٹ ٹچ', en: 'Ghost Touch / Self Touch' },
      { id: 'disp_13', urdu: 'ڈسپلے کنیکٹر خراب', en: 'Damaged FPC Display Connector' },
      { id: 'disp_14', urdu: 'ٹچ IC مسئلہ', en: 'Touch Controller IC Fault' },
    ],
  },
  {
    id: 'power_charging',
    code: 'B',
    titleUrdu: 'پاور اور چارجنگ',
    titleEn: 'Power & Charging',
    iconName: 'Zap',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    faults: [
      { id: 'pwr_1', urdu: 'موبائل آن نہیں ہوتا', en: 'Phone Not Turning On' },
      { id: 'pwr_2', urdu: 'موبائل آف ہوتا ہے', en: 'Auto Power Off / Shuts Down' },
      { id: 'pwr_3', urdu: 'ڈیڈ موبائل', en: 'Totally Dead Device' },
      { id: 'pwr_4', urdu: 'سلو چارجنگ', en: 'Slow Charging Issue' },
      { id: 'pwr_5', urdu: 'چارجنگ نہیں ہوتی', en: 'Not Charging At All' },
      { id: 'pwr_6', urdu: 'فاسٹ چارجنگ مسئلہ', en: 'Fast / Quick Charging Failure' },
      { id: 'pwr_7', urdu: 'چارجنگ پن خراب', en: 'Damaged Charging Pin' },
      { id: 'pwr_8', urdu: 'USB پورٹ خراب', en: 'Damaged Type-C / USB Port' },
      { id: 'pwr_9', urdu: 'پاور بٹن خراب', en: 'Faulty / Stuck Power Button' },
      { id: 'pwr_10', urdu: 'موبائل بار بار ری اسٹارٹ', en: 'Constant Auto Restart' },
      { id: 'pwr_11', urdu: 'کرنٹ شارٹ', en: 'Motherboard Current Leak / Short' },
      { id: 'pwr_12', urdu: 'پاور IC خراب', en: 'Damaged Power Management IC (PMIC)' },
    ],
  },
  {
    id: 'battery',
    code: 'C',
    titleUrdu: 'بیٹری اور پاور بیک اپ',
    titleEn: 'Battery & Backup',
    iconName: 'BatteryCharging',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    faults: [
      { id: 'bat_1', urdu: 'بیٹری جلد ختم ہوتی ہے', en: 'Rapid Battery Drain' },
      { id: 'bat_2', urdu: 'بیٹری چارج نہیں رکھتی', en: 'Battery Holds No Charge' },
      { id: 'bat_3', urdu: 'بیٹری پھولی ہوئی', en: 'Swollen / Bloated Battery' },
      { id: 'bat_4', urdu: 'بیٹری گرم ہوتی ہے', en: 'Battery Overheating' },
      { id: 'bat_5', urdu: 'بیٹری فیصد غلط', en: 'Erratic / Inaccurate Battery %' },
      { id: 'bat_6', urdu: 'بیٹری کنیکٹر خراب', en: 'Broken Battery Connector' },
      { id: 'bat_7', urdu: 'بیٹری ڈرین', en: 'Standby Battery Leakage' },
      { id: 'bat_8', urdu: 'بیٹری چارجنگ کٹ جاتی ہے', en: 'Charging Cuts Off Intermittently' },
    ],
  },
  {
    id: 'network_sim',
    code: 'D',
    titleUrdu: 'نیٹ ورک اور سم کارڈ',
    titleEn: 'Network & SIM Card',
    iconName: 'Radio',
    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    faults: [
      { id: 'net_1', urdu: 'نیٹ ورک نہیں آتا', en: 'No Service / Network Unavailable' },
      { id: 'net_2', urdu: 'سگنل کم ہیں', en: 'Weak Signal Strength' },
      { id: 'net_3', urdu: 'سم ریڈ نہیں ہوتی', en: 'SIM Card Not Detected' },
      { id: 'net_4', urdu: 'سم نہیں چلتی', en: 'SIM Not Working' },
      { id: 'net_5', urdu: 'ایک سم کام نہیں کرتی', en: 'SIM 1 Dead / Not Working' },
      { id: 'net_6', urdu: 'دونوں سم کام نہیں کرتیں', en: 'Dual SIM Dead / Not Working' },
      { id: 'net_7', urdu: 'IMEI مسئلہ', en: 'Null / Invalid IMEI' },
      { id: 'net_8', urdu: 'نیٹ ورک لاک', en: 'Carrier / Network Lock (CPID/Patch)' },
      { id: 'net_9', urdu: 'کال نہیں ملتی', en: 'Outgoing Call Failed' },
      { id: 'net_10', urdu: 'کال ڈراپ', en: 'Frequent Call Drops' },
      { id: 'net_11', urdu: 'موبائل ڈیٹا مسئلہ', en: 'Cellular Data Not Working' },
      { id: 'net_12', urdu: '4G/5G مسئلہ', en: '4G / 5G Latch Failure' },
      { id: 'net_13', urdu: 'اینٹینا خراب', en: 'Damaged Antenna / Cable' },
      { id: 'net_14', urdu: 'بیس بینڈ مسئلہ', en: 'Baseband Unknown / Corrupted' },
    ],
  },
  {
    id: 'software',
    code: 'E',
    titleUrdu: 'سافٹ ویئر اور سسٹم',
    titleEn: 'Software & Operating System',
    iconName: 'Terminal',
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    faults: [
      { id: 'sw_1', urdu: 'سافٹ ویئر خراب', en: 'Corrupted OS / Firmware' },
      { id: 'sw_2', urdu: 'موبائل ہینگ', en: 'Phone Freezing / Hanging' },
      { id: 'sw_3', urdu: 'موبائل سلو', en: 'Extremely Slow Performance' },
      { id: 'sw_4', urdu: 'لوگو پر رک جاتا ہے', en: 'Stuck on Boot Logo' },
      { id: 'sw_5', urdu: 'بوٹ لوپ', en: 'Infinite Boot Loop' },
      { id: 'sw_6', urdu: 'فلیشنگ کی ضرورت', en: 'Requires Full ROM Flashing' },
      { id: 'sw_7', urdu: 'FRP لاک', en: 'FRP / Google Account Lock' },
      { id: 'sw_8', urdu: 'ایپلیکیشن کریش', en: 'Apps Force Closing / Crashing' },
      { id: 'sw_9', urdu: 'سافٹ ویئر اپڈیٹ مسئلہ', en: 'OTA Update Failed / Brick' },
      { id: 'sw_10', urdu: 'فیکٹری ری سیٹ', en: 'Factory Data Reset Required' },
      { id: 'sw_11', urdu: 'ڈیٹا ریکوری', en: 'Dead Phone Data Recovery' },
      { id: 'sw_12', urdu: 'سسٹم ایرر', en: 'System UI / Core Crash Error' },
      { id: 'sw_13', urdu: 'وائرس یا میلویئر', en: 'Malware / Adware Infection' },
    ],
  },
  {
    id: 'audio_sound',
    code: 'F',
    titleUrdu: 'آڈیو، اسپیکر اور مائیک',
    titleEn: 'Audio, Speaker & Mic',
    iconName: 'Volume2',
    badgeColor: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
    faults: [
      { id: 'aud_1', urdu: 'ائیر پیس اسپیکر خراب', en: 'Faulty Earpiece Receiver' },
      { id: 'aud_2', urdu: 'لاؤڈ اسپیکر خراب', en: 'Faulty Loudspeaker' },
      { id: 'aud_3', urdu: 'رنگر خراب', en: 'Ringer / Buzzer Fault' },
      { id: 'aud_4', urdu: 'آواز کم', en: 'Low Audio Volume Output' },
      { id: 'aud_5', urdu: 'آواز پھٹی ہوئی', en: 'Distorted / Crackling Audio' },
      { id: 'aud_6', urdu: 'مائیک خراب', en: 'Primary Microphone Dead' },
      { id: 'aud_7', urdu: 'وائس ریکارڈنگ مسئلہ', en: 'Voice Note / Video Mic Issue' },
      { id: 'aud_8', urdu: 'ہیڈ فون جیک خراب', en: 'Damaged 3.5mm Headphone Jack' },
      { id: 'aud_9', urdu: 'بلوٹوتھ آڈیو مسئلہ', en: 'Bluetooth Headset Stutter / Mute' },
    ],
  },
  {
    id: 'camera',
    code: 'G',
    titleUrdu: 'کیمرہ اور فلیش لائٹ',
    titleEn: 'Camera & Flashlight',
    iconName: 'Camera',
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    faults: [
      { id: 'cam_1', urdu: 'فرنٹ کیمرہ خراب', en: 'Front Selfie Camera Dead' },
      { id: 'cam_2', urdu: 'بیک کیمرہ خراب', en: 'Rear Primary Camera Dead' },
      { id: 'cam_3', urdu: 'کیمرہ اوپن نہیں ہوتا', en: 'Camera App Fails to Open' },
      { id: 'cam_4', urdu: 'کیمرہ فوکس مسئلہ', en: 'Autofocus / OIS Failure' },
      { id: 'cam_5', urdu: 'کیمرہ بلر', en: 'Blurry / Foggy Lens Image' },
      { id: 'cam_6', urdu: 'کیمرہ گلاس ٹوٹا ہوا', en: 'Cracked Camera Lens Glass' },
      { id: 'cam_7', urdu: 'فلیش لائٹ خراب', en: 'Flash LED Not Working' },
      { id: 'cam_8', urdu: 'ویڈیو ریکارڈنگ مسئلہ', en: 'Video Recording Stutter / Failure' },
    ],
  },
  {
    id: 'wifi_connectivity',
    code: 'H',
    titleUrdu: 'وائی فائی، بلوٹوتھ اور جی پی ایس',
    titleEn: 'WiFi, Bluetooth & GPS',
    iconName: 'Wifi',
    badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    faults: [
      { id: 'wifi_1', urdu: 'وائی فائی آن نہیں ہوتا', en: 'WiFi Toggle Greyed Out / Won\'t Turn On' },
      { id: 'wifi_2', urdu: 'وائی فائی کنیکٹ نہیں ہوتا', en: 'WiFi Fails to Connect' },
      { id: 'wifi_3', urdu: 'وائی فائی سگنل کم', en: 'Weak WiFi Reception' },
      { id: 'wifi_4', urdu: 'بلوٹوتھ آن نہیں ہوتا', en: 'Bluetooth Toggle Disabled / Dead' },
      { id: 'wifi_5', urdu: 'بلوٹوتھ کنیکٹ نہیں ہوتا', en: 'Bluetooth Pairing Fails' },
      { id: 'wifi_6', urdu: 'ہاٹ اسپاٹ مسئلہ', en: 'Portable Hotspot Error' },
      { id: 'wifi_7', urdu: 'GPS مسئلہ', en: 'GPS Location Inaccurate / Dead' },
    ],
  },
  {
    id: 'motherboard_ic',
    code: 'I',
    titleUrdu: 'مدربورڈ اور آئی سی لیول',
    titleEn: 'Motherboard & Micro-Soldering IC',
    iconName: 'Cpu',
    badgeColor: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
    faults: [
      { id: 'mb_1', urdu: 'مدربورڈ خراب', en: 'Damaged Motherboard PCB' },
      { id: 'mb_2', urdu: 'CPU مسئلہ', en: 'Processor / SoC Desoldered or Faulty' },
      { id: 'mb_3', urdu: 'RAM مسئلہ', en: 'LPDDR RAM Failure' },
      { id: 'mb_4', urdu: 'ROM مسئلہ', en: 'Internal Storage ROM Corrupt' },
      { id: 'mb_5', urdu: 'eMMC مسئلہ', en: 'Faulty eMMC 5.1 Chip' },
      { id: 'mb_6', urdu: 'UFS مسئلہ', en: 'Faulty UFS 2.2 / 3.1 Storage Chip' },
      { id: 'mb_7', urdu: 'پاور IC خراب', en: 'PMIC / Sub-PMIC Blown' },
      { id: 'mb_8', urdu: 'چارجنگ IC خراب', en: 'Charging IC (OVP / BQ) Blown' },
      { id: 'mb_9', urdu: 'آڈیو IC خراب', en: 'Audio Codec IC Malfunction' },
      { id: 'mb_10', urdu: 'WiFi IC خراب', en: 'WiFi / BT Combo IC Failure' },
      { id: 'mb_11', urdu: 'بیس بینڈ IC خراب', en: 'Baseband Transceiver IC Fault' },
      { id: 'mb_12', urdu: 'شارٹ سرکٹ', en: 'Primary Line (VBAT/VDD) Short Circuit' },
      { id: 'mb_13', urdu: 'ٹریک ٹوٹا ہوا', en: 'Broken PCB Copper Track / Pad' },
      { id: 'mb_14', urdu: 'جمپر کی ضرورت', en: 'Micro-Jumper Wire Required' },
      { id: 'mb_15', urdu: 'سولڈرنگ مسئلہ', en: 'Cold Joint / Reballing Needed' },
      { id: 'mb_16', urdu: 'پانی لگنے سے خرابی', en: 'Severe Liquid / Water Corrosion' },
      { id: 'mb_17', urdu: 'زنگ لگنا', en: 'Component Oxidation & Rust' },
    ],
  },
  {
    id: 'sensors_buttons',
    code: 'J',
    titleUrdu: 'سینسرز اور فزیکل بٹنز',
    titleEn: 'Sensors & Hardware Buttons',
    iconName: 'Sliders',
    badgeColor: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300',
    faults: [
      { id: 'sens_1', urdu: 'فنگر پرنٹ خراب', en: 'Fingerprint Sensor Dead' },
      { id: 'sens_2', urdu: 'فیس ان لاک مسئلہ', en: 'Face Unlock / IR Sensor Issue' },
      { id: 'sens_3', urdu: 'پراکسیمیٹی سینسر خراب', en: 'Proximity Sensor Malfunction' },
      { id: 'sens_4', urdu: 'لائٹ سینسر خراب', en: 'Ambient Light Sensor Fault' },
      { id: 'sens_5', urdu: 'جائروسکوپ مسئلہ', en: 'Gyroscope / Accelerometer Failure' },
      { id: 'sens_6', urdu: 'پاور بٹن خراب', en: 'Hardware Power Key Click Dead' },
      { id: 'sens_7', urdu: 'والیوم بٹن خراب', en: 'Volume Up / Down Buttons Stuck' },
      { id: 'sens_8', urdu: 'ہوم بٹن خراب', en: 'Physical Home Button Dead' },
      { id: 'sens_9', urdu: 'وائبریشن موٹر خراب', en: 'Haptic / Vibration Motor Dead' },
      { id: 'sens_10', urdu: 'آٹو روٹیشن مسئلہ', en: 'Auto Screen Rotation Failure' },
    ],
  },
];

// Helper to retrieve saved custom technician faults from localStorage
const CUSTOM_FAULTS_STORAGE_KEY = 'musa_custom_faults_v1';

export interface CustomFaultItem {
  id: string;
  category: string;
  urdu: string;
  en: string;
  defaultCost?: number;
}

export const getCustomFaults = (): CustomFaultItem[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_FAULTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomFault = (fault: Omit<CustomFaultItem, 'id'>): CustomFaultItem => {
  const existing = getCustomFaults();
  const newItem: CustomFaultItem = {
    ...fault,
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(CUSTOM_FAULTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom fault:', err);
  }
  return newItem;
};
