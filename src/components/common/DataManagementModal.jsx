import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import ConfirmDialog from './ConfirmDialog';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  FileJson,
  Layers,
  Calendar,
  FileSpreadsheet,
  FileSignature,
  Receipt,
  Network,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DataManagementModal({ isOpen, onClose }) {
  const { dataService, addToast, refreshLocalData } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [restoreAnalysis, setRestoreAnalysis] = useState(null);
  const [pendingBackupPayload, setPendingBackupPayload] = useState(null);
  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false);
  const fileInputRef = useRef(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const s = await dataService.getStorageStats();
      setStats(s);
    } catch (err) {
      console.warn('Could not load storage stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  // Export JSON Backup
  const handleExportBackup = async () => {
    try {
      setLoading(true);
      const res = await dataService.exportBackupJson();
      addToast({
        type: 'success',
        title: 'Local Backup Exported',
        message: `Saved ${res.filename} (${res.stats.total} total records).`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger File Input for Import
  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Pre-flight Analysis for Imported JSON Backup
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const analysis = await dataService.analyzeBackupJson(parsed);
      setRestoreAnalysis(analysis);
      setPendingBackupPayload(parsed);

      addToast({
        type: 'info',
        title: 'Backup Pre-Flight Analyzed',
        message: `Inspected ${analysis.summary.totalIncoming} records (${analysis.summary.totalToAdd} new, ${analysis.summary.totalCollisions} collisions). Please review before applying.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Backup Analysis Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Execute restore with user-approved collision policy
  const handleExecuteRestore = async (overwriteCollisions) => {
    if (!pendingBackupPayload) return;
    try {
      setLoading(true);
      const res = await dataService.importBackupJson(pendingBackupPayload, { overwriteCollisions });
      addToast({
        type: 'success',
        title: 'Restore Completed',
        message: `Successfully applied: ${res.added} added, ${res.updated} updated, ${res.skipped} skipped.`,
      });
      setRestoreAnalysis(null);
      setPendingBackupPayload(null);
      setOverwriteConfirmOpen(false);

      if (refreshLocalData) {
        await refreshLocalData();
      }
      await fetchStats();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Restore Failed (Rolled Back)',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore Baseline Divisional Datasets
  const handleConfirmReset = async () => {
    try {
      setLoading(true);
      if (dataService.resetToBaselineDatasets) {
        await dataService.resetToBaselineDatasets();
      } else if (dataService.resetToDemoDatasets) {
        await dataService.resetToDemoDatasets();
      }
      if (refreshLocalData) {
        await refreshLocalData();
      }
      await fetchStats();
      addToast({
        type: 'info',
        title: 'Baseline Masters Restored',
        message: 'Local IndexedDB initialized with project enterprise reference standards.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Operation Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
      setResetConfirmOpen(false);
    }
  };

  const modules = [
    { name: 'Financial Years', key: 'financialYears', count: stats?.financialYears ?? 0, icon: Calendar, color: 'text-blue-600' },
    { name: 'Work Orders', key: 'workOrders', count: stats?.workOrders ?? 0, icon: FileSpreadsheet, color: 'text-indigo-600' },
    { name: 'Agreements', key: 'agreements', count: stats?.agreements ?? 0, icon: FileSignature, color: 'text-violet-600' },
    { name: 'Billing Vouchers', key: 'billing', count: stats?.billing ?? 0, icon: Receipt, color: 'text-emerald-600' },
    { name: 'Subdivisions', key: 'subdivisions', count: stats?.subdivisions ?? 0, icon: Network, color: 'text-amber-600' },
    { name: 'FMD / SD Custody', key: 'fmdSd', count: stats?.fmdSd ?? 0, icon: ShieldCheck, color: 'text-rose-600' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Local Database & Storage Management"
        subtitle="Manage local IndexedDB persistence, offline backup files, and data restoration."
        size="lg"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Hidden File Input for JSON Backup Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          {/* Storage Overview Card */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    IndexedDB Local Storage (Dexie.js)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Database: <span className="font-mono text-slate-700">TenderFlowERP_DB</span> • Browser Persisted
                  </p>
                </div>
              </div>
              <Badge variant="success">Active (Offline-First)</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.key} className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-4 w-4 ${m.color}`} />
                      <span className="text-base font-extrabold text-slate-800">
                        {m.count}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 truncate">
                      {m.name}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span>Total Local Records:</span>
              <strong className="text-sm text-blue-700">{stats?.total ?? 0} records</strong>
            </div>
          </div>

          {/* Action Tools: Export, Import, Reset */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Export JSON */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-2.5">
                  <Download className="h-4 w-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900">Export Backup</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Download all 6 modules as a timestamped JSON file for offline backup.
                </p>
              </div>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={handleExportBackup}
                  disabled={loading}
                  className="w-full"
                >
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Import JSON */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 mb-2.5">
                  <Upload className="h-4 w-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900">Restore Backup</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Select a TenderFlow JSON backup file to restore records into IndexedDB.
                </p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  onClick={handleTriggerImport}
                  disabled={loading}
                  className="w-full"
                >
                  Import JSON
                </Button>
              </div>
            </div>

            {/* Restore Official Baseline Masters */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 mb-2.5">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <h5 className="text-xs font-bold text-slate-900">Restore Baseline Masters</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Re-initialize local database with official PWD Division 1 baseline master records.
                </p>
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={loading}
                  className="w-full text-slate-700 hover:text-amber-800"
                >
                  Restore Baseline
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Restore Baseline Divisional Master Datasets?"
        message="This administrative action will re-initialize your local database with official baseline standards for PWD Division 1. Ensure you have exported a verified JSON backup before proceeding. Are you sure you want to proceed?"
        confirmText="Yes, Restore Masters"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Pre-Flight Backup Comparison & Review Modal */}
      {restoreAnalysis && (
        <Modal
          isOpen={Boolean(restoreAnalysis)}
          onClose={() => {
            setRestoreAnalysis(null);
            setPendingBackupPayload(null);
          }}
          title="Restore Pre-Flight Comparison & Safety Review"
          subtitle={`Inspect records from ${restoreAnalysis.app || 'Backup'} (${restoreAnalysis.format || 'JSON'}) before committing to IndexedDB.`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2.5">
              <span className="text-xs text-slate-500">
                Safe restore preserves existing local records via ACID rollback transaction.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRestoreAnalysis(null);
                    setPendingBackupPayload(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExecuteRestore(false)}
                  disabled={loading || restoreAnalysis.summary.totalToAdd === 0}
                  icon={CheckCircle2}
                >
                  Add New Only ({restoreAnalysis.summary.totalToAdd})
                </Button>
                {restoreAnalysis.summary.totalCollisions > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setOverwriteConfirmOpen(true)}
                    disabled={loading}
                    icon={AlertTriangle}
                  >
                    Overwrite Collisions ({restoreAnalysis.summary.totalCollisions})
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Metric Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Incoming</span>
                <span className="text-lg font-black text-slate-900">{restoreAnalysis.summary.totalIncoming}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">New Records</span>
                <span className="text-lg font-black text-emerald-700">+{restoreAnalysis.summary.totalToAdd}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Collisions</span>
                <span className="text-lg font-black text-amber-800">{restoreAnalysis.summary.totalCollisions}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Identical</span>
                <span className="text-lg font-black text-slate-600">{restoreAnalysis.summary.totalIdentical}</span>
              </div>
            </div>

            {/* Collision Warning Banner */}
            {restoreAnalysis.summary.totalCollisions > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-amber-900">Collision Warning Detected</h4>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    {restoreAnalysis.summary.totalCollisions} incoming record(s) share identical keys with existing local records, but have differing values. Clicking <strong>"Add New Only"</strong> will safely insert new items while leaving your existing records untouched.
                  </p>
                </div>
              </div>
            )}

            {/* Six-Module Pre-Flight Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                Module Breakdown
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-3.5 py-2">Module</th>
                    <th className="px-3 py-2 text-center">Incoming</th>
                    <th className="px-3 py-2 text-center text-emerald-700">To Add</th>
                    <th className="px-3 py-2 text-center text-amber-700">Collisions</th>
                    <th className="px-3 py-2 text-center text-slate-500">Identical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(restoreAnalysis.modules).map(([modKey, mod]) => (
                    <tr key={modKey} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2 font-medium text-slate-800">{mod.label}</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700">{mod.incomingCount}</td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-700">
                        {mod.toAdd.length > 0 ? `+${mod.toAdd.length}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-amber-700">
                        {mod.collisions.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                            {mod.collisions.length}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400">
                        {mod.identical.length > 0 ? mod.identical.length : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Explicit Overwrite Confirmation Dialog */}
      <ConfirmDialog
        isOpen={overwriteConfirmOpen}
        onClose={() => setOverwriteConfirmOpen(false)}
        onConfirm={() => handleExecuteRestore(true)}
        title="Confirm Overwriting Colliding Records?"
        message={`Are you sure you want to overwrite ${restoreAnalysis?.summary?.totalCollisions ?? 0} existing records in IndexedDB with values from this backup file? Existing values will be replaced.`}
        confirmText="Yes, Overwrite Collisions"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
