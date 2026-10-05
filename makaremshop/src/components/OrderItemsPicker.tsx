import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  FileText,
  ShoppingBag,
  Sparkles,
  Check,
  Package,
} from 'lucide-react';
import type { InventoryItem, OrderItem } from '../types';

interface OrderItemsPickerProps {
  catalog: InventoryItem[];
  selectedItems: OrderItem[];
  onUpdateQuantity: (item: InventoryItem, delta: number) => void;
  customNotes: string;
  onCustomNotesChange: (val: string) => void;
  language: 'en' | 'ar';
}

const QUICK_SUGGESTIONS = [
  'حليب المراعي بارد ٢ لتر',
  'خبز صامولي مفرود طازج',
  'طبق بيض بلدي ٣٠ حبة',
  'كرتون مياه نوفا',
  'شاي ربيع إكسبريس',
  'كيلو طماطم وخيار',
  'زبادي سادة',
];

export const OrderItemsPicker: React.FC<OrderItemsPickerProps> = ({
  catalog,
  selectedItems,
  onUpdateQuantity,
  customNotes,
  onCustomNotesChange,
  language,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom_list'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(catalog.map((i) => i.category)))];

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

  const handleAddSuggestion = (suggestion: string) => {
    if (customNotes.includes(suggestion)) return;
    const newNotes = customNotes ? `${customNotes}, ${suggestion}` : suggestion;
    onCustomNotesChange(newNotes);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      {/* Header with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>{isAr ? 'محتويات الطلب والمشتريات' : 'Select Groceries or Write List'}</span>
          </h3>
          <p className="text-xs text-slate-500 font-['Cairo',sans-serif]">
            {isAr
              ? 'اختر من الأصناف السريعة أو اكتب قائمة مشترياتك بحرية كما تريد'
              : 'Pick from daily essentials or quickly type your custom grocery list'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الأصناف الشائعة' : 'Quick Essentials'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom_list')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
              activeTab === 'custom_list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'قائمة حرة / مخصصة' : 'Custom List'}</span>
            {customNotes.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Catalog Picker */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Category Pills */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن صنف (حليب، خبز، ماء، أرز...)' : 'Search items (milk, bread, water, rice)...'}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Category Filter Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'All' ? (isAr ? 'الكل' : 'All') : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredCatalog.map((item) => {
              const qty = getItemQuantity(item.id);
              const inStock = item.stock > 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                    qty > 0
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        {isAr ? item.arabicName : item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-['Cairo',sans-serif] mt-0.5">
                        {isAr ? item.name : item.arabicName}
                      </p>
                    </div>
                    {item.salesplayItemId && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                        SalesPlay
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="font-extrabold text-sm sm:text-base text-emerald-700">
                        {item.price.toFixed(2)} SAR
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">/ {item.unit}</span>
                      <div className="text-[10px] text-slate-400">
                        {inStock ? `${item.stock} in stock` : 'Low stock'}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item, -1)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-md bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white shadow-xs transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center text-xs font-bold text-slate-900">
                        {qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item, 1)}
                        className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
              <Package className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">{isAr ? 'لم نجد هذا الصنف في القائمة' : 'No items found matching your search'}</p>
              <button
                type="button"
                onClick={() => setActiveTab('custom_list')}
                className="mt-2 text-xs text-emerald-700 hover:underline font-bold"
              >
                {isAr ? 'انقر لكتابته في القائمة الحرة' : 'Switch to Custom List to type it directly'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Custom / Handwritten Grocery List */}
      {activeTab === 'custom_list' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <span className="font-bold">
                {isAr ? 'تسوق مثل ما تحب!' : 'Freedom for regular customers!'}
              </span>{' '}
              {isAr
                ? 'لا داعي للبحث عن كل صنف بالتفصيل. فقط اكتب أو الصق قائمة طلباتك كما هي وسيقوم عامل بقالة مكارم الخير بتجهيزها وإحضارها لك فوراً.'
                : 'No need to search for every tiny item. Just type your grocery list naturally and our store team will pick and pack everything for you.'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {isAr ? 'اكتب قائمة مشترياتك أو طلبات إضافية *' : 'Type Your Grocery List / Special Requests *'}
            </label>
            <textarea
              rows={4}
              value={customNotes}
              onChange={(e) => onCustomNotesChange(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: ٢ كرتون حليب المراعي بارد، ١ كيس خبز صامولي طازج، ٣ علب تونة، ١ فيمتو، باقة نعناع، ٢ بطاطس ليز حار'
                  : 'e.g. 2 cold cartons Almarai full cream milk, 1 pack fresh samoli bread, 3 cans tuna, 1 bottle Vimto, fresh mint...'
              }
              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {isAr ? 'أضف بنقرة واحدة للقائمة:' : '1-Click Quick Add Suggestions:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddSuggestion(sug)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 border border-slate-200 transition flex items-center gap-1 font-['Cairo',sans-serif]"
                >
                  <Plus className="w-3 h-3" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Items Mini Badge Summary */}
      {selectedItems.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {isAr ? 'الأصناف المحددة:' : 'Selected Items:'}
            </span>
            <span className="px-2 py-0.5 text-xs font-extrabold bg-emerald-600 text-white rounded-full">
              {selectedItems.reduce((acc, i) => acc + i.quantity, 0)} {isAr ? 'قطعة' : 'items'}
            </span>
          </div>

          <div className="text-xs font-extrabold text-slate-900">
            {isAr ? 'الإجمالي المقدر:' : 'Estimated Total:'}{' '}
            <span className="text-emerald-700 text-sm">
              {selectedItems.reduce((acc, i) => acc + i.total, 0).toFixed(2)} SAR
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
