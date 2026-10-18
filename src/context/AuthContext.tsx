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
  
  // Pengurusan Jadual Waktu Boleh Ubah Mengikut Akaun Google Guru
  timetable: JadualSlot[];
  saveTimetable: (slots: JadualSlot[]) => void;
  addSlot: (slot: JadualSlot) => void;
  updateSlot: (index: number, slot: JadualSlot) => void;
  deleteSlot: (index: number) => void;
  resetTimetable: () => void;
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

  // Jadual Waktu Guru Mengikut Akaun Google
  const [timetable, setTimetable] = useState<JadualSlot[]>([]);

  // Kunci storan tempatan untuk jadual guru mengikut Google UID unik
  const getStorageKey = (uid: string) => {
    return `erph_timetable_${uid}`;
  };

  // Muat jadual tersimpan khusus untuk akaun Google guru ini
  const loadTeacherTimetable = (uid: string) => {
    try {
      const key = getStorageKey(uid);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimetable(parsed);
          return;
        }
      }
      // Jika kali pertama akaun Google ini log masuk, sediakan templat lalai dan simpan untuknya
      localStorage.setItem(key, JSON.stringify(defaultJadual));
      setTimetable(defaultJadual as JadualSlot[]);
    } catch (e) {
      console.warn('Gagal memuat jadual guru:', e);
      setTimetable(defaultJadual as JadualSlot[]);
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
          setTeacherName(currentUser.displayName || email.split('@')[0]);
          setTeacherEmail(email);
          setIsDeLIMA(true);
          setError(null);
          loadTeacherTimetable(currentUser.uid);
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
      setTeacherName(result.user.displayName || email.split('@')[0]);
      setTeacherEmail(email);
      setIsDeLIMA(true);
      setError(null);
      loadTeacherTimetable(result.user.uid);
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

  // Simpan Jadual Waktu Guru mengikut Google UID mereka
  const saveTimetable = (newSlots: JadualSlot[]) => {
    setTimetable(newSlots);
    if (user?.uid) {
      try {
        localStorage.setItem(getStorageKey(user.uid), JSON.stringify(newSlots));
      } catch (err) {
        console.error('Gagal menyimpan jadual waktu:', err);
      }
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
        resetTimetable
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
