import { doc, setDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface ProductMediaRecord {
  productId: string;
  imageUrl: string;
  updatedAt: string;
}

// Compress file to base64 data url using HTML5 Canvas
export async function compressImageFile(file: File, maxWidth = 640, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Use image/jpeg or image/webp for optimal compression
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Save image override to both Firestore and Backend
export async function saveProductImage(productId: string, imageUrl: string): Promise<boolean> {
  try {
    // 1. Save to Firestore for permanent cross-device sync
    const docRef = doc(db, 'product_media', productId);
    await setDoc(docRef, {
      productId,
      imageUrl,
      updatedAt: new Date().toISOString(),
    });

    // 2. Also notify backend server
    await fetch('/api/salesplay/update-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, imageUrl }),
    }).catch(() => null);

    return true;
  } catch (error) {
    console.error('Failed to save product image:', error);
    // Even if Firestore errors, notify backend
    await fetch('/api/salesplay/update-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, imageUrl }),
    }).catch(() => null);
    return true;
  }
}

// Subscribe to real-time image updates from Firestore
export function subscribeToProductMedia(
  onUpdate: (mediaMap: Record<string, string>) => void
) {
  try {
    return onSnapshot(
      collection(db, 'product_media'),
      (snapshot) => {
        const map: Record<string, string> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.imageUrl) {
            map[doc.id] = data.imageUrl;
          }
        });
        onUpdate(map);
      },
      (err) => {
        console.warn('Product media snapshot notice:', err);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribeToProductMedia catch:', err);
    return () => {};
  }
}
