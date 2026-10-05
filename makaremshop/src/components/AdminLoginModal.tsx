import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  X,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import {
  loginAdminWithGoogle,
  loginAdminWithCredentials,
} from '../services/adminAuthService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  language: 'en' | 'ar';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  language,
}) => {
  const isAr = language === 'ar';
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [useEmailAuth, setUseEmailAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginAdminWithGoogle();
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Google login notice:', err);
      setErrorMsg(
        err.message ||
          (isAr
            ? 'فشل تسجيل الدخول أو الحساب غير مصرح له'
            : 'Access Denied: Only authorized store emails can access this portal.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginAdminWithCredentials(emailInput, passwordInput);
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Credentials login notice:', err);
      setErrorMsg(
        err.message ||
          (isAr
            ? 'البريد أو كلمة المرور غير صحيحة، أو الحساب غير مصرح له'
            : 'Access Denied: Unauthorized admin email or invalid credentials.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h3 className="font-black text-lg">
            {isAr ? 'تسجيل دخول الإدارة والكاشير' : 'Store Admin & Cashier Portal'}
          </h3>
          <p className="text-xs text-slate-300 font-['Cairo',sans-serif] mt-1">
            {isAr
              ? 'مخصص فقط للمشرفين والموظفين المصرح لهم لإدارة الطلبات ونقطة البيع'
              : 'Restricted portal for authorized Makarem Al-Khair staff only'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary 1-Click Google Sign In */}
          {!useEmailAuth ? (
            <div className="space-y-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isAr ? 'الدخول بحساب Google المعتمد' : 'Sign in with Google Account'}</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setUseEmailAuth(true)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  {isAr ? 'أو الدخول عبر البريد الإلكتروني وكلمة المرور' : 'Or sign in with email & password'}
                </button>
              </div>
            </div>
          ) : (
            /* Email & Password Form */
            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@makarem.om"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{isAr ? 'تسجيل الدخول' : 'Sign In as Admin'}</span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setUseEmailAuth(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  {isAr ? 'العودة للدخول بـ Google' : 'Back to Google sign in'}
                </button>
              </div>
            </form>
          )}

          {/* Security Notice (No emails exposed) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? 'الدخول محمي ومقتصر على حسابات المشرفين المعتمدة لدى بقالة مكارم الخير.'
                : 'Access restricted strictly to authorized Makarem Al-Khair staff accounts.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
