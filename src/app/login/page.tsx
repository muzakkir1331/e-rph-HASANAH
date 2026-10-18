'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  AlertCircle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    signInWithGoogle,
    loading,
    error,
    clearError,
    isDeLIMA,
    isFirebaseConfigured
  } = useAuth();

  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Jika sudah log masuk sebagai DeLIMA, arahkan terus ke laman utama
  React.useEffect(() => {
    if (user && isDeLIMA) {
      router.push('/');
    }
  }, [user, isDeLIMA, router]);

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        
        {/* Logo & Header SMA Al-Hasanah & DeLIMA */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-24 h-24 flex items-center justify-center">
            <img
              src="/logo-al-hasanah.png"
              alt="Logo Sekolah Menengah Agama Al-Hasanah"
              className="w-24 h-24 object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              SMA Al-Hasanah (SABK)
            </h1>
            <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mt-0.5">
              Sistem e-RPH Pintar &bull; Log Masuk ID DeLIMA
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pahang Darul Makmur &bull; Sesi Persekolahan 2026
            </p>
          </div>

          {/* Penunjuk Status Firebase */}
          <div className="pt-2 flex justify-center">
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Google SSO DeLIMA Sedia Digunakan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Kunci Firebase Belum Dikonfigurasi di .env.local
              </span>
            )}
          </div>
        </div>

        {/* Notis Keselamatan Ketat ID DeLIMA */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2 text-emerald-950">
          <div className="flex items-center space-x-2 font-bold text-emerald-900">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Dasar Keselamatan Rasmi KPM:</span>
          </div>
          <p className="leading-relaxed text-emerald-900/90">
            Sistem ini <strong>HANYA</strong> menerima log masuk Google melalui <strong>ID DeLIMA rasmi (*@moe-dl.edu.my)</strong>. Log masuk menggunakan akaun Gmail peribadi atau luar akan ditolak serta-merta.
          </p>
        </div>

        {/* Paparan Mesej Ralat / Penolakan Akses */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Akses Tidak Dibenarkan</span>
            </div>
            <p className="leading-relaxed pl-6">
              {error}
            </p>
          </div>
        )}

        {/* SATU-SATUNYA BUTANG LOG MASUK: Google SSO */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 shadow-md flex items-center justify-center space-x-3 transition-all hover:shadow-lg disabled:opacity-50"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.12C3.26 21.36 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.59H1.27C.46 8.2.0 10.05.0 12s.46 3.8 1.27 5.41l4.01-3.12z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.64 1.27 6.59l4.01 3.12c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{loading ? 'Menghubungkan ke Google SSO...' : 'Log Masuk dengan Google SSO (ID DeLIMA)'}</span>
          </button>

          {/* Panduan Konfigurasi Firebase (Accordion Kecil) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="w-full px-4 py-2.5 text-[11px] text-slate-600 flex items-center justify-between hover:bg-slate-100 transition-colors font-medium"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Bantuan Konfigurasi Kunci Firebase di .env.local</span>
              </span>
              {showConfigGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showConfigGuide && (
              <div className="p-4 border-t border-slate-200 text-xs text-slate-600 space-y-2 bg-white">
                <p>
                  Untuk menghubungkan Google SSO ke projek Firebase anda, buka fail <code>.env.local</code> di direktori projek dan masukkan maklumat daripada <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a>:
                </p>
                <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=projek-anda.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=projek-anda`}
                </pre>
                <p className="text-[10px] text-slate-500">
                  * Pastikan domain <code>localhost</code> telah ditambah di <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Makluman */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400">
            Kementerian Pendidikan Malaysia &bull; Inisiatif Transformasi Sekolah 2025 (TS25)
          </p>
        </div>

      </div>
    </div>
  );
}
