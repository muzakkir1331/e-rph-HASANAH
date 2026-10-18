'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RPTManagerPage() {
  const router = useRouter();
  const { user, isDeLIMA, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || !isDeLIMA)) {
      router.push('/login');
    }
  }, [user, isDeLIMA, authLoading, router]);

  const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [week, setWeek] = useState(34);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (authLoading || !user || !isDeLIMA) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan sesi ID DeLIMA...</p>
      </div>
    );
  }
  const [items, setItems] = useState<any[]>([
    {
      minggu: 34,
      tarikh: '28/09/2026 - 02/10/2026',
      sk: '1.1 الاستماع إلى الكلمات ونطقها',
      sp: '1.1.1 التمكن من الاستماع إلى الكلمات المشددة وغير المشددة وترديدها ترديدا صحيحا',
      cadangan_aktiviti: 'Aktiviti Round Robin dalam kumpulan dan pembentangan peta pemikiran.'
    }
  ]);

  const handleTestFetch = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/rpt/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, sheetName, targetWeek: week })
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setItems(data.items);
        setStatusMessage(`Berjaya membaca ${data.items.length} rekod RPT bagi Minggu ${week}!`);
      } else {
        setStatusMessage('Tiada rekod RPT ditemui bagi minggu tersebut.');
      }
    } catch (err: any) {
      setStatusMessage('Gagal menyambung ke Google Sheet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pengurusan Modul Penyambung RPT Google Sheets
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hubungkan fail RPT panitia sekolah secara terus daripada Google Sheets tanpa perlu salin-tampal manual setiap minggu.
        </p>
      </div>

      {/* Panduan Ringkas Penggunaan */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-900">
        <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Panduan Perkongsian Google Sheet RPT:</p>
          <p>
            Pastikan fail Google Sheet anda ditetapkan akses kepada <strong>&ldquo;Anyone with the link can view&rdquo; (Sesiapa yang mempunyai pautan boleh melihat)</strong>. Modul ini menyokong pengesanan lajur pintar untuk lajur <em>Minggu</em>, <em>SK</em>, <em>SP</em>, dan <em>Cadangan Aktiviti</em>.
          </p>
        </div>
      </div>

      {/* Borang Konfigurasi Sambungan */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
          Tetapan Pautan Google Sheets RPT
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              URL Google Sheet RPT
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Tab Lembaran Kerja
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="Sheet1 / RPT 2026"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Uji Mengikut Nombor Minggu
              </label>
              <input
                type="number"
                min="1"
                max="43"
                value={week}
                onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestFetch}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Sedang Membaca...' : 'Uji Sambungan &amp; Baca Data'}</span>
          </button>

          {statusMessage && (
            <div className="p-3 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800">
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Pratonton Data RPT yang Diterima */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
            Pratonton Data RPT (Minggu {week})
          </h2>
          <span className="text-xs text-slate-500">{items.length} Rekod</span>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Minggu {item.minggu} {item.tarikh ? `(${item.tarikh})` : ''}
                </span>
                <Link
                  href="/rph/baharu"
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1"
                >
                  <span>Gunakan dalam e-RPH</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div>
                <span className="font-bold text-slate-500 text-[10px] uppercase">Standard Kandungan (SK):</span>
                <p className="font-bold text-slate-800 mt-0.5">{item.sk}</p>
              </div>

              <div>
                <span className="font-bold text-slate-500 text-[10px] uppercase">Standard Pembelajaran (SP):</span>
                <p className="text-slate-700 mt-0.5 font-medium">{item.sp}</p>
              </div>

              {item.cadangan_aktiviti && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="font-bold text-teal-700 text-[10px] uppercase">Cadangan Aktiviti:</span>
                  <p className="text-slate-600 mt-0.5">{item.cadangan_aktiviti}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
