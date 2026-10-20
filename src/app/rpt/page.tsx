'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Loader2,
  Database,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  rptDatabase,
  rptCatalog,
  takwimData,
  RPTDatabaseRecord,
  normalizeSubjectName,
  normalizeFormNumber
} from '@/lib/rpt-helper';

export default function RPTManagerPage() {
  const router = useRouter();
  const { user, isDeLIMA, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || !isDeLIMA)) {
      router.push('/login');
    }
  }, [user, isDeLIMA, authLoading, router]);

  // Tab: 'local' (RPT Panitia Tempatan) atau 'sheets' (Penyambung Google Sheets)
  const [activeTab, setActiveTab] = useState<'local' | 'sheets'>('local');

  // Filter RPT Panitia Tempatan
  const subjectList = useMemo(() => {
    return Object.keys(rptCatalog).filter(k => !k.startsWith('rpt_'));
  }, []);
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectList[0] || 'Sains');

  const availableForms = useMemo(() => {
    return rptCatalog[selectedSubject]?.tingkatan_list || ['1', '2', '3', '4', '5'];
  }, [selectedSubject]);

  const [selectedForm, setSelectedForm] = useState<string>('1');

  // Pastikan form sah apabila subjek bertukar
  useEffect(() => {
    if (!availableForms.includes(selectedForm)) {
      setSelectedForm(availableForms[0] || '1');
    }
  }, [availableForms, selectedForm]);

  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tapis rekod RPT
  const filteredRPT = useMemo(() => {
    const normSelected = normalizeSubjectName(selectedSubject);
    return rptDatabase.filter((item) => {
      // Padanan subjek fleksibel merangkumi 5 subjek rpt rasmi
      const isSubjMatch =
        item.subjek === selectedSubject ||
        item.subjek.toLowerCase() === normSelected.toLowerCase() ||
        (selectedSubject === 'rpt_usulaldin' && item.fail_asal === 'rpt_usulaldin.csv') ||
        (selectedSubject === 'rpt_lam' && item.fail_asal === 'rpt_lam.csv') ||
        (selectedSubject === 'rpt_syariah' && item.fail_asal === 'rpt_syariah.csv') ||
        (selectedSubject === 'rpt_adab' && item.fail_asal === 'rpt_adab.csv') ||
        (selectedSubject === 'rpt_manahij' && item.fail_asal === 'rpt_manahij.csv') ||
        (selectedSubject === 'أصول الدين' && item.fail_asal === 'rpt_usulaldin.csv') ||
        (selectedSubject === 'اللغة العربية المعاصرة' && item.fail_asal === 'rpt_lam.csv') ||
        (selectedSubject === 'الشريعة اسلامية' && item.fail_asal === 'rpt_syariah.csv') ||
        (selectedSubject === 'الأدب والبلاغة' && item.fail_asal === 'rpt_adab.csv') ||
        (selectedSubject === 'مناهج العلوم إسلامية' && item.fail_asal === 'rpt_manahij.csv');

      if (!isSubjMatch) return false;
      // Padanan tingkatan
      if (item.tingkatan !== selectedForm) return false;
      // Padanan minggu
      if (selectedWeekFilter !== 'all') {
        if (selectedWeekFilter === 'cuti') {
          if (!item.adalah_cuti) return false;
        } else {
          if (item.minggu_ke !== Number(selectedWeekFilter)) return false;
        }
      }
      // Padanan carian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.tema.toLowerCase().includes(q) ||
          item.sk.toLowerCase().includes(q) ||
          item.sp.toLowerCase().includes(q) ||
          item.standard_prestasi.toLowerCase().includes(q) ||
          item.catatan.toLowerCase().includes(q) ||
          item.label_minggu.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedSubject, selectedForm, selectedWeekFilter, searchQuery]);

  // Google Sheets Test Connection State
  const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [targetWeek, setTargetWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sheetItems, setSheetItems] = useState<any[]>([]);

  const handleTestFetch = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/rpt/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          sheetName,
          targetWeek,
          subject: selectedSubject,
          form: selectedForm
        })
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setSheetItems(data.items);
        setStatusMessage(`Berjaya membaca ${data.items.length} rekod RPT bagi Minggu ${targetWeek}!`);
      } else {
        setStatusMessage('Tiada rekod RPT ditemui bagi minggu tersebut.');
      }
    } catch (err: any) {
      setStatusMessage('Gagal menyambung ke Google Sheet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || !isDeLIMA) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan sesi ID DeLIMA...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Tajuk & Pengenalan */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pusat Pengurusan &amp; Penyelarasan RPT Panitia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maklumat 44 minggu persekolahan &amp; 4 penggal cuti diselaraskan secara penuh merentas 12 fail RPT panitia sekolah.
          </p>
        </div>

        <Link
          href={`/rph/baharu?subjek=${encodeURIComponent(selectedSubject)}&tingkatan=${selectedForm}`}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Bina e-RPH dengan RPT Ini</span>
        </Link>
      </div>

      {/* Ringkasan Statistik RPT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Subjek Panitia</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">12 Subjek</p>
          <span className="text-[11px] text-emerald-700 font-medium">Semua fail CSV dimuatkan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Minggu Persekolahan</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">44 Minggu</p>
          <span className="text-[11px] text-teal-700 font-medium">M1 hingga M44 Disegerak</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Jumlah Rekod RPT</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{rptDatabase.length} Rekod</p>
          <span className="text-[11px] text-blue-700 font-medium">Lengkap DSKP &amp; TP</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase">
            <Database className="w-4 h-4 text-amber-600" />
            <span>Status Takwim</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">100% Selaras</p>
          <span className="text-[11px] text-slate-500 font-medium">Tarikh &amp; Cuti Penggal Padan</span>
        </div>
      </div>

      {/* Tab Navigasi */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('local')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'local'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Katalog RPT Panitia Tempatan ({rptDatabase.length} Rekod)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'sheets'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sheet className="w-4 h-4" />
          <span>Penyambung Google Sheets Luaran</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: KATALOG RPT PANITIA TEMPATAN (12 FAIL RPT)
         ========================================================================= */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          
          {/* Bar Penapis Subjek, Tingkatan, Minggu & Carian */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Pilihan Subjek */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Pilih Subjek Panitia
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {subjectList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Tingkatan */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Pilih Tingkatan
                </label>
                <select
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableForms.map((f) => (
                    <option key={f} value={f}>
                      Tingkatan {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Minggu */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Tapis Minggu Persekolahan
                </label>
                <select
                  value={selectedWeekFilter}
                  onChange={(e) => setSelectedWeekFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Minggu (M1 &ndash; M44 + Cuti)</option>
                  <option value="cuti">Hanya Cuti Penggal Persekolahan</option>
                  {Array.from({ length: 44 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Minggu {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Carian Teks */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Cari Tajuk / SK / SP / TP
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: Kuantiti fizik, 1.1..."
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Menunjukkan <strong>{filteredRPT.length}</strong> rekod RPT bagi{' '}
                <strong className="text-slate-800">{selectedSubject} Tingkatan {selectedForm}</strong>.
              </span>
              {(selectedWeekFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWeekFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Reset Penapis
                </button>
              )}
            </div>
          </div>

          {/* Senarai Kad Rekod RPT */}
          <div className="space-y-3">
            {filteredRPT.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-sm text-slate-700">Tiada Rekod RPT Ditemui</p>
                <p className="text-xs">Cuba tukar subjek, tingkatan, atau kosongkan kotak carian.</p>
              </div>
            ) : (
              filteredRPT.map((item, idx) => {
                const isCuti = item.adalah_cuti;
                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                      isCuti
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                          isCuti
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-600 text-white shadow-sm'
                        }`}>
                          {item.kod_minggu}
                        </span>
                        <div>
                          <span className="font-extrabold text-sm text-slate-900">
                            {item.label_minggu}
                          </span>
                          <span className="text-xs text-slate-500 font-mono ml-2">
                            {item.tarikh_teks}
                          </span>
                        </div>
                      </div>

                      {!isCuti && (
                        <Link
                          href={`/rph/baharu?minggu=${item.minggu_ke}&subjek=${encodeURIComponent(item.subjek)}&tingkatan=${item.tingkatan}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors shrink-0"
                        >
                          <span>Guna dalam e-RPH</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    {isCuti ? (
                      <div className="pt-3 text-xs text-amber-900 font-medium">
                        <p>{item.tema || item.catatan || 'Cuti Persekolahan Rasmi Kementerian Pendidikan Malaysia (KPM)'}</p>
                      </div>
                    ) : (
                      <div className="pt-3.5 space-y-3 text-xs">
                        {item.tema && (
                          <div>
                            <span className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider block">
                              Tema / Bidang / Tajuk DSKP:
                            </span>
                            <p className="text-slate-800 font-bold mt-0.5 whitespace-pre-line leading-relaxed">
                              {item.tema}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                            <span className="font-bold text-[10px] uppercase text-slate-600 tracking-wider block">
                              Standard Kandungan (SK):
                            </span>
                            <p className="text-slate-800 font-semibold mt-1 whitespace-pre-line">
                              {item.sk || '-'}
                            </p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                            <span className="font-bold text-[10px] uppercase text-slate-600 tracking-wider block">
                              Standard Pembelajaran (SP):
                            </span>
                            <p className="text-slate-800 font-medium mt-1 whitespace-pre-line">
                              {item.sp || '-'}
                            </p>
                          </div>
                        </div>

                        {(item.standard_prestasi || item.catatan) && (
                          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                            {item.standard_prestasi && (
                              <p>
                                <strong className="text-slate-700">Tahap Penguasaan:</strong> {item.standard_prestasi}
                              </p>
                            )}
                            {item.catatan && (
                              <p className="truncate max-w-lg">
                                <strong className="text-slate-700">Catatan/EMK:</strong> {item.catatan}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: PENYAMBUNG GOOGLE SHEETS LUARAN
         ========================================================================= */}
      {activeTab === 'sheets' && (
        <div className="space-y-5">
          {/* Panduan Ringkas Penggunaan */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-900">
            <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Panduan Perkongsian Google Sheet RPT Luaran:</p>
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
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Tab / Helaian (Sheet Name)
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Sheet1 atau RPT_SAINS"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sasaran Minggu Diuji (1 &ndash; 44)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={44}
                    value={targetWeek}
                    onChange={(e) => setTargetWeek(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleTestFetch}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Menghubungkan...' : 'Uji Sambungan & Baca Data'}</span>
                </button>
              </div>

              {statusMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  statusMessage.includes('Berjaya')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {statusMessage.includes('Berjaya') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
