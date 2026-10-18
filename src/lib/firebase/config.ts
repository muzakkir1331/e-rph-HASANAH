import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const isFirebaseConfigured = Boolean(
  rawApiKey && 
  rawApiKey.trim() !== '' && 
  !rawApiKey.includes('Fake') && 
  !rawApiKey.includes('DemoFake')
);

const firebaseConfig = {
  apiKey: rawApiKey || 'AIzaSyDemoFakeApiKeyForDeLIMAeRPH2026',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'erph-pintar-delima.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'erph-pintar-delima',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'erph-pintar-delima.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

// Pastikan inisialisasi selamat tanpa ralat SSR
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  // Galakkan pengguna memilih akaun Google domain moe-dl.edu.my
  hd: 'moe-dl.edu.my',
  prompt: 'select_account'
});

/**
 * Pengesahan ketat domain e-mel rasmi DeLIMA Kementerian Pendidikan Malaysia (KPM).
 * Hanya menerima domain @moe-dl.edu.my atau subdomain berkaitan (cth: g-12345678@moe-dl.edu.my)
 */
export function isDeLIMAEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  
  // Format rasmi guru KPM: g-XXXXXXXX@moe-dl.edu.my atau apa-apa awalan @moe-dl.edu.my
  return (
    lower.endsWith('@moe-dl.edu.my') ||
    lower.endsWith('.moe-dl.edu.my') ||
    lower.endsWith('@epembelajaran.edu.my') ||
    lower.endsWith('@moe.gov.my')
  );
}
