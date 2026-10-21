import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarRange,
  FileSpreadsheet,
  FileSignature,
  Receipt,
  Network,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// EXACTLY SIX BUSINESS MODULES as strictly required
const NAV_ITEMS = [
  {
    name: 'Financial Year',
    path: '/financial-year',
    icon: CalendarRange,
    badgeKey: 'financialYears',
  },
  {
    name: 'Work Order',
    path: '/work-orders',
    icon: FileSpreadsheet,
    badgeKey: 'workOrders',
  },
  {
    name: 'Agreement',
    path: '/agreements',
    icon: FileSignature,
    badgeKey: 'agreements',
  },
  {
    name: 'Billing',
    path: '/billing',
    icon: Receipt,
    badgeKey: 'billingList',
  },
  {
    name: 'Subdivision',
    path: '/subdivisions',
    icon: Network,
    badgeKey: 'subdivisions',
  },
  {
    name: 'FMD / SD',
    path: '/fmd-sd',
    icon: ShieldCheck,
    badgeKey: 'fmdList',
  },
];

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const context = useApp();

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#090D16] border-r border-slate-800/80 transition-all duration-300 ease-in-out shadow-2xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div
        className={`relative flex h-16 items-center border-b border-slate-800/80 transition-all duration-300 z-10 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <div
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? 'justify-center cursor-pointer group' : ''
          }`}
          onClick={collapsed ? onToggle : undefined}
          title={collapsed ? 'TenderFlow ERP — Click to expand' : undefined}
        >
          {/* Modern Enterprise Brand Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div className="truncate">
              <span className="block text-sm font-bold tracking-tight text-white leading-tight">
                TenderFlow{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent font-extrabold">
                  ERP
                </span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Contract & Project ERP
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button (Inside Header when Expanded) */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onToggle}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700 transition-colors"
          aria-label="Close navigation drawer"
          title="Close Navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop Expand Button (Floating cleanly on border seam when Collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="hidden md:flex absolute -right-3.5 top-5 z-40 h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-xl hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-2 mb-2.5">
          {!collapsed ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 inline-block" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Operations & Registers
              </span>
            </div>
          ) : (
            <div className="h-2" />
          )}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const count = context[item.badgeKey]?.length || 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={collapsed ? `${item.name} (${count})` : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl transition-all duration-150 min-h-[42px] sm:min-h-0 ${
                  collapsed
                    ? 'justify-center p-2.5'
                    : 'gap-3 px-3.5 py-2.5 text-xs font-medium'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white active:bg-slate-800/90'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Subtle active left edge indicator when expanded */}
                  {isActive && !collapsed && (
                    <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-white shadow-xs" />
                  )}

                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-blue-400 group-hover:scale-105'
                    }`}
                  />

                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 tracking-wide">{item.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition-colors ${
                          isActive
                            ? 'bg-white/25 text-white backdrop-blur-xs'
                            : count > 0
                            ? 'bg-slate-800/90 text-slate-300 border border-slate-700/60 group-hover:border-slate-600 group-hover:text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* System Status / Environment Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-xs">
        {!collapsed ? (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3 text-xs shadow-inner">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="font-bold text-[10px] text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
                Enterprise Suite
              </span>
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
              <span>Financial Year:</span>
              <span className="font-bold text-blue-400 font-mono">
                FY {context.activeFY || '2024-2025'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Offline-First IndexedDB Engine
            </p>
          </div>
        ) : (
          <div
            className="flex justify-center py-1 cursor-pointer"
            onClick={onToggle}
            title={`TenderFlow Enterprise Suite — Active (FY ${context.activeFY})`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
