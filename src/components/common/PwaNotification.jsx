import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle2, X, DownloadCloud } from 'lucide-react';
import Button from './Button';

/**
 * PWA Notification Banner & Safe Reload Controller
 * Handles:
 * 1. Notification when new frontend assets are downloaded and ready for activation
 * 2. Notification when app shell is cached for offline use
 * 3. Safe user-triggered reload without mid-flight interruption
 */
export default function PwaNotification() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[TenderFlow PWA] Service Worker registered:', r);
      }
    },
    onRegisterError(error) {
      console.warn('[TenderFlow PWA] Service Worker registration failed:', error);
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismissRefresh = () => {
    setNeedRefresh(false);
  };

  const handleDismissOffline = () => {
    setOfflineReady(false);
  };

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <aside aria-label="Application Notifications" className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-32px)]">
      {needRefresh && (
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xl ring-1 ring-blue-500/20 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <DownloadCloud className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">
                New Version Available
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                An updated version of TenderFlow ERP has been downloaded. Update now to activate the latest features and security enhancements.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={RefreshCw}
                  onClick={handleUpdate}
                  className="shadow-sm"
                >
                  Update & Refresh
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDismissRefresh}
                >
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismissRefresh}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {offlineReady && !needRefresh && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 backdrop-blur-xs p-3.5 shadow-xl ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Offline Mode Ready
                </p>
                <p className="text-[11px] text-emerald-700">
                  Application shell cached for offline access.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissOffline}
              className="text-emerald-700 hover:text-emerald-900 transition-colors p-1"
              aria-label="Close message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
