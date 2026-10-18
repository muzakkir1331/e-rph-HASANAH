'use client';

import React, { useState } from 'react';
import { Sheet, RefreshCw, AlertCircle, ArrowRightCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { RPTItem } from '@/types/erph';

interface RPTConnectorBannerProps {
  currentWeek: number;
  subject: string;
  form: string;
  onApplyRPTItem: (item: RPTItem, isCarryForward?: boolean) => void;
  isCarryForwardActive?: boolean;
}

export default function RPTConnectorBanner({
  currentWeek,
  subject,
  form,
  onApplyRPTItem,
  isCarryForwardActive
}: RPTConnectorBannerProps) {
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [loading, setLoading] = useState(false);
  const [syncedItem, setSyncedItem] = useState<RPTItem | null>({
    minggu: currentWeek,
    sk: '1.1 Kemahiran Mendengar dan Bertutur (Bahasa Arab / Sains)',
    sp: '1.1.1 Menyebut dan membina ayat mudah mengikut tatabahasa yang betul.',
    cadangan_aktiviti: 'Aktiviti Round Robin dalam kumpulan dan pembentangan peta pemikiran.'
  });

  // Contoh data penangguhan minggu lepas (Carry Forward Simulation)
  const [postponedLesson, setPostponedLesson] = useState<{
    minggu: number;
    sebab: string;
    item: RPTItem;
  } | null>({
    minggu: Math.max(1, currentWeek - 1),
    sebab: 'Sukan Tahunan Sekolah & Cuti Peristiwa',
    item: {
      minggu: Math.max(1, currentWeek - 1),
      sk: '1.0 Pengenalan Topik Asas & Perbendaharaan Kata',
      sp: '1.0.2 Menghubungkaitkan perkataan dengan gambarajah yang bersesuaian.',
      cadangan_aktiviti: 'Latihan pengukuhan berpasangan menggunakan kad imbasan.'
    }
  });

  const [expanded, setExpanded] = useState(false);

  const handleSync = async () => {
    if (!sheetUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rpt/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl, targetWeek: currentWeek })
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setSyncedItem(data.items[0]);
        onApplyRPTItem(data.items[0], false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCarryForward = () => {
    if (postponedLesson) {
      onApplyRPTItem(postponedLesson.item, true);
    }
  };

  return (
    <div className="space-y-3 mb-6 no-print">
      
      {/* Carry Forward Alert Notification Banner */}
      {postponedLesson && !isCarryForwardActive && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-amber-900 text-sm">
                  Pengesanan Penangguhan PdPc (Minggu {postponedLesson.minggu})
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-200 text-amber-800 rounded-full">
                  Perlu Ganti
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                Sebab: <span className="font-semibold">{postponedLesson.sebab}</span> &bull; SP tertangguh: {postponedLesson.item.sp}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExecuteCarryForward}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>Laksana &lsquo;Carry Forward&rsquo; ke Minggu Ini</span>
            </button>
            <button
              type="button"
              onClick={() => setPostponedLesson(null)}
              className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Carry Forward Active Badge */}
      {isCarryForwardActive && (
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">
              Status PdPc: Mengajar Tajuk Tertangguh daripada Minggu {postponedLesson?.minggu || (currentWeek - 1)} (Carry Forward Aktif)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (syncedItem) onApplyRPTItem(syncedItem, false);
            }}
            className="text-emerald-700 underline font-medium hover:text-emerald-900"
          >
            Reset ke Jadual Asal Minggu {currentWeek}
          </button>
        </div>
      )}

      {/* Main RPT Google Sheets Connection Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-800">Penyambung RPT Google Sheets</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Minggu {currentWeek} Disambung</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Subjek: <span className="font-medium text-slate-700">{subject} Tingkatan {form}</span> &bull; {sheetUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSync}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{loading ? 'Menyemak...' : 'Sync RPT'}</span>
            </button>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              {expanded ? 'Tutup Tetapan' : 'Tukar URL'}
            </button>
          </div>

        </div>

        {/* Collapsible URL Input */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Masukkan URL Google Sheets RPT (contoh: https://docs.google.com/spreadsheets/d/...)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <button
              type="button"
              onClick={handleSync}
              className="w-full sm:w-auto whitespace-nowrap px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Simpan &amp; Muat
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
