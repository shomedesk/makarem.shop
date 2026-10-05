import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface StoreSettings {
  houseDeliveryEnabled: boolean;
  updatedAt?: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  houseDeliveryEnabled: false, // Default is FALSE (hidden) as requested
};

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const docRef = doc(db, 'store_settings', 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...snap.data() } as StoreSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.warn('Failed to load store settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  try {
    const docRef = doc(db, 'store_settings', 'general');
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to update store settings:', err);
  }
}

export function subscribeToStoreSettings(onUpdate: (settings: StoreSettings) => void) {
  try {
    const docRef = doc(db, 'store_settings', 'general');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate({ ...DEFAULT_SETTINGS, ...snap.data() } as StoreSettings);
        } else {
          onUpdate(DEFAULT_SETTINGS);
        }
      },
      (err) => {
        console.warn('Store settings subscription error:', err);
        onUpdate(DEFAULT_SETTINGS);
      }
    );
  } catch (err) {
    console.warn('Store settings error:', err);
    onUpdate(DEFAULT_SETTINGS);
    return () => {};
  }
}
