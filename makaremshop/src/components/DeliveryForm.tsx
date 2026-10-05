import React, { useState } from 'react';
import {
  Home,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  User,
  Loader2,
} from 'lucide-react';
import type { LocationCoordinates, PaymentMethod } from '../types';

interface DeliveryFormProps {
  houseNumber: string;
  onHouseNumberChange: (val: string) => void;
  locationCoordinates: LocationCoordinates | undefined;
  onLocationCoordinatesChange: (coords: LocationCoordinates | undefined) => void;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (val: PaymentMethod) => void;
  language: 'en' | 'ar';
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  houseNumber,
  onHouseNumberChange,
  locationCoordinates,
  onLocationCoordinatesChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  paymentMethod,
  onPaymentMethodChange,
  language,
}) => {
  const isAr = language === 'ar';
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handlePinpointLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(
        isAr
          ? 'المتصفح لا يدعم تحديد الموقع الجغرافي. يرجى كتابة العنوان يدوياً.'
          : 'Geolocation is not supported by your browser. Please type your address manually.'
      );
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        onLocationCoordinatesChange({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp,
          mapUrl,
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let msg = isAr ? 'تعذر تحديد الموقع تلقائياً. تأكد من تفعيل الـ GPS ومشاركة الموقع.' : 'Could not detect GPS location. Please check browser location permissions.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = isAr ? 'تم رفض إذن مشاركة الموقع. يرجى السماح بالموقع أو كتابة رقم العمارة بدقة.' : 'Location access was denied. Please allow location permissions in your browser or type house details.';
        }
        setGeoError(msg);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
          <Home className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {isAr ? 'بيانات التوصيل السريع للمنزل' : 'Nearby Neighborhood Delivery Details'}
          </h3>
          <p className="text-xs text-slate-500 font-['Cairo',sans-serif]">
            {isAr
              ? 'أدخل رقم العمارة أو الفيلا وانقر زر تحديد الموقع بالـ GPS ليصل مندوبنا مباشرة لبابك'
              : 'Enter your house number and click the 1-click GPS pin button so our runner reaches your door'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* House / Flat / Villa Number (Required) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'رقم العمارة / الفيلا / الشقة والدور *' : 'Building / Villa / Flat & Floor # *'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Home className="w-4 h-4 text-teal-600" />
            </div>
            <input
              type="text"
              required
              value={houseNumber}
              onChange={(e) => onHouseNumberChange(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: عمارة رقم ١٤، الدور الثاني، شقة رقم ٥ (بجوار المسجد)'
                  : 'e.g. Building 14, 2nd Floor, Apt 5 (Opposite Mosque)'
              }
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 1-Click GPS Pinpoint Button Section */}
        <div className="sm:col-span-2 p-4 rounded-xl bg-teal-50/60 border border-teal-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-teal-900">
                  {isAr ? 'تحديد الموقع الجغرافي الدقيق بنقرة واحدة' : '1-Click Exact GPS Location Pinpoint'}
                </span>
              </div>
              <p className="text-[11px] text-teal-700 mt-0.5">
                {isAr
                  ? 'يحدد إحداثيات موقعك الحالي عبر GPS لمساعدة مندوب البقالة في الوصول سريعاً'
                  : 'Captures your exact GPS coordinates to guide the store runner directly to your doorstep'}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePinpointLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري تحديد الموقع...' : 'Detecting GPS...'}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>{isAr ? '📍 اضغط لتحديد موقعي بدقة' : '📍 Pinpoint My Location'}</span>
                </>
              )}
            </button>
          </div>

          {/* Captured Coordinates Banner */}
          {locationCoordinates && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-teal-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>{isAr ? 'تم تثبيت الموقع بنجاح' : 'Location Pinned Successfully'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                      ±{locationCoordinates.accuracy}m accuracy
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {locationCoordinates.lat.toFixed(5)}, {locationCoordinates.lng.toFixed(5)}
                  </div>
                </div>
              </div>

              {locationCoordinates.mapUrl && (
                <a
                  href={locationCoordinates.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100 transition shrink-0"
                >
                  <span>{isAr ? 'معاينة بالخريطة' : 'View Pin'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Error Message */}
          {geoError && (
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'رقم الجوال للتواصل *' : 'Mobile / Contact Phone *'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              placeholder={isAr ? '05xxxxxxxx' : '+966 5x xxx xxxx'}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'اسم المستلم (اختياري)' : 'Recipient Name (Optional)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder={isAr ? 'أبو خالد' : 'e.g. Khalid'}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          {isAr ? 'طريقة الدفع عند الباب *' : 'Payment Method *'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onPaymentMethodChange('cash')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
              paymentMethod === 'cash'
                ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-teal-100 text-teal-700 shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">{isAr ? 'نقداً عند الاستلام' : 'Cash upon Delivery'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? 'الدفع نقداً للمندوب' : 'Pay cash at door'}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPaymentMethodChange('card')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
              paymentMethod === 'card'
                ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-teal-100 text-teal-700 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">{isAr ? 'شبكة / مدى بالباب' : 'Card / POS Machine'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? 'المندوب يحضر جهاز مدى' : 'Runner brings portable POS'}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPaymentMethodChange('online')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
              paymentMethod === 'online'
                ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-teal-100 text-teal-700 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">{isAr ? 'دفع إلكتروني / تحويل' : 'Online / Apple Pay'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? 'تحويل سريع أو STC Pay' : 'STC Pay / Transfer'}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
