'use client';

import React, { useState, useEffect } from 'react';
import { Sheet, RefreshCw, AlertCircle, ArrowRightCircle, CheckCircle2, FileText, Database, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { RPTItem } from '@/types/erph';
import { findRPTRecord, convertToRPTItem, RPTDatabaseRecord } from '@/lib/rpt-helper';

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
  const [sourceMode, setSourceMode] = useState<'local' | 'sheets'>('local');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Cari rekod RPT tempatan berdasarkan subjek, tingkatan dan minggu
  const [localRecord, setLocalRecord] = useState<RPTDatabaseRecord | null>(null);
  const [syncedItem, setSyncedItem] = useState<RPTItem | null>(null);

  // Kemas kini rekod RPT tempatan setiap kali subjek, tingkatan atau minggu berubah
  useEffect(() => {
    const rec = findRPTRecord(subject, form, currentWeek);
    setLocalRecord(rec);
    if (rec) {
      const item = convertToRPTItem(rec);
      setSyncedItem(item);
    } else {
      setSyncedItem(null);
    }
  }, [subject, form, currentWeek]);

  // Simulasi penangguhan PdPc daripada minggu lepas menggunakan RPT sebenar
  const [postponedLesson, setPostponedLesson] = useState<{
    minggu: number;
    sebab: string;
    item: RPTItem;
  } | null>(null);

  useEffect(() => {
    if (currentWeek > 1) {
      const prevWeek = currentWeek - 1;
      const prevRec = findRPTRecord(subject, form, prevWeek);
      if (prevRec && !prevRec.adalah_cuti) {
        setPostponedLesson({
          minggu: prevWeek,
          sebab: 'Cuti Peristiwa / Program Rasmi Sekolah',
          item: convertToRPTItem(prevRec)
        });
      } else {
        setPostponedLesson(null);
      }
    } else {
      setPostponedLesson(null);
    }
  }, [subject, form, currentWeek]);

  const handleApplyLocalRPT = () => {
    if (syncedItem) {
      onApplyRPTItem(syncedItem, false);
    }
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rpt/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sheetUrl,
          targetWeek: currentWeek,
          subject,
          form,
          preferLocal: sourceMode === 'local'
        })
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
              <p className="text-xs text-amber-700 mt-0.5 line-clamp-1">
                Sebab: <span className="font-semibold">{postponedLesson.sebab}</span> &bull; SK/SP: {postponedLesson.item.sk}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={handleExecuteCarryForward}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>Carry Forward ke Minggu {currentWeek}</span>
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
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">
              Status PdPc: Mengajar Tajuk Tertangguh daripada Minggu {postponedLesson?.minggu || (currentWeek - 1)} (Carry Forward Aktif)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (syncedItem) onApplyRPTItem(syncedItem, false);
            }}
            className="text-emerald-700 underline font-medium hover:text-emerald-900 shrink-0"
          >
            Reset ke Jadual Asal Minggu {currentWeek}
          </button>
        </div>
      )}

      {/* Main Synchronized RPT Bar */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-extrabold text-sm text-slate-900">
                  RPT Panitia Disegerakkan: Minggu {currentWeek}
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center space-x-1 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>12 Subjek Tersedia</span>
                </span>
                {localRecord && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-mono">
                    {localRecord.tarikh_teks}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Subjek: <strong className="text-slate-800">{subject}</strong> (Tingkatan {form}) &bull;{' '}
                {localRecord ? (
                  <span className="text-emerald-700 font-medium">Rekod RPT ditemui &amp; sedia digunakan</span>
                ) : (
                  <span className="text-amber-600 font-medium">Tiada rekod khusus ditemui untuk minggu ini</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            {localRecord && (
              <button
                type="button"
                onClick={handleApplyLocalRPT}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all hover:scale-102"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Suntik RPT Minggu {currentWeek}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-2.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
              title="Lihat Butiran RPT"
            >
              <span>{showPreview ? 'Tutup' : 'Pratonton'}</span>
              {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              {expanded ? 'Tutup Pilihan' : 'Pilihan Sheets'}
            </button>
          </div>

        </div>

        {/* Collapsible RPT Preview Box */}
        {showPreview && localRecord && (
          <div className="mt-3 pt-3 border-t border-emerald-200/60 bg-white/90 rounded-xl p-3.5 text-xs space-y-2 border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider block">
                  Tema / Bidang / Tajuk DSKP:
                </span>
                <p className="text-slate-700 font-medium mt-0.5 whitespace-pre-line">{localRecord.tema || '-'}</p>
              </div>
              <div>
                <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider block">
                  Standard Prestasi (TP):
                </span>
                <p className="text-slate-700 font-medium mt-0.5">{localRecord.standard_prestasi || '-'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider block">
                Standard Kandungan (SK):
              </span>
              <p className="text-slate-800 font-semibold mt-0.5 whitespace-pre-line">{localRecord.sk || '-'}</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider block">
                Standard Pembelajaran (SP):
              </span>
              <p className="text-slate-800 font-medium mt-0.5 whitespace-pre-line">{localRecord.sp || '-'}</p>
            </div>

            {localRecord.catatan && (
              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider block">
                  Cadangan Aktiviti / EMK:
                </span>
                <p className="text-slate-600 mt-0.5 whitespace-pre-line">{localRecord.catatan}</p>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Google Sheets URL Option */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
              <Sheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet URL:</span>
            </div>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Masukkan URL Google Sheets RPT (jika ingin guna Google Sheet luaran)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <button
              type="button"
              onClick={handleSyncGoogleSheet}
              disabled={loading}
              className="w-full sm:w-auto whitespace-nowrap px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Menyemak...' : 'Sync Sheet'}</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
