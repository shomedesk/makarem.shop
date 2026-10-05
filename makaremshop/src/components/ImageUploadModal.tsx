import React, { useState, useRef } from 'react';
import {
  Upload,
  Link,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { InventoryItem } from '../types';
import { compressImageFile, saveProductImage } from '../services/imageService';

interface ImageUploadModalProps {
  product: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onImageSaved: (productId: string, imageUrl: string) => void;
  language: 'en' | 'ar';
}

const PRESET_GROCERY_PHOTOS = [
  {
    name: 'Fresh Potatoes (بطاطس طازجة)',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    category: 'Vegitable',
  },
  {
    name: 'Mineral Water (مياه شرب معبأة)',
    url: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=500&auto=format&fit=crop&q=80',
    category: 'Drink',
  },
  {
    name: 'Cold Beverages (مشروبات غازية / عصائر)',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
    category: 'Drink',
  },
  {
    name: 'Fresh Bakery (مخبوزات طازجة)',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
    category: 'Bakery',
  },
  {
    name: 'Fresh Milk / Dairy (حليب وألبان)',
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
    category: 'Dairy',
  },
  {
    name: 'Fresh Eggs (بيض طازج)',
    url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80',
    category: 'Dairy',
  },
];

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  product,
  isOpen,
  onClose,
  onImageSaved,
  language,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string>(product?.imageUrl || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImageFile(file, 600, 0.85);
      setPreviewUrl(compressedDataUrl);
    } catch (err) {
      console.error('File compression error:', err);
      setErrorMsg(isAr ? 'تعذر معالجة الصورة، جرب صورة أخرى' : 'Failed to process image file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setPreviewUrl(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = async () => {
    if (!previewUrl) {
      setErrorMsg(isAr ? 'يرجى اختيار صورة أولاً' : 'Please select an image first');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      await saveProductImage(product.id, previewUrl);
      onImageSaved(product.id, previewUrl);
      onClose();
    } catch (err) {
      console.error('Save image error:', err);
      setErrorMsg(isAr ? 'حدث خطأ أثناء حفظ الصورة' : 'Failed to save image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              {isAr ? 'تحديث صورة المنتج' : 'Update Product Image'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {product.name} ({product.price.toFixed(3)} OMR)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع من الجهاز / الكاميرا' : 'Upload File / Camera'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'url'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" />
              <span>{isAr ? 'رابط مباشر' : 'Paste Image URL'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'presets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'صور جاهزة' : 'Quick Presets'}</span>
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Live Preview Box */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {isAr ? 'معاينة شكل المنتج في التطبيق' : 'Live E-Commerce Card Preview'}
            </span>

            <div className="w-44 h-44 rounded-2xl border-2 border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center relative shadow-inner group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={() => {
                    setErrorMsg(isAr ? 'تعذر تحميل هذه الصورة' : 'Image link failed to load');
                  }}
                />
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-1 stroke-1" />
                  <span className="text-xs font-medium">
                    {isAr ? 'لا توجد صورة بعد' : 'No image selected'}
                  </span>
                </div>
              )}

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full transition shadow-md"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl text-center cursor-pointer transition"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {isAr ? 'اضغط لاختيار صورة من هاتفك أو جهازك' : 'Click to choose image from phone / computer'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WebP • {isAr ? 'يتم ضغطها تلقائياً لتحميل فائق السرعة' : 'Automatically optimized for fast loading'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {isAr ? 'رابط الصورة على الإنترنت' : 'Direct Image URL'}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/product.jpg"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-black transition"
                >
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Quick Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'اختر صورة جاهزة عالية الجودة بنقرة واحدة:' : 'Pick a high-resolution grocery photo with 1-click:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_GROCERY_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewUrl(preset.url)}
                    className="p-2 border border-slate-200 hover:border-emerald-500 rounded-xl text-left flex items-center gap-2 hover:bg-emerald-50/50 transition cursor-pointer"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={!previewUrl || isProcessing}
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isAr ? 'حفظ الصورة وتطبيقها فوراً' : 'Save & Sync Image'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
