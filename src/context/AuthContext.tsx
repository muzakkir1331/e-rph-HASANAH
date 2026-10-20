'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, isDeLIMAEmail, isFirebaseConfigured } from '@/lib/firebase/config';
import { JadualSlot } from '@/types/erph';
import defaultJadual from '@/data/jadual_waktu.json';
import { saveTeacherProfileToDrive, getTeacherProfileFromDrive } from '@/lib/google-drive';

interface AuthContextType {
  user: User | null;
  teacherName: string;
  teacherEmail: string;
  isDeLIMA: boolean;
  isFirebaseConfigured: boolean;
  googleAccessToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
  
  // Pengurusan Jadual Waktu Boleh Ubah Mengikut Akaun Google Guru (Cloud Profile)
  timetable: JadualSlot[];
  saveTimetable: (slots: JadualSlot[]) => Promise<void>;
  addSlot: (slot: JadualSlot) => void;
  updateSlot: (index: number, slot: JadualSlot) => void;
  deleteSlot: (index: number) => void;
  resetTimetable: () => void;
  cloudSyncStatus: 'synced' | 'saving' | 'error' | 'idle';
  isCloudProfile: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [isDeLIMA, setIsDeLIMA] = useState<boolean>(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'error' | 'idle'>('idle');

  // Jadual Waktu Guru Mengikut Akaun Google (Disimpan dalam Profil Cloud Tersendiri)
  const [timetable, setTimetable] = useState<JadualSlot[]>([]);

  // Kunci storan tempatan untuk jadual guru mengikut Google UID unik (sebagai sandaran luar talian sahaja)
  const getStorageKey = (uid: string) => {
    return `erph_timetable_${uid}`;
  };

  // Muat jadual tersimpan khusus dari Cloud Profile DeLIMA masing-masing (bukan local)
  const loadTeacherTimetable = async (uid: string, email: string, token?: string | null) => {
    setCloudSyncStatus('saving');
    try {
      // 1. Cuba muat turun daripada Google Drive pengguna terlebih dahulu jika token sah wujud
      if (token) {
        try {
          const driveRes = await getTeacherProfileFromDrive({ accessToken: token });
          if (driveRes.success && driveRes.timetable && Array.isArray(driveRes.timetable) && driveRes.timetable.length > 0) {
            setTimetable(driveRes.timetable);
            setCloudSyncStatus('synced');
            try { localStorage.setItem(getStorageKey(uid), JSON.stringify(driveRes.timetable)); } catch {}
            return;
          }
        } catch (e) {
          console.warn('Gagal semak Google Drive profile:', e);
        }
      }

      // 2. Ambil daripada Profil Cloud API Pelayan
      const res = await fetch(`/api/profile/timetable?email=${encodeURIComponent(email)}&uid=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.timetable && Array.isArray(data.timetable) && data.timetable.length > 0) {
          setTimetable(data.timetable);
          setCloudSyncStatus('synced');
          try { localStorage.setItem(getStorageKey(uid), JSON.stringify(data.timetable)); } catch {}
          return;
        }
      }

      // 3. Sandaran luar talian sekiranya talian internet terganggu
      const saved = localStorage.getItem(getStorageKey(uid));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimetable(parsed);
          setCloudSyncStatus('synced');
          return;
        }
      }

      // 4. Default jadual
      setTimetable(defaultJadual as JadualSlot[]);
      setCloudSyncStatus('synced');
    } catch (e) {
      console.warn('Gagal memuat jadual guru dari profil cloud:', e);
      setTimetable(defaultJadual as JadualSlot[]);
      setCloudSyncStatus('error');
    }
  };

  // Dengar perubahan Auth Firebase
  useEffect(() => {
    // Cuba ambil token akses Google yang masih sah dalam sesi
    const savedToken = sessionStorage.getItem('erph_google_access_token');
    if (savedToken) {
      setGoogleAccessToken(savedToken);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const email = currentUser.email || '';
        
        // PENGESAHAN KETAT: Hanya ID DeLIMA (*@moe-dl.edu.my) sahaja diterima!
        if (isDeLIMAEmail(email)) {
          setUser(currentUser);
          const tName = currentUser.displayName || email.split('@')[0];
          setTeacherName(tName);
          setTeacherEmail(email);
          setIsDeLIMA(true);
          setError(null);
          await loadTeacherTimetable(currentUser.uid, email, savedToken);
        } else {
          // Tolak akses serta-merta & log keluar jika bukan ID DeLIMA
          await signOut(auth);
          sessionStorage.removeItem('erph_google_access_token');
          setUser(null);
          setIsDeLIMA(false);
          setTeacherName('');
          setTeacherEmail('');
          setGoogleAccessToken(null);
          setTimetable([]);
          setError(
            `Akses Ditolak: Akaun Google "${email}" bukan ID DeLIMA rasmi. Sila log masuk menggunakan e-mel rasmi Kementerian Pendidikan Malaysia (*@moe-dl.edu.my).`
          );
        }
      } else {
        // Tiada pengguna log masuk
        setUser(null);
        setIsDeLIMA(false);
        setTeacherName('');
        setTeacherEmail('');
        setGoogleAccessToken(null);
        setTimetable([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Log masuk Google SSO Firebase (HANYA Google SSO Disediakan)
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        'Kunci API Firebase (NEXT_PUBLIC_FIREBASE_API_KEY) belum dikonfigurasikan di dalam fail .env.local. Sila salin konfigurasi Web App daripada Firebase Console untuk membolehkan Google SSO.'
      );
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';

      // Pengesahan ketat domain ID DeLIMA KPM
      if (!isDeLIMAEmail(email)) {
        await signOut(auth);
        sessionStorage.removeItem('erph_google_access_token');
        setUser(null);
        setIsDeLIMA(false);
        setTeacherName('');
        setTeacherEmail('');
        setGoogleAccessToken(null);
        setTimetable([]);
        setError(
          `Akses Ditolak: Akaun "${email}" bukan ID DeLIMA rasmi. Hanya e-mel rasmi KPM (*@moe-dl.edu.my) sahaja dibenarkan.`
        );
        return;
      }

      // Ambil token akses Google OAuth untuk capaian Google Drive
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setGoogleAccessToken(token);
        sessionStorage.setItem('erph_google_access_token', token);
      }

      setUser(result.user);
      const tName = result.user.displayName || email.split('@')[0];
      setTeacherName(tName);
      setTeacherEmail(email);
      setIsDeLIMA(true);
      setError(null);
      await loadTeacherTimetable(result.user.uid, email, token);
      router.push('/');
    } catch (err: any) {
      console.error('Ralat Google Sign In:', err);
      const errorCode = err?.code || '';
      const errorMsg = err?.message || '';

      if (errorCode === 'auth/api-key-not-valid' || errorMsg.includes('api-key-not-valid')) {
        setError(
          'Kunci API Firebase Tidak Sah (auth/api-key-not-valid). Sila pastikan pembolehubah NEXT_PUBLIC_FIREBASE_API_KEY dalam fail .env.local telah diisi dengan kunci sah daripada Firebase Console.'
        );
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError(
          'Domain Tidak Dibenarkan: Sila pastikan domain "localhost" telah dimasukkan dalam senarai Authorized Domains di Firebase Console (Authentication > Settings > Authorized domains).'
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        // Pengguna menutup tetingkap popup
      } else {
        setError(errorMsg || 'Gagal log masuk dengan Google SSO.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Log Keluar: Reset semua sesi dan kembali ke halaman log masuk (/login)
  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Ralat sign out:', err);
    }
    sessionStorage.removeItem('erph_google_access_token');
    setUser(null);
    setIsDeLIMA(false);
    setTeacherName('');
    setTeacherEmail('');
    setGoogleAccessToken(null);
    setTimetable([]);
    setError(null);
    router.push('/login');
  };

  // Simpan Jadual Waktu Guru ke Profil Cloud masing-masing (bukan local)
  const saveTimetable = async (newSlots: JadualSlot[]) => {
    setTimetable(newSlots);
    setCloudSyncStatus('saving');

    const email = teacherEmail || user?.email || '';
    const uid = user?.uid || '';

    // 1. Simpan ke fail Profil Cloud API Pelayan
    try {
      const res = await fetch('/api/profile/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          uid,
          teacherName,
          timetable: newSlots
        })
      });
      if (res.ok) {
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('error');
      }
    } catch (err) {
      console.error('Ralat simpan ke profil cloud pelayan:', err);
      setCloudSyncStatus('error');
    }

    // 2. Simpan ke Google Drive Cloud pengguna jika ada token akses DeLIMA
    const activeToken = googleAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('erph_google_access_token') : null);
    if (activeToken) {
      saveTeacherProfileToDrive({
        accessToken: activeToken,
        timetable: newSlots,
        teacherName,
        teacherEmail: email
      }).catch(err => console.warn('Ralat simpan ke Google Drive:', err));
    }

    // 3. Sandaran cache luar talian
    if (uid) {
      try {
        localStorage.setItem(getStorageKey(uid), JSON.stringify(newSlots));
      } catch {}
    }
  };

  const addSlot = (slot: JadualSlot) => {
    const updated = [...timetable, slot];
    saveTimetable(updated);
  };

  const updateSlot = (index: number, updatedSlot: JadualSlot) => {
    const updated = [...timetable];
    if (index >= 0 && index < updated.length) {
      updated[index] = updatedSlot;
      saveTimetable(updated);
    }
  };

  const deleteSlot = (index: number) => {
    const updated = timetable.filter((_, idx) => idx !== index);
    saveTimetable(updated);
  };

  const resetTimetable = () => {
    saveTimetable(defaultJadual as JadualSlot[]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        teacherName,
        teacherEmail,
        isDeLIMA,
        isFirebaseConfigured,
        googleAccessToken,
        loading,
        error,
        signInWithGoogle,
        signOutUser,
        clearError: () => setError(null),
        timetable,
        saveTimetable,
        addSlot,
        updateSlot,
        deleteSlot,
        resetTimetable,
        cloudSyncStatus,
        isCloudProfile: true
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth mesti digunakan di dalam AuthProvider');
  }
  return context;
}
