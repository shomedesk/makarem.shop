import React, { useEffect, useRef } from 'react';
import {
  Clock,
  PackageCheck,
  CheckCircle2,
  Car,
  Home,
  Phone,
  MessageCircle,
  ExternalLink,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { Order } from '../types';
import { playOrderReadyChime, playSuccessChime } from '../utils/audio';

interface ActiveOrderTrackerProps {
  order: Order;
  onNewOrder: () => void;
  language: 'en' | 'ar';
}

export const ActiveOrderTracker: React.FC<ActiveOrderTrackerProps> = ({
  order,
  onNewOrder,
  language,
}) => {
  const isAr = language === 'ar';
  const prevStatusRef = useRef(order.status);

  // Play audio chime when status updates & Auto reset timer when completed
  useEffect(() => {
    if (prevStatusRef.current !== order.status) {
      if (order.status === 'ready') {
        playOrderReadyChime();
      } else if (order.status === 'completed') {
        playSuccessChime();
      }
      prevStatusRef.current = order.status;
    }
  }, [order.status]);

  // When order is completed & paid, set a countdown to auto-return to home
  const [countdown, setCountdown] = React.useState<number | null>(null);

  useEffect(() => {
    if (order.status === 'completed' && order.paymentStatus === 'received') {
      setCountdown(7);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onNewOrder();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [order.status, order.paymentStatus, onNewOrder]);

  const isCurbside = order.orderType === 'curbside';
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';

  const steps = [
    {
      key: 'pending',
      titleEn: 'Order Placed',
      titleAr: 'تم استلام الطلب',
      descEn: 'Sent directly to store cashier',
      descAr: 'وصل للكاشير في البقالة',
    },
    {
      key: 'processing',
      titleEn: 'Store Packing Items',
      titleAr: 'جاري التجهيز والتعبئة',
      descEn: 'Staff picking fresh goods from shelves',
      descAr: 'عامل المحل يجهز الأغراض من الرفوف',
    },
    {
      key: 'ready',
      titleEn: isCurbside ? 'Ready at Your Car!' : 'Out for Door Delivery!',
      titleAr: isCurbside ? 'جاهز عند نافذة سيارتك!' : 'خرج للتوصيل لبابك!',
      descEn: isCurbside
        ? 'Runner carrying bags to your vehicle now'
        : 'Delivery boy is on the way to your building',
      descAr: isCurbside
        ? 'عامل المتجر يحمل الأكياس وجهاز الدفع لسيارتك الآن'
        : 'المندوب في طريقه لعنك بالحي',
    },
    {
      key: 'completed',
      titleEn: 'Delivered & Paid',
      titleAr: 'تم التسليم والدفع بنجاح',
      descEn: 'Payment received. Thank you!',
      descAr: 'تم استلام الحساب بنجاح. شكراً لك!',
    },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Status Alert Banner */}
      {isReady ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                {isAr ? '🔔 طلبك جاهز الآن!' : '🔔 Your Order is READY!'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 font-['Cairo',sans-serif]">
                {isCurbside
                  ? isAr
                    ? `عامل البقالة يحضر مشترياتك الآن إلى سيارتك (${order.vehicleNumber})!`
                    : `Our runner is bringing your bags directly to your car (#${order.vehicleNumber}) right now!`
                  : isAr
                  ? `المندوب خرج من البقالة وفي الطريق إلى عنوانك (${order.houseNumber})!`
                  : `Our delivery runner has left the store heading towards ${order.houseNumber}!`}
              </p>
            </div>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  {isAr ? 'تم استلام الطلب والدفع بنجاح ✅' : 'Delivered & Paid Successfully ✅'}
                </h3>
                <p className="text-xs text-emerald-100 font-['Cairo',sans-serif]">
                  {isAr
                    ? 'شكراً لتسوقك من بقالة مكارم الخير الحديثة!'
                    : 'Thank you for shopping at Makarem Al-Khair Modern Grocery!'}
                </p>
              </div>
            </div>

            {countdown !== null && (
              <span className="text-[11px] font-mono font-bold bg-white/20 px-2.5 py-1 rounded-full text-amber-200">
                {countdown}s
              </span>
            )}
          </div>

          <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/20">
            <span className="text-xs text-white/90">
              {isAr ? 'العودة للمتجر لطلب جديد تلقائياً...' : 'Returning to storefront for a new order...'}
            </span>

            <button
              type="button"
              onClick={onNewOrder}
              className="px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-black text-xs shadow-md transition cursor-pointer"
            >
              <span>{isAr ? 'بدء طلب جديد الآن ➔' : 'Place Another Order Now ➔'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <div>
              <div className="text-xs font-bold text-slate-800">
                {isAr ? 'الطلب قيد المتابعة والتجهيز المباشر' : 'Live Order in Progress'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isAr ? 'يتم التحديث فوراً لحظة بلحظة' : 'Updating live as store staff processes items'}
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg">
            {order.status === 'processing'
              ? isAr
                ? 'جاري التجهيز'
                : 'Packing'
              : isAr
              ? 'في الانتظار'
              : 'Pending'}
          </span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isAr ? 'رقم الطلب المرجعي' : 'Reference Order #'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight text-emerald-700">
              {order.orderNumber}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                isCurbside
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {isCurbside ? <Car className="w-4 h-4" /> : <Home className="w-4 h-4" />}
              <span>
                {isCurbside
                  ? isAr
                    ? 'استلام بالسيارة'
                    : 'Curbside Vehicle Pickup'
                  : isAr
                  ? 'توصيل للمنزل'
                  : 'Neighborhood Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Step Progress Timeline */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            {isAr ? 'مراحل الطلب المباشرة' : 'Live Order Timeline'}
          </h4>

          <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-3">
            {steps.map((st, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={st.key} className="relative">
                  {/* Indicator Dot */}
                  <div
                    className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div>
                    <h5
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-emerald-700 font-extrabold'
                          : isPast
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {isAr ? st.titleAr : st.titleEn}
                    </h5>
                    <p className="text-xs text-slate-500 font-['Cairo',sans-serif] mt-0.5">
                      {isAr ? st.descAr : st.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location & Delivery Spot Info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {isCurbside
              ? isAr
                ? 'بيانات وموقع السيارة'
                : 'Vehicle Pickup Details'
              : isAr
              ? 'عنوان وموقع التوصيل'
              : 'Delivery Address & Coordinates'}
          </h4>

          {isCurbside ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">{isAr ? 'السيارة:' : 'Vehicle Plate:'}</span>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                  🚗 {order.vehicleNumber || 'Not specified'}
                </div>
              </div>
              {order.parkingSpot && (
                <div>
                  <span className="text-slate-500">{isAr ? 'مكان الوقوف:' : 'Parking Spot:'}</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    📍 {order.parkingSpot}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">{isAr ? 'رقم العمارة / الشقة:' : 'House / Building:'}</span>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                  🏠 {order.houseNumber}
                </div>
              </div>

              {order.locationCoordinates && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-[11px] text-slate-600 font-mono">
                    GPS: {order.locationCoordinates.lat.toFixed(5)}, {order.locationCoordinates.lng.toFixed(5)} (±{order.locationCoordinates.accuracy}m)
                  </div>
                  {order.locationCoordinates.mapUrl && (
                    <a
                      href={order.locationCoordinates.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                    >
                      <span>{isAr ? 'فتح الخريطة' : 'Open Map'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">{isAr ? 'طريقة الدفع:' : 'Payment Method:'}</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              {order.paymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-emerald-600" />}
              {order.paymentMethod === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
              {order.paymentMethod === 'online' && <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
              <span>
                {order.paymentMethod === 'card'
                  ? isAr
                    ? 'شبكة / بطاقة (المندوب يحضر الجهاز)'
                    : 'Card (Runner brings POS machine)'
                  : order.paymentMethod === 'cash'
                  ? isAr
                    ? 'نقداً عند الاستلام'
                    : 'Cash upon pickup/delivery'
                  : isAr
                  ? 'دفع إلكتروني'
                  : 'Online'}
              </span>
            </span>
          </div>
        </div>

        {/* Ordered Items Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {isAr ? 'الأصناف المطلوبة' : 'Order Items'}
          </h4>

          {order.items.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {order.items.map((it) => (
                <div key={it.productId || it.name} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {isAr ? it.arabicName || it.name : it.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {it.quantity} x {it.price.toFixed(3)} OMR ({it.unit})
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 text-sm font-mono">
                    {it.total.toFixed(3)} OMR
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Custom Notes */}
          {order.customNotes && (
            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                {isAr ? 'قائمة الطلبات المكتوبة:' : 'Custom Items / Handwritten List:'}
              </span>
              <p className="text-xs text-amber-950 font-medium whitespace-pre-wrap font-['Cairo',sans-serif]">
                {order.customNotes}
              </p>
            </div>
          )}

          {/* Total Amount */}
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold">{isAr ? 'الإجمالي المطلوب:' : 'Total Amount:'}</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {order.totalAmount > 0 ? `${order.totalAmount.toFixed(3)} OMR` : isAr ? 'يحدد مع الأصناف الحرة' : 'Calculated by Store'}
            </span>
          </div>
        </div>

        {/* Need help or change? Call Store button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <a
            href="tel:+966500000000"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'اتصال مباشر بالبقالة' : 'Call Store directly'}</span>
          </a>

          <button
            type="button"
            onClick={onNewOrder}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            <span>{isAr ? 'إنشاء طلب آخر' : 'Place Another Order'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
