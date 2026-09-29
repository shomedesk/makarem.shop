import React from 'react';
import { Store, User, LogOut, ShieldCheck } from 'lucide-react';
import type { CustomerProfile } from '../types';

interface NavbarProps {
  currentView: 'customer' | 'admin';
  onViewChange: (view: 'customer' | 'admin') => void;
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  salesplayConnected: boolean;
  customerProfile: CustomerProfile | null;
  onOpenProfile: () => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  language,
  onLanguageChange,
  salesplayConnected,
  customerProfile,
  onOpenProfile,
  isAdminLoggedIn,
  onAdminLogout,
}) => {
  const isAr = language === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer"
            onClick={() => onViewChange('customer')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Store className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate">
                  MAKAREM AL-KHAIR
                </h1>
                <span className="hidden xs:inline-block px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                  OMAN
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-['Cairo',sans-serif] truncate">
                {isAr ? 'مكارم الخير • بقالة وخدمة السيارات' : 'Makarem Al-Khair Express & Curbside'}
              </p>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* SalesPlay POS Status Indicator */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                salesplayConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  salesplayConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>SalesPlay POS</span>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
              className="px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            >
              {isAr ? 'EN' : 'عربي'}
            </button>

            {/* Customer Profile / My Account Button */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                <User className="w-3 h-3" />
              </div>
              <span className="truncate max-w-[90px] sm:max-w-none font-mono">
                {customerProfile?.phone || (isAr ? 'حسابي' : 'My Profile')}
              </span>
            </button>

            {/* If Admin View is active, show exit/logout */}
            {currentView === 'admin' && (
              <div className="flex items-center gap-1 pl-1">
                <button
                  type="button"
                  onClick={() => onViewChange('customer')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{isAr ? 'واجهة الزبائن' : 'Shop View'}</span>
                </button>
                {isAdminLoggedIn && (
                  <button
                    type="button"
                    onClick={onAdminLogout}
                    title={isAr ? 'تسجيل خروج الإدارة' : 'Logout Admin'}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
