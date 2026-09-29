import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StepByStepOrderWizard } from './components/StepByStepOrderWizard';
import { ActiveOrderTracker } from './components/ActiveOrderTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { InitialCustomerPromptModal } from './components/InitialCustomerPromptModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { INITIAL_CATALOG } from './data/initialCatalog';
import {
  generateOrderNumber,
  createOrderInFirestore,
  subscribeToOrders,
  subscribeToSingleOrder,
} from './services/orderService';
import { subscribeToProductMedia } from './services/imageService';
import {
  subscribeToStoreSettings,
  updateStoreSettings,
  StoreSettings,
  DEFAULT_SETTINGS,
} from './services/settingsService';
import {
  loadLocalCustomerProfile,
  saveCustomerProfileToFirestore,
  getSavedLocation,
  saveLocation,
} from './services/customerService';
import {
  subscribeToAdminState,
  logoutAdmin,
  isEmailAuthorizedAdmin,
} from './services/adminAuthService';
import { testFirestoreConnection } from './firebase';
import { playNewOrderChime } from './utils/audio';
import type {
  Order,
  OrderType,
  PaymentMethod,
  OrderItem,
  InventoryItem,
  LocationCoordinates,
  SalesPlayShop,
  CustomerProfile,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'admin'>('customer');
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const isAr = language === 'ar';

  // Customer Profile State (persisted locally and in Firestore)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(() => {
    return loadLocalCustomerProfile();
  });

  // Customer order configuration state
  const [orderType, setOrderType] = useState<OrderType>('curbside');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locationCoordinates, setLocationCoordinates] = useState<LocationCoordinates | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [customNotes, setCustomNotes] = useState('');

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showInitialPrompt, setShowInitialPrompt] = useState(false);

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    const savedEmail = localStorage.getItem('makarem_admin_email');
    return isEmailAuthorizedAdmin(savedEmail);
  });

  // Catalog state - loaded ONLY from SalesPlay POS
  const [catalog, setCatalog] = useState<InventoryItem[]>(INITIAL_CATALOG);
  const [productMediaMap, setProductMediaMap] = useState<Record<string, string>>({});

  // Active customer order
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    return localStorage.getItem('makarem_active_order_id') || null;
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Store orders (Real-time from Firestore)
  const [orders, setOrders] = useState<Order[]>([]);
  const prevPendingCountRef = useRef(0);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // SalesPlay Connection state
  const [salesplayConnected, setSalesplayConnected] = useState(true);
  const [salesplayShop, setSalesplayShop] = useState<SalesPlayShop | null>(null);

  // Store Settings (e.g. House Delivery visibility)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  // Auto pre-fill customer details from profile or saved location
  useEffect(() => {
    if (customerProfile) {
      if (customerProfile.phone && !customerPhone) setCustomerPhone(customerProfile.phone);
      if (customerProfile.vehicleNumber && !vehicleNumber) setVehicleNumber(customerProfile.vehicleNumber);
      if (customerProfile.houseNumber && !houseNumber) setHouseNumber(customerProfile.houseNumber);
      if (customerProfile.locationCoordinates && !locationCoordinates) {
        setLocationCoordinates(customerProfile.locationCoordinates);
      }
    } else {
      const savedLoc = getSavedLocation();
      if (savedLoc && !locationCoordinates) {
        setLocationCoordinates(savedLoc);
      }
    }
  }, [customerProfile]);

  // 10-Second Timer: Ask for mobile & vehicle once on 1st opening if not yet saved
  useEffect(() => {
    const existing = loadLocalCustomerProfile();
    if (!existing) {
      const timer = setTimeout(() => {
        if (!loadLocalCustomerProfile()) {
          setShowInitialPrompt(true);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to Admin Auth State changes
  useEffect(() => {
    const unsub = subscribeToAdminState((isAdmin) => {
      setIsAdminLoggedIn(isAdmin);
      if (!isAdmin && currentView === 'admin') {
        setCurrentView('customer');
      }
    });
    return () => unsub();
  }, [currentView]);

  // Subscribe to real-time store settings
  useEffect(() => {
    const unsubSettings = subscribeToStoreSettings((settings) => {
      setStoreSettings(settings);
      if (!settings.houseDeliveryEnabled && orderType === 'neighborhood_delivery') {
        setOrderType('curbside');
      }
    });
    return () => {
      if (unsubSettings) unsubSettings();
    };
  }, [orderType]);

  const handleToggleHouseDelivery = async (enabled: boolean) => {
    setStoreSettings((prev) => ({ ...prev, houseDeliveryEnabled: enabled }));
    if (!enabled && orderType === 'neighborhood_delivery') {
      setOrderType('curbside');
    }
    await updateStoreSettings({ houseDeliveryEnabled: enabled });
  };

  // Subscribe to real-time custom product image uploads
  useEffect(() => {
    const unsubMedia = subscribeToProductMedia((mediaMap) => {
      setProductMediaMap(mediaMap);
      setCatalog((prev) =>
        prev.map((item) => {
          const override = mediaMap[item.id] || mediaMap[item.name];
          return override ? { ...item, imageUrl: override } : item;
        })
      );
    });
    return () => {
      if (unsubMedia) unsubMedia();
    };
  }, []);

  // Bootstrap Firebase connection & fetch real SalesPlay data
  useEffect(() => {
    testFirestoreConnection();

    // Check SalesPlay status & fetch products
    fetch('/api/salesplay/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setSalesplayConnected(true);
          setSalesplayShop({
            id: data.shopId,
            shop_name: data.shopName,
            terminal_list: data.terminals || [],
            is_enable: '1',
          });
        }
      })
      .catch((err) => console.warn('SalesPlay status check:', err));

    fetchSalesPlayProducts();
  }, []);

  const fetchSalesPlayProducts = () => {
    fetch('/api/salesplay/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.products?.length > 0) {
          // Use ONLY real SalesPlay products, excluding any test products
          const realItems: InventoryItem[] = data.products
            .filter((sp: any) => sp.productCode !== '10006' && sp.name !== 'Fresh Bread')
            .map((sp: any) => {
              let fallbackImg = sp.imageUrl;
              if (!fallbackImg && sp.name.toLowerCase().includes('potato')) {
                fallbackImg =
                  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80';
              }
              const customImg = productMediaMap[sp.id] || productMediaMap[sp.productCode] || fallbackImg || '';

              return {
                id: sp.id,
                name: sp.name,
                arabicName:
                  sp.name === 'Potato'
                    ? 'بطاطس بالكيلو'
                    : sp.name === 'Fida water 250'
                    ? 'مياه فيدا ٢٥٠ مل'
                    : sp.name,
                category: sp.category || 'General',
                price: Number(sp.price || 0.1),
                unit: sp.unit || (sp.name.toLowerCase().includes('potato') ? 'kg' : 'pcs'),
                stock: sp.stock !== undefined ? sp.stock : 25,
                barcode: sp.barcode,
                salesplayItemId: sp.id,
                imageUrl: customImg,
              };
            });
          setCatalog(realItems);
        }
      })
      .catch((err) => console.warn('SalesPlay products fetch:', err));
  };

  const handleUpdateProductImage = (productId: string, imageUrl: string) => {
    setProductMediaMap((prev) => ({ ...prev, [productId]: imageUrl }));
    setCatalog((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, imageUrl } : item))
    );
  };

  // Real-time listener for all orders
  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);

      // Check if new pending orders arrived to trigger chime
      const pendingCount = newOrders.filter((o) => o.status === 'pending').length;
      if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        playNewOrderChime();
      }
      prevPendingCountRef.current = pendingCount;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time listener for customer active order
  useEffect(() => {
    if (!activeOrderId) return;

    const unsubscribe = subscribeToSingleOrder(activeOrderId, (order) => {
      if (order) {
        setActiveOrder(order);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeOrderId]);

  // Quantity adjustments with strict stock check
  const handleUpdateQuantity = (item: InventoryItem, delta: number) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.productId === item.id);
      const currentQty = existing ? existing.quantity : 0;
      const availableStock = item.stock !== undefined ? Number(item.stock) : 999;

      // Disallow adding if out of stock
      if (delta > 0 && availableStock <= 0) {
        return prev;
      }

      // Disallow exceeding available stock
      if (delta > 0 && currentQty + delta > availableStock) {
        return prev;
      }

      if (!existing && delta > 0) {
        return [
          ...prev,
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: item.id,
            name: item.name,
            arabicName: item.arabicName,
            unit: item.unit,
            price: item.price,
            quantity: 1,
            total: item.price,
            salesplayProductId: item.salesplayItemId,
            barcode: item.barcode,
          },
        ];
      }
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter((i) => i.productId !== item.id);
        }
        return prev.map((i) =>
          i.productId === item.id
            ? { ...i, quantity: newQty, total: Number((newQty * i.price).toFixed(3)) }
            : i
        );
      }
      return prev;
    });
  };

  // Calculate totals
  const subtotal = selectedItems.reduce((acc, i) => acc + i.total, 0);
  const totalAmount = subtotal;

  // Handle Location changes & Auto-save to avoid reprompting
  const handleLocationChange = (coords: LocationCoordinates | undefined) => {
    setLocationCoordinates(coords);
    if (coords) {
      saveLocation(coords);
      if (customerProfile) {
        saveCustomerProfileToFirestore({
          ...customerProfile,
          locationCoordinates: coords,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Handle Order Placement from Wizard
  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      setSubmitError(
        isAr
          ? 'يرجى اختيار طريقة الدفع أولاً (كاش، بطاقة-فيزا، أو تحويل بنكي)'
          : 'Please select a payment method first (Cash, Card-VISA, or Online Pay)'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const orderNum = generateOrderNumber();
      const now = new Date().toISOString();

      const newOrder: Order = {
        id: orderId,
        orderNumber: orderNum,
        orderType,
        customerName: orderType === 'curbside' ? `Car (${vehicleNumber.trim()})` : `House (${houseNumber.trim()})`,
        customerPhone: orderType === 'curbside' ? (customerPhone.trim() || 'Curbside Walkout') : customerPhone.trim(),
        vehicleNumber: orderType === 'curbside' ? vehicleNumber.trim() : undefined,
        houseNumber: orderType === 'neighborhood_delivery' ? houseNumber.trim() : undefined,
        locationCoordinates: orderType === 'neighborhood_delivery' ? locationCoordinates : undefined,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        items: selectedItems,
        customNotes: customNotes.trim(),
        subtotal: Number(subtotal.toFixed(3)),
        tax: 0,
        totalAmount: Number(totalAmount.toFixed(3)),
        salesplaySyncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await createOrderInFirestore(newOrder);

      // Auto-save/update customer profile details
      if (customerPhone.trim()) {
        const updatedProfile: CustomerProfile = {
          id: customerProfile?.id || `cust_${customerPhone.replace(/[^0-9]/g, '')}`,
          phone: customerPhone.trim(),
          vehicleNumber: vehicleNumber.trim() || customerProfile?.vehicleNumber,
          houseNumber: houseNumber.trim() || customerProfile?.houseNumber,
          locationCoordinates: locationCoordinates || customerProfile?.locationCoordinates,
          createdAt: customerProfile?.createdAt || now,
          updatedAt: now,
        };
        setCustomerProfile(updatedProfile);
        saveCustomerProfileToFirestore(updatedProfile);
      }

      // Save active order in state and storage
      setActiveOrderId(orderId);
      setActiveOrder(newOrder);
      localStorage.setItem('makarem_active_order_id', orderId);

      // Reset form items
      setSelectedItems([]);
      setCustomNotes('');
      setPaymentMethod(null);
    } catch (err) {
      console.error('Error submitting order:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to confirm order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewOrder = () => {
    localStorage.removeItem('makarem_active_order_id');
    setActiveOrderId(null);
    setActiveOrder(null);
    setPaymentMethod(null);
    setSelectedItems([]);
    setCustomNotes('');
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setIsAdminLoggedIn(false);
    setCurrentView('customer');
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans"
    >
      {/* PWA Install & Add to Home Screen Prompt Strip */}
      <PwaInstallPrompt language={language} />

      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        language={language}
        onLanguageChange={setLanguage}
        salesplayConnected={salesplayConnected}
        customerProfile={customerProfile}
        onOpenProfile={() => setShowProfileModal(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area - Native App Fit */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-2.5 sm:py-5">
        {currentView === 'admin' && isAdminLoggedIn ? (
          /* Store Admin / Cashier Dashboard */
          <AdminDashboard
            orders={orders}
            catalog={catalog}
            onRefreshCatalog={fetchSalesPlayProducts}
            onUpdateProductImage={handleUpdateProductImage}
            language={language}
            salesplayShop={salesplayShop}
            salesplayConnected={salesplayConnected}
            houseDeliveryEnabled={storeSettings.houseDeliveryEnabled}
            onToggleHouseDelivery={handleToggleHouseDelivery}
          />
        ) : activeOrder ? (
          /* Customer Active Order Live Tracking View */
          <ActiveOrderTracker
            order={activeOrder}
            onNewOrder={handleStartNewOrder}
            language={language}
          />
        ) : (
          /* Step-By-Step Fast Order Wizard */
          <StepByStepOrderWizard
            catalog={catalog}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            vehicleNumber={vehicleNumber}
            onVehicleNumberChange={setVehicleNumber}
            houseNumber={houseNumber}
            onHouseNumberChange={setHouseNumber}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            locationCoordinates={locationCoordinates}
            onLocationCoordinatesChange={handleLocationChange}
            selectedItems={selectedItems}
            onUpdateQuantity={handleUpdateQuantity}
            customNotes={customNotes}
            onCustomNotesChange={setCustomNotes}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onSubmitOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            submitError={submitError}
            houseDeliveryEnabled={storeSettings.houseDeliveryEnabled}
            language={language}
          />
        )}
      </main>

      {/* Clean Footer with Makarem Alkhair modern, Terms Notice & Discrete Admin Link */}
      <footer className="mt-auto py-5 border-t border-slate-200/80 bg-white text-xs text-slate-500 font-['Cairo',sans-serif]">
        <div className="max-w-5xl mx-auto px-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
              Makarem Alkhair modern
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {isAr
                  ? 'بقالة مكارم الخير الحديثة • خدمة المتسوق والسيارات'
                  : 'Makarem Al-Khair Modern Grocery • Curbside & Express Shopping'}
              </span>

              {/* Discrete small Admin link */}
              <button
                type="button"
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setCurrentView('admin');
                  } else {
                    setShowAdminLoginModal(true);
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-700 underline font-mono flex items-center gap-1 transition cursor-pointer"
                title={isAr ? 'دخول الإدارة والكاشير' : 'Store Admin Portal'}
              >
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
            <p>
              <strong className="text-slate-800">{isAr ? 'الشروط والأحكام: ' : 'Terms & Conditions: '}</strong>
              {isAr
                ? 'هذا ليس موقع تجارة إلكترونية عام. هذه المنصة هي خدمة طلب واستلام سريعة وميسرة مخصصة لزبائن بقالة مكارم الخير الحديثة الفعليين (Hassle-free ordering for existing and offline store shoppers).'
                : 'This is not an e-commerce website. This is a hassle-free ordering system exclusively for existing and offline store shoppers of Makarem Al-Khair Modern Grocery.'}
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal (Restricted to Whitelisted Emails Only) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setCurrentView('admin');
        }}
        language={language}
      />

      {/* Customer Profile & Shopping History Modal */}
      <CustomerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={customerProfile}
        onProfileUpdated={(updated) => {
          setCustomerProfile(updated);
          if (updated.phone) setCustomerPhone(updated.phone);
          if (updated.vehicleNumber) setVehicleNumber(updated.vehicleNumber);
          if (updated.houseNumber) setHouseNumber(updated.houseNumber);
        }}
        onTrackOrder={(ord) => {
          setActiveOrderId(ord.id);
          setActiveOrder(ord);
        }}
        language={language}
      />

      {/* 10-Second Customer Initial Registration Prompt */}
      <InitialCustomerPromptModal
        isOpen={showInitialPrompt}
        onClose={() => setShowInitialPrompt(false)}
        onProfileSaved={(newProf) => {
          setCustomerProfile(newProf);
          if (newProf.phone) setCustomerPhone(newProf.phone);
          if (newProf.vehicleNumber) setVehicleNumber(newProf.vehicleNumber);
        }}
        language={language}
      />
    </div>
  );
}
