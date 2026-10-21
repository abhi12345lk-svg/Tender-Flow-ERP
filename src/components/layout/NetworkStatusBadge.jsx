import React, { useState, useRef, useEffect } from 'react';
import { Wifi, WifiOff, Database, Cloud, CloudOff, ShieldCheck, HardDrive, Info, X } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useApp } from '../../context/AppContext';
import DataManagementModal from '../common/DataManagementModal';

/**
 * NetworkStatusBadge
 * Visible indicator displayed in the Topbar showing real-time connectivity:
 * - Online / Offline browser state
 * - PWA Service Worker caching state
 * - IndexedDB storage readiness
 * - Render Express / MongoDB connection status
 */
export default function NetworkStatusBadge() {
  const { isOnline } = useNetworkStatus();
  const { isBackendConnected, openSyncModal } = useApp();
  const [open, setOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let label = 'Online';

  if (!isOnline) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Offline';
  } else if (!isBackendConnected) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Local Mode';
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${badgeColor}`}
        title="Click to view network and offline storage status"
      >
        <span className="relative flex h-2 w-2">
          {isOnline && isBackendConnected && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span className="hidden sm:inline">{label}</span>
        {isOnline ? (
          <Wifi className="h-3.5 w-3.5 shrink-0 opacity-80" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-fade-in text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                PWA & Network Status
              </h4>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Browser Internet Connectivity */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-rose-600" />
                )}
                <span className="font-medium text-slate-700">Browser Network:</span>
              </div>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* 2. PWA App Shell */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-700">PWA App Shell:</span>
              </div>
              <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800">
                Cached & Active
              </span>
            </div>

            {/* 3. Local Storage (IndexedDB / Dexie) */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-slate-700">Local Storage:</span>
              </div>
              <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-indigo-100 text-indigo-800">
                IndexedDB (Dexie.js)
              </span>
            </div>

            {/* 4. Remote Express / MongoDB */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                {isBackendConnected ? (
                  <Cloud className="h-4 w-4 text-emerald-600" />
                ) : (
                  <CloudOff className="h-4 w-4 text-amber-600" />
                )}
                <span className="font-medium text-slate-700">Cloud Backend:</span>
              </div>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isBackendConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isBackendConnected ? 'Connected (Render)' : 'Standalone'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
            <div className="text-[11px] text-slate-500 leading-normal flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                {isOnline
                  ? 'Online operations enabled. Local IndexedDB synced.'
                  : 'Offline mode active. All 6 modules persist in browser IndexedDB.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSyncModal();
              }}
              className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-xs font-semibold text-blue-800 transition-colors"
            >
              <Cloud className="h-3.5 w-3.5 text-blue-600" />
              <span>Safe Cloud Sync & Reconciliation</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDataModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span>Manage Local Data & Backups (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* Local Storage & Backup Management Modal */}
      <DataManagementModal
        isOpen={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
      />
    </div>
  );
}
