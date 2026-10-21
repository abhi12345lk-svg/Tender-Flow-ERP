  import React, { useState, useEffect } from 'react';
  import { Outlet } from 'react-router-dom';
  import Sidebar from './Sidebar';
  import Topbar from './Topbar';
  import ToastContainer from '../common/Toast';
  import PwaNotification from '../common/PwaNotification';
  import { useApp } from '../../context/AppContext';

  export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { toasts, removeToast } = useApp();

    // Prevent body scrolling when mobile drawer is open
    useEffect(() => {
      if (mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [mobileMenuOpen]);

    // Close mobile drawer on desktop resize
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setMobileMenuOpen(false);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleToggleSidebar = () => {
      // If screen is mobile/tablet, toggle drawer
      if (window.innerWidth < 768) {
        setMobileMenuOpen(!mobileMenuOpen);
      } else {
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex">
        {/* Toast Notification Container */}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />

        {/* PWA Update & Offline Notification */}
        <PwaNotification />

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay & Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl">
              <Sidebar
                collapsed={false}
                onToggle={() => setMobileMenuOpen(false)}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
          }`}
        >
          <Topbar onToggleSidebar={handleToggleSidebar} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200/80 bg-white py-3.5 px-6 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              <strong className="text-slate-700">TenderFlow ERP</strong> &copy; {new Date().getFullYear()} Commercial Project & Contract ERP. All rights reserved.
            </span>
            <span className="text-[11px] text-slate-400">
              Enterprise Grade Works, Contracts & Billing Management
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
