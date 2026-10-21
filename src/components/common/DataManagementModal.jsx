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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DataManagementModal({ isOpen, onClose }) {
  const { dataService, addToast, refreshLocalData } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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

  // Process Imported JSON
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const results = await dataService.importBackupJson(parsed);
      const totalImported = Object.values(results).reduce((a, b) => a + b, 0);

      addToast({
        type: 'success',
        title: 'Backup Restored',
        message: `Restored ${totalImported} records across all modules into IndexedDB.`,
      });

      if (refreshLocalData) {
        await refreshLocalData();
      }
      await fetchStats();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: `Invalid backup file: ${err.message}`,
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        message: 'Local IndexedDB initialized with official PWD Division 1 reference standards.',
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
    </>
  );
}
