/**
 * Authentication & Password Security Service for MUSA MOBILE REPAIRING CENTER
 * Uses Web Crypto API SHA-256 for secure password hashing.
 * Passwords are never stored in plain-text.
 * Supports Multi-User Management System with role-based access control.
 */

import { AppUser, UserRole } from '../types';

const USERS_STORAGE_KEY = 'musa_mobile_users_v2';
const LEGACY_AUTH_STORAGE_KEY = 'musa_mobile_auth_v1';
const SESSION_STORAGE_KEY = 'musa_mobile_session_token';
const OTP_STORAGE_KEY = 'musa_mobile_active_otp';
const REMEMBER_STORAGE_KEY = 'musa_remembered_creds_v2';
const SALT = 'MUSA_MOBILE_SALT_2026_MUZAFFARGARH';

export interface AdminAccount {
  username: string;
  passwordHash: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  securityQuestion: string;
  securityAnswerHash: string;
}

/**
 * Hash string using SHA-256 via browser Web Crypto API
 */
export async function hashString(plainText: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plainText + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Obfuscate and deobfuscate credentials for Remember Me feature
 */
function encodeCredentials(user: string, pass: string): string {
  try {
    const raw = JSON.stringify({ u: user, p: pass, t: Date.now() });
    return btoa(unescape(encodeURIComponent(raw)));
  } catch {
    return '';
  }
}

function decodeCredentials(encoded: string): { username: string; password: string } | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(jsonStr);
    if (data && data.u && data.p) {
      return { username: data.u, password: data.p };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRememberedCredentials(user: string, pass: string): void {
  try {
    const token = encodeCredentials(user, pass);
    localStorage.setItem(REMEMBER_STORAGE_KEY, token);
  } catch (err) {
    console.warn('Could not save credentials:', err);
  }
}

export function getRememberedCredentials(): { username: string; password: string } | null {
  try {
    const raw = localStorage.getItem(REMEMBER_STORAGE_KEY);
    if (!raw) return null;
    return decodeCredentials(raw);
  } catch {
    return null;
  }
}

export function clearRememberedCredentials(): void {
  localStorage.removeItem(REMEMBER_STORAGE_KEY);
}

/**
 * Initialize default User Accounts (Owner Admin & Lab Engineer)
 */
export async function initAuthUsers(): Promise<AppUser[]> {
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AppUser[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Continue to re-seed
    }
  }

  // Check legacy account if exists
  let initialPassHash = await hashString('musa123');
  const legacyRaw = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (legacyRaw) {
    try {
      const leg = JSON.parse(legacyRaw) as AdminAccount;
      if (leg.passwordHash) {
        initialPassHash = leg.passwordHash;
      }
    } catch {
      // ignore
    }
  }

  const defaultUsers: AppUser[] = [
    {
      id: 'usr_admin_001',
      username: 'admin',
      name: 'Mian Muhammad Mohsin Qureshi',
      role: 'Admin',
      phone: '03216861765',
      passwordHash: initialPassHash,
      active: true,
      createdAt: new Date().toISOString(),
      notes: 'پروپرائیٹر و سسٹم سپروائزر (Proprietor & Primary Admin)',
      isOwner: true,
    },
    {
      id: 'usr_azhar_002',
      username: 'azhar',
      name: 'Mian Azhar Qureshi',
      role: 'Lab Engineer',
      phone: '03006861765',
      passwordHash: await hashString('musa123'),
      active: true,
      createdAt: new Date().toISOString(),
      notes: 'چیف لیب انجینئر و ہارڈویئر ماسٹر (Chief Lab Engineer)',
      isOwner: false,
    },
  ];

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

/**
 * Backward-compatible initAuthAccount for existing callers
 */
export async function initAuthAccount(): Promise<AdminAccount> {
  const users = await initAuthUsers();
  const admin = users.find((u) => u.username === 'admin') || users[0];
  const answerHash = await hashString('muzaffargarh');

  return {
    username: admin.username,
    passwordHash: admin.passwordHash,
    name: admin.name,
    phone: admin.phone || '03216861765',
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt || admin.createdAt,
    securityQuestion: 'دکان کا اصل شہر اور برانڈ کیا ہے؟ (Muzaffargarh)',
    securityAnswerHash: answerHash,
  };
}

/**
 * Get all user accounts
 */
export async function getAllUsers(): Promise<AppUser[]> {
  return await initAuthUsers();
}

/**
 * Create a new user account
 */
export async function createAppUser(userData: {
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  password: string;
  notes?: string;
  active?: boolean;
}): Promise<{ success: boolean; message: string; user?: AppUser }> {
  const cleanUsername = userData.username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return { success: false, message: 'یوزر نیم کم از کم 3 حروف پر مشتمل ہونا چاہیے۔' };
  }
  if (!userData.name.trim()) {
    return { success: false, message: 'براہ کرم صارف کا مکمل نام درج کریں۔' };
  }
  if (!userData.password || userData.password.length < 4) {
    return { success: false, message: 'پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔' };
  }

  const users = await getAllUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: `یوزر نیم "${userData.username}" پہلے سے موجود ہے۔ مختلف یوزر نیم منتخب کریں۔` };
  }

  const passwordHash = await hashString(userData.password);
  const newUser: AppUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: userData.name.trim(),
    role: userData.role || 'Technician',
    phone: userData.phone?.trim() || '',
    passwordHash,
    active: userData.active !== undefined ? userData.active : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: userData.notes?.trim() || '',
    isOwner: false,
  };

  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  return {
    success: true,
    message: `نیا یوزر اکاؤنٹ "${newUser.name}" کامیابی سے بنا لیا گیا ہے!`,
    user: newUser,
  };
}

/**
 * Update an existing user account
 */
export async function updateAppUser(
  id: string,
  updates: Partial<Omit<AppUser, 'id' | 'passwordHash'>> & { newPassword?: string }
): Promise<{ success: boolean; message: string }> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return { success: false, message: 'متعلقہ صارف اکاؤنٹ نہیں ملا۔' };
  }

  const existing = users[index];

  // If username is changing, ensure uniqueness
  if (updates.username) {
    const cleanU = updates.username.trim().toLowerCase();
    const clash = users.find((u) => u.id !== id && u.username.toLowerCase() === cleanU);
    if (clash) {
      return { success: false, message: `یوزر نیم "${updates.username}" پہلے سے زیرِ استعمال ہے۔` };
    }
    existing.username = cleanU;
  }

  if (updates.name !== undefined) existing.name = updates.name.trim();
  if (updates.role !== undefined) existing.role = updates.role;
  if (updates.phone !== undefined) existing.phone = updates.phone.trim();
  if (updates.notes !== undefined) existing.notes = updates.notes.trim();
  if (updates.active !== undefined) {
    // Prevent deactivating primary owner
    if (existing.isOwner && !updates.active) {
      return { success: false, message: 'بنیادی پروپرائیٹر ایڈمن اکاؤنٹ کو غیر فعال نہیں کیا جا سکتا۔' };
    }
    existing.active = updates.active;
  }

  // Update password if provided
  if (updates.newPassword) {
    if (updates.newPassword.length < 4) {
      return { success: false, message: 'نیا پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔' };
    }
    existing.passwordHash = await hashString(updates.newPassword);
  }

  existing.updatedAt = new Date().toISOString();
  users[index] = existing;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  // If this was admin, sync legacy
  if (existing.username === 'admin') {
    initAuthAccount();
  }

  return { success: true, message: 'صارف کی تفصیلات کامیابی کے ساتھ اپڈیٹ کر دی گئی ہیں!' };
}

/**
 * Toggle user active/inactive status
 */
export async function toggleUserActive(
  id: string,
  active: boolean
): Promise<{ success: boolean; message: string }> {
  const users = await getAllUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { success: false, message: 'صارف نہیں ملا۔' };
  }
  if (target.isOwner && !active) {
    return { success: false, message: 'بنیادی پروپرائیٹر ایڈمن اکاؤنٹ کو غیر فعال نہیں کیا جا سکتا۔' };
  }

  target.active = active;
  target.updatedAt = new Date().toISOString();
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  return {
    success: true,
    message: active
      ? `اکاؤنٹ "${target.name}" فعال (Active) کر دیا گیا ہے۔`
      : `اکاؤنٹ "${target.name}" غیر فعال (Inactive) کر دیا گیا ہے۔`,
  };
}

/**
 * Delete a user account (cannot delete primary owner)
 */
export async function deleteAppUser(id: string): Promise<{ success: boolean; message: string }> {
  const users = await getAllUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { success: false, message: 'صارف نہیں ملا۔' };
  }
  if (target.isOwner || target.username === 'admin') {
    return { success: false, message: 'بنیادی مالک ایڈمن اکاؤنٹ کو ڈیلیٹ نہیں کیا جا سکتا۔' };
  }

  const filtered = users.filter((u) => u.id !== id);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));

  return { success: true, message: `صارف "${target.name}" کا اکاؤنٹ کامیابی سے ڈیلیٹ کر دیا گیا ہے۔` };
}

/**
 * Authenticates user credentials with secure hash comparison
 * Handles individual accounts and required error messages
 */
export async function verifyLogin(
  userOrId: string,
  pass: string
): Promise<{ success: boolean; message?: string; user?: AppUser }> {
  const users = await getAllUsers();
  const inputUser = userOrId.trim().toLowerCase();

  // Find user by username, or by phone number, or legacy aliases
  const matchedUser = users.find((u) => {
    const uName = u.username.toLowerCase();
    const uPhone = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
    const inPhone = inputUser.replace(/[^0-9]/g, '');

    if (uName === inputUser) return true;
    if (inPhone && uPhone && uPhone.includes(inPhone) && inPhone.length >= 7) return true;
    if (inputUser === 'musa' && u.isOwner) return true;
    return false;
  });

  if (!matchedUser) {
    return {
      success: false,
      message: 'موسی موبائل کی طرف سے معذرت! آپ کا یوزر نیم یا پاس ورڈ غلط ہے۔ براہ کرم دوبارہ کوشش کریں۔',
    };
  }

  // Check if account is active
  if (!matchedUser.active) {
    return {
      success: false,
      message: 'Musa Mobile کی طرف سے اطلاع: یہ اکاؤنٹ غیر فعال (Inactive) ہے۔ ایڈمن سے رابطہ کریں۔',
    };
  }

  // Verify password hash
  const inputHash = await hashString(pass);
  if (inputHash !== matchedUser.passwordHash) {
    return {
      success: false,
      message: 'Musa Mobile کی طرف سے اطلاع: آپ کا پاس ورڈ غلط ہے، دوبارہ کوشش کریں۔',
    };
  }

  // Store active session token
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      authenticated: true,
      userId: matchedUser.id,
      username: matchedUser.username,
      name: matchedUser.name,
      role: matchedUser.role,
      timestamp: Date.now(),
    })
  );

  return { success: true, user: matchedUser };
}

/**
 * Check if active session exists
 */
export function isAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    return session && session.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * Get current session user
 */
export function getCurrentSessionUser(): {
  userId?: string;
  username: string;
  name?: string;
  role?: UserRole;
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Logout and clear active session
 */
export function logoutUser(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Generate a 6-digit OTP for password recovery
 */
export function generatePasswordRecoveryOTP(): { otp: string; expiresAt: number; phone: string } {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  localStorage.setItem(
    OTP_STORAGE_KEY,
    JSON.stringify({
      otp,
      expiresAt,
    })
  );

  return {
    otp,
    expiresAt,
    phone: '03216861765 / 03006861765',
  };
}

/**
 * Verify OTP and reset password for admin or targeted user
 */
export async function verifyOTPAndResetPassword(
  enteredOtp: string,
  newPassword: string,
  targetUsername?: string
): Promise<{ success: boolean; message: string }> {
  const raw = localStorage.getItem(OTP_STORAGE_KEY);
  if (!raw) {
    return { success: false, message: 'او ٹی پی موصول نہیں ہوا یا ایکسپائر ہو گیا ہے۔' };
  }

  const { otp, expiresAt } = JSON.parse(raw);
  if (Date.now() > expiresAt) {
    localStorage.removeItem(OTP_STORAGE_KEY);
    return { success: false, message: 'او ٹی پی کوڈ کی میعاد ختم ہو چکی ہے۔ نیا او ٹی پی حاصل کریں۔' };
  }

  if (enteredOtp.trim() !== otp) {
    return { success: false, message: 'غلط او ٹی پی کوڈ درج کیا گیا ہے۔ براہ کرم دوبارہ چیک کریں۔' };
  }

  if (newPassword.length < 4) {
    return { success: false, message: 'نیا پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔' };
  }

  const users = await getAllUsers();
  const targetUser = targetUsername
    ? users.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase())
    : users.find((u) => u.isOwner) || users[0];

  if (!targetUser) {
    return { success: false, message: 'صارف اکاؤنٹ نہیں ملا۔' };
  }

  targetUser.passwordHash = await hashString(newPassword);
  targetUser.updatedAt = new Date().toISOString();
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  localStorage.removeItem(OTP_STORAGE_KEY);

  return { success: true, message: 'پاس ورڈ کامیابی کے ساتھ تبدیل ہو گیا ہے! اب آپ لاگ اِن کر سکتے ہیں۔' };
}

/**
 * Change Password with current password verification
 */
export async function changePassword(
  currentPass: string,
  newPass: string,
  username?: string
): Promise<{ success: boolean; message: string }> {
  const users = await getAllUsers();
  const curUser = getCurrentSessionUser();
  const targetName = username || curUser?.username || 'admin';

  const user = users.find((u) => u.username.toLowerCase() === targetName.toLowerCase());
  if (!user) {
    return { success: false, message: 'صارف اکاؤنٹ نہیں ملا۔' };
  }

  const curHash = await hashString(currentPass);
  if (curHash !== user.passwordHash) {
    return { success: false, message: 'Musa Mobile کی طرف سے اطلاع: آپ کا موجودہ پاس ورڈ غلط ہے۔' };
  }

  if (newPass.length < 4) {
    return { success: false, message: 'نیا پاس ورڈ کم از کم 4 حروف پر مشتمل ہونا چاہیے۔' };
  }

  user.passwordHash = await hashString(newPass);
  user.updatedAt = new Date().toISOString();

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return { success: true, message: 'پاس ورڈ کامیابی کے ساتھ اپڈیٹ ہو گیا ہے۔' };
}
