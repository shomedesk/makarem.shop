export type OrderType = 'curbside' | 'neighborhood_delivery';

export type PaymentMethod = 'cash' | 'card' | 'online';

export type PaymentStatus = 'pending' | 'received';

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';

export type SalesPlaySyncStatus = 'pending' | 'synced' | 'failed' | 'skipped';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  arabicName: string;
  unit: string;
  price: number;
  quantity: number;
  total: number;
  salesplayProductId?: string;
  barcode?: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  mapUrl?: string;
  addressHint?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  vehicleNumber?: string;
  parkingSpot?: string;
  houseNumber?: string;
  locationCoordinates?: LocationCoordinates;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: OrderItem[];
  customNotes?: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  salesplaySyncStatus: SalesPlaySyncStatus;
  salesplayReceiptId?: string;
  salesplaySyncMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  arabicName: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  barcode?: string;
  salesplayItemId?: string;
  imageUrl?: string;
}

export interface CustomerProfile {
  id: string;
  phone: string;
  vehicleNumber?: string;
  houseNumber?: string;
  locationCoordinates?: LocationCoordinates;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPlayShop {
  id: string;
  shop_name: string;
  terminal_list: Array<{ pos_name: string; pos_key: string }>;
  is_enable: string;
}

export interface SalesPlaySyncLog {
  id: string;
  orderId?: string;
  orderNumber?: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  details: string;
}
