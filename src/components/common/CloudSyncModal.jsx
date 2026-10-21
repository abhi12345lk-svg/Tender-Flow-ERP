import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import ConfirmDialog from './ConfirmDialog';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FileJson,
  Layers,
  Database,
  Calendar,
  FileSpreadsheet,
  FileSignature,
  Receipt,
  Network,
  Download,
  Info,
  Server,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { syncService, MODULE_CONFIG } from '../../services/sync/syncService';
import { api } from '../../services/apiClient';

export default function CloudSyncModal({ isOpen, onClose }) {
  const { dataService, addToast, refreshLocalData, isBackendConnected } = useApp();

  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [diffReport, setDiffReport] = useState(null);
  const [conflictResolutions, setConflictResolutions] = useState({});
  const [uploadAttachments, setUploadAttachments] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'conflicts' | 'uploads' | 'downloads' | 'all'
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [safetyBackupVerified, setSafetyBackupVerified] = useState(syncService.hasValidSafetyBackup());
  const [backupDetails, setBackupDetails] = useState(syncService.latestBackupToken);

  // Officer Authentication state for protected API routes
  const [officerEmail, setOfficerEmail] = useState('admin@tenderflow.gov.in');
  const [officerPassword, setOfficerPassword] = useState('AdminSecurePass@2024');
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(sessionStorage.getItem('tenderflow_token')));

  const handleOfficerLogin = async (e) => {
    if (e) e.preventDefault();
    try {
      setAuthLoading(true);
      const res = await api.auth.login({
        email: officerEmail,
        password: officerPassword,
      });

      if (res?.data?.token) {
        sessionStorage.setItem('tenderflow_token', res.data.token);
        setIsAuthenticated(true);
        addToast({
          type: 'success',
          title: 'Officer Session Established',
          message: `Authenticated as ${res.data.user?.name || officerEmail} (${res.data.user?.role || 'Admin'})`,
        });
        await runInspection();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Invalid officer credentials',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Run dry-run inspection
  const runInspection = async () => {
    try {
      setInspecting(true);
      const report = await syncService.inspectSyncDifferences();
      setDiffReport(report);
      setIsAuthenticated(Boolean(sessionStorage.getItem('tenderflow_token')));

      // Pre-populate conflict resolutions with default 'keep_local'
      const initialResolutions = {};
      if (report.modules) {
        Object.values(report.modules).forEach((mod) => {
          mod.conflicts.forEach((c) => {
            initialResolutions[c.id] = 'keep_local';
          });
        });
      }
      setConflictResolutions(initialResolutions);

      setSafetyBackupVerified(syncService.hasValidSafetyBackup());
      setBackupDetails(syncService.latestBackupToken);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Inspection Failed',
        message: err.message,
      });
    } finally {
      setInspecting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSafetyBackupVerified(syncService.hasValidSafetyBackup());
      setBackupDetails(syncService.latestBackupToken);
      runInspection();
    }
  }, [isOpen]);

  // Export Safety Backup to pass gate
  const handleExportSafetyBackup = async () => {
    try {
      setLoading(true);
      const res = await dataService.exportBackupJson();
      syncService.setBackupVerified(res);
      setSafetyBackupVerified(true);
      setBackupDetails(syncService.latestBackupToken);

      addToast({
        type: 'success',
        title: 'Safety Backup Verified',
        message: `Snapshot ${res.filename} saved. Cloud sync safety gate unlocked.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Backup Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Set individual conflict resolution choice
  const handleResolutionChange = (recordId, choice) => {
    setConflictResolutions((prev) => ({
      ...prev,
      [recordId]: choice,
    }));
  };

  // Apply Reviewed Sync
  const handleApplySync = async () => {
    try {
      setLoading(true);
      const syncResult = await syncService.executeReviewedSync(diffReport, conflictResolutions, {
        uploadAttachments,
      });

      if (refreshLocalData) {
        await refreshLocalData();
      }

      addToast({
        type: 'success',
        title: 'Synchronization Complete',
        message: `Applied: ${syncResult.uploaded} uploaded, ${syncResult.downloaded} downloaded, ${syncResult.conflictsResolved} conflicts resolved.`,
      });

      setConfirmSyncOpen(false);
      onClose();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Sync Execution Error',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const moduleIcons = {
    financialYears: Calendar,
    subdivisions: Network,
    workOrders: FileSpreadsheet,
    agreements: FileSignature,
    billing: Receipt,
    fmdSd: ShieldCheck,
  };

  const summary = diffReport?.summary || {
    pendingUploadCount: 0,
    pendingDownloadCount: 0,
    conflictCount: 0,
    syncedCount: 0,
    totalDifferences: 0,
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Safe Cloud Synchronization & Reconciliation"
        subtitle="Review differences, resolve conflicts, and apply idempotent sync between local IndexedDB and MongoDB."
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Sync requires a verified JSON backup snapshot before applying.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                onClick={runInspection}
                disabled={inspecting || loading}
                icon={RefreshCw}
              >
                Re-inspect
              </Button>
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setConfirmSyncOpen(true)}
                disabled={
                  loading ||
                  inspecting ||
                  !diffReport?.canSync ||
                  !safetyBackupVerified ||
                  summary.totalDifferences === 0
                }
                icon={Cloud}
              >
                Apply Reviewed Sync ({summary.totalDifferences})
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 1. Safety Backup Gate Banner */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              safetyBackupVerified
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    safetyBackupVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {safetyBackupVerified ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {safetyBackupVerified
                      ? 'Safety Gate Cleared: Verified Backup Active'
                      : 'Safety Gate: Verified Backup Required'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {safetyBackupVerified
                      ? `Snapshot "${backupDetails?.filename}" verified at ${new Date(
                          backupDetails?.timestamp || Date.now()
                        ).toLocaleTimeString()}. Safe to reconcile.`
                      : 'To prevent accidental data loss, TenderFlow requires a verified client-side JSON backup before merging records.'}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant={safetyBackupVerified ? 'outline' : 'primary'}
                onClick={handleExportSafetyBackup}
                disabled={loading}
                icon={Download}
                className="shrink-0 w-full sm:w-auto"
              >
                {safetyBackupVerified ? 'Export New Snapshot' : 'Export Verified Backup Now'}
              </Button>
            </div>
          </div>

          {/* 2. Backend Health & Server Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">Cloud Backend:</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  diffReport?.healthStatus?.isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {diffReport?.healthStatus?.isConnected ? 'Online (Render)' : 'Offline'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">Storage Engine:</span>
              </div>
              <span className="text-xs font-bold text-slate-800">
                IndexedDB ↔ MongoDB
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">Differences:</span>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {summary.totalDifferences} to reconcile
              </span>
            </div>
          </div>

          {/* Officer Authorization Status Bar */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${isAuthenticated ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span className="text-xs font-medium text-slate-700">Officer API Authorization:</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isAuthenticated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isAuthenticated ? 'Authenticated (Active Session)' : 'Session Token Missing'}
              </span>
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('tenderflow_token');
                  setIsAuthenticated(false);
                  addToast({ type: 'info', title: 'Session Cleared', message: 'Officer session token removed.' });
                  runInspection();
                }}
                className="text-[11px] text-slate-500 hover:text-rose-600 underline"
              >
                Clear Token
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">Government Officer session required for protected cloud routes</span>
            )}
          </div>

          {/* If Authentication Required, Show Dedicated Officer Login Form */}
          {diffReport && !diffReport.canSync && diffReport.isUnauthorized && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Divisional Officer Authentication Required
                  </h4>
                  <p className="text-xs mt-1 text-amber-800 leading-relaxed">
                    All six business API routes are protected by server-side authentication. Please provide valid Officer credentials to inspect differences or synchronize data.
                  </p>
                </div>
              </div>

              <form onSubmit={handleOfficerLogin} className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Officer Email</label>
                  <input
                    type="email"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@tenderflow.gov.in"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={officerPassword}
                    onChange={(e) => setOfficerPassword(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={authLoading}
                    className="w-full text-xs py-1.5"
                    icon={ShieldCheck}
                  >
                    {authLoading ? 'Authenticating...' : 'Authenticate Officer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* If Backend Offline, Show Warning */}
          {diffReport && !diffReport.canSync && !diffReport.isUnauthorized && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 flex items-start gap-3">
              <CloudOff className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Sync Disabled — Cloud Backend Unreachable</h4>
                <p className="text-xs mt-1 text-rose-700 leading-relaxed">
                  {diffReport.reason || 'The remote Render/Express server is offline. All offline CRUD and document generation remain operational in IndexedDB.'}
                </p>
              </div>
            </div>
          )}

          {/* 3. Dry-Run Metric Cards */}
          {diffReport?.canSync && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('uploads')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeTab === 'uploads'
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-700">Pending Upload</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {summary.pendingUploadCount}
                </div>
                <span className="text-[10px] text-slate-500">Local → Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('downloads')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeTab === 'downloads'
                    ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-700">Pending Download</span>
                  <ArrowDownLeft className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {summary.pendingDownloadCount}
                </div>
                <span className="text-[10px] text-slate-500">Cloud → Local</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('conflicts')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeTab === 'conflicts'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-700">Conflicts</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {summary.conflictCount}
                </div>
                <span className="text-[10px] text-slate-500">Review Required</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeTab === 'summary'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700">In Sync</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {summary.syncedCount}
                </div>
                <span className="text-[10px] text-slate-500">Identical Records</span>
              </button>
            </div>
          )}

          {/* 4. Tab Content & Module Breakdown */}
          {diffReport?.canSync && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reconciliation Inspector: {activeTab.toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-500">
                  {summary.totalDifferences === 0
                    ? 'All 6 government modules fully synchronized'
                    : `${summary.totalDifferences} item(s) pending reconciliation`}
                </span>
              </div>

              <div className="p-3 space-y-4 max-h-[380px] overflow-y-auto">
                {Object.entries(diffReport.modules || {}).map(([modKey, modReport]) => {
                  const Icon = moduleIcons[modKey] || Layers;
                  const filteredUploads = activeTab === 'downloads' || activeTab === 'conflicts' ? [] : modReport.pendingUploads;
                  const filteredDownloads = activeTab === 'uploads' || activeTab === 'conflicts' ? [] : modReport.pendingDownloads;
                  const filteredConflicts = activeTab === 'uploads' || activeTab === 'downloads' ? [] : modReport.conflicts;

                  const hasItems =
                    (activeTab === 'summary' && (modReport.pendingUploads.length > 0 || modReport.pendingDownloads.length > 0 || modReport.conflicts.length > 0)) ||
                    (activeTab === 'uploads' && modReport.pendingUploads.length > 0) ||
                    (activeTab === 'downloads' && modReport.pendingDownloads.length > 0) ||
                    (activeTab === 'conflicts' && modReport.conflicts.length > 0) ||
                    (activeTab === 'all');

                  if (!hasItems) return null;

                  return (
                    <div key={modKey} className="border border-slate-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-800">{modReport.label}</h4>
                          <span className="text-[10px] text-slate-400">
                            (Local: {modReport.totalLocal} | Cloud: {modReport.totalRemote})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {modReport.pendingUploads.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                              +{modReport.pendingUploads.length} Up
                            </span>
                          )}
                          {modReport.pendingDownloads.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                              +{modReport.pendingDownloads.length} Down
                            </span>
                          )}
                          {modReport.conflicts.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                              {modReport.conflicts.length} Conflict
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mt-2">
                        {/* Conflicts with Side-by-Side Diff */}
                        {filteredConflicts.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                {c.title} ({c.key})
                              </span>
                              <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                {c.diffs.length} differing field(s)
                              </span>
                            </div>

                            {/* Field Diff Table */}
                            <div className="bg-white rounded border border-amber-200 overflow-hidden">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                  <tr>
                                    <th className="py-1 px-2 font-semibold">Field</th>
                                    <th className="py-1 px-2 font-semibold text-blue-700">Local (IndexedDB)</th>
                                    <th className="py-1 px-2 font-semibold text-emerald-700">Cloud (MongoDB)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {c.diffs.map((d) => (
                                    <tr key={d.field}>
                                      <td className="py-1 px-2 font-mono text-slate-600">{d.field}</td>
                                      <td className="py-1 px-2 text-slate-900 bg-blue-50/30">
                                        {String(d.localValue ?? '—')}
                                      </td>
                                      <td className="py-1 px-2 text-slate-900 bg-emerald-50/30">
                                        {String(d.cloudValue ?? '—')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Explicit Resolution Choice */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-700">
                              <span className="font-semibold text-slate-800">Resolution:</span>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`res-${c.id}`}
                                  value="keep_local"
                                  checked={conflictResolutions[c.id] === 'keep_local'}
                                  onChange={() => handleResolutionChange(c.id, 'keep_local')}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Keep Local (Upload to Cloud)</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`res-${c.id}`}
                                  value="keep_cloud"
                                  checked={conflictResolutions[c.id] === 'keep_cloud'}
                                  onChange={() => handleResolutionChange(c.id, 'keep_cloud')}
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Keep Cloud (Overwrite Local)</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`res-${c.id}`}
                                  value="keep_both"
                                  checked={conflictResolutions[c.id] === 'keep_both'}
                                  onChange={() => handleResolutionChange(c.id, 'keep_both')}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                <span>Keep Both (Duplicate Local)</span>
                              </label>
                            </div>
                          </div>
                        ))}

                        {/* Pending Uploads */}
                        {filteredUploads.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-2 rounded bg-blue-50/50 border border-blue-100 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                              <span className="font-medium text-slate-800">{u.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">[{u.key}]</span>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Pending Upload
                            </span>
                          </div>
                        ))}

                        {/* Pending Downloads */}
                        {filteredDownloads.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between p-2 rounded bg-indigo-50/50 border border-indigo-100 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowDownLeft className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="font-medium text-slate-800">{d.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">[{d.key}]</span>
                            </div>
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                              Pending Download
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {summary.totalDifferences === 0 && (
                  <div className="text-center py-6 text-slate-500">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">IndexedDB & Cloud are in complete sync</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No pending uploads, downloads, or conflicts found across all six business modules.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Document Attachments Safety Protection Toggle */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="uploadAttachmentsToggle"
              checked={uploadAttachments}
              onChange={(e) => setUploadAttachments(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="uploadAttachmentsToggle" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-semibold block text-slate-800">
                Synchronize FMD/SD Binary Document Attachments to Server
              </span>
              <span className="text-slate-500 text-[11px] block mt-0.5">
                Disabled by default. Attachments remain securely stored in browser IndexedDB unless explicitly approved for cloud custody upload.
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog before applying sync */}
      <ConfirmDialog
        isOpen={confirmSyncOpen}
        onClose={() => setConfirmSyncOpen(false)}
        onConfirm={handleApplySync}
        title="Confirm Safe Cloud Synchronization"
        message={`You are about to reconcile ${summary.totalDifferences} records (${summary.pendingUploadCount} uploads, ${summary.pendingDownloadCount} downloads, ${summary.conflictCount} conflicts resolved). Verified backup "${backupDetails?.filename}" is recorded. Local and cloud data will be updated idempotently.`}
        confirmText="Apply Reconciled Sync"
        cancelText="Review Changes"
        type="primary"
        loading={loading}
      />
    </>
  );
}
