import type { InventoryItem } from '../types';

// ONLY REAL products from Makarem Al-Khair Modern SalesPlay POS account
export const INITIAL_CATALOG: InventoryItem[] = [
  {
    id: 'ZVBaNzR4YkZYK2Y0OWsxcUc1Wkl4Zz09',
    name: 'Fida water 250',
    arabicName: 'مياه فيدا ٢٥٠ مل',
    category: 'Drink',
    price: 0.1,
    unit: 'pcs',
    stock: 49,
    barcode: '9210499092115',
    salesplayItemId: 'ZVBaNzR4YkZYK2Y0OWsxcUc1Wkl4Zz09',
    imageUrl: 'https://cloud.salesplaypos.com/img/product_images/SP60850280_1845944.png',
  },
  {
    id: 'YytacDR4bkxIZ1FjNXJrb2Z1OEZ2QT09',
    name: 'Potato',
    arabicName: 'بطاطس بالكيلو',
    category: 'Vegitable',
    price: 0.2,
    unit: 'kg',
    stock: 25,
    barcode: '6073000051635',
    salesplayItemId: 'YytacDR4bkxIZ1FjNXJrb2Z1OEZ2QT09',
  },
  {
    id: 'QWhxek54UkQ3eTArdml2d1NkSDVnUT09',
    name: 'Test',
    arabicName: 'صنف تجريبي Test',
    category: 'Drink',
    price: 0.2,
    unit: 'pcs',
    stock: 62,
    barcode: 'X001EJGGRZ',
    salesplayItemId: 'QWhxek54UkQ3eTArdml2d1NkSDVnUT09',
    imageUrl: 'https://cloud.salesplaypos.com/img/product_images/SP60850280_1862375.png',
  },
];
