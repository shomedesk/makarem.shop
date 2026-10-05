import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

export const ADMIN_WHITELIST = [
  'shomedesk@gmail.com',
  'imshomesantu@gmail.com',
  'makarembakkala@gmail.com',
];

export function isEmailAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.includes(email.toLowerCase().trim());
}

export async function loginAdminWithGoogle(): Promise<{ success: boolean; email: string }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const email = result.user.email?.toLowerCase().trim() || '';

  if (!isEmailAuthorizedAdmin(email)) {
    await signOut(auth);
    throw new Error(
      `Access Denied: ${email || 'This account'} is not an authorized administrator. Only designated store emails can log in.`
    );
  }

  // Persist admin session in localStorage
  localStorage.setItem('makarem_admin_email', email);
  return { success: true, email };
}

export async function loginAdminWithCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; email: string }> {
  const cleanEmail = emailInput.toLowerCase().trim();
  if (!isEmailAuthorizedAdmin(cleanEmail)) {
    throw new Error('Access Denied: This email address is not in the authorized store admin list.');
  }

  const result = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
  const email = result.user.email?.toLowerCase().trim() || cleanEmail;
  localStorage.setItem('makarem_admin_email', email);
  return { success: true, email };
}

export async function logoutAdmin(): Promise<void> {
  localStorage.removeItem('makarem_admin_email');
  await signOut(auth);
}

export function subscribeToAdminState(
  callback: (isAdmin: boolean, user: User | null) => void
) {
  return onAuthStateChanged(auth, (user) => {
    if (user && isEmailAuthorizedAdmin(user.email)) {
      localStorage.setItem('makarem_admin_email', user.email!.toLowerCase().trim());
      callback(true, user);
    } else {
      localStorage.removeItem('makarem_admin_email');
      callback(false, null);
    }
  });
}
