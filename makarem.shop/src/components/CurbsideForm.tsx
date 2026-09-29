import React from 'react';
import { Car, CreditCard, Banknote, Smartphone, User, Phone, MapPin } from 'lucide-react';
import type { PaymentMethod } from '../types';

interface CurbsideFormProps {
  vehicleNumber: string;
  onVehicleNumberChange: (val: string) => void;
  parkingSpot: string;
  onParkingSpotChange: (val: string) => void;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (val: PaymentMethod) => void;
  language: 'en' | 'ar';
}

export const CurbsideForm: React.FC<CurbsideFormProps> = ({
  vehicleNumber,
  onVehicleNumberChange,
  parkingSpot,
  onParkingSpotChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  paymentMethod,
  onPaymentMethodChange,
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {isAr ? 'بيانات الاستلام أمام المحل (بالسيارة)' : 'Curbside Vehicle & Payment Details'}
          </h3>
          <p className="text-xs text-slate-500 font-['Cairo',sans-serif]">
            {isAr
              ? 'ساعدنا في التعرف على سيارتك لتسليم الأغراض وجهاز الدفع عند النافذة'
              : 'Tell us your vehicle info so our staff can bring items and POS machine directly to your window'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehicle Number / Plate (Required) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'رقم أو لوحة السيارة والموديل *' : 'Vehicle Plate / Car Model *'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Car className="w-4 h-4 text-emerald-600" />
            </div>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => onVehicleNumberChange(e.target.value)}
              placeholder={isAr ? 'مثال: كامري أبيض ٤٨٢١ أو لوحة أ ب ج ١٢٣' : 'e.g. White Camry 4821 or Plate ABC-123'}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAr
              ? 'ضروري ليتعرف عليك عامل المتجر ويحضر الطلب فوراً إلى سيارتك'
              : 'Essential for our runner to locate your car outside the storefront'}
          </p>
        </div>

        {/* Parking Spot / Curb Location */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'مكان الوقوف أمام البقالة' : 'Storefront Parking Spot / Curb'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={parkingSpot}
              onChange={(e) => onParkingSpotChange(e.target.value)}
              placeholder={isAr ? 'مثال: أمام الباب الرئيسي، الموقف الثاني' : 'e.g. Main door curb, Bay 2, Near ATM'}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'رقم الجوال *' : 'Mobile / Phone Number *'}
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
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Customer Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            {isAr ? 'اسم العميل (اختياري)' : 'Customer Name (Optional)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder={isAr ? 'أبو محمد' : 'e.g. Mohammed / Santu'}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          {isAr ? 'طريقة الدفع المطلوبة عند الاستلام *' : 'Payment Method *'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Card / POS Terminal */}
          <button
            type="button"
            onClick={() => onPaymentMethodChange('card')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
              paymentMethod === 'card'
                ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">{isAr ? 'بطاقة / مدى عند الشباك' : 'Card / POS Machine'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? 'عامل المتجر يحضر جهاز الشبكة' : 'Runner brings wireless POS'}</div>
            </div>
          </button>

          {/* Cash */}
          <button
            type="button"
            onClick={() => onPaymentMethodChange('cash')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
              paymentMethod === 'cash'
                ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">{isAr ? 'نقداً عند الاستلام' : 'Cash to Runner'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? 'كاش عند نافذة السيارة' : 'Pay cash at car window'}</div>
            </div>
          </button>

          {/* Online / Transfer */}
          <button
            type="button"
            onClick={() => onPaymentMethodChange('online')}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
              paymentMethod === 'online'
                ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">{isAr ? 'دفع إلكتروني / تحويل' : 'Online / Apple Pay'}</div>
              <div className="text-[10px] text-slate-500">{isAr ? 'مدى أو STC Pay' : 'STC Pay / Mada link'}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
