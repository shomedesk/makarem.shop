import React, { useState } from 'react';
import {
  Car,
  Home,
  Clock,
  CheckCircle2,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  ExternalLink,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Check,
  Phone,
  AlertCircle,
  Zap,
  Plus,
  Loader2,
  Boxes,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import type { Order, OrderStatus, InventoryItem, SalesPlayShop } from '../types';
import { updateOrderInFirestore, syncOrderWithSalesPlayAPI } from '../services/orderService';
import { playNewOrderChime } from '../utils/audio';
import { ImageUploadModal } from './ImageUploadModal';

interface AdminDashboardProps {
  orders: Order[];
  catalog: InventoryItem[];
  onRefreshCatalog: () => void;
  onUpdateProductImage?: (productId: string, imageUrl: string) => void;
  language: 'en' | 'ar';
  salesplayShop: SalesPlayShop | null;
  salesplayConnected: boolean;
  houseDeliveryEnabled: boolean;
  onToggleHouseDelivery: (enabled: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  catalog,
  onRefreshCatalog,
  onUpdateProductImage,
  language,
  salesplayShop,
  salesplayConnected,
  houseDeliveryEnabled,
  onToggleHouseDelivery,
}) => {
  const isAr = language === 'ar';
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'salesplay'>('orders');

  // Product Image Upload Modal state
  const [selectedProductForImage, setSelectedProductForImage] = useState<InventoryItem | null>(null);

  // Add Product to SalesPlay Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Drink');
  const [newProdStock, setNewProdStock] = useState('20');
  const [newProdCost, setNewProdCost] = useState('');
  const [isAddingProd, setIsAddingProd] = useState(false);
  const [addProdError, setAddProdError] = useState<string | null>(null);
  const [addProdSuccess, setAddProdSuccess] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = filterStatus === 'all' || ord.status === filterStatus;
    const matchesType = filterType === 'all' || ord.orderType === filterType;
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.vehicleNumber && ord.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.houseNumber && ord.houseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.customerPhone && ord.customerPhone.includes(searchQuery));
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  // Status transition handlers
  const handleSetStatus = async (order: Order, newStatus: OrderStatus) => {
    setActionLoadingId(order.id);
    try {
      await updateOrderInFirestore(order.id, {
        status: newStatus,
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Complete Order & Sync to SalesPlay POS
  const handleCompleteAndPay = async (order: Order) => {
    setActionLoadingId(order.id);
    setSyncingOrderId(order.id);
    try {
      await updateOrderInFirestore(order.id, {
        status: 'completed',
        paymentStatus: 'received',
      });

      await syncOrderWithSalesPlayAPI(order);
      onRefreshCatalog();
    } catch (err) {
      console.error('Failed to complete order:', err);
    } finally {
      setActionLoadingId(null);
      setSyncingOrderId(null);
    }
  };

  const handleManualResync = async (order: Order) => {
    setSyncingOrderId(order.id);
    try {
      await syncOrderWithSalesPlayAPI(order);
      onRefreshCatalog();
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    setIsAddingProd(true);
    setAddProdError(null);
    setAddProdSuccess(null);

    try {
      const priceNum = parseFloat(newProdPrice);
      const costNum = newProdCost ? parseFloat(newProdCost) : Math.round(priceNum * 0.7 * 100) / 100;
      const stockNum = newProdStock ? parseInt(newProdStock, 10) : 20;

      const res = await fetch('/api/salesplay/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName.trim(),
          category: newProdCategory.trim() || 'General',
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          unit: 'pcs',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAddProdSuccess(
          isAr
            ? `تم إضافة المنتج "${newProdName}" بنجاح إلى SalesPlay POS!`
            : `Product "${newProdName}" created successfully in SalesPlay!`
        );
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCost('');
        onRefreshCatalog();
        setTimeout(() => {
          setShowAddModal(false);
          setAddProdSuccess(null);
        }, 1500);
      } else {
        setAddProdError(data.error ? JSON.stringify(data.error) : 'Failed to create product in SalesPlay');
      }
    } catch (err) {
      setAddProdError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsAddingProd(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Inbound */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'طلبات جديدة' : 'New Orders'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'تنتظر التعبئة' : 'Awaiting packing'}
          </div>
        </div>

        {/* Processing */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'قيد التعبئة' : 'Packing'}
            </span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {processingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'العامل يجمع الأغراض' : 'Staff picking items'}
          </div>
        </div>

        {/* Ready for Pickup / Out */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'جاهزة عند السيارة / بالطريق' : 'Ready / Out'}
            </span>
            <Car className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {readyCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'في يد المندوب' : 'Runner outside'}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'مكتملة ومسددة' : 'Completed'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
            {completedCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {isAr ? 'محدث في SalesPlay' : 'Synced in SalesPlay'}
          </div>
        </div>
      </div>

      {/* House Delivery Toggle & Service Control */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              houseDeliveryEnabled ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900">
                {isAr ? 'خدمة توصيل المنازل (House Delivery)' : 'Neighborhood House Delivery'}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  houseDeliveryEnabled
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {houseDeliveryEnabled
                  ? isAr
                    ? 'مفعلة للزبائن'
                    : 'Active for Customers'
                  : isAr
                  ? 'مخفية (استلام سيارات فقط)'
                  : 'Hidden (Curbside Car Only)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-['Cairo',sans-serif] mt-0.5">
              {houseDeliveryEnabled
                ? isAr
                  ? 'يمكن للزبائن الآن اختيار التوصيل للمنازل والعمارات المجاورة'
                  : 'Customers can choose nearby house delivery'
                : isAr
                ? 'خيار توصيل المنازل مخفي تماماً من صفحة الزبون، متاح فقط استلام السيارات'
                : 'House delivery option is hidden from customer shop. Only car pickup is visible.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleHouseDelivery(!houseDeliveryEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-xs active:scale-95 ${
            houseDeliveryEnabled
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          <span>
            {houseDeliveryEnabled
              ? isAr
                ? 'إخفاء خدمة المنازل (سيارات فقط)'
                : 'Hide House Delivery'
              : isAr
              ? 'تفعيل خدمة التوصيل للمنازل'
              : 'Enable House Delivery'}
          </span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'لوحة الطلبات المباشرة' : 'Live Orders Board'}
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-mono">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'مخزون SalesPlay الحقيقي' : 'SalesPlay POS Inventory'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salesplay')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'salesplay'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAr ? 'حالة الربط المباشر' : 'SalesPlay Cloud Sync'}</span>
          </button>
        </div>

        {/* Chime & Sound Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={playNewOrderChime}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Test alert tone"
          >
            🔔 {isAr ? 'نغمة التنبيه' : 'Test Chime'}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Tab: Orders Board */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
              {[
                { key: 'all', labelEn: 'All', labelAr: 'الكل' },
                { key: 'pending', labelEn: 'Pending', labelAr: 'جديدة' },
                { key: 'processing', labelEn: 'Packing', labelAr: 'تعبئة' },
                { key: 'ready', labelEn: 'Ready', labelAr: 'جاهزة' },
                { key: 'completed', labelEn: 'Completed', labelAr: 'مكتملة' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setFilterStatus(st.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
                    filterStatus === st.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? st.labelAr : st.labelEn}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="all">{isAr ? 'كل الأنواع' : 'All Types'}</option>
                <option value="curbside">{isAr ? 'سيارات فقط' : 'Car Only'}</option>
                <option value="neighborhood_delivery">{isAr ? 'منازل فقط' : 'House Only'}</option>
              </select>

              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث برقم اللوحة / الطلب...' : 'Search plate, order #...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Orders Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const isCurbside = order.orderType === 'curbside';
              const isPending = order.status === 'pending';
              const isProcessing = order.status === 'processing';
              const isReady = order.status === 'ready';
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-5 border-2 shadow-xs transition space-y-4 ${
                    isPending
                      ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
                      : isReady
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : isProcessing
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header: Order Number, Time, and Type Badge */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg sm:text-xl text-slate-900 font-mono">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                            isPending
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : isProcessing
                              ? 'bg-amber-100 text-amber-800'
                              : isReady
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isCurbside
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {isCurbside ? <Car className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                      <span>{isCurbside ? 'CAR / CURBSIDE' : 'HOUSE DELIVERY'}</span>
                    </div>
                  </div>

                  {/* PROMINENT VEHICLE / LOCATION HIGHLIGHT */}
                  {isCurbside ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                      <div className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">
                        {isAr ? 'رقم أو لوحة السيارة بالخارج:' : 'CAR / VEHICLE PLATE:'}
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1 font-mono">
                        <Car className="w-6 h-6 text-emerald-600 shrink-0" />
                        <span>{order.vehicleNumber}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-teal-50 border-2 border-teal-300 space-y-2">
                      <div>
                        <div className="text-[10px] font-black text-teal-900 uppercase tracking-wider">
                          {isAr ? 'العمارة / المنزل والشقة:' : 'HOUSE / BUILDING #:'}
                        </div>
                        <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                          <Home className="w-5 h-5 text-teal-600 shrink-0" />
                          <span>{order.houseNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-200">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono">
                          <Phone className="w-4 h-4 text-teal-600" />
                          <span>{order.customerPhone}</span>
                        </div>
                        {order.locationCoordinates?.mapUrl && (
                          <a
                            href={order.locationCoordinates.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-teal-800 bg-white px-2 py-0.5 rounded-lg border border-teal-300 hover:bg-teal-100"
                          >
                            <span>{isAr ? 'فتح بالخريطة' : 'Open GPS'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      {isAr ? 'الأصناف المطلوب تعبئتها:' : 'Items to Pack:'}
                    </span>

                    {order.items.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {order.items.map((it) => (
                          <div
                            key={it.productId || it.name}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-slate-800">
                              {it.quantity} x {isAr ? it.arabicName || it.name : it.name}
                            </span>
                            <span className="font-bold text-slate-900 font-mono">
                              {it.total.toFixed(3)} OMR
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.customNotes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block mb-0.5">
                          📝 {isAr ? 'طلبات مكتوبة:' : 'Custom list items:'}
                        </span>
                        <p className="whitespace-pre-wrap font-medium">{order.customNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Cashier SalesPlay POS Billing Helper */}
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-blue-900">
                        <Zap className="w-3.5 h-3.5 text-blue-700" />
                        <span>{isAr ? 'فاتورة كاشير SalesPlay POS:' : 'SalesPlay POS Counter Bill:'}</span>
                      </span>
                      <span className="text-[10px] font-mono bg-blue-200/80 px-1.5 py-0.5 rounded text-blue-900 font-bold">
                        {isAr ? 'سجلها بالكاشير' : 'Punch in POS'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-tight">
                      {isAr
                        ? 'قم بإصدار الفاتورة عبر جهاز كاشير SalesPlay كالمعتاد ليتم خصم المخزون طبيعياً بدون تكرار.'
                        : 'Ring up this bill on your SalesPlay POS machine at counter to print receipt and deduct inventory normally.'}
                    </p>
                  </div>

                  {/* Payment tag & Total */}
                  <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      {order.paymentMethod === 'card' && <CreditCard className="w-4 h-4 text-emerald-600" />}
                      {order.paymentMethod === 'cash' && <Banknote className="w-4 h-4 text-emerald-600" />}
                      {order.paymentMethod === 'online' && <Smartphone className="w-4 h-4 text-emerald-600" />}
                      <span>
                        {order.paymentMethod === 'card'
                          ? '💳 CARD / POS MACHINE'
                          : order.paymentMethod === 'cash'
                          ? '💵 CASH'
                          : '📱 ONLINE'}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          order.paymentStatus === 'received'
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {order.paymentStatus === 'received' ? 'PAID' : 'PAY ON WINDOW/DOOR'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm sm:text-base text-emerald-800 font-mono">
                        {order.totalAmount.toFixed(3)} OMR
                      </span>
                    </div>
                  </div>

                  {/* SalesPlay POS Status on Card */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-600">SalesPlay POS:</span>
                      <span
                        className={`font-bold ${
                          order.salesplaySyncStatus === 'synced'
                            ? 'text-emerald-700'
                            : order.salesplaySyncStatus === 'failed'
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {order.salesplaySyncStatus.toUpperCase()}
                      </span>
                    </div>

                    {isCompleted && order.salesplaySyncStatus !== 'synced' && (
                      <button
                        type="button"
                        onClick={() => handleManualResync(order)}
                        disabled={syncingOrderId === order.id}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                        <span>{isAr ? 'إعادة مزامنة' : 'Resync'}</span>
                      </button>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {/* Step 1: Start Packing */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(order, 'processing')}
                        disabled={actionLoadingId === order.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        <span>{isAr ? 'بدء التعبئة' : 'Start Packing'}</span>
                      </button>
                    )}

                    {/* Step 2: Mark Ready -> Customer app alerts! */}
                    {(isPending || isProcessing) && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(order, 'ready')}
                        disabled={actionLoadingId === order.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isCurbside
                            ? isAr
                              ? 'جاهز! إحضار للسيارة'
                              : 'Ready! Bring to Car'
                            : isAr
                            ? 'جاهز! إرسال للمنزل'
                            : 'Ready! Dispatch Runner'}
                        </span>
                      </button>
                    )}

                    {/* Step 3: Payment Received -> Order Success & SalesPlay sync! */}
                    {isReady && (
                      <button
                        type="button"
                        onClick={() => handleCompleteAndPay(order)}
                        disabled={actionLoadingId === order.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ring-2 ring-emerald-500"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          {syncingOrderId === order.id
                            ? isAr
                              ? 'جاري حفظ واستكمال المزامنة...'
                              : 'Syncing SalesPlay...'
                            : isAr
                            ? 'تم استلام المبلغ والطلب ناجح ✅'
                            : 'Payment Received & Complete ✅'}
                        </span>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="w-full text-center py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">
                        ✓ {isAr ? 'مكتمل ومحفوظ في السجلات' : 'Completed & Saved to SalesPlay'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-800">{isAr ? 'لا توجد طلبات تطابق الفلتر' : 'No orders found'}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'سيظهر أي طلب جديد يقدمه العميل هنا فوراً' : 'Any customer storefront or neighborhood order will appear here in real time.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Real SalesPlay Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  {isAr ? 'مخزون SalesPlay الحقيقي' : 'Real SalesPlay POS Products'}
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">
                  {catalog.length} items
                </span>
              </div>
              <p className="text-xs text-slate-500 font-['Cairo',sans-serif]">
                {isAr
                  ? 'يتم جلب هذه الأصناف مباشرة من حسابك في SalesPlay بدون أي بيانات وهمية'
                  : 'Directly pulled from your live SalesPlay POS account without any placeholder items'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منتج لـ SalesPlay' : 'Add Product to POS'}</span>
              </button>

              <button
                type="button"
                onClick={onRefreshCatalog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Add Product Modal */}
          {showAddModal && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                  {isAr ? 'إضافة منتج جديد لنظام SalesPlay POS' : 'Add New Product to SalesPlay Cloud POS'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم المنتج *' : 'Product Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Almarai Milk 2L"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isAr ? 'القسم / التصنيف *' : 'Category *'}
                  </label>
                  <input
                    type="text"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="Drink, Bakery, Vegitable, etc."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isAr ? 'سعر البيع (OMR / ر.ع.) *' : 'Sale Price (OMR) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="0.100"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isAr ? 'الكمية المبدئية في المخزون' : 'Initial Stock Count'}
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium font-mono"
                  />
                </div>

                {addProdError && (
                  <div className="sm:col-span-2 text-xs text-rose-600 font-semibold">
                    {addProdError}
                  </div>
                )}

                {addProdSuccess && (
                  <div className="sm:col-span-2 text-xs text-emerald-700 font-bold">
                    {addProdSuccess}
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingProd}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isAddingProd && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{isAr ? 'حفظ في SalesPlay' : 'Save to SalesPlay'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {catalog.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  {/* Image Thumbnail */}
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300 stroke-1" />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedProductForImage(item)}
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                      title={isAr ? 'تعديل الصورة' : 'Change Image'}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-800 rounded font-semibold font-mono">
                        POS: {item.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-['Cairo',sans-serif]">
                      {item.arabicName} • {item.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900 font-mono">
                      {item.price.toFixed(3)} OMR
                    </div>
                    <div
                      className={`text-[11px] font-semibold ${
                        item.stock > 10 ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {item.stock} in stock
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProductForImage(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.imageUrl ? (isAr ? 'تغيير الصورة' : 'Change Image') : (isAr ? '📷 رفع صورة' : '📷 Upload Image')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Image Upload Modal */}
      <ImageUploadModal
        isOpen={Boolean(selectedProductForImage)}
        product={selectedProductForImage}
        onClose={() => setSelectedProductForImage(null)}
        onImageSaved={(productId, newUrl) => {
          if (onUpdateProductImage) {
            onUpdateProductImage(productId, newUrl);
          }
          onRefreshCatalog();
        }}
        language={language}
      />

      {/* Tab: SalesPlay Live Sync */}
      {activeTab === 'salesplay' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {isAr ? 'تكامل SalesPlay POS السحابي' : 'SalesPlay Cloud POS Integration'}
              </h3>
              <p className="text-xs text-slate-500 font-['Cairo',sans-serif]">
                {isAr
                  ? 'مربوط مباشرة مع متجر مكارم الخير لتحديث حركة البيع والمخزون'
                  : 'Live connected to Makarem Al-Khair Modern SalesPlay POS'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                {isAr ? 'اسم المتجر' : 'Shop Name'}
              </span>
              <div className="font-extrabold text-sm text-slate-900">
                {salesplayShop?.shop_name || 'MAKAREM ALKHAIR MODERN'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Shop ID: {salesplayShop?.id || 'VEpoaG9WaHlTZ0Nocko4ekcwVFpqZz09'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                {isAr ? 'الحساب المرتبط ونقاط البيع' : 'Linked Account & Terminals'}
              </span>
              <div className="font-bold text-emerald-700">
                makarembakkala@gmail.com
              </div>
              <div className="text-[11px] text-slate-600">
                Active Terminals: Web (SP22285391), POS 01 (SP60850280), PRASAN
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'خصم المخزون التلقائي' : 'Automatic Stock Sync'}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isAr
                ? 'عند النقر على "تم استلام المبلغ والطلب ناجح"، يقوم النظام تلقائياً بخصم الكميات المباعة من كميات المخزون في SalesPlay عبر الـ API.'
                : 'When you click "Payment Received & Complete", the app automatically calls the SalesPlay API to deduct the purchased item counts from your POS inventory.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
