import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { CustomerProfile, LocationCoordinates, Order } from '../types';

const STORAGE_KEY_PROFILE = 'makarem_customer_profile';
const STORAGE_KEY_LOCATION = 'makarem_saved_location';

export function loadLocalCustomerProfile(): CustomerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse local customer profile:', err);
  }
  return null;
}

export function saveLocalCustomerProfile(profile: CustomerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save local customer profile:', err);
  }
}

export function getSavedLocation(): LocationCoordinates | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse saved location:', err);
  }
  return null;
}

export function saveLocation(coords: LocationCoordinates): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(coords));
  } catch (err) {
    console.warn('Failed to save location coordinates:', err);
  }
}

export async function saveCustomerProfileToFirestore(profile: CustomerProfile): Promise<void> {
  saveLocalCustomerProfile(profile);
  if (profile.locationCoordinates) {
    saveLocation(profile.locationCoordinates);
  }

  try {
    const cleanId = profile.phone.replace(/[^0-9]/g, '') || profile.id;
    const docRef = doc(db, 'customers', cleanId);
    
    // Clean any undefined fields before writing
    const cleanData: any = {
      id: cleanId,
      phone: profile.phone,
      updatedAt: new Date().toISOString(),
    };
    if (profile.vehicleNumber) cleanData.vehicleNumber = profile.vehicleNumber;
    if (profile.houseNumber) cleanData.houseNumber = profile.houseNumber;
    if (profile.locationCoordinates) cleanData.locationCoordinates = profile.locationCoordinates;
    if (profile.createdAt) cleanData.createdAt = profile.createdAt;
    else cleanData.createdAt = new Date().toISOString();

    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('Firestore customer profile save error:', err);
  }
}

export async function fetchCustomerOrders(phone: string): Promise<Order[]> {
  if (!phone || !phone.trim()) return [];
  const cleanPhone = phone.trim();

  try {
    const q = query(
      collection(db, 'orders'),
      where('customerPhone', '==', cleanPhone),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const orders: Order[] = [];
    snap.forEach((d) => {
      orders.push({ id: d.id, ...d.data() } as Order);
    });
    return orders;
  } catch (err) {
    console.warn('Error fetching customer orders:', err);
    // Fallback: search client-side from local orders if index or compound query is waiting
    return [];
  }
}
