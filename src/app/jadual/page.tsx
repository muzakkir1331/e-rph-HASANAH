'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, Edit3, Plus, ArrowRight, ShieldCheck, RotateCcw, Loader2, Cloud, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TimetableEditorModal from '@/components/jadual/TimetableEditorModal';

export default function JadualPage() {
  const router = useRouter();
  const { user, timetable, teacherName, teacherEmail, isDeLIMA, loading, cloudSyncStatus } = useAuth();
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
        <p className="text-xs text-slate-500 font-medium">Memuatkan profil cloud jadual guru...</p>
      </div>
    );
  }

  const days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];

  return (
    <div className="space-y-6">
      
      {/* Header & Butang Ubah Jadual */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Jadual Waktu Mengajar Guru
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ID DeLIMA Aktif</span>
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1" title="Data jadual disimpan dalam profil cloud masing-masing, bukan local">
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Profil Cloud DeLIMA (Bukan Local)</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>Pendidik: <strong className="text-slate-800">{teacherName}</strong> &bull; ({teacherEmail})</span>
            {cloudSyncStatus === 'synced' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                Diselaraskan ke Cloud
              </span>
            )}
            {cloudSyncStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Menyimpan ke Cloud...
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all hover:scale-105"
          >
            <Edit3 className="w-4 h-4" />
            <span>Ubah Suai Jadual Saya</span>
          </button>
        </div>
      </div>

      {/* Grid 5 Hari Jadual Waktu Mengajar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day) => {
          const slots = timetable.filter((s) => s.hari === day);

          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col space-y-3">
              <div className="bg-slate-100 rounded-xl p-2.5 text-center flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 tracking-wide">{day}</span>
                <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full">
                  {slots.length} Waktu
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {slots.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Tiada kelas dijadualkan.
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(true)}
                      className="text-emerald-600 hover:underline block mx-auto mt-1 font-semibold"
                    >
                      + Tambah Waktu
                    </button>
                  </div>
                ) : (
                  slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-emerald-400 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>SLOT {slot.slot_ke}</span>
                        <span className="text-emerald-700 font-bold">{slot.masa_mula}</span>
                      </div>
                      
                      <div className="font-extrabold text-xs text-slate-900 leading-snug">
                        {slot.subjek}
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                        <span>{slot.kelas}</span>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-bold">
                          T{slot.tingkatan}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/rph/baharu"
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center block transition-colors"
              >
                Bina e-RPH {day}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Modal Editor Jadual Waktu */}
      <TimetableEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

    </div>
  );
}
