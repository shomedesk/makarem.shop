import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Car,
  MapPin,
  Clock,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Save,
  Check,
} from 'lucide-react';
import type { CustomerProfile, Order } from '../types';
import {
  saveCustomerProfileToFirestore,
  fetchCustomerOrders,
} from '../services/customerService';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  onProfileUpdated: (updated: CustomerProfile) => void;
  onTrackOrder?: (order: Order) => void;
  language: 'en' | 'ar';
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onTrackOrder,
  language,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [vehicle, setVehicle] = useState(profile?.vehicleNumber || '');
  const [house, setHouse] = useState(profile?.houseNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Orders History State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setVehicle(profile.vehicleNumber || '');
      setHouse(profile.houseNumber || '');
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen && (profile?.phone || phone)) {
      loadHistory();
    }
  }, [isOpen, profile?.phone, phone]);

  const loadHistory = async () => {
    const targetPhone = profile?.phone || phone;
    if (!targetPhone) return;
    setIsLoadingOrders(true);
    try {
      const orderList = await fetchCustomerOrders(targetPhone);
      setOrders(orderList);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const updatedProfile: CustomerProfile = {
      id: profile?.id || `cust_${phone.replace(/[^0-9]/g, '')}`,
      phone: phone.trim(),
      vehicleNumber: vehicle.trim() || undefined,
      houseNumber: house.trim() || undefined,
      locationCoordinates: profile?.locationCoordinates,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCustomerProfileToFirestore(updatedProfile);
    onProfileUpdated(updatedProfile);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {isAr ? 'حساب الزبون وسجل المشتريات' : 'Customer Account & Orders'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {profile?.phone || (isAr ? 'ضيف مكارم الخير' : 'Makarem Shopper')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? 'البيانات الشخصية' : 'Profile & Car'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل الطلبات والمشتريات' : 'Order History'}</span>
            {orders.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Profile & Saved details */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAr ? 'رقم الهاتف / الجوال *' : 'Mobile Phone Number *'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9xxxxxxx"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAr ? 'رقم أو موديل السيارة المحفوظة' : 'Saved Car Plate / Model'}
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder={isAr ? 'مثال: كامري أبيض ٤٨٢١' : 'e.g. White Camry 4821'}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-semibold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'يتم تعبئتها تلقائياً عند طلبك القادم' : 'Auto-filled automatically for future orders'}
                </p>
              </div>

              {/* Saved Location status */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'موقع الخريطة المحفوظ (GPS)' : 'Saved Map Location (GPS)'}</span>
                  </span>
                  {profile?.locationCoordinates && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      ✓ {isAr ? 'محفوظ في جهازك' : 'Saved in browser'}
                    </span>
                  )}
                </div>
                {profile?.locationCoordinates ? (
                  <div className="text-[11px] text-emerald-800">
                    <div>
                      {isAr ? 'إحداثيات:' : 'Coordinates:'}{' '}
                      <span className="font-mono">
                        {profile.locationCoordinates.lat.toFixed(5)}, {profile.locationCoordinates.lng.toFixed(5)}
                      </span>
                    </div>
                    {profile.locationCoordinates.mapUrl && (
                      <a
                        href={profile.locationCoordinates.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline font-semibold flex items-center gap-1 mt-1"
                      >
                        <span>{isAr ? 'فتح على خرائط Google' : 'Open in Google Maps'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-700">
                    {isAr
                      ? 'عندما تضغط على "تحديد موقعي" في المرة الأولى، سيتم حفظه تلقائياً ولن يطلب منك مجدداً.'
                      : 'Once you allow GPS location in an order, it is permanently saved in your browser.'}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>{isAr ? 'تم الحفظ بنجاح!' : 'Saved successfully!'}</span>
                  </span>
                )}
                {!saveSuccess && <span />}

                <button
                  type="submit"
                  disabled={isSaving || !phone.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isAr ? 'حفظ البيانات' : 'Save Details'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Order History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-slate-500 font-medium">
                  {isAr ? 'الطلبات المسجلة برقم جوالك:' : 'Orders placed with your phone:'}
                </span>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isAr ? 'تحديث' : 'Refresh'}</span>
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-xs">{isAr ? 'جاري جلب الطلبات...' : 'Loading orders...'}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="font-bold text-slate-700 text-sm">
                    {isAr ? 'لا توجد طلبات سابقة بعد' : 'No previous orders found'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? 'عند تأكيد أي طلب برقم جوالك، سيظهر هنا في السجل.'
                      : 'Orders placed with your phone number will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 transition shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 font-mono text-sm">
                          {ord.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ord.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'ready'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>{ord.orderType === 'curbside' ? `🚗 ${ord.vehicleNumber || 'Car'}` : `🏠 ${ord.houseNumber || 'House'}`}</span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {ord.totalAmount.toFixed(3)} OMR
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Items Summary */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 line-clamp-1">
                          {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>
                      )}

                      {onTrackOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            onTrackOrder(ord);
                            onClose();
                          }}
                          className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition text-center"
                        >
                          {isAr ? 'عرض تفاصيل الطلب والفاتورة' : 'View Order Details'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
