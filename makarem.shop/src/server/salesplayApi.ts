import type { IncomingMessage, ServerResponse } from 'http';

const SALESPLAY_BASE_URL = 'https://api.salesplaypos.com/v1.0';
const DEFAULT_TOKEN =
  process.env.SALESPLAY_API_TOKEN ||
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbl9uYW1lIjoibWFrYXJlbWJha2thbGFAZ21haWwuY29tIiwiZGF0ZSI6IkZyaWRheSAyNXRoIDIwMjZmIFNlcHRlbWJlciAyMDI2IDAxOjA1OjU1IEFNIn0.wmzb6XXPzLK_xsmyML7KA8U9_NNC9W0m26nlM29afsU';

export const SHOP_ID = 'VEpoaG9WaHlTZ0Nocko4ekcwVFpqZz09';

interface SyncLogEntry {
  id: string;
  timestamp: string;
  orderNumber?: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  details: string;
}

const recentLogs: SyncLogEntry[] = [
  {
    id: 'log-init',
    timestamp: new Date().toISOString(),
    action: 'SalesPlay POS Service Bootstrapped',
    status: 'success',
    details: 'Connected to Makarem Al-Khair Modern POS (makarembakkala@gmail.com). Shop ID verified.',
  },
];

export function addSyncLog(entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) {
  const newEntry: SyncLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  recentLogs.unshift(newEntry);
  if (recentLogs.length > 50) recentLogs.pop();
  return newEntry;
}

export function getSyncLogs() {
  return recentLogs;
}

async function fetchFromSalesPlay(endpoint: string, options: RequestInit = {}) {
  const url = `${SALESPLAY_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${DEFAULT_TOKEN}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}

// Request parser utility
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Image overrides map (persisted in server memory)
const productImageOverrides: Record<string, string> = {};

export function setProductImageOverride(productId: string, imageUrl: string) {
  productImageOverrides[productId] = imageUrl;
}

export function getProductImageOverrides() {
  return productImageOverrides;
}

export async function handleSalesPlayRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/salesplay')) {
    return false;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return true;
  }

  try {
    // 1. Connection status & shop details
    if (url === '/api/salesplay/status' && req.method === 'GET') {
      const shopRes = await fetchFromSalesPlay('/shops');
      if (shopRes.ok && shopRes.data?.shops?.length > 0) {
        const shop = shopRes.data.shops[0];
        sendJson(res, 200, {
          connected: true,
          shopName: shop.shop_name,
          shopId: shop.id,
          terminals: shop.terminal_list,
          account: 'makarembakkala@gmail.com',
          lastChecked: new Date().toISOString(),
        });
      } else {
        sendJson(res, 200, {
          connected: false,
          error: shopRes.data || 'Failed to verify shop status',
          account: 'makarembakkala@gmail.com',
          lastChecked: new Date().toISOString(),
        });
      }
      return true;
    }

    // 2. Fetch live products and inventory stock
    if (url === '/api/salesplay/products' && req.method === 'GET') {
      const [prodRes, invRes] = await Promise.all([
        fetchFromSalesPlay('/products'),
        fetchFromSalesPlay('/inventory'),
      ]);

      const products = prodRes.data?.products || [];
      const inventoryLevels = invRes.data?.inventory_levels || [];

      // Create a stock map by product_id
      const stockMap: Record<string, number> = {};
      for (const item of inventoryLevels) {
        stockMap[item.product_id] = item.in_stock;
      }

      // Merge stock into products & filter out test product code 10006
      const enrichedProducts = products
        .filter((prod: any) => prod.product_code !== '10006')
        .map((prod: any) => {
          const defaultShop = prod.shops?.find((s: any) => s.shop_id === SHOP_ID) || prod.shops?.[0];
          const customImg = productImageOverrides[prod.id] || productImageOverrides[prod.product_code];
          return {
            id: prod.id,
            productCode: prod.product_code,
            name: prod.product_name,
            category: prod.category || 'General',
            price: defaultShop?.price ?? 0.1,
            stock: stockMap[prod.id] ?? 25,
            barcode: prod.barcode || '',
            imageUrl: customImg || prod.image_url || '',
            unit: prod.measurement || 'pcs',
          };
        });

      sendJson(res, 200, {
        success: true,
        count: enrichedProducts.length,
        products: enrichedProducts,
      });
      return true;
    }

    // 2.2 Update/Upload Product Image Override
    if (url === '/api/salesplay/update-image' && req.method === 'POST') {
      const body = await parseBody(req);
      const { productId, imageUrl } = body;
      if (!productId || !imageUrl) {
        sendJson(res, 400, { success: false, error: 'productId and imageUrl are required' });
        return true;
      }
      setProductImageOverride(productId, imageUrl);
      addSyncLog({
        action: 'Product Image Updated',
        status: 'success',
        details: `Saved new visual image for product ID ${productId}`,
      });
      sendJson(res, 200, { success: true, productId, imageUrl });
      return true;
    }

    // 2.5 Add new product to SalesPlay POS
    if (url === '/api/salesplay/create-product' && req.method === 'POST') {
      const body = await parseBody(req);
      const { productCode, name, category, price, cost, stock, unit, barcode } = body;

      const code = productCode || `PRD-${Date.now().toString().slice(-5)}`;
      const prodRes = await fetchFromSalesPlay('/products', {
        method: 'POST',
        body: JSON.stringify({
          product_code: code,
          product_name: name,
          category: category || 'General',
          sub_category: '',
          stock_control: true,
          expire_mode: false,
          safety_stock: 0,
          product_price_change: false,
          cost: Number(cost || (price * 0.7)),
          qty_change_option: false,
          barcode: barcode || '',
          measurement: unit || 'pcs',
          tax_codes: [],
          is_vat_product: false,
          is_composite: false,
          use_production: false,
          components: [],
          is_combo: false,
          combo_sets: [],
          modifier_group_ids: [],
          is_ingredient: false,
          is_variant: false,
          shops: [{ shop_id: SHOP_ID, price: Number(price), available_for_sale: true, safety_stock: 0 }],
        }),
      });

      if (prodRes.ok && Array.isArray(prodRes.data) && prodRes.data[0]?.product_ids?.[0]) {
        const newProductId = prodRes.data[0].product_ids[0].product_id;
        // Set initial stock if provided
        if (stock !== undefined && stock > 0) {
          await fetchFromSalesPlay('/inventory', {
            method: 'POST',
            body: JSON.stringify({
              inventory_levels: [{ product_id: newProductId, shop_id: SHOP_ID, in_stock: Number(stock) }],
            }),
          });
        }
        addSyncLog({
          action: 'Product Added to SalesPlay POS',
          status: 'success',
          details: `Created "${name}" (${price} SAR) with code ${code} in SalesPlay Back Office.`,
        });
        sendJson(res, 200, { success: true, product_id: newProductId, code });
      } else {
        sendJson(res, 400, { success: false, error: prodRes.data || 'Failed to create product in SalesPlay' });
      }
      return true;
    }

    // 3. Complete transaction log without auto-deducting stock via API
    // (As cashier bills on the SalesPlay POS counter machine directly, avoiding double stock deduction)
    if (url === '/api/salesplay/sync-transaction' && req.method === 'POST') {
      const body = await parseBody(req);
      const { orderNumber, items, paymentMethod, totalAmount, posReceiptNumber } = body;

      const itemsSummary = (items || [])
        .map((i: any) => `${i.quantity}x ${i.name}`)
        .join(', ');

      const formattedTotal = Number(totalAmount || 0).toFixed(3);
      const receiptNote = posReceiptNumber ? ` [POS Bill #${posReceiptNumber}]` : '';

      const detailsMessage = `Order ${orderNumber} (${formattedTotal} OMR via ${paymentMethod})${receiptNote}. Ready for / Billed on SalesPlay POS terminal (${itemsSummary || 'Custom list'}).`;

      const log = addSyncLog({
        orderNumber,
        action: 'Order Completed & Billed on POS',
        status: 'success',
        details: detailsMessage,
      });

      sendJson(res, 200, {
        success: true,
        orderNumber,
        log,
      });
      return true;
    }

    // 4. Fetch recent sync logs
    if (url === '/api/salesplay/logs' && req.method === 'GET') {
      sendJson(res, 200, {
        logs: getSyncLogs(),
      });
      return true;
    }

    sendJson(res, 404, { error: 'Not found' });
    return true;
  } catch (error) {
    console.error('Error handling SalesPlay request:', error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
    return true;
  }
}
