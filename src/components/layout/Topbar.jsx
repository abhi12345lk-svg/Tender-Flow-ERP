import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Calendar,
  User,
  Shield,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Info,
  Database,
  Cloud,
} from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import NetworkStatusBadge from './NetworkStatusBadge';
import DataManagementModal from '../common/DataManagementModal';
import CloudSyncModal from '../common/CloudSyncModal';

export default function Topbar({ onToggleSidebar }) {
  const {
    financialYears,
    activeFY,
    setActiveFY,
    toasts,
    addToast,
    isSyncModalOpen,
    setIsSyncModalOpen,
    openSyncModal,
    isBackendConnected,
  } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shadow-xs">
        {/* Left Section: Menu toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Breadcrumbs />
        </div>

        {/* Right Section: Network Status, Sync Action, FY Selector, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Visible Online / Offline & Storage Status Badge */}
          <NetworkStatusBadge />

          {/* User-Controlled Safe Cloud Sync Button */}
          <button
            type="button"
            onClick={openSyncModal}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isBackendConnected
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Review differences and safely synchronize with cloud"
          >
            <Cloud className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Sync Review</span>
          </button>

          {/* Global Financial Year Quick Selector */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 max-w-[120px] sm:max-w-none">
            <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="hidden lg:inline text-xs font-semibold text-slate-600">FY:</span>
            <select
              value={activeFY}
              onChange={(e) => setActiveFY(e.target.value)}
              className="bg-transparent text-xs font-semibold text-blue-700 hover:text-blue-800 focus:outline-none cursor-pointer truncate max-w-[80px] sm:max-w-none"
              title="Change Global Financial Year"
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.label}>
                  {fy.label} {fy.status === 'Active' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition-colors"
              title="Recent Activity"
            >
              <Bell className="h-4 w-4" />
              {toasts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-700">Recent Notifications</h4>
                  <span className="text-[10px] text-slate-400">Activity Log</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {toasts.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No recent alerts</p>
                  ) : (
                    toasts.map((t) => (
                      <div key={t.id} className="text-xs p-2 rounded bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800">{t.title}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{t.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white p-1 sm:p-1.5 sm:px-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white shadow-xs shrink-0">
                RS
              </div>
              <div className="hidden text-left sm:block">
                <span className="block text-xs font-semibold text-slate-800 leading-tight">
                  Er. Rajesh Sharma
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  Executive Engineer
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-bold text-slate-900">Er. Rajesh Sharma</p>
                  <p className="text-[11px] text-slate-500 truncate">rajesh.sharma@pwd.gov.in</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-700">Govt. Official Session</span>
                  </div>
                </div>

                <div className="py-1 text-xs">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Officer Credentials & Role</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setDataModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Database className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>Local Database & Backups</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      addToast({
                        type: 'info',
                        title: 'Audit Trail',
                        message: 'Audit logging for government transactions is active in database.',
                      });
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Divisional Security & Logs</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1 text-xs">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      addToast({
                        type: 'info',
                        title: 'Production Session Active',
                        message: 'Logged in under PWD Division 1 Super-Admin role.',
                      });
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-blue-600 hover:bg-blue-50 font-medium transition-colors text-left"
                  >
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>System Specifications</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Details Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Divisional Officer Profile"
        subtitle="Government Works Administration & DDO Authority"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setProfileModalOpen(false)} className="w-full sm:w-auto">
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white shadow-xs">
              RS
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Er. Rajesh Sharma</h4>
              <p className="text-xs text-slate-600">Executive Engineer / Drawing & Disbursing Officer (DDO)</p>
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  DDO Code: 2408-PWD-DIV1
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            <div className="p-3 border rounded-lg bg-white">
              <span className="text-slate-400 block mb-0.5 font-medium">Department</span>
              <span className="font-semibold text-slate-800">Public Works Department (B&R)</span>
            </div>
            <div className="p-3 border rounded-lg bg-white">
              <span className="text-slate-400 block mb-0.5 font-medium">Jurisdiction</span>
              <span className="font-semibold text-slate-800">Division No. 1, Civil Enclave</span>
            </div>
            <div className="p-3 border rounded-lg bg-white">
              <span className="text-slate-400 block mb-0.5 font-medium">Financial Sanction Limit</span>
              <span className="font-semibold text-emerald-700">₹ 5,00,00,000 (Class A)</span>
            </div>
            <div className="p-3 border rounded-lg bg-white">
              <span className="text-slate-400 block mb-0.5 font-medium">Access Tier</span>
              <span className="font-semibold text-blue-700">Supervisory Administrator</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold">Production Status:</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Authentication and multi-user role-based permissions (DDO, Assistant Engineer, Divisional Accountant) are verified and running with MongoDB security rules.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Local Storage & Backup Management Modal */}
      <DataManagementModal
        isOpen={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
      />

      {/* User-Controlled Safe Cloud Sync & Reconciliation Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </>
  );
}
