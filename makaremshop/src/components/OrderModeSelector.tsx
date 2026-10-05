import React from 'react';
import { Car, Home, Zap, MapPin, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import type { OrderType } from '../types';

interface OrderModeSelectorProps {
  selectedMode: OrderType;
  onSelectMode: (mode: OrderType) => void;
  language: 'en' | 'ar';
}

export const OrderModeSelector: React.FC<OrderModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          {isAr ? 'تسوق سريع بدون عناء أو انتظار' : 'Fast, Hassle-Free Shopping Assistant'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isAr ? 'كيف ترغب في استلام طلبك اليوم؟' : 'How Would You Like Your Order?'}
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto mt-1 font-['Cairo',sans-serif]">
          {isAr
            ? 'سواء كنت متوقفاً بسيارتك أمام بقالتنا أو في منزلك بالحي، سنقوم بتجهيز مشترياتك فوراً'
            : 'Parked outside in your car or relaxing at home nearby? We prepare and bring your groceries directly to you.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Curbside / In-Car Option */}
        <button
          type="button"
          onClick={() => onSelectMode('curbside')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
            selectedMode === 'curbside'
              ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          {selectedMode === 'curbside' && (
            <div className="absolute top-4 right-4 text-emerald-600">
              <CheckCircle2 className="w-6 h-6 fill-emerald-100" />
            </div>
          )}

          <div className="flex items-start gap-4">
            <div
              className={`w-13 h-13 rounded-xl flex items-center justify-center shrink-0 ${
                selectedMode === 'curbside'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Car className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">
                  {isAr ? 'استلام بالسيارة أمام المحل' : 'In-Car / Curbside Pickup'}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-md">
                  ⚡ 5-10 Min
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {isAr
                  ? 'أدخل رقم أو لوحة سيارتك. جهز طلبك وسيقوم عامل المتجر بإحضار الأكياس وجهاز مدى حتى نافذة سيارتك.'
                  : 'Parked in front of Makarem Al-Khair? Enter your car plate/number. We pack and bring bags & card machine to your car window.'}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {isAr ? 'رقم السيارة مطلوب' : 'Vehicle Plate Required'}
                </span>
                <span>•</span>
                <span>{isAr ? 'كاش أو جهاز شبكة' : 'Cash or Card POS'}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Neighborhood Home Delivery Option */}
        <button
          type="button"
          onClick={() => onSelectMode('neighborhood_delivery')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
            selectedMode === 'neighborhood_delivery'
              ? 'border-teal-600 bg-teal-50/70 shadow-md ring-2 ring-teal-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          {selectedMode === 'neighborhood_delivery' && (
            <div className="absolute top-4 right-4 text-teal-600">
              <CheckCircle2 className="w-6 h-6 fill-teal-100" />
            </div>
          )}

          <div className="flex items-start gap-4">
            <div
              className={`w-13 h-13 rounded-xl flex items-center justify-center shrink-0 ${
                selectedMode === 'neighborhood_delivery'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-teal-100 text-teal-700'
              }`}
            >
              <Home className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">
                  {isAr ? 'توصيل للمنازل والعمائر المجاورة' : 'Nearby Neighborhood Delivery'}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-100 text-teal-800 rounded-md">
                  📍 GPS Pinpoint
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {isAr
                  ? 'لسكان الحي والمنازل القريبة. أدخل رقم العمارة/الفيلا وانقر زر تحديد موقعك الدقيق بالـ GPS لنوصل لبابك فوراً.'
                  : 'For neighboring buildings and villas. Enter house number and pinpoint your GPS location with 1 click for direct door delivery.'}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-teal-800">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {isAr ? 'تحديد الموقع بنقرة واحدة' : '1-Click GPS Pin'}
                </span>
                <span>•</span>
                <span>{isAr ? 'رقم العمارة / الشقة' : 'House / Flat #'}</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
