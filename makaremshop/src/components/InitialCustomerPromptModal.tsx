import React, { useState } from 'react';
import { Sparkles, Phone, Car, Check, X, ShieldCheck } from 'lucide-react';
import type { CustomerProfile } from '../types';
import { saveCustomerProfileToFirestore } from '../services/customerService';

interface InitialCustomerPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved: (profile: CustomerProfile) => void;
  language: 'en' | 'ar';
}

export const InitialCustomerPromptModal: React.FC<InitialCustomerPromptModalProps> = ({
  isOpen,
  onClose,
  onProfileSaved,
  language,
}) => {
  const isAr = language === 'ar';
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم الجوال' : 'Please enter your mobile phone');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const cleanPhone = phone.trim();
    const cleanVehicle = vehicle.trim();

    const newProfile: CustomerProfile = {
      id: `cust_${cleanPhone.replace(/[^0-9]/g, '')}`,
      phone: cleanPhone,
      vehicleNumber: cleanVehicle || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCustomerProfileToFirestore(newProfile);
      onProfileSaved(newProfile);
      onClose();
    } catch (err) {
      console.warn('Customer prompt save notice:', err);
      onProfileSaved(newProfile);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-bounce-subtle">
        {/* Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>

          <h3 className="font-black text-xl">
            {isAr ? 'مرحباً بكم في بقالة مكارم الخير' : 'Welcome to Makarem Al-Khair!'}
          </h3>
          <p className="text-xs text-white/90 font-['Cairo',sans-serif] mt-1.5 leading-relaxed">
            {isAr
              ? 'احفظ رقم جوالك وسيارتك مرة واحدة لتسوق سريع واستلام فوري عند نافذة سيارتك بدون تكرار إدخال البيانات!'
              : 'Save your phone and car plate once for fast curbside pickup without retyping your details every time!'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {isAr ? 'رقم الجوال للتواصل *' : 'Mobile Phone Number *'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9xxxxxxx"
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {isAr ? 'رقم أو موديل السيارة (اختياري)' : 'Car Plate / Vehicle Model (Optional)'}
            </label>
            <div className="relative">
              <Car className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder={isAr ? 'مثال: كامري أبيض ٤٨٢١' : 'e.g. White Camry 4821'}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? 'يتم حفظ بياناتك بأمان في متصفحك وتبقى مسجلاً دائماً.'
                : 'Saved securely in your browser. Stays logged in permanently.'}
            </span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !phone.trim()}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ والبدء بالتسوق' : 'Save & Start Shopping'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              {isAr ? 'تخطي والمتابعة كزائر' : 'Skip for now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
