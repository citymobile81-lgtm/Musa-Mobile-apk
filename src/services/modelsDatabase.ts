export interface PhoneBrand {
  id: string;
  name: string;
  urduName: string;
  popularModels: string[];
}

export const PHONE_BRANDS: PhoneBrand[] = [
  {
    id: 'samsung',
    name: 'Samsung',
    urduName: 'سام سنگ',
    popularModels: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
      'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21 FE', 'Galaxy S20 FE', 'Galaxy S20 Ultra',
      'Galaxy Z Fold 6', 'Galaxy Z Fold 5', 'Galaxy Z Fold 4', 'Galaxy Z Flip 6', 'Galaxy Z Flip 5', 'Galaxy Z Flip 4',
      'Galaxy Note 20 Ultra', 'Galaxy Note 10+', 'Galaxy Note 9', 'Galaxy Note 8',
      'Galaxy A55 5G', 'Galaxy A54 5G', 'Galaxy A53 5G', 'Galaxy A52s 5G', 'Galaxy A52', 'Galaxy A51',
      'Galaxy A35 5G', 'Galaxy A34 5G', 'Galaxy A33 5G', 'Galaxy A32', 'Galaxy A31', 'Galaxy A30s',
      'Galaxy A25 5G', 'Galaxy A24', 'Galaxy A23', 'Galaxy A22', 'Galaxy A21s', 'Galaxy A20s',
      'Galaxy A15', 'Galaxy A14', 'Galaxy A13', 'Galaxy A12', 'Galaxy A11', 'Galaxy A10s',
      'Galaxy A05s', 'Galaxy A05', 'Galaxy A04s', 'Galaxy A04', 'Galaxy A03s', 'Galaxy A02s',
      'Galaxy M54', 'Galaxy M34', 'Galaxy M14', 'Galaxy J7 Prime', 'Galaxy J7 Pro', 'Galaxy J5 Prime', 'Galaxy Grand Prime Plus'
    ]
  },
  {
    id: 'apple',
    name: 'Apple iPhone',
    urduName: 'ایپل آئی فون',
    popularModels: [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
      'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
      'iPhone 6s Plus', 'iPhone 6s', 'iPhone 6 Plus', 'iPhone 6',
      'iPhone SE (3rd Gen 2022)', 'iPhone SE (2nd Gen 2020)'
    ]
  },
  {
    id: 'vivo',
    name: 'Vivo',
    urduName: 'ویوو',
    popularModels: [
      'V30 Pro', 'V30', 'V30e', 'V29 5G', 'V29e 5G', 'V27 5G', 'V27e', 'V25 Pro', 'V25e', 'V23 5G', 'V23e', 'V21', 'V21e', 'V20', 'V20 SE', 'V19',
      'Y200 5G', 'Y200e', 'Y100 5G', 'Y36', 'Y35', 'Y27 4G', 'Y22', 'Y21t', 'Y21', 'Y20s', 'Y20', 'Y17s', 'Y16', 'Y15s', 'Y12s', 'Y11', 'Y03', 'Y02t', 'Y02',
      'Y91c', 'Y90', 'Y81', 'Y71', 'Y53',
      'X100 Pro', 'X100', 'X90 Pro', 'X80 Pro', 'X70 Pro', 'T2 Pro 5G', 'T2x 5G', 'T1 5G'
    ]
  },
  {
    id: 'oppo',
    name: 'Oppo',
    urduName: 'اوپو',
    popularModels: [
      'Reno 12 Pro 5G', 'Reno 12 5G', 'Reno 11 Pro 5G', 'Reno 11 5G', 'Reno 11 F 5G', 'Reno 10 Pro+ 5G', 'Reno 10 Pro 5G', 'Reno 8 Pro', 'Reno 8', 'Reno 7 Pro', 'Reno 6 5G', 'Reno 5', 'Reno 4', 'Reno 3 Pro',
      'A79 5G', 'A78 4G', 'A58', 'A38', 'A18', 'A77s', 'A77', 'A57', 'A17k', 'A17', 'A16e', 'A16', 'A54', 'A53', 'A15s', 'A15', 'A12', 'A31', 'A5s', 'A3s', 'A7',
      'F25 Pro 5G', 'F21 Pro 5G', 'F21 Pro', 'F19 Pro+', 'F19 Pro', 'F17 Pro', 'F11 Pro', 'F9', 'F7',
      'Find X7 Ultra', 'Find N3 Flip', 'Find X5 Pro'
    ]
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi / Poco',
    urduName: 'شیاومی / ریڈمی / پوکو',
    popularModels: [
      'Redmi Note 13 Pro+ 5G', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro+ 5G', 'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 12S',
      'Redmi Note 11 Pro+ 5G', 'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi Note 11S', 'Redmi Note 10 Pro', 'Redmi Note 10', 'Redmi Note 9 Pro', 'Redmi Note 9', 'Redmi Note 8 Pro', 'Redmi Note 8', 'Redmi Note 7',
      'Redmi 13C', 'Redmi 13', 'Redmi 12', 'Redmi 10C', 'Redmi 10A', 'Redmi 10', 'Redmi 9C', 'Redmi 9A', 'Redmi 9', 'Redmi A3', 'Redmi A2+', 'Redmi A1+',
      'Poco X6 Pro', 'Poco X6', 'Poco X5 Pro 5G', 'Poco M6 Pro', 'Poco M5', 'Poco M4 Pro', 'Poco C65', 'Poco C55', 'Poco F5', 'Poco F4 GT', 'Poco X3 Pro', 'Poco M3',
      'Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13T Pro', 'Xiaomi 13T', 'Xiaomi 12 Pro', 'Mi 11 Lite'
    ]
  },
  {
    id: 'realme',
    name: 'Realme',
    urduName: 'ریئل می',
    popularModels: [
      'Realme 12 Pro+ 5G', 'Realme 12+ 5G', 'Realme 12', 'Realme 11 Pro+ 5G', 'Realme 11 5G', 'Realme 11', 'Realme 10 Pro+', 'Realme 10',
      'Realme 9 Pro+', 'Realme 9', 'Realme 8 Pro', 'Realme 8', 'Realme 7 Pro', 'Realme 7', 'Realme 6 Pro', 'Realme 6', 'Realme 5 Pro', 'Realme 5',
      'Realme C67', 'Realme C65', 'Realme C55', 'Realme C53', 'Realme C51', 'Realme C35', 'Realme C33', 'Realme C30', 'Realme C25s', 'Realme C21', 'Realme C15', 'Realme C12', 'Realme C11', 'Realme C3', 'Realme C2',
      'Realme Note 50', 'Realme GT 5 Pro', 'Realme GT Neo 3', 'Realme Narzo 60', 'Realme Narzo 50'
    ]
  },
  {
    id: 'tecno',
    name: 'Tecno',
    urduName: 'ٹیکنو',
    popularModels: [
      'Spark 20 Pro+', 'Spark 20 Pro', 'Spark 20', 'Spark 20C', 'Spark 10 Pro', 'Spark 10C', 'Spark 10', 'Spark 9T', 'Spark 9 Pro', 'Spark 8C', 'Spark 8 Pro', 'Spark 7 Pro', 'Spark 6 Go', 'Spark 5 Pro',
      'Camon 30 Premier 5G', 'Camon 30 Pro 5G', 'Camon 30', 'Camon 20 Premier 5G', 'Camon 20 Pro 5G', 'Camon 20', 'Camon 19 Pro', 'Camon 18 Premier', 'Camon 18P', 'Camon 17 Pro',
      'Pova 6 Pro 5G', 'Pova 5 Pro 5G', 'Pova 4 Pro', 'Pova 3', 'Pova Neo 3', 'Pova Neo 2', 'Pova Neo',
      'Pop 8', 'Pop 7 Pro', 'Pop 7', 'Pop 6 Pro', 'Pop 5 LTE', 'Pop 4',
      'Phantom V Fold', 'Phantom V Flip'
    ]
  },
  {
    id: 'infinix',
    name: 'Infinix',
    urduName: 'انفنکس',
    popularModels: [
      'Hot 40 Pro', 'Hot 40i', 'Hot 40', 'Hot 30 Play', 'Hot 30i', 'Hot 30', 'Hot 20 Play', 'Hot 20i', 'Hot 20', 'Hot 12 Play', 'Hot 12i', 'Hot 12', 'Hot 11s', 'Hot 11 Play', 'Hot 10 Play', 'Hot 10', 'Hot 9 Play', 'Hot 8',
      'Note 40 Pro+ 5G', 'Note 40 Pro', 'Note 40', 'Note 30 Pro', 'Note 30 VIP', 'Note 30', 'Note 12 Pro 5G', 'Note 12 VIP', 'Note 12 G96', 'Note 11 Pro', 'Note 10 Pro', 'Note 8', 'Note 7',
      'Smart 8 Pro', 'Smart 8 HD', 'Smart 8', 'Smart 7 HD', 'Smart 7', 'Smart 6 Plus', 'Smart 6', 'Smart 5',
      'Zero 30 5G', 'Zero 30 4G', 'Zero Ultra', 'Zero 20', 'Zero 8', 'GT 20 Pro 5G', 'GT 10 Pro'
    ]
  },
  {
    id: 'nokia',
    name: 'Nokia',
    urduName: 'نوکیا',
    popularModels: [
      'Nokia G42 5G', 'Nokia G22', 'Nokia G21', 'Nokia G20', 'Nokia G11 Plus', 'Nokia G10',
      'Nokia C32', 'Nokia C31', 'Nokia C22', 'Nokia C21 Plus', 'Nokia C20', 'Nokia C12', 'Nokia C2 2nd Edition', 'Nokia C1 2nd Edition',
      'Nokia X30 5G', 'Nokia X20', 'Nokia 5.4', 'Nokia 3.4', 'Nokia 2.4',
      'Nokia 105 (4G / 2G)', 'Nokia 106 4G', 'Nokia 110 4G', 'Nokia 130 (2023)', 'Nokia 150 (2023)',
      'Nokia 5310 XpressMusic', 'Nokia 6310', 'Nokia 8210 4G', 'Nokia 2660 Flip', 'Nokia 3310 (2017)', 'Nokia 216', 'Nokia 225 4G'
    ]
  },
  {
    id: 'motorola',
    name: 'Motorola',
    urduName: 'موتورولا',
    popularModels: [
      'Moto Edge 50 Ultra', 'Moto Edge 50 Pro', 'Moto Edge 50 Fusion', 'Moto Edge 40 Pro', 'Moto Edge 40 Neo', 'Moto Edge 40', 'Moto Edge 30 Ultra', 'Moto Edge 30 Fusion',
      'Moto G84 5G', 'Moto G54 5G', 'Moto G34 5G', 'Moto G24 Power', 'Moto G24', 'Moto G14', 'Moto G73 5G', 'Moto G53 5G', 'Moto G32', 'Moto G23', 'Moto G13', 'Moto G Stylus 5G', 'Moto G Power 5G',
      'Moto E13', 'Moto E22i', 'Moto E22', 'Moto E20', 'Moto E7 Power', 'Moto E6s',
      'Motorola Razr 50 Ultra', 'Motorola Razr 40 Ultra', 'Motorola Razr 40'
    ]
  },
  {
    id: 'huawei',
    name: 'Huawei / Honor',
    urduName: 'ہواوے / آنر',
    popularModels: [
      'Honor Magic 6 Pro', 'Honor 200 Pro', 'Honor 200', 'Honor 90', 'Honor 70', 'Honor 50',
      'Honor X9b 5G', 'Honor X8b', 'Honor X7b', 'Honor X6a', 'Honor X5 Plus', 'Honor 8X', 'Honor 7X',
      'Huawei Pura 70 Ultra', 'Huawei P60 Pro', 'Huawei P50 Pro', 'Huawei P40 Pro', 'Huawei P30 Pro', 'Huawei P30 Lite',
      'Huawei Nova 12s', 'Huawei Nova 11 Pro', 'Huawei Nova 10', 'Huawei Nova 9', 'Huawei Nova 7i', 'Huawei Nova 3i',
      'Huawei Y9a', 'Huawei Y9 Prime 2019', 'Huawei Y9s', 'Huawei Y7a', 'Huawei Y7 Prime', 'Huawei Y6p', 'Huawei Mate 20 Pro'
    ]
  },
  {
    id: 'oneplus',
    name: 'OnePlus',
    urduName: 'ون پلس',
    popularModels: [
      'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 10R', 'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus 9RT', 'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 8', 'OnePlus 7T Pro', 'OnePlus 7 Pro',
      'Nord CE 4 5G', 'Nord CE 3 5G', 'Nord CE 3 Lite 5G', 'Nord 3 5G', 'Nord CE 2 5G', 'Nord 2T 5G', 'Nord N30 5G', 'Nord N20 SE', 'Nord N100', 'OnePlus Open'
    ]
  },
  {
    id: 'google',
    name: 'Google Pixel',
    urduName: 'گوگل پکسل',
    popularModels: [
      'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 8a', 'Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel 7',
      'Pixel 6a', 'Pixel 6 Pro', 'Pixel 6', 'Pixel 5a 5G', 'Pixel 5', 'Pixel 4a 5G', 'Pixel 4a', 'Pixel 4 XL', 'Pixel 3 XL', 'Pixel 2 XL', 'Pixel Fold'
    ]
  },
  {
    id: 'itel',
    name: 'Itel',
    urduName: 'آئی ٹیل',
    popularModels: [
      'Itel S24', 'Itel S23+', 'Itel S23', 'Itel A70', 'Itel A60s', 'Itel A50', 'Itel P55+ 5G', 'Itel P55', 'Itel P40+', 'Itel P40', 'Itel Vision 3 Plus', 'Itel Vision 2',
      'Itel Magic 3', 'Itel Magic 2 Max', 'Itel Value 100', 'Itel Power 400', 'Itel Circle 1'
    ]
  },
  {
    id: 'other',
    name: 'Other Brands / دیگر برانڈز',
    urduName: 'کیو موبائل / ڈی کوڈ / دیگر',
    popularModels: [
      'QMobile Noir Series', 'QMobile E-Series', 'QMobile Power Series', 'QMobile D-Series',
      'Dcode Bold 3 Pro', 'Dcode Cygnal 3 Lite', 'Dcode Cygnal 2 Pro', 'Dcode Bold 2',
      'VGO TEL New 26', 'VGO TEL Venture V12', 'VGO TEL Smart 8',
      'Jazz Digit 4G', 'Jazz Digit 4G Elite', 'ZTE Blade A72', 'ZTE Blade A52',
      'TCL 40 SE', 'TCL 30+', 'Sparx Neo 7 Ultra', 'Sparx Neo 6', 'Sparx Note 20',
      'Dany Genius Tab', 'Generic China Bar Phone / Keypad'
    ]
  }
];

const CUSTOM_MODELS_KEY = 'musa_custom_phone_models';

export function getCustomModels(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveCustomModel(brandId: string, modelName: string): void {
  try {
    const custom = getCustomModels();
    const list = custom[brandId] || [];
    const trimmed = modelName.trim();
    if (trimmed && !list.includes(trimmed)) {
      list.push(trimmed);
      custom[brandId] = list;
      localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(custom));
    }
  } catch (e) {
    console.error('Failed to save custom model', e);
  }
}

export function getModelsForBrand(brandId: string): string[] {
  const brand = PHONE_BRANDS.find(b => b.id === brandId || b.name.toLowerCase() === brandId.toLowerCase());
  const custom = getCustomModels()[brand?.id || brandId] || [];
  if (!brand) return custom;
  return Array.from(new Set([...brand.popularModels, ...custom]));
}
