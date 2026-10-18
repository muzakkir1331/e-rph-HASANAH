import React from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import takwimData from '@/data/takwim_2026.json';

export const metadata = {
  title: 'Takwim Persekolahan 2026 (Kumpulan B) | e-RPH Pintar',
  description: 'Jadual Mingguan Sesi Persekolahan dan Cuti 2026 Kumpulan B Kementerian Pendidikan Malaysia.',
};

export default function TakwimPage() {
  const currentWeek = 34; // Minggu 34

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Takwim Sesi Persekolahan &amp; Cuti 2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kumpulan B (Selangor, Wilayah Persekutuan Kuala Lumpur, Putrajaya, Labuan, Melaka, Negeri Sembilan, Pahang, Perak, Perlis, Pulau Pinang, Sabah, Sarawak)
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="font-extrabold text-sm text-slate-800">43 Minggu Persekolahan &amp; 4 Penggal Cuti</span>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Tahun Akademik 2026
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
          {takwimData.map((item: any, idx: number) => {
            const isCurrent = item.minggu_ke === currentWeek;
            const isCuti = item.adalah_cuti;

            return (
              <div
                key={idx}
                className={`px-6 py-3.5 flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                    : isCuti
                    ? 'bg-amber-50/50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isCuti
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isCurrent
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isCuti ? 'CUTI' : `M${item.minggu_ke}`}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
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
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {item.tarikh_mula} &ndash; {item.tarikh_tamat}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                    isCuti ? 'text-amber-800 bg-amber-100' : 'text-slate-600 bg-slate-100'
                  }`}>
                    {isCuti ? 'Tiada Sesi PdPc' : 'Sesi Pengajaran'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
