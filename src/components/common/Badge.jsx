import React from 'react';

const VARIANT_MAP = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
  issued: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
  'in progress': 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/10',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
  passed: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
  draft: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
  submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
  'under review': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
  closed: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
  upcoming: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10',
  default: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
};

export default function Badge({ children, variant, size = 'md', className = '' }) {
  const normalizedVariant = (variant || children || '').toString().toLowerCase();
  const matchedStyle = VARIANT_MAP[normalizedVariant] || VARIANT_MAP.default;

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-1.5 py-0.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ring-1 ring-inset ${sizeClasses} ${matchedStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {children}
    </span>
  );
}
