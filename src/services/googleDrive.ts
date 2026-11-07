import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { exportAllDataJSON, importDataFromJSON, logActivity } from './db';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with requested Drive scopes
const provider = new GoogleAuthProvider();
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

// Add primary scopes to the provider
SCOPES.forEach((scope) => provider.addScope(scope));

// In-Memory Token Cache (Per security guidelines, never store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime?: string;
  mimeType?: string;
  webViewLink?: string;
}

/**
 * Initialize auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google using Firebase Auth popup to obtain Google Drive OAuth Access Token.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the currently cached in-memory access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Synchronous check for active in-memory token.
 */
export function getActiveAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Get the current authenticated user.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Log out and clear the in-memory access token.
 */
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Upload database backup file to Google Drive.
 */
export async function uploadBackupToGoogleDrive(): Promise<{
  success: boolean;
  message: string;
  fileName?: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'Google Drive is not connected. Please click "Sign in with Google" first.',
    };
  }

  try {
    const jsonData = await exportAllDataJSON();
    const dateFormatted = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Musa_Mobile_Backup_${dateFormatted}.json`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'MUSA MOBILE REPAIRING CENTER - Complete System Database Backup',
    };

    const boundary = '-------MusaMobileBackupBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `${delimiter}Content-Type: application/json\r\n\r\n` +
      jsonData +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `HTTP ${response.status}`;
      return { success: false, message: `Google Drive Upload Failed: ${errMsg}` };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('musa_last_daily_backup', todayStr);
    await logActivity('GOOGLE_DRIVE_BACKUP', `Uploaded cloud backup: ${fileName}`);

    return {
      success: true,
      message: `Database successfully backed up to your Google Drive as '${fileName}'!`,
      fileName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Upload error: ${errorMsg}` };
  }
}

/**
 * List backup files in Google Drive.
 */
export async function listGoogleDriveBackups(): Promise<DriveBackupFile[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with Google.');
  }

  const query = encodeURIComponent("name contains 'Musa_Mobile_Backup' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,mimeType,webViewLink)&orderBy=createdTime desc&pageSize=30`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch backups (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data.files as DriveBackupFile[]) || [];
}

/**
 * List general Drive files (up to pageSize).
 */
export async function listAllDriveFiles(pageSize = 20): Promise<DriveBackupFile[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with Google.');
  }

  const query = encodeURIComponent('trashed = false');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,mimeType,webViewLink)&orderBy=modifiedTime desc&pageSize=${pageSize}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Drive files (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data.files as DriveBackupFile[]) || [];
}

/**
 * Restore data from a Google Drive JSON backup file.
 */
export async function restoreFromGoogleDriveFile(
  fileId: string
): Promise<{ success: boolean; message: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, message: 'Google Drive authorization is required to restore.' };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to download backup file (HTTP ${res.status})`);
    }

    const jsonText = await res.text();
    return await importDataFromJSON(jsonText);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Cloud restore failed: ${errorMsg}` };
  }
}

/**
 * Delete a file from Google Drive (with bearer authorization).
 */
export async function deleteGoogleDriveFile(
  fileId: string
): Promise<{ success: boolean; message: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, message: 'Google Drive authorization is required.' };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete file (HTTP ${res.status})`);
    }

    await logActivity('GOOGLE_DRIVE_DELETE', `Deleted cloud file ID: ${fileId}`);
    return { success: true, message: 'File deleted from Google Drive successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Delete failed: ${errorMsg}` };
  }
}

/**
 * Automatic Daily Backup Check.
 */
export async function checkAndRunAutoDailyBackup(
  isAutoEnabled: boolean
): Promise<{ ran: boolean; success: boolean; message: string } | null> {
  const token = await getAccessToken();
  if (!isAutoEnabled || !token) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastBackup = localStorage.getItem('musa_last_daily_backup');

  if (lastBackup === todayStr) {
    return {
      ran: false,
      success: true,
      message: `Today's automatic backup is already completed (${todayStr}).`,
    };
  }

  const result = await uploadBackupToGoogleDrive();
  return {
    ran: true,
    success: result.success,
    message: result.message,
  };
}
