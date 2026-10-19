import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
};

const ICON_STYLES = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
};

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        const style = STYLES[toast.type] || STYLES.info;
        const iconStyle = ICON_STYLES[toast.type] || ICON_STYLES.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all duration-200 ${style}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconStyle}`} />
            <div className="flex-1 text-xs">
              {toast.title && <div className="font-semibold text-sm mb-0.5">{toast.title}</div>}
              <div className="opacity-90">{toast.message}</div>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
