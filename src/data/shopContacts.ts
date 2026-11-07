/**
 * Central Shop Personnel & Contact Information
 * Single source of truth for Musa Mobile Repairing Center
 * Strict Pairing:
 * 1. میاں اظہر قریشی -> 03216861765 (WhatsApp: +923216861765)
 * 2. میاں محمد محسن قریشی -> 03006861765 (WhatsApp: +923006861765)
 */

export interface ShopPersonnel {
  id: 'azhar' | 'mohsin';
  nameUrdu: string;
  nameEn: string;
  roleUrdu: string;
  roleEn: string;
  phone: string;
  cleanPhone: string;
  callUrl: string;
  whatsappUrl: string;
  avatarInitial: string;
}

export const SHOP_PERSONNEL: Record<'azhar' | 'mohsin', ShopPersonnel> = {
  azhar: {
    id: 'azhar',
    nameUrdu: 'میاں اظہر قریشی',
    nameEn: 'Mian Azhar Qureshi',
    roleUrdu: 'چیف لیب انجینئر و ہارڈویئر ماسٹر',
    roleEn: 'Chief Lab Engineer',
    phone: '03006861765',
    cleanPhone: '923006861765',
    callUrl: 'tel:03006861765',
    whatsappUrl: 'https://wa.me/923006861765',
    avatarInitial: 'A',
  },
  mohsin: {
    id: 'mohsin',
    nameUrdu: 'میاں محمد محسن قریشی',
    nameEn: 'Mian Muhammad Mohsin Qureshi',
    roleUrdu: 'پروپرائیٹر و سسٹم سپروائزر',
    roleEn: 'Proprietor',
    phone: '03216861765',
    cleanPhone: '923216861765',
    callUrl: 'tel:03216861765',
    whatsappUrl: 'https://wa.me/923216861765',
    avatarInitial: 'M',
  },
};

export const SHOP_LOCATION = {
  nameUrdu: 'موسیٰ موبائل ریپیئرنگ سنٹر',
  nameEn: 'MUSA MOBILE REPAIRING CENTER',
  addressUrdu: 'نزد واٹر پلانٹ، بالمقابل قبا آپٹیکل، مظفرگڑھ سٹی، پاکستان',
  addressEn: 'Near Water Plant, Opposite Quba Optical, Muzaffargarh City, Pakistan',
  city: 'Muzaffargarh',
  country: 'Pakistan',
};
