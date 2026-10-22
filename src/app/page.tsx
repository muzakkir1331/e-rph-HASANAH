'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  Calendar,
  Sheet,
  ArrowRight,
  ShieldCheck,
  User,
  Edit3,
  Loader2,
  Crown,
  Share2,
  School,
  AlertCircle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TimetableEditorModal from '@/components/jadual/TimetableEditorModal';
import ShareReviewModal from '@/components/review/ShareReviewModal';
import { getCurrentWeekFromDate } from '@/lib/rpt-helper';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    timetable,
    teacherName,
    teacherEmail,
    isDeLIMA,
    userProfile,
    planType,
    aiCreditsRemaining,
    isOnboardingCompleted,
    setIsOnboardingModalOpen,
    setIsUpgradeModalOpen,
    loading
  } = useAuth();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan sesi pendidik...</p>
      </div>
    );
  }

  const currentWeekObj = getCurrentWeekFromDate();
  const currentWeek = currentWeekObj?.minggu_ke || 1;

  // Tapis kelas hari ini mengikut hari Isnin (atau hari semasa)
  const todayClasses = timetable.filter((s) => s.hari === 'ISNIN');

  // Dapatkan senarai subjek unik guru
  const uniqueSubjects = Array.from(new Set(timetable.map((s) => `${s.subjek} (T${s.tingkatan})`)));

  const schoolName = userProfile?.school_name || 'SEKOLAH SAYA';
  const schoolLogo = userProfile?.school_logo;
  const isPro = planType === 'pro';

  return (
    <div className="space-y-8">
      
      {/* Banner Makluman Onboarding (Jika profil belum lengkap) */}
      {!isOnboardingCompleted && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Lengkapkan Profil Sekolah &amp; Muat Naik Logo
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Masukkan nama sekolah, daerah, gred jawatan, dan logo sekolah anda supaya diletakkan secara automatik pada kepala surat fail PDF e-RPH.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOnboardingModalOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap self-end sm:self-center"
          >
            Sediakan Profil Sekarang &rarr;
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 rounded-3xl p-5 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{isDeLIMA ? `ID DeLIMA: ${teacherEmail}` : teacherEmail}</span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-700/60 border border-emerald-400/30 text-emerald-100">
              <School className="w-3.5 h-3.5 text-amber-300" />
              <span>Warga Pendidik SMA Al-Hasanah &bull; Akses Penuh</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Selamat Datang, {teacherName}
          </h1>
          <p className="text-xs sm:text-base text-emerald-100/90 leading-relaxed">
            Sistem Pengurusan e-RPH Digital rasmi bagi guru-guru SMA Al-Hasanah. Dilengkapi integrasi DSKP KBD &amp; KSSM, Takwim KPM, jadual waktu boleh ubah guru, Co-Pilot Gemini AI, dan pautan semakan luar Pengetua (Magic Link).
          </p>

          <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <Link
              href="/rph/baharu"
              className="px-5 py-3 sm:py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-105 touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Buka Borang e-RPH Pintar</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-3 sm:py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white border border-white/20 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors shadow-sm touch-manipulation"
            >
              <Share2 className="w-4 h-4 text-emerald-200" />
              <span>Kongsi Semakan Pengetua (Magic Link)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="px-4 py-3 sm:py-2.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-white border border-white/20 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors touch-manipulation"
            >
              <Edit3 className="w-4 h-4" />
              <span>Jadual Mengajar</span>
            </button>
          </div>
        </div>

        {/* Logo Sekolah Pengguna */}
        <div className="relative z-10 hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex-shrink-0 self-center max-w-[130px]">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt="Logo Sekolah Anda"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            ) : (
              <img
                src="/logo-al-hasanah.png"
                alt="Logo e-RPH"
                className="w-24 h-24 object-contain drop-shadow-xl"
              />
            )}
          </div>
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-200 mt-1 text-center truncate w-full">
            {schoolName}
          </span>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid Status Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Takwim Semasa</span>
            <p className="text-lg font-extrabold text-slate-900">Minggu {currentWeek}</p>
            <span className="text-[11px] text-emerald-600 font-medium">
              {currentWeekObj?.penggal || 'Penggal Persekolahan 2026/2027'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Jadual Mengajar Anda</span>
            <p className="text-lg font-extrabold text-slate-900">{timetable.length} Waktu Seminggu</p>
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="text-[11px] text-blue-600 font-medium hover:underline block text-left"
            >
              Ubah Suai Masa &amp; Kelas &rarr;
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Semakan Pengetua</span>
            <p className="text-lg font-extrabold text-slate-900">Magic Link</p>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="text-[11px] text-purple-600 font-medium hover:underline block text-left"
            >
              Kongsi Pautan Minggu Ini &rarr;
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Status Langganan</span>
            <p className="text-lg font-extrabold text-slate-900 uppercase">
              {isPro ? 'PRO AKTIF' : 'PELAN FREE'}
            </p>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-[11px] text-amber-700 font-bold hover:underline block text-left"
            >
              {isPro ? 'Akses Tanpa Had' : 'Naik Taraf ke PRO &rarr;'}
            </button>
          </div>
        </div>

      </div>

      {/* Kelas Hari Ini & Profil Pendidik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Senarai Kelas Hari Ini (Berdasarkan Jadual Waktu Tersuai Guru) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-base text-slate-800">Kelas Hari Ini (Isnin)</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">{todayClasses.length} Waktu</span>
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="text-xs text-emerald-700 hover:underline font-bold flex items-center space-x-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {todayClasses.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Tiada kelas dijadualkan pada hari Isnin dalam jadual anda.
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="text-emerald-600 font-bold hover:underline block mx-auto mt-2 text-xs"
                >
                  + Tambah Waktu Mengajar Isnin
                </button>
              </div>
            ) : (
              todayClasses.map((item, idx) => {
                const globalIndex = timetable.findIndex((s) => s === item);
                const targetSlotIdx = globalIndex !== -1 ? globalIndex : idx;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">{item.subjek}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded">
                            Tingkatan {item.tingkatan}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kelas: <span className="font-semibold text-slate-700">{item.kelas}</span> &bull; Masa: {item.masa_mula} &ndash; {item.masa_tamat}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/rph/baharu?slot=${targetSlotIdx}&hari=ISNIN&subjek=${encodeURIComponent(item.subjek)}`}
                      className="px-4 py-2 bg-white border border-slate-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <span>Buka e-RPH</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ringkasan Profil Guru & Institusi */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-base text-slate-800">Profil Guru</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOnboardingModalOpen(true)}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center space-x-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Profil</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Pendidik</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{teacherName}</p>
              <span className="text-[11px] text-slate-500">{userProfile?.position || 'Guru Akademik'}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sekolah / Institusi</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{schoolName}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {userProfile?.district ? `PPD ${userProfile.district}` : 'PPD'} &bull; {userProfile?.state || 'Malaysia'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">E-Mel / ID Pengguna</span>
              <p className="font-mono text-emerald-800 font-bold mt-0.5 truncate">{teacherEmail}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mata Pelajaran Diajar</span>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="text-[10px] text-emerald-700 font-bold hover:underline"
                >
                  Ubah Jadual
                </button>
              </div>
              <ul className="space-y-1 font-semibold text-slate-700">
                {uniqueSubjects.slice(0, 5).map((subj, i) => (
                  <li key={i} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="truncate">{subj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Editor Jadual */}
      <TimetableEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      {/* Modal Kongsi Semakan Pengetua */}
      <ShareReviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentWeek={currentWeek}
        rphList={timetable.map((s) => ({
          subjek: s.subjek,
          tingkatan: s.tingkatan,
          kelas: s.kelas,
          hari: s.hari,
          masa_mula: s.masa_mula,
          masa_tamat: s.masa_tamat,
          minggu_ke: currentWeek
        }))}
      />

    </div>
  );
}
