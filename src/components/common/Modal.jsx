import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-7xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  preventBackdropClose = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !preventBackdropClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, preventBackdropClose]);

  if (!isOpen) return null;

  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => !preventBackdropClose && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6 text-center">
        <div
          className={`w-full ${sizeClass} transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 flex flex-col max-h-[94vh] sm:max-h-[90vh]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80 shrink-0">
            <div className="pr-3">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">{title}</h3>
              {subtitle && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 active:bg-slate-200 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-5 flex-1 text-xs sm:text-sm text-slate-700">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
