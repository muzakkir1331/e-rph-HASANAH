'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Shield,
  Crown,
  Users,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Sparkles,
  Printer,
  Download,
  Save,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { RPHRecord, KarakterData } from '@/types/erph';
import { LOGO_AL_HASANAH_BASE64 } from '@/data/logo_base64';
import { printOrSaveRPH, downloadRPHPdf } from '@/lib/print-rph';

interface KarakterRPHSectionProps {
  currentWeek: number;
  initialDate?: string;
  initialForm?: string;
  initialClass?: string;
  initialTimeStart?: string;
  initialTimeEnd?: string;
  classList: string[];
  teacherName: string;
  teacherEmail: string;
  schoolName?: string;
  savedRecord?: Partial<RPHRecord>;
  onSaveRecord: (record: Partial<RPHRecord>) => void;
}

export const ELEMEN_KARAKTER = [
  {
    id: 'Penyayang',
    label: 'Penyayang',
    icon: Heart,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    description: 'Menyemai rasa empati, prihatin, kasih sayang dan saling menghormati antara warga sekolah.'
  },
  {
    id: 'Berdaya Tahan',
    label: 'Berdaya Tahan',
    icon: Shield,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    description: 'Membina kekuatan emosi, ketabahan, disiplin diri dan keupayaan mengatasi cabaran harian.'
  },
  {
    id: 'Berupaya Memimpin',
    label: 'Berupaya Memimpin',
    icon: Crown,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: 'Menonjolkan kepimpinan diri, integriti, keberanian menyuarakan pandangan dan memimpin rakan.'
  },
  {
    id: 'Warganegara Aktif',
    label: 'Warganegara Aktif',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description: 'Menerapkan patriotisme, kesedaran sivik, tanggungjawab kebersihan persekitaran dan perpaduan.'
  }
];

export const CADANGAN_AKTIVITI_KARAKTER: Record<string, string[]> = {
  'Penyayang': [
    'Aktiviti "Sentuhan Kasih": Murid berkongsi ucapan terima kasih dan penghargaan ikhlas kepada rakan sekelas.',
    'Refleksi Emosi Pagi: Berkongsi cara membantu rakan yang dalam kesusahan dan amalan bertegur sapa dengan sopan.'
  ],
  'Berdaya Tahan': [
    'Bicara Minda Positif: Perbincangan 15 minit tentang cara mengurus tekanan belajar dan tidak mudah berputus asa.',
    'Kisah Inspirasi Ketabahan: Menghayati kisah teladan tokoh yang berjaya bangkit daripada kegagalan.'
  ],
  'Berupaya Memimpin': [
    'Pemimpin Giliran 15 Minit: Murid mempengerusikan sesi perbincangan meja bulat tentang disiplin dan kerjasama kelas.',
    'Amanah & Tanggungjawab: Pengurusan tugasan harian kelas dan penetapan matlamat kecemerlangan bersama.'
  ],
  'Warganegara Aktif': [
    'Operasi Kelas Bersih & Ceria: Kerjasama membersihkan kelas dan menghayati amalan kebersihan sebahagian daripada iman.',
    'Bicara Semarak Patriotik: Menghayati lagu kebangsaan dan memahami peranan remaja sebagai pewaris negara.'
  ]
};

export default function KarakterRPHSection({
  currentWeek,
  initialDate,
  initialForm = '1',
  initialClass,
  initialTimeStart = '7.20 PAGI',
  initialTimeEnd = '7.35 PAGI',
  classList,
  teacherName,
  teacherEmail,
  schoolName = 'SEKOLAH MENENGAH AGAMA AL-HASANAH (SABK)',
  savedRecord,
  onSaveRecord
}: KarakterRPHSectionProps) {
  // State Borang Karakter
  const [tarikh, setTarikh] = useState<string>(
    savedRecord?.tarikh || initialDate || new Date().toISOString().split('T')[0]
  );
  const [masaMula, setMasaMula] = useState<string>(
    savedRecord?.masa_mula || initialTimeStart
  );
  const [masaTamat, setMasaTamat] = useState<string>(
    savedRecord?.masa_tamat || initialTimeEnd
  );
  const [tingkatan, setTingkatan] = useState<string>(
    savedRecord?.tingkatan || initialForm
  );
  const [kelas, setKelas] = useState<string>(
    savedRecord?.kelas || initialClass || classList[0] || '1 MUSLIM'
  );
  const [selectedElemen, setSelectedElemen] = useState<string[]>(
    savedRecord?.karakter_data?.elemen || ['Penyayang']
  );
  const [catatanAktiviti, setCatatanAktiviti] = useState<string>(
    savedRecord?.karakter_data?.catatan_aktiviti ||
      'Murid menjalankan aktiviti perkongsian nilai murni selama 15 minit dengan bimbingan guru bagi memupuk sahsiah terpuji.'
  );

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Format paparan masa 15 minit
  const masaDisplay = `${masaMula} - ${masaTamat} (15 minit)`;

  // Format tarikh dalam Bahasa Melayu
  const formattedDateDisplay = React.useMemo(() => {
    try {
      const dt = new Date(tarikh);
      if (isNaN(dt.getTime())) return tarikh;
      const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
        'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
      ];
      const dayName = days[dt.getDay()];
      const dayNum = String(dt.getDate()).padStart(2, '0');
      const monthName = months[dt.getMonth()];
      const year = dt.getFullYear();
      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    } catch {
      return tarikh;
    }
  }, [tarikh]);

  // Toggle pilihan elemen teras karakter
  const toggleElemen = (elemenId: string) => {
    setSelectedElemen(prev => {
      if (prev.includes(elemenId)) {
        // Jangan benarkan kosong sepenuhnya
        if (prev.length === 1) return prev;
        return prev.filter(e => e !== elemenId);
      } else {
        return [...prev, elemenId];
      }
    });
  };

  // Bina objek RPH Karakter penuh
  const buildKarakterRecord = (): Partial<RPHRecord> => {
    return {
      subjek: 'Program Pembentukan Karakter (15 minit)',
      tingkatan,
      kelas,
      hari: formattedDateDisplay.split(',')[0].toUpperCase(),
      tarikh,
      masa_mula: masaMula,
      masa_tamat: masaTamat,
      minggu_ke: currentWeek,
      tahun_akademik: 2027,
      kod_bahasa: 'ms',
      arah_teks: 'ltr',
      tema: 'Penataran Kurikulum Persekolahan 2027',
      tajuk: 'Pelaksanaan Aktiviti Program Pembentukan Karakter (15 minit)',
      sk: 'Pembentukan Karakter Murid',
      sp: selectedElemen.join(', '),
      objektif_pembelajaran: `Pada akhir aktiviti 15 minit, murid dapat mempraktikkan elemen teras karakter: ${selectedElemen.join(', ')}.`,
      kriteria_kejayaan: `Murid berjaya melaksanakan aktiviti karakter: ${catatanAktiviti}`,
      jenis_rph: 'karakter',
      karakter_data: {
        elemen: selectedElemen,
        catatan_aktiviti: catatanAktiviti
      },
      status: 'SELESAI',
      updated_at: new Date().toISOString()
    };
  };

  // Simpan RPH
  const handleSave = () => {
    const record = buildKarakterRecord();
    onSaveRecord(record);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  // Cetak Kad Slaid Rasmi
  const handlePrint = () => {
    const record = buildKarakterRecord();
    printOrSaveRPH({
      rphList: [record],
      teacherName,
      teacherEmail,
      weekNo: currentWeek,
      schoolName
    });
  };

  // Muat Turun PDF Kad Slaid Rasmi
  const handleDownloadPdf = async () => {
    const record = buildKarakterRecord();
    await downloadRPHPdf({
      rphList: [record],
      teacherName,
      teacherEmail,
      weekNo: currentWeek,
      schoolName
    });
  };

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          BANNER PENGENALAN PROGRAM PEMBENTUKAN KARAKTER (15 MINIT)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-700/60 no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md shrink-0">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-blue-500/30 text-blue-200 rounded-full border border-blue-400/30 uppercase tracking-wider">
                  PENATARAN KURIKULUM PERSEKOLAHAN 2027
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full">
                  15 Minit Sahaja
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                Pelaksanaan Aktiviti Program Pembentukan Karakter (15 minit)
              </h2>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Borang RPH format khas rasmi KPM untuk sekolah menengah tanpa maklumat kurikulum subjek biasa.
              </p>
            </div>
          </div>

          {/* Bar Butang Tindakan Pantas */}
          <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saveStatus === 'saved' ? 'Tersimpan!' : 'Simpan e-RPH'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-white/20"
              title="Cetak kad slaid rasmi 15 minit"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
              title="Muat turun fail PDF kad slaid"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BORANG ISIAN MESRA TELEFON & TABLET (REKA BENTUK TEPAT SEPERTI GAMBAR)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-lg space-y-6 no-print">
        
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Pengisian Butiran Program Pembentukan Karakter</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Minggu {currentWeek} &bull; Sesi 2027
          </span>
        </div>

        {/* 1. Baris Tarikh & Masa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Tarikh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Tarikh</span>
            </label>
            <input
              type="date"
              value={tarikh}
              onChange={(e) => setTarikh(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          {/* Masa Mula & Tamat (15 Minit) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Masa Pelaksanaan (15 Minit)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={masaMula}
                onChange={(e) => setMasaMula(e.target.value)}
                placeholder="7.20 PAGI"
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              <input
                type="text"
                value={masaTamat}
                onChange={(e) => setMasaTamat(e.target.value)}
                placeholder="7.35 PAGI"
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Tahun / Tingkatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Tahun / Tingkatan</span>
            </label>
            <select
              value={tingkatan}
              onChange={(e) => setTingkatan(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] cursor-pointer"
            >
              {['1', '2', '3', '4', '5', '6'].map((f) => (
                <option key={f} value={f}>
                  Tingkatan {f}
                </option>
              ))}
            </select>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Kelas</span>
            </label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] cursor-pointer"
            >
              {classList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* 2. Elemen Teras Karakter (4 Pilihan Kotak Seperti Dalam Gambar) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Elemen Teras Karakter (Pilih Satu atau Lebih):</span>
            </label>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {selectedElemen.length} Elemen Terpilih
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ELEMEN_KARAKTER.map((elemen) => {
              const isChecked = selectedElemen.includes(elemen.id);
              const IconComponent = elemen.icon;
              return (
                <div
                  key={elemen.id}
                  onClick={() => toggleElemen(elemen.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[90px] select-none ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 font-extrabold text-xs text-slate-900">
                      <IconComponent className={`w-4 h-4 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{elemen.label}</span>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {elemen.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Catatan Aktiviti (15 Minit) & Cadangan Pantas */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Catatan Aktiviti (15 Minit):</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Boleh ditaip manual atau klik cadangan aktiviti di bawah
            </span>
          </div>

          {/* Butang Cadangan Aktiviti Pantas KPM */}
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 flex items-center px-1">
              Cadangan Pantas:
            </span>
            {selectedElemen.flatMap(el => CADANGAN_AKTIVITI_KARAKTER[el] || []).map((cadangan, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCatatanAktiviti(cadangan)}
                className="text-[10px] font-medium px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors shadow-2xs text-left"
              >
                + {cadangan.slice(0, 50)}...
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            value={catatanAktiviti}
            onChange={(e) => setCatatanAktiviti(e.target.value)}
            placeholder="Tulis ringkasan pelaksanaan aktiviti pembentukan karakter 15 minit di sini..."
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
          />
        </div>

      </div>

      {/* =========================================================================
          PRATONTON KAD SLAID SEBENAR (FORMAT TEPAT SEPERTI GAMBAR SLIDE KPM)
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between no-print">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Paparan Kad Slaid Rasmi (Kurikulum Persekolahan 2027)</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Format Slaid 1:1 Seperti Gambar
          </span>
        </div>

        {/* Kad Slaid Penataran Kurikulum Persekolahan 2027 */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden p-6 sm:p-10 relative print:p-0 print:border-none print:shadow-none print:rounded-none">
          
          {/* Header Slaid: Logo Kiri & Tajuk Kanan */}
          <div className="flex items-start justify-between border-b-2 border-slate-100 pb-4 mb-4">
            {/* Logo Kiri dengan Latar Belakang Geometri Kuning/Jingga */}
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center p-1.5 shadow-sm">
                <img
                  src={LOGO_AL_HASANAH_BASE64}
                  alt="Logo Rasmi"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
            </div>

            {/* Label Atas Kanan */}
            <div className="text-right">
              <div className="text-[11px] font-extrabold text-blue-800 tracking-wider uppercase">
                PENATARAN
              </div>
              <div className="text-[12px] font-extrabold text-blue-700 tracking-wide uppercase">
                KURIKULUM PERSEKOLAHAN 2027
              </div>
            </div>
          </div>

          {/* Tajuk Utama di Bahagian Tengah */}
          <div className="text-center my-4">
            <h1 className="text-base sm:text-xl font-extrabold text-blue-700 tracking-tight">
              Pelaksanaan Aktiviti
            </h1>
            <h2 className="text-sm sm:text-lg font-extrabold text-blue-600 mt-0.5">
              Program Pembentukan Karakter (15 minit)
            </h2>
            <h3 className="text-xs sm:text-base font-bold text-blue-800 mt-0.5">
              Sekolah Menengah
            </h3>
          </div>

          {/* JADUAL 5 BARIS TEPAT SEPERTI GAMBAR */}
          <div className="mt-6 border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <tbody>
                
                {/* Baris 1: Tarikh (Dengan Highlight Bar Hijau Limau seperti dalam gambar) */}
                <tr className="border-b border-slate-200">
                  <td className="w-1/3 sm:w-1/4 p-2.5 sm:p-3 font-bold bg-[#84cc16] text-slate-900 border-r border-slate-200 flex items-center justify-between">
                    <span>Tarikh</span>
                    <span>:</span>
                  </td>
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800 bg-white">
                    {formattedDateDisplay}
                  </td>
                </tr>

                {/* Baris 2: Masa */}
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 flex items-center justify-between">
                    <span>Masa</span>
                    <span>:</span>
                  </td>
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800">
                    {masaDisplay}
                  </td>
                </tr>

                {/* Baris 3: Tahun / Tingkatan */}
                <tr className="border-b border-slate-200 bg-white">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 flex items-center justify-between">
                    <span>Tahun</span>
                    <span>:</span>
                  </td>
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800">
                    Tingkatan {tingkatan} ({kelas})
                  </td>
                </tr>

                {/* Baris 4: Elemen Teras Karakter (Checkboxes Seperti Dalam Gambar) */}
                <tr className="border-b border-slate-200 bg-slate-50/40">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 align-top flex items-center justify-between">
                    <span>Elemen Teras Karakter</span>
                    <span>:</span>
                  </td>
                  <td className="p-3 sm:p-4 bg-white space-y-2">
                    {ELEMEN_KARAKTER.map((el) => {
                      const isChecked = selectedElemen.includes(el.id);
                      return (
                        <div key={el.id} className="flex items-center space-x-2 text-xs sm:text-sm">
                          <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'border-slate-400 bg-white'
                          }`}>
                            {isChecked ? '✓' : ''}
                          </span>
                          <span className={`font-semibold ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                            {el.label}
                          </span>
                        </div>
                      );
                    })}
                  </td>
                </tr>

                {/* Baris 5: Catatan Aktiviti */}
                <tr className="bg-white">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 align-top flex items-center justify-between">
                    <span>Catatan Aktiviti</span>
                    <span>:</span>
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {catatanAktiviti || '-'}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Footer Slaid Rasmi: Grafik Jalur Biru/Kuning & Tag #kurikulumkita */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-end justify-between">
            <div className="text-[11px] font-extrabold text-blue-600 tracking-wider">
              #kurikulumkita
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              3
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
