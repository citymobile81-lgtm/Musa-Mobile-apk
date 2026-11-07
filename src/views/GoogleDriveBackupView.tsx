import React, { useState, useEffect } from 'react';
import { ShopSettings } from '../types';
import {
  exportAllDataJSON,
  importDataFromJSON,
  saveSettings,
  logActivity,
} from '../services/db';
import {
  initAuth,
  googleSignIn,
  logout,
  getCurrentUser,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  listAllDriveFiles,
  restoreFromGoogleDriveFile,
  deleteGoogleDriveFile,
  getActiveAccessToken,
  DriveBackupFile,
} from '../services/googleDrive';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { RotatingLogo } from '../components/RotatingLogo';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Calendar,
  ExternalLink,
  Trash2,
  LogOut,
  FolderOpen,
  ShieldCheck,
  HardDrive,
  Clock,
  Database,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleDriveBackupViewProps {
  settings: ShopSettings;
  onRefreshAllData: () => void;
  onSettingsUpdated: (newSettings: ShopSettings) => void;
}

export const GoogleDriveBackupView: React.FC<GoogleDriveBackupViewProps> = ({
  settings,
  onRefreshAllData,
  onSettingsUpdated,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isConnected, setIsConnected] = useState<boolean>(!!getActiveAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingBackups, setIsFetchingBackups] = useState(false);
  const [isFetchingDriveFiles, setIsFetchingDriveFiles] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'backups' | 'explorer'>('backups');

  // Lists
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [allDriveFiles, setAllDriveFiles] = useState<DriveBackupFile[]>([]);

  // Confirmation Modal for Destructive Operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemDetails?: string;
    actionLabel: string;
    actionType: 'delete' | 'restore';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    actionType: 'delete',
    onConfirm: async () => {},
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [autoDailyBackup, setAutoDailyBackup] = useState(
    settings.autoDailyBackupEnabled ?? true
  );

  const lastBackupStr = localStorage.getItem('musa_last_daily_backup') || 'None recorded yet';

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsConnected(true);
        loadCloudFileList();
      },
      () => {
        setCurrentUser(null);
        setIsConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage({ type: 'info', text: 'Connecting to Google Drive...' });
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setIsConnected(true);
        setStatusMessage({
          type: 'success',
          text: `Connected to Google Drive as ${res.user.displayName || res.user.email}!`,
        });
        loadCloudFileList();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `Authentication error: ${msg}` });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setIsConnected(false);
    setDriveBackups([]);
    setAllDriveFiles([]);
    setStatusMessage({
      type: 'info',
      text: 'Signed out of Google Drive. In-memory access token cleared.',
    });
  };

  const handleUploadBackup = async () => {
    setIsUploading(true);
    setStatusMessage({ type: 'info', text: 'Uploading database snapshot to Google Drive...' });

    const res = await uploadBackupToGoogleDrive();
    setIsUploading(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      loadCloudFileList();
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const loadCloudFileList = async () => {
    if (!getActiveAccessToken()) return;
    setIsFetchingBackups(true);
    try {
      const files = await listGoogleDriveBackups();
      setDriveBackups(files);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsFetchingBackups(false);
    }
  };

  const loadAllDriveFiles = async () => {
    if (!getActiveAccessToken()) return;
    setIsFetchingDriveFiles(true);
    try {
      const files = await listAllDriveFiles(30);
      setAllDriveFiles(files);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsFetchingDriveFiles(false);
    }
  };

  // Switch Tab
  const handleTabChange = (tab: 'backups' | 'explorer') => {
    setActiveTab(tab);
    if (tab === 'explorer' && allDriveFiles.length === 0 && isConnected) {
      loadAllDriveFiles();
    }
  };

  // Mandatory Explicit Confirmation Modal for Restoring
  const requestRestoreCloudFile = (file: DriveBackupFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Database Cloud Restoration',
      description:
        'Restoring this backup will replace current local database records with the selected snapshot from Google Drive. Are you sure you want to proceed?',
      itemDetails: `File: ${file.name} (Created: ${new Date(file.createdTime).toLocaleString()})`,
      actionLabel: 'Confirm & Restore Data',
      actionType: 'restore',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setStatusMessage({
          type: 'info',
          text: `Downloading and restoring '${file.name}' from Google Drive...`,
        });
        const res = await restoreFromGoogleDriveFile(file.id);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          onRefreshAllData();
          alert('Database restored successfully from Google Drive!');
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      },
    });
  };

  // Mandatory Explicit Confirmation Modal for Deletion
  const requestDeleteCloudFile = (file: DriveBackupFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete from Google Drive',
      description:
        'Are you sure you want to permanently delete this backup file from your Google Drive? This action cannot be undone.',
      itemDetails: `File: ${file.name} (ID: ${file.id})`,
      actionLabel: 'Delete File Permanently',
      actionType: 'delete',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setStatusMessage({ type: 'info', text: `Deleting '${file.name}' from Google Drive...` });
        const res = await deleteGoogleDriveFile(file.id);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          loadCloudFileList();
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      },
    });
  };

  // Local JSON Export
  const handleExportJSON = async () => {
    const jsonStr = await exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Musa_Mobile_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await logActivity('LOCAL_JSON_EXPORT', 'Downloaded JSON backup file');
  };

  // Local JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (
        confirm(
          'Restoring from this file will import records into the Musa database. Continue?'
        )
      ) {
        const res = await importDataFromJSON(content);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          onRefreshAllData();
          alert('Database restored successfully from local JSON file!');
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleAutoDailyBackup = async () => {
    const nextVal = !autoDailyBackup;
    setAutoDailyBackup(nextVal);
    const updated = { ...settings, autoDailyBackupEnabled: nextVal };
    await saveSettings(updated);
    onSettingsUpdated(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-400" />
            <span>Google Drive API Cloud Backup & Restoration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise cloud backup with Google Drive REST API & automated daily synchronization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              isConnected
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{isConnected ? 'Drive Connected' : 'Drive Disconnected'}</span>
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-600/60 text-rose-200'
              : 'bg-blue-950/60 border-blue-600/60 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Connection & Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Google Account Authentication */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>1. Google Drive Account Connection</span>
          </h3>

          {!isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#030b1e] border border-slate-800">
                <RotatingLogo size="sm" showGlow={true} customLogoUrl={settings.customLogoUrl} />
                <div>
                  <p className="font-bold text-white text-xs">Musa Mobile Repairing Center</p>
                  <p className="text-[10px] text-slate-400 font-serif">موسی موبائل ریپیئرنگ سنٹر کلاؤڈ کنیکٹ</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your Google Account to authorize this app to safely upload, list, and restore
                your mobile repairing shop backups to Google Drive.
              </p>
              <div className="pt-2">
                <GoogleSignInButton
                  onClick={handleSignIn}
                  isLoading={isAuthenticating}
                  label="Sign in with Google"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                🔒 Access tokens are kept in memory only and never stored in localStorage or sessionStorage.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#030b1e] rounded-xl border border-slate-800">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#0353a4]/50 border border-slate-700 flex items-center justify-center text-white">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {currentUser?.displayName || 'Google User'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {currentUser?.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Google Drive Authorized</span>
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Disconnect Google Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>

              {/* Automatic Daily Backup Switch */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Automated Daily Backup</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Uploads a fresh database snapshot to Drive on first startup each day
                  </p>
                </div>
                <button
                  onClick={toggleAutoDailyBackup}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    autoDailyBackup ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoDailyBackup ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Cloud Sync Actions */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span>2. Cloud Backup & Live Sync</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Creates a complete encrypted snapshot of all customers, repair tokens, job cards,
              inspection photos, parts inventory, financial ledgers, and staff logs, saving to your Google Drive.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-[#030b1e] border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">
                Last Auto-Backup:{' '}
                <span className="font-mono text-[#d4af37] font-bold">{lastBackupStr}</span>
              </p>
              <p className="text-slate-400">
                Cloud Sync Status:{' '}
                <span className="text-white font-semibold">
                  {isConnected ? 'Ready & Connected' : 'Awaiting Google Sign-in'}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleUploadBackup}
              disabled={!isConnected || isUploading}
              className="w-full py-2.5 rounded-xl bg-[#0466c8] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#d4af37]" />
              <span>
                {isUploading ? 'Uploading to Drive...' : 'Backup Database to Google Drive Now'}
              </span>
            </button>

            <button
              onClick={loadCloudFileList}
              disabled={!isConnected || isFetchingBackups}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetchingBackups ? 'animate-spin' : ''}`}
              />
              <span>Refresh Backups List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs for Google Drive Content */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => handleTabChange('backups')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 ${
            activeTab === 'backups'
              ? 'bg-[#0a192f] text-[#d4af37] border-b-2 border-[#d4af37]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Musa System Backups ({driveBackups.length})</span>
        </button>
        <button
          onClick={() => handleTabChange('explorer')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 ${
            activeTab === 'explorer'
              ? 'bg-[#0a192f] text-[#d4af37] border-b-2 border-[#d4af37]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Google Drive Explorer</span>
        </button>
      </div>

      {/* Tab 1: Musa System Backups */}
      {activeTab === 'backups' && (
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#d4af37]" />
              <span>Available Backups Found in your Google Drive</span>
            </h3>
            {isConnected && (
              <button
                onClick={loadCloudFileList}
                disabled={isFetchingBackups}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingBackups ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Sign in with your Google Account above to view and manage cloud backups.
            </div>
          ) : driveBackups.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              {isFetchingBackups ? 'Searching Google Drive...' : 'No Musa backups found on your Google Drive yet. Click "Backup Database to Google Drive Now" to create your first cloud backup!'}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Backup File Name</th>
                    <th className="py-2.5 px-3">Snapshot Date</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {driveBackups.map((f) => (
                    <tr key={f.id} className="hover:bg-[#030b1e]/60 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate max-w-xs">{f.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {new Date(f.createdTime).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {f.size ? `${(Number(f.size) / 1024).toFixed(1)} KB` : 'JSON'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => requestRestoreCloudFile(f)}
                            className="px-3 py-1 rounded-lg bg-[#d4af37] hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                            title="Restore database from this backup"
                          >
                            <Download className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => requestDeleteCloudFile(f)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-rose-200 transition"
                            title="Delete this backup file from Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {f.webViewLink && (
                            <a
                              href={f.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title="Open file in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Google Drive Explorer */}
      {activeTab === 'explorer' && (
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Google Drive File Explorer</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Browse recently modified files and folders in your connected Google Drive account
              </p>
            </div>
            {isConnected && (
              <button
                onClick={loadAllDriveFiles}
                disabled={isFetchingDriveFiles}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetchingDriveFiles ? 'animate-spin' : ''}`}
                />
                <span>Refresh Drive Files</span>
              </button>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Sign in with your Google Account above to explore files in your Google Drive.
            </div>
          ) : allDriveFiles.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              {isFetchingDriveFiles ? 'Loading files from Google Drive...' : 'No files found or click "Refresh Drive Files" to load.'}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">File / Item Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Last Modified</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3 text-center">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allDriveFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[#030b1e]/60 transition">
                      <td className="py-2 px-3 font-medium text-white flex items-center gap-2">
                        {file.mimeType?.includes('folder') ? (
                          <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <span className="truncate max-w-xs">{file.name}</span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                        {file.mimeType?.split('.').pop() || file.mimeType}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">
                        {file.size ? `${(Number(file.size) / 1024).toFixed(1)} KB` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {file.webViewLink ? (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0353a4]/50 hover:bg-[#0353a4] text-white text-[11px] font-semibold transition"
                          >
                            <span>Open in Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Local JSON Offline Export & Import (Instant Fallback) */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-800/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
          <FileJson className="w-4 h-4" />
          <span>Local Device JSON Database Backup & Direct File Restore</span>
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Save an offline JSON file directly to your laptop or smartphone storage without requiring an internet connection.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Local JSON Backup File</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-2 transition">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Restore from Local JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* MANDATORY EXPLICIT CONFIRMATION MODAL FOR DESTRUCTIVE OPERATIONS */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.actionType === 'delete'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-500/50'
                    : 'bg-amber-950/80 text-amber-400 border border-amber-500/50'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{confirmModal.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Explicit User Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.description}
            </p>

            {confirmModal.itemDetails && (
              <div className="p-2.5 bg-[#030b1e] rounded-xl border border-slate-800 font-mono text-[11px] text-[#d4af37] break-all">
                {confirmModal.itemDetails}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow transition ${
                  confirmModal.actionType === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
