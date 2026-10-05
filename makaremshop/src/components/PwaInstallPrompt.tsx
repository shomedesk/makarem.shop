import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';

interface PwaInstallPromptProps {
  language: 'en' | 'ar';
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ language }) => {
  const isAr = language === 'ar';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('makarem_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isInstalled || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('makarem_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Sleek Native Install Strip Banner */}
      {(isInstallable || isIOS) && (
        <div className="bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 border-b border-emerald-500/30 flex items-center justify-between gap-2 shadow-xs text-xs animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-extrabold text-white text-xs block truncate">
                {isAr ? 'تثبيت تطبيق مكارم الخير' : 'Install Makarem Al-Khair App'}
              </span>
              <span className="text-[10px] text-slate-300 block truncate">
                {isAr ? 'وصول فوري من شاشة هاتفك الرئيسية كاختصار' : 'Add to home screen for 1-tap fast access'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] sm:text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تثبيت التطبيق' : 'Install PWA'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white"
              title={isAr ? 'إغلاق' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'تثبيت على الآيفون (iOS)' : 'Install on iPhone / iPad'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <p>
                  {isAr
                    ? 'اضغط على زر المشاركة في شريط المتصفح سفلي:'
                    : 'Tap the Share icon at the bottom of Safari:'}
                  <Share2 className="w-4 h-4 inline-block mx-1.5 text-blue-600" />
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <p>
                  {isAr
                    ? 'اختر "إضافة إلى الشاشة الرئيسية":'
                    : 'Scroll and select "Add to Home Screen":'}
                  <PlusSquare className="w-4 h-4 inline-block mx-1.5 text-emerald-600" />
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <p>
                  {isAr
                    ? 'اضغط على "إضافة" في الزاوية العلوية وسيظهر التطبيق على شاشتك!'
                    : 'Tap "Add" in the top right. The app shortcut will appear on your home screen!'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              {isAr ? 'فهمت، حسناً' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
