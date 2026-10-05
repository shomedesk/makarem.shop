import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Home,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  Minus,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Package,
  X,
} from 'lucide-react';
import type { OrderType, PaymentMethod, OrderItem, InventoryItem, LocationCoordinates } from '../types';

interface StepByStepOrderWizardProps {
  catalog: InventoryItem[];
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  vehicleNumber: string;
  onVehicleNumberChange: (num: string) => void;
  houseNumber: string;
  onHouseNumberChange: (num: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (phone: string) => void;
  locationCoordinates: LocationCoordinates | undefined;
  onLocationCoordinatesChange: (coords: LocationCoordinates | undefined) => void;
  selectedItems: OrderItem[];
  onUpdateQuantity: (item: InventoryItem, delta: number) => void;
  customNotes: string;
  onCustomNotesChange: (notes: string) => void;
  paymentMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
  houseDeliveryEnabled?: boolean;
  language: 'en' | 'ar';
}

export const StepByStepOrderWizard: React.FC<StepByStepOrderWizardProps> = ({
  catalog,
  orderType,
  onOrderTypeChange,
  vehicleNumber,
  onVehicleNumberChange,
  houseNumber,
  onHouseNumberChange,
  customerPhone,
  onCustomerPhoneChange,
  locationCoordinates,
  onLocationCoordinatesChange,
  selectedItems,
  onUpdateQuantity,
  customNotes,
  onCustomNotesChange,
  paymentMethod,
  onPaymentMethodChange,
  onSubmitOrder,
  isSubmitting,
  submitError,
  houseDeliveryEnabled = false,
  language,
}) => {
  const isAr = language === 'ar';
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const stepTopRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top on step change so Step 4 payment options are immediately in view
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (stepTopRef.current) {
      stepTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  // Search & real category filter for Step 3
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showNotesBox, setShowNotesBox] = useState(false);

  // Extract REAL categories ONLY from SalesPlay catalog
  const realCategories = ['All', ...Array.from(new Set(catalog.map((i) => i.category || 'General')))];

  const filteredCatalog = catalog.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arabicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const getItemQuantity = (productId: string): number => {
    const found = selectedItems.find((i) => i.productId === productId);
    return found ? found.quantity : 0;
  };

  const totalAmount = selectedItems.reduce((acc, i) => acc + i.total, 0);
  const totalItemCount = selectedItems.reduce((acc, i) => acc + i.quantity, 0);

  // GPS Pinpoint Handler
  const handlePinpointLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(
        isAr
          ? 'المتصفح لا يدعم تحديد الموقع. يرجى كتابة رقم العمارة.'
          : 'Geolocation not supported by browser. Please type house number.'
      );
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        onLocationCoordinatesChange({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp,
          mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geo error:', err);
        setGeoError(
          isAr
            ? 'تعذر التقاط الـ GPS. تأكد من تفعيل إذن الموقع.'
            : 'Could not access GPS. Please check location permissions.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Step Validation
  const handleNextFromStep2 = () => {
    setStepError(null);
    if (orderType === 'curbside') {
      if (!vehicleNumber.trim()) {
        setStepError(
          isAr
            ? 'يرجى كتابة رقم أو لوحة وموديل السيارة فقط'
            : 'Please enter your car / vehicle plate number'
        );
        return;
      }
    } else {
      if (!houseNumber.trim()) {
        setStepError(
          isAr
            ? 'يرجى كتابة رقم العمارة أو الفيلا والشقة'
            : 'Please enter your house / building number'
        );
        return;
      }
      if (!customerPhone.trim()) {
        setStepError(
          isAr
            ? 'يرجى كتابة رقم الجوال للتواصل'
            : 'Please enter your mobile phone number'
        );
        return;
      }
    }
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    setStepError(null);
    if (selectedItems.length === 0 && !customNotes.trim()) {
      setStepError(
        isAr
          ? 'اختر صنفاً واحداً على الأقل أو اكتب ما تحتاجه في الصندوق'
          : 'Please select at least 1 item or write your requested items'
      );
      return;
    }
    setCurrentStep(4);
  };

  const stepsList = [
    { num: 1, labelEn: 'Location', labelAr: 'المكان' },
    { num: 2, labelEn: 'Details', labelAr: 'البيانات' },
    { num: 3, labelEn: 'Products', labelAr: 'المنتجات' },
    { num: 4, labelEn: 'Payment', labelAr: 'الدفع' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-24 sm:pb-16">
      {/* Sleek Compact Step Progress Indicator */}
      <div className="bg-white px-3 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between relative max-w-md mx-auto">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {stepsList.map((st) => {
            const isDone = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <div
                key={st.num}
                className="relative z-10 flex flex-col items-center cursor-pointer"
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num);
                }}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] sm:text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-3 ring-emerald-100 shadow-xs'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : st.num}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-bold mt-1 ${
                    isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {isAr ? st.labelAr : st.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Select Car vs House (Mobile-Optimized & Snug) */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 sm:space-y-6 max-w-xl mx-auto">
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {isAr ? 'الخطوة الأولى' : 'Step 1 of 4'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {isAr ? 'أين تتواجد حالياً؟' : 'Where are you right now?'}
            </h2>
            <p className="text-xs text-slate-500 font-['Cairo',sans-serif] mt-1">
              {isAr
                ? 'اختر إن كنت متوقفاً بالسيارة أمام بقالتنا أو ترغب بالتوصيل للمنزل'
                : 'Select if you are in your car outside or at home nearby'}
            </p>
          </div>

          <div className={`grid gap-3 pt-1 ${houseDeliveryEnabled ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Curbside Car */}
            <button
              type="button"
              onClick={() => onOrderTypeChange('curbside')}
              className={`p-4 sm:p-5 rounded-2xl border-2 text-center flex flex-col items-center gap-2.5 transition cursor-pointer ${
                orderType === 'curbside'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                  orderType === 'curbside'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Car className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {isAr ? 'بالسيارة أمام المحل' : 'In Car Outside'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'أغراضك تصل لنافذة سيارتك' : 'Runner brings bags to window'}
                </p>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                ⚡ {isAr ? 'رقم السيارة فقط' : 'Car plate only'}
              </span>
            </button>

            {/* Neighborhood House - ONLY rendered when admin activates it */}
            {houseDeliveryEnabled && (
              <button
                type="button"
                onClick={() => onOrderTypeChange('neighborhood_delivery')}
                className={`p-4 sm:p-5 rounded-2xl border-2 text-center flex flex-col items-center gap-2.5 transition cursor-pointer ${
                  orderType === 'neighborhood_delivery'
                    ? 'border-teal-600 bg-teal-50/70 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                    orderType === 'neighborhood_delivery'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  <Home className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {isAr ? 'توصيل للمنزل القريب' : 'Nearby House'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isAr ? 'لسكان المنازل والعمائر المجاورة' : 'For nearby residents & villas'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800">
                  📍 {isAr ? 'رقم العمارة والموقع' : 'House # & GPS'}
                </span>
              </button>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'التالي: إدخال البيانات' : 'Next: Enter Details'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Super Simplified Details */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 sm:space-y-6 max-w-xl mx-auto">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {isAr ? 'الخطوة الثانية' : 'Step 2 of 4'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              {orderType === 'curbside' ? (
                <>
                  <Car className="w-6 h-6 text-emerald-600" />
                  <span>{isAr ? 'رقم أو لوحة السيارة' : 'Car / Vehicle Number'}</span>
                </>
              ) : (
                <>
                  <Home className="w-6 h-6 text-teal-600" />
                  <span>{isAr ? 'بيانات المنزل والجوال' : 'House & Mobile Details'}</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-['Cairo',sans-serif] mt-0.5">
              {orderType === 'curbside'
                ? isAr
                  ? 'فقط اكتب رقم أو موديل ولون السيارة ليتعرف عليك عامل المتجر بالخارج'
                  : 'Only your car plate / model is needed so our staff can spot your car outside'
                : isAr
                ? 'أدخل رقم العمارة والشقة ورقم الجوال للتوصيل المباشر'
                : 'Enter your building/flat number and contact phone for delivery'}
            </p>
          </div>

          {/* If CAR: ONLY Car Number */}
          {orderType === 'curbside' ? (
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {isAr ? 'رقم أو لوحة وموديل السيارة *' : 'Car Plate / Vehicle Model *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                    <Car className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={vehicleNumber}
                    onChange={(e) => onVehicleNumberChange(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: كامري أبيض ٤٨٢١ أو لوحة أ ب ج ١٢٣'
                        : 'e.g. White Camry 4821 or Plate 1234-AD'
                    }
                    className="w-full pl-11 pr-4 py-3.5 text-base sm:text-lg bg-slate-50 border-2 border-emerald-500/50 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {isAr
                    ? 'أوقف سيارتك أمام البقالة وسيحضر لك العامل المشتريات وجهاز الشبكة عند نافذتك.'
                    : 'Simply park outside. Our staff will bring your bags and wireless POS machine to your window.'}
                </p>
              </div>
            </div>
          ) : (
            /* If HOUSE: House number + Mobile + 1-Click GPS button */
            <div className="space-y-3.5 py-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {isAr ? 'رقم العمارة / الفيلا / الشقة *' : 'Building / Flat / Villa # *'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={houseNumber}
                  onChange={(e) => onHouseNumberChange(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: عمارة ١٤، الدور الثاني، شقة ٥'
                      : 'e.g. Building 14, 2nd Floor, Apt 5'
                  }
                  className="w-full px-4 py-3 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {isAr ? 'رقم الجوال للتواصل *' : 'Mobile Phone Number *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-teal-600" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => onCustomerPhoneChange(e.target.value)}
                    placeholder="9xxxxxxx"
                    className="w-full pl-10 pr-4 py-3 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* 1-Click GPS Pinpoint Button */}
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-teal-700" />
                      <span>{isAr ? 'تحديد الموقع بنقرة واحدة (GPS)' : '1-Click GPS Pinpoint'}</span>
                    </span>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      {isAr ? 'يحدد مكانك بالضبط على الخريطة ليأتي المندوب مباشرة' : 'Pinpoints your exact coordinates for runner navigation'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePinpointLocation}
                    disabled={isLocating}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isAr ? 'جاري التحديد...' : 'Locating...'}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isAr ? '📍 تحديد موقعي الآن' : '📍 Pin My Location'}</span>
                      </>
                    )}
                  </button>
                </div>

                {locationCoordinates && (
                  <div className="mt-2.5 p-2 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-700">
                      ✓ {isAr ? 'تم تحديد الموقع' : 'Pinned'} (±{locationCoordinates.accuracy}m)
                    </span>
                    {locationCoordinates.mapUrl && (
                      <a
                        href={locationCoordinates.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <span>{isAr ? 'معاينة على الخريطة' : 'Preview Map'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {geoError && (
                  <div className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{geoError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {stepError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{stepError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isAr ? 'السابق' : 'Back'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep2}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'التالي: اختيار المنتجات' : 'Next: Select Products'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: E-Commerce Catalog with STRICT Stock Controls (No stock count text, out of stock badge & limits) */}
      {currentStep === 3 && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header & Category Filter Bar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {isAr ? 'الخطوة الثالثة' : 'Step 3 of 4'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  <span>{isAr ? 'منتجات بقالة مكارم الخير' : 'Makarem Al-Khair Store Catalog'}</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-['Cairo',sans-serif] mt-0.5">
                  {isAr
                    ? 'أصناف طازجة ومباشرة من نقطة البيع بالريال العماني'
                    : 'Real live items directly from store inventory in OMR'}
                </p>
              </div>

              {/* Toggle Handwritten/Custom Note */}
              <button
                type="button"
                onClick={() => setShowNotesBox(!showNotesBox)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 transition cursor-pointer self-start sm:self-auto"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'أغراض إضافية غير معروضة؟' : 'Need custom items?'}</span>
              </button>
            </div>

            {/* Custom Notes Drawer */}
            {showNotesBox && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>{isAr ? 'اكتب أي أغراض إضافية تريدها من الرفوف:' : 'Type any additional groceries from store shelves:'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNotesBox(false)}
                    className="text-amber-600 hover:text-amber-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => onCustomNotesChange(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: خبز صامولي حار، ٢ كرتون حليب، علبة شاي...'
                      : 'e.g. 1 carton cold fresh milk, 2 samoli bread, 1 tea bag...'
                  }
                  className="w-full p-2.5 text-xs sm:text-sm bg-white border border-amber-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
                />
              </div>
            )}

            {/* Search Bar & Categories */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث عن صنف بالاسم أو الباركود...' : 'Search by product name or barcode...'}
                  className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {realCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'All' ? (isAr ? 'جميع الأصناف' : 'All Products') : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* E-Commerce Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredCatalog.map((item) => {
              const qty = getItemQuantity(item.id);
              const baisaAmount = Math.round(item.price * 1000);
              const isOutOfStock = (item.stock !== undefined && item.stock <= 0);
              const isAtMaxStock = (item.stock !== undefined && qty >= item.stock);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all flex flex-col justify-between hover:shadow-md ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50/50'
                      : qty > 0
                      ? 'border-emerald-500 ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Image Box */}
                  <div className="relative aspect-4/3 w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100 group">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          isOutOfStock ? 'opacity-50 grayscale-[50%]' : ''
                        }`}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-slate-400">
                        <Package className="w-10 h-10 stroke-1 mb-1 text-slate-300" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.category}
                        </span>
                      </div>
                    )}

                    {/* ONLY display badge if Out of Stock - DO NOT show stock numbers */}
                    {isOutOfStock && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black shadow-xs">
                        {isAr ? 'غير متوفر' : 'Out of Stock'}
                      </div>
                    )}

                    {qty > 0 && !isOutOfStock && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                        {qty}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      {item.arabicName && item.arabicName !== item.name && (
                        <div className="text-[11px] text-slate-500 font-['Cairo',sans-serif] mt-0.5 line-clamp-1">
                          {item.arabicName}
                        </div>
                      )}
                    </div>

                    {/* Price in OMR & Baisa */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-base sm:text-lg text-emerald-800 font-mono">
                          {item.price.toFixed(3)}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          {isAr ? 'ر.ع.' : 'OMR'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        ({baisaAmount} {isAr ? 'بيسة' : 'Baisa'} / {item.unit})
                      </div>
                    </div>

                    {/* Add / Stepper Button with Strict Stock Checks */}
                    <div className="pt-1">
                      {isOutOfStock ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 px-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed text-center"
                        >
                          {isAr ? 'غير متوفر حالياً' : 'Out of Stock'}
                        </button>
                      ) : qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item, 1)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إضافة' : 'Add'}</span>
                        </button>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item, -1)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-slate-800 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="font-black text-sm text-emerald-950 font-mono">
                              {qty}
                            </span>

                            <button
                              type="button"
                              disabled={isAtMaxStock}
                              onClick={() => onUpdateQuantity(item, 1)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-xs transition ${
                                isAtMaxStock
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 cursor-pointer'
                              }`}
                              title={isAtMaxStock ? (isAr ? 'وصلت للحد الأقصى المتوفر' : 'Max stock reached') : ''}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {isAtMaxStock && (
                            <div className="text-[10px] text-amber-700 font-bold text-center">
                              {isAr ? 'الحد الأقصى المتوفر' : 'Max stock reached'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-200">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-800">{isAr ? 'لا توجد منتجات تطابق البحث' : 'No items match your search'}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'يمكنك كتابة ما تريده في صندوق الطلبات الخاصة' : 'You can write any item you need in the custom items box'}
              </p>
            </div>
          )}

          {stepError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{stepError}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isAr ? 'السابق' : 'Back'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep3}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'التالي: طريقة الدفع' : 'Next: Payment Method'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* FLOATING E-COMMERCE CART BAR */}
          {totalItemCount > 0 && (
            <div className="fixed bottom-3 left-3 right-3 z-40 max-w-lg mx-auto">
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      {totalItemCount} {isAr ? 'أصناف بالسلة' : 'Items in Basket'}
                    </div>
                    <div className="text-base font-black text-emerald-400 font-mono">
                      {totalAmount.toFixed(3)} {isAr ? 'ر.ع.' : 'OMR'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isAr ? 'متابعة الدفع ➔' : 'Proceed to Pay ➔'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Payment Method & Confirm */}
      {currentStep === 4 && (
        <div
          ref={stepTopRef}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 sm:space-y-6 max-w-xl mx-auto animate-fadeIn"
        >
          <div className="border-b border-slate-100 pb-2.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {isAr ? 'الخطوة الرابعة' : 'Step 4 of 4'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {isAr ? 'طريقة الدفع وتأكيد الطلب' : 'Payment Method & Confirmation'}
            </h2>
            <p className="text-xs text-slate-500 font-['Cairo',sans-serif] mt-0.5">
              {orderType === 'curbside'
                ? isAr
                  ? 'اختر كيف ستدفع لعامل المتجر عند نافذة سيارتك'
                  : 'Choose how you will pay the runner at your car window'
                : isAr
                ? 'اختر طريقة الدفع عند باب المنزل'
                : 'Choose your payment method at your door'}
            </p>
          </div>

          {/* Payment Method Selector (1 Line with Circular Radio Indicators - No default) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isAr ? 'اختر طريقة الدفع (إلزامي) *' : 'Select Payment Method (Required) *'}
              </label>
              {!paymentMethod && (
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                  {isAr ? 'يرجى الاختيار' : 'Please select one'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: Cash */}
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  onPaymentMethodChange('cash');
                }}
                className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-emerald-700' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight">
                    {isAr ? 'كاش (نقداً)' : 'Cash'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {isAr ? 'عند الاستلام' : 'Pay upon delivery'}
                  </div>
                </div>
              </button>

              {/* Option 2: Card-VISA */}
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  onPaymentMethodChange('card');
                }}
                className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    paymentMethod === 'card'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-emerald-700' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight">
                    {isAr ? 'بطاقة / فيزا' : 'Card-VISA'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {isAr ? 'جهاز POS' : 'Wireless POS'}
                  </div>
                </div>
              </button>

              {/* Option 3: Online Mobile Pay */}
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  onPaymentMethodChange('online');
                }}
                className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === 'online'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    paymentMethod === 'online'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <Smartphone className={`w-5 h-5 ${paymentMethod === 'online' ? 'text-emerald-700' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight">
                    {isAr ? 'تحويل بنكي' : 'Online Pay'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {isAr ? 'تحويل فوري' : 'Instant mobile'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Final Order Review Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              {isAr ? 'ملخص بيانات الطلب:' : 'Order Summary:'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500">{isAr ? 'المكان:' : 'Location:'}</span>
                <div className="font-extrabold text-slate-900 mt-0.5 text-xs sm:text-sm">
                  {orderType === 'curbside' ? `🚗 Car: ${vehicleNumber}` : `🏠 House: ${houseNumber}`}
                </div>
              </div>

              {orderType === 'neighborhood_delivery' && (
                <div>
                  <span className="text-slate-500">{isAr ? 'الجوال:' : 'Phone:'}</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">{customerPhone}</div>
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                {selectedItems.map((it) => (
                  <div key={it.productId} className="flex justify-between text-slate-700">
                    <span>
                      {it.quantity} x {it.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{it.total.toFixed(3)} OMR</span>
                  </div>
                ))}
              </div>
            )}

            {customNotes && (
              <div className="pt-2 border-t border-slate-200 text-amber-900 font-medium">
                📝 {customNotes}
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between font-black text-sm sm:text-base text-slate-900">
              <span>{isAr ? 'الإجمالي المطلوب:' : 'Total Payable:'}</span>
              <span className="text-emerald-700 text-base sm:text-lg font-mono">{totalAmount.toFixed(3)} OMR</span>
            </div>
          </div>

          {paymentError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 animate-bounce-subtle">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{paymentError}</span>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Confirm Button */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isAr ? 'السابق' : 'Back'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (!paymentMethod) {
                  setPaymentError(
                    isAr
                      ? 'يرجى اختيار طريقة الدفع أولاً (كاش، بطاقة-فيزا، أو تحويل بنكي)'
                      : 'Please select a payment method first (Cash, Card-VISA, or Online Pay)'
                  );
                  return;
                }
                setPaymentError(null);
                onSubmitOrder();
              }}
              className="px-6 sm:px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري إرسال الطلب...' : 'Submitting Order...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5 text-amber-300" />
                  <span>{isAr ? 'تأكيد وإرسال الطلب للبقالة ✅' : 'Confirm & Place Order Now ✅'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
