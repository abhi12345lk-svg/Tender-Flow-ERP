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
  
  Landmark,
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
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm ring-1 ring-white/10">
            <Landmark className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="block text-sm font-bold tracking-tight text-white leading-tight">
                TenderFlow <span className="text-blue-400 font-extrabold">ERP</span>
              </span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Govt. Works Division
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggle}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Button (Touch target 36x36) */}
        <button
          onClick={onToggle}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700 transition-colors"
          aria-label="Close navigation drawer"
          title="Close Navigation"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 mb-2">
          {!collapsed ? (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Business Modules
            </span>
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
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 sm:py-2 text-xs font-medium transition-all duration-150 min-h-[42px] sm:min-h-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white active:bg-slate-800'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate flex-1">{item.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                      count > 0
                        ? 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* System Status / Environment Note */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        {!collapsed ? (
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-semibold text-[11px] text-slate-300">Production Edition</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400">
              Active FY: <span className="font-medium text-blue-400">FY {context.activeFY}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Fully Secured & Responsive
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title={`Active FY: ${context.activeFY}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
