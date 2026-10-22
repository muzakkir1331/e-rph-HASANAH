'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, isDeLIMAEmail, isFirebaseConfigured } from '@/lib/firebase/config';
import { JadualSlot, UserProfile } from '@/types/erph';
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
  
  // Profil SaaS B2C & Multi-Tenant
  userProfile: UserProfile | null;
  isOnboardingCompleted: boolean;
  planType: 'free' | 'pro';
  aiCreditsRemaining: number;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  upgradeToPro: (voucherCode?: string) => Promise<{ success: boolean; message: string; profile?: UserProfile }>;
  deductAICredit: (amount?: number) => Promise<{ success: boolean; creditsRemaining: number; isPro: boolean }>;
  
  // Kawalan Modal Onboarding & Paywall
  isOnboardingModalOpen: boolean;
  setIsOnboardingModalOpen: (open: boolean) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;

  // Pengurusan Jadual Waktu Boleh Ubah (Cloud Profile)
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

  // Profil SaaS B2C
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  // Jadual Waktu Guru
  const [timetable, setTimetable] = useState<JadualSlot[]>([]);

  const getStorageKey = (uid: string) => `erph_timetable_${uid}`;

  // Muat turun profil guru daripada API / Pelayan
  const loadUserProfile = useCallback(async (uid: string, email: string) => {
    try {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUserProfile(data.profile);
          if (data.profile.full_name) {
            setTeacherName(data.profile.full_name);
          }
          // Jika pengguna belum melengkapkan onboarding, buka wizard secara automatik
          if (!data.profile.is_onboarding_completed) {
            setIsOnboardingModalOpen(true);
          }
          return data.profile;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat profil guru:', e);
    }
    return null;
  }, []);

  // Muat jadual tersimpan khusus dari Cloud Profile masing-masing
  const loadTeacherTimetable = useCallback(async (uid: string, email: string, token?: string | null) => {
    setCloudSyncStatus('saving');
    try {
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

      const saved = localStorage.getItem(getStorageKey(uid));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimetable(parsed);
          setCloudSyncStatus('synced');
          return;
        }
      }

      setTimetable(defaultJadual as JadualSlot[]);
      setCloudSyncStatus('synced');
    } catch (e) {
      console.warn('Gagal memuat jadual guru:', e);
      setTimetable(defaultJadual as JadualSlot[]);
      setCloudSyncStatus('error');
    }
  }, []);

  // Dengar perubahan Auth Firebase
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? sessionStorage.getItem('erph_google_access_token') : null;
    if (savedToken) {
      setGoogleAccessToken(savedToken);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const email = currentUser.email || '';
        setUser(currentUser);
        const isDelima = isDeLIMAEmail(email);
        setIsDeLIMA(isDelima);
        
        const fallbackName = currentUser.displayName || email.split('@')[0];
        setTeacherName(fallbackName);
        setTeacherEmail(email);
        setError(null);

        // Muat profil SaaS B2C guru dan jadual waktu
        await loadUserProfile(currentUser.uid, email);
        await loadTeacherTimetable(currentUser.uid, email, savedToken);
      } else {
        setUser(null);
        setIsDeLIMA(false);
        setTeacherName('');
        setTeacherEmail('');
        setUserProfile(null);
        setGoogleAccessToken(null);
        setTimetable([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile, loadTeacherTimetable]);

  // Log masuk Google SSO Firebase
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        'Kunci API Firebase (NEXT_PUBLIC_FIREBASE_API_KEY) belum dikonfigurasikan di dalam fail .env.local.'
      );
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      if (token && typeof window !== 'undefined') {
        setGoogleAccessToken(token);
        sessionStorage.setItem('erph_google_access_token', token);
      }

      setUser(result.user);
      const isDelima = isDeLIMAEmail(email);
      setIsDeLIMA(isDelima);
      const fallbackName = result.user.displayName || email.split('@')[0];
      setTeacherName(fallbackName);
      setTeacherEmail(email);
      setError(null);

      const profile = await loadUserProfile(result.user.uid, email);
      await loadTeacherTimetable(result.user.uid, email, token);

      router.push('/');
    } catch (err: any) {
      console.error('Ralat Google Sign In:', err);
      const errorCode = err?.code || '';
      const errorMsg = err?.message || '';

      if (errorCode === 'auth/api-key-not-valid' || errorMsg.includes('api-key-not-valid')) {
        setError(
          'Kunci API Firebase Tidak Sah (auth/api-key-not-valid). Sila pastikan pembolehubah NEXT_PUBLIC_FIREBASE_API_KEY dalam fail .env.local telah diisi dengan kunci sah.'
        );
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError(
          'Domain Tidak Dibenarkan: Sila pastikan domain "localhost" telah dimasukkan dalam senarai Authorized Domains di Firebase Console.'
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        // Pengguna tutup popup
      } else {
        setError(errorMsg || 'Gagal log masuk dengan Google SSO.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Log Keluar
  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Ralat sign out:', err);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('erph_google_access_token');
    }
    setUser(null);
    setIsDeLIMA(false);
    setTeacherName('');
    setTeacherEmail('');
    setUserProfile(null);
    setGoogleAccessToken(null);
    setTimetable([]);
    setError(null);
    router.push('/login');
  };

  // Kemas kini profil pengguna (Onboarding & Tetapan)
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    const uid = user?.uid || userProfile?.user_id || '';
    const email = teacherEmail || user?.email || userProfile?.email || '';

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid,
          email,
          ...data
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          setUserProfile(json.profile);
          if (json.profile.full_name) {
            setTeacherName(json.profile.full_name);
          }
          return true;
        }
      }
    } catch (e) {
      console.error('Ralat mengemas kini profil:', e);
    }
    return false;
  };

  // Naik taraf pelan ke PRO melalui baucar atau pembayaran
  const upgradeToPro = async (voucherCode?: string): Promise<{ success: boolean; message: string; profile?: UserProfile }> => {
    const uid = user?.uid || userProfile?.user_id || '';
    const email = teacherEmail || user?.email || userProfile?.email || '';

    try {
      const res = await fetch('/api/profile/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          email,
          voucherCode,
          paymentMethod: voucherCode ? undefined : 'fpx_direct'
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.profile) {
          setUserProfile(json.profile);
        }
        return { success: true, message: json.message, profile: json.profile };
      } else {
        return { success: false, message: json.error || 'Gagal menaik taraf pelan.' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Ralat pelayan semasa memproses naik taraf.' };
    }
  };

  // Semak & tolak kredit AI
  const deductAICredit = async (amount: number = 1): Promise<{ success: boolean; creditsRemaining: number; isPro: boolean }> => {
    const uid = user?.uid || userProfile?.user_id || '';
    const email = teacherEmail || user?.email || userProfile?.email || '';

    try {
      const res = await fetch('/api/profile/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          email,
          amount
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            ai_credits_remaining: json.creditsRemaining
          });
        }
        return { success: true, creditsRemaining: json.creditsRemaining, isPro: Boolean(json.isPro) };
      } else if (res.status === 403) {
        // Kuota habis! Buka modal Paywall
        setIsUpgradeModalOpen(true);
        return { success: false, creditsRemaining: 0, isPro: false };
      }
    } catch (err) {
      console.warn('Gagal tolak kredit AI:', err);
    }
    return { success: false, creditsRemaining: userProfile?.ai_credits_remaining || 0, isPro: userProfile?.plan_type === 'pro' };
  };

  // Simpan Jadual Waktu Guru
  const saveTimetable = async (newSlots: JadualSlot[]) => {
    setTimetable(newSlots);
    setCloudSyncStatus('saving');

    const email = teacherEmail || user?.email || '';
    const uid = user?.uid || '';

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

    const activeToken = googleAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('erph_google_access_token') : null);
    if (activeToken) {
      saveTeacherProfileToDrive({
        accessToken: activeToken,
        timetable: newSlots,
        teacherName,
        teacherEmail: email
      }).catch(err => console.warn('Ralat simpan ke Google Drive:', err));
    }

    if (uid && typeof window !== 'undefined') {
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

        // Profil B2C SaaS & Langganan
        userProfile,
        isOnboardingCompleted: Boolean(userProfile?.is_onboarding_completed),
        planType: userProfile?.plan_type || 'free',
        aiCreditsRemaining: userProfile?.ai_credits_remaining !== undefined ? userProfile.ai_credits_remaining : 5,
        updateUserProfile,
        upgradeToPro,
        deductAICredit,

        // Modal triggers
        isOnboardingModalOpen,
        setIsOnboardingModalOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,

        // Jadual
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
