'use client';

import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight, Sparkles, Filter } from 'lucide-react';
import takwimData from '@/data/takwim_2026.json';
import Link from 'next/link';
import { getCurrentWeekFromDate } from '@/lib/rpt-helper';

export default function TakwimPage() {
  const currentWeekObj = getCurrentWeekFromDate();
  const currentWeek = currentWeekObj?.minggu_ke || 1;
  const [filterPenggal, setFilterPenggal] = useState<string>('all');

  const filteredTakwim = takwimData.filter((item: any) => {
    if (filterPenggal === 'all') return true;
    if (filterPenggal === 'cuti') return item.adalah_cuti;
    if (filterPenggal === 'p1') return item.penggal?.includes('Penggal 1');
    if (filterPenggal === 'p2') return item.penggal?.includes('Penggal 2');
    if (filterPenggal === 'p3') return item.penggal?.includes('Penggal 3');
    return true;
  });

  const teachingWeeksCount = takwimData.filter((i: any) => !i.adalah_cuti).length;
  const holidaysCount = takwimData.filter((i: any) => i.adalah_cuti).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Takwim Sesi Persekolahan 2027 &amp; Cuti (Kumpulan B)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Jadual rasmi 44 minggu persekolahan &amp; cuti penggal sesi 2027 yang diselaraskan secara tepat dengan fail RPT Panitia.
          </p>
        </div>

        <Link
          href={`/rph/baharu?minggu=${currentWeek}`}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Buka e-RPH Minggu Ini (M{currentWeek})</span>
        </Link>
      </div>

      {/* Grid Status Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Minggu Mengajar</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{teachingWeeksCount} Minggu</p>
          <span className="text-[11px] text-emerald-600 font-medium">M1 &ndash; M44 Diselaraskan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Penggal Cuti</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{holidaysCount} Penggal</p>
          <span className="text-[11px] text-amber-600 font-medium">Cuti Penggal Persekolahan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Minggu Semasa</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">Minggu {currentWeek}</p>
          <span className="text-[11px] text-slate-500 font-medium">{currentWeekObj?.penggal || 'Penggal 1'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Penyelarasan RPT</span>
          <p className="text-xl font-extrabold text-blue-700 mt-1">100% Selaras</p>
          <span className="text-[11px] text-blue-600 font-medium">12 Subjek RPT Terpaut</span>
        </div>
      </div>

      {/* Butang Penapis Penggal */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilterPenggal('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filterPenggal === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua ({takwimData.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterPenggal('p1')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filterPenggal === 'p1'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Penggal 1 (M1 &ndash; M9)
        </button>

        <button
          type="button"
          onClick={() => setFilterPenggal('p2')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filterPenggal === 'p2'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Penggal 2 (M10 &ndash; M31)
        </button>

        <button
          type="button"
          onClick={() => setFilterPenggal('p3')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filterPenggal === 'p3'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Penggal 3 (M32 &ndash; M44)
        </button>

        <button
          type="button"
          onClick={() => setFilterPenggal('cuti')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filterPenggal === 'cuti'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Cuti Persekolahan Sahaja
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="font-extrabold text-sm text-slate-800">
              44 Minggu Persekolahan &amp; 4 Penggal Cuti Rasmi KPM
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Diselaraskan dengan Fail RPT
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
          {filteredTakwim.map((item: any, idx: number) => {
            const isCurrent = item.minggu_ke === currentWeek && !item.adalah_cuti;
            const isCuti = item.adalah_cuti;

            return (
              <div
                key={idx}
                className={`px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50/90 border-l-4 border-emerald-600'
                    : isCuti
                    ? 'bg-amber-50/50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    isCuti
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isCurrent
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isCuti ? 'CUTI' : item.kod_minggu || `M${item.minggu_ke}`}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                        {item.label_minggu}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-600 text-white rounded-full uppercase">
                          Minggu Semasa
                        </span>
                      )}
                      {isCuti && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-full">
                          Cuti Persekolahan KPM
                        </span>
                      )}
                      {item.penggal && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md">
                          {item.penggal}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {item.tarikh_teks ? item.tarikh_teks : `${item.tarikh_mula} – ${item.tarikh_tamat}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {!isCuti ? (
                    <Link
                      href={`/rph/baharu?minggu=${item.minggu_ke}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
                    >
                      <span>Buka e-RPH</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-amber-800 bg-amber-100">
                      Tiada Sesi PdPc
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
