'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Clock, Calendar, Sheet, ArrowRight, ShieldCheck, User, Edit3, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TimetableEditorModal from '@/components/jadual/TimetableEditorModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, timetable, teacherName, teacherEmail, isDeLIMA, loading } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isDeLIMA)) {
      router.push('/login');
    }
  }, [user, isDeLIMA, loading, router]);

  if (loading || !user || !isDeLIMA) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan ID DeLIMA KPM...</p>
      </div>
    );
  }

  const currentWeek = 34; // Minggu 34

  // Tapis kelas hari ini mengikut hari Isnin (atau hari semasa)
  const todayClasses = timetable.filter((s) => s.hari === 'ISNIN');

  // Dapatkan senarai subjek unik guru
  const uniqueSubjects = Array.from(new Set(timetable.map(s => `${s.subjek} (T${s.tingkatan})`)));

  return (
    <div className="space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>ID DeLIMA Disahkan: {teacherEmail}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Selamat Datang, {teacherName}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Sistem e-RPH Pintar SMA Al-Hasanah (SABK) dilengkapi Google SSO ID DeLIMA, jadual waktu boleh ubah mengikut guru, Co-Pilot Gemini 3.8 Flash, dan penyambung RPT Google Sheets.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/rph/baharu"
              className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Buka Borang e-RPH Dinamik</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="px-4 py-2.5 bg-emerald-700/60 hover:bg-emerald-700 text-white border border-white/20 rounded-xl font-medium text-xs sm:text-sm flex items-center space-x-2 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Ubah Jadual Mengajar Saya</span>
            </button>
          </div>
        </div>

        {/* Logo Rasmi SMA Al-Hasanah */}
        <div className="relative z-10 hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex-shrink-0 self-center">
          <img
            src="/logo-al-hasanah.png"
            alt="Logo SMA Al-Hasanah"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
          />
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-200 mt-1">
            SMA Al-Hasanah
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
            <span className="text-[11px] text-emerald-600 font-medium">Penggal Persekolahan 2</span>
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
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Sheet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Google Sheets RPT</span>
            <p className="text-lg font-extrabold text-slate-900">Tersambung</p>
            <span className="text-[11px] text-teal-600 font-medium">Carry Forward Aktif</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Pengesahan DeLIMA</span>
            <p className="text-lg font-extrabold text-slate-900">Aktif &amp; Sah</p>
            <span className="text-[11px] text-amber-600 font-medium">@moe-dl.edu.my</span>
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
              todayClasses.map((item, idx) => (
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
                    href="/rph/baharu"
                    className="px-4 py-2 bg-white border border-slate-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Buka e-RPH</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ringkasan Profil Guru & Sekolah */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-base text-slate-800">Profil Guru</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Pendidik</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{teacherName}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ID Pengguna DeLIMA</span>
              <p className="font-mono text-emerald-800 font-bold mt-0.5">{teacherEmail}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sekolah</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">SMA AL-HASANAH 2026</p>
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

    </div>
  );
}
