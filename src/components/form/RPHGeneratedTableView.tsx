'use client';

import React from 'react';
import { RPHRecord } from '@/types/erph';
import { LOGO_AL_HASANAH_BASE64 } from '@/data/logo_base64';
import { Printer, Download, CheckCircle2, AlertTriangle, FileText, Share2, Copy, Edit3, FileDown } from 'lucide-react';
import { formatRPHFileName } from '@/lib/google-drive';
import { printOrSaveRPH, downloadRPHPdf } from '@/lib/print-rph';

interface RPHGeneratedTableViewProps {
  rph: Partial<RPHRecord>;
  teacherName: string;
  teacherEmail: string;
  slotIndex?: number;
  totalSlots?: number;
  schoolName?: string;
  onPrint?: () => void;
  onDownloadHtml?: () => void;
  onSwitchToForm?: () => void;
}

/**
 * Komponen Templat e-RPH Berjadual Rasmi KPM (SABK SMA Al-Hasanah)
 * Menggunakan susun atur TABLE penuh yang kemas, padat, dan mematuhi standard A4 Potrait 1 Muka Surat.
 */
export default function RPHGeneratedTableView({
  rph,
  teacherName,
  teacherEmail,
  slotIndex = 1,
  totalSlots = 1,
  schoolName = 'SEKOLAH MENENGAH AGAMA AL-HASANAH (SABK)',
  onPrint,
  onDownloadHtml,
  onSwitchToForm
}: RPHGeneratedTableViewProps) {
  const isRTL = rph.arah_teks === 'rtl' || rph.kod_bahasa === 'ar';
  const isPdPExecuted = rph.refleksi?.pdp_dijalankan !== false;

  const handleSavePdf = async () => {
    await downloadRPHPdf({
      rphList: [rph],
      teacherName,
      teacherEmail,
      weekNo: rph.minggu_ke || 1,
      schoolName
    });
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printOrSaveRPH({
        rphList: [rph],
        teacherName,
        teacherEmail,
        weekNo: rph.minggu_ke || 1,
        schoolName
      });
    }
  };

  const isKarakter = rph.jenis_rph === 'karakter' || rph.subjek?.toLowerCase().includes('karakter');
  const elemenList = ['Penyayang', 'Berdaya Tahan', 'Berupaya Memimpin', 'Warganegara Aktif'];
  const selectedElemen = rph.karakter_data?.elemen || (rph.sp ? rph.sp.split(',').map(s => s.trim()) : ['Penyayang']);
  const catatan = rph.karakter_data?.catatan_aktiviti || rph.kriteria_kejayaan || rph.sk || '';

  if (isKarakter) {
    return (
      <div className="space-y-4">
        {/* Bar Tindakan */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-md no-print">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white block">
                Templat Slaid Program Pembentukan Karakter (15 Minit)
              </span>
              <span className="text-[10px] text-slate-400">
                Penataran Kurikulum Persekolahan 2027 &bull; Format Slaid Rasmi 1:1
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {onSwitchToForm && (
              <button
                type="button"
                onClick={onSwitchToForm}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-white/20"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-300" />
                <span>Kembali ke Borang Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSavePdf}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Simpan sebagai fail PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Cetak paparan slaid"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Kad Paparan Slaid Sebenar Seperti Gambar */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-10 shadow-xl mx-auto max-w-5xl text-slate-900">
          {/* Header Slaid */}
          <div className="flex items-start justify-between border-b-2 border-slate-100 pb-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center p-1.5 shadow-sm">
              <img
                src={LOGO_AL_HASANAH_BASE64}
                alt="Logo Rasmi"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div className="text-right">
              <div className="text-[11px] font-extrabold text-blue-800 tracking-wider uppercase">
                PENATARAN
              </div>
              <div className="text-[12px] font-extrabold text-blue-700 tracking-wide uppercase">
                KURIKULUM PERSEKOLAHAN 2027
              </div>
            </div>
          </div>

          {/* Tajuk Utama */}
          <div className="text-center my-4">
            <h1 className="text-lg sm:text-xl font-extrabold text-blue-700 tracking-tight">
              Pelaksanaan Aktiviti
            </h1>
            <h2 className="text-base sm:text-lg font-extrabold text-blue-600 mt-0.5">
              Program Pembentukan Karakter (15 minit)
            </h2>
            <h3 className="text-sm sm:text-base font-bold text-blue-800 mt-0.5">
              Sekolah Menengah
            </h3>
          </div>

          {/* Jadual 5 Baris */}
          <div className="mt-6 border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/3 sm:w-1/4 p-2.5 sm:p-3 font-bold bg-[#84cc16] text-slate-900 border-r border-slate-200 flex items-center justify-between">
                    <span>Tarikh</span>
                    <span>:</span>
                  </td>
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800 bg-white">
                    {rph.tarikh || '-'} {rph.hari ? `(${rph.hari})` : ''}
                  </td>
                </tr>

                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 flex items-center justify-between">
                    <span>Masa</span>
                    <span>:</span>
                  </td>
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800">
                    {rph.masa_mula || '7.20 PAGI'} - {rph.masa_tamat || '7.35 PAGI'} (15 minit)
                  </td>
                </tr>

                <tr className="border-b border-slate-200 bg-white">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 flex items-center justify-between">
                    <span>Tahun</span>
                    <span>:</span>
                  </td>
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800">
                    Tingkatan {rph.tingkatan || '1'} ({rph.kelas || '-'})
                  </td>
                </tr>

                <tr className="border-b border-slate-200 bg-slate-50/40">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 align-top flex items-center justify-between">
                    <span>Elemen Teras Karakter</span>
                    <span>:</span>
                  </td>
                  <td className="p-3 sm:p-4 bg-white space-y-2">
                    {elemenList.map((item) => {
                      const isChecked = selectedElemen.includes(item);
                      return (
                        <div key={item} className="flex items-center space-x-2 text-xs sm:text-sm">
                          <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'border-slate-400 bg-white'
                          }`}>
                            {isChecked ? '✓' : ''}
                          </span>
                          <span className={`font-semibold ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </td>
                </tr>

                <tr className="bg-white">
                  <td className="p-2.5 sm:p-3 font-bold text-slate-700 border-r border-slate-200 align-top flex items-center justify-between">
                    <span>Catatan Aktiviti</span>
                    <span>:</span>
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {catatan || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Slaid */}
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Bar Tindakan Templat Jadual */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-md no-print">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-white block">
              Templat e-RPH Berjadual Rasmi (Format Table KPM)
            </span>
            <span className="text-[10px] text-slate-400">
              Disusun rapi dalam struktur jadual berkotak &bull; Tepat 1 Muka Surat A4 Landscape
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          {onSwitchToForm && (
            <button
              type="button"
              onClick={onSwitchToForm}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-white/20"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kembali ke Borang Edit</span>
            </button>
          )}

          {/* Butang Simpan PDF */}
          <button
            type="button"
            onClick={handleSavePdf}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Simpan e-RPH sebagai fail PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak A4</span>
          </button>

          {onDownloadHtml && (
            <button
              type="button"
              onClick={onDownloadHtml}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun .HTML</span>
            </button>
          )}
        </div>
      </div>

      {/* Kad Muka Surat A4 Landscape Dengan Struktur Table Rasmi */}
      <div
        className="bg-white border-2 border-slate-700 rounded-xl p-4 sm:p-6 shadow-xl mx-auto max-w-6xl text-slate-900 overflow-x-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          fontFamily: isRTL ? 'Amiri, Arial, Tahoma, sans-serif' : 'Inter, Arial, sans-serif'
        }}
      >
        {/* Header Rasmi Kementerian & Sekolah (Kekal Simetri LTR: Logo Kiri, Tajuk Tengah, Slot Kanan) */}
        <div className="border-b-2 border-slate-800 pb-3 mb-3" dir="ltr">
          <table className="w-full border-none border-collapse">
            <tbody>
              <tr>
                <td className="w-16 text-center align-middle border-none p-0">
                  <img
                    src={LOGO_AL_HASANAH_BASE64}
                    alt="Logo Al-Hasanah"
                    className="w-14 h-14 object-contain mx-auto"
                  />
                </td>
                <td className="text-center align-middle border-none px-3">
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                    KEMENTERIAN PENDIDIKAN MALAYSIA
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-emerald-800 uppercase tracking-tight my-0.5">
                    {schoolName}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    RANCANGAN PENGAJARAN HARIAN (e-RPH SESI 2027)
                  </div>
                </td>
                <td className="w-20 text-right align-middle border-none p-0 text-[10px] font-bold text-slate-400">
                  <span className="px-2 py-1 bg-slate-100 rounded text-[9px] border border-slate-300 block text-center">
                    SLOT {slotIndex}/{totalSlots}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Master Table e-RPH Rasmi (A4 Landscape) */}
        <table className="w-full border-collapse border-2 border-slate-800 text-[10.5px] leading-relaxed">
          <tbody>
            {/* Baris 1: Minggu Persekolahan, Hari & Tarikh, Masa PdPc */}
            <tr>
              <th className="w-[13%] bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Minggu Persekolahan
              </th>
              <td className="w-[20%] border border-slate-400 p-2 font-semibold">
                Minggu {rph.minggu_ke || 1} (Sesi 2027)
              </td>
              <th className="w-[13%] bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Hari &amp; Tarikh
              </th>
              <td className="w-[21%] border border-slate-400 p-2 font-semibold">
                <strong>{rph.hari || '-'}</strong> ({rph.tarikh || '-'})
              </td>
              <th className="w-[12%] bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Masa PdPc
              </th>
              <td className="w-[21%] border border-slate-400 p-2 font-semibold text-emerald-900">
                <strong>{rph.masa_mula || '-'} &ndash; {rph.masa_tamat || '-'}</strong>
              </td>
            </tr>

            {/* Baris 2: Tingkatan & Kelas, Mata Pelajaran, Guru Pengajar */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Tingkatan / Kelas
              </th>
              <td className="border border-slate-400 p-2 font-semibold">
                Tingkatan {rph.tingkatan || '-'} &bull; <strong>{rph.kelas || '-'}</strong>
              </td>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Mata Pelajaran
              </th>
              <td className="border border-slate-400 p-2 font-extrabold text-emerald-800">
                {rph.subjek || '-'}
              </td>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Guru Pengajar
              </th>
              <td className="border border-slate-400 p-2 font-semibold text-slate-700">
                <strong>{teacherName}</strong>
              </td>
            </tr>

            {/* Baris 3: Tema / Tajuk */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Tema / Tajuk
              </th>
              <td colSpan={5} className="border border-slate-400 p-2 font-semibold text-slate-800">
                {rph.tema || '-'} {rph.tajuk ? `• ${rph.tajuk}` : ''}
              </td>
            </tr>

            {/* Baris 4: Standard Kandungan (SK) */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Standard Kandungan (SK)
              </th>
              <td colSpan={5} className="border border-slate-400 p-2 font-medium text-slate-800">
                {rph.sk || '-'}
              </td>
            </tr>

            {/* Baris 5: Standard Pembelajaran (SP) */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Standard Pembelajaran (SP)
              </th>
              <td colSpan={5} className="border border-slate-400 p-2 font-medium text-slate-800 leading-relaxed">
                {rph.sp || '-'}
              </td>
            </tr>

            {/* Baris 6: Objektif Pembelajaran */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Objektif Pembelajaran
              </th>
              <td colSpan={5} className="border border-slate-400 p-2 font-medium text-slate-900 leading-relaxed bg-emerald-50/20">
                {rph.objektif_pembelajaran || '-'}
              </td>
            </tr>

            {/* Baris 7: Kriteria Kejayaan */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase">
                Kriteria Kejayaan
              </th>
              <td colSpan={5} className="border border-slate-400 p-2 font-medium text-slate-700 leading-relaxed">
                {rph.kriteria_kejayaan || '-'}
              </td>
            </tr>

            {/* Baris 8: Aktiviti Pengajaran & Pembelajaran (PdPc) */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase align-top">
                Aktiviti Pembelajaran &amp; Pemudahcaraan (PdPc)
              </th>
              <td colSpan={5} className="border border-slate-400 p-2 space-y-1.5">
                <div className="pb-1 border-b border-slate-200">
                  <span className="font-bold text-emerald-800 text-[10.5px]">Set Induksi (5 Minit):</span>
                  <div className="text-slate-800 mt-0.5">{rph.aktiviti?.set_induksi || '-'}</div>
                </div>

                <div className="pb-1 border-b border-slate-200">
                  <span className="font-bold text-emerald-800 text-[10.5px]">Aktiviti Utama (Langkah Pembelajaran):</span>
                  <div className="space-y-0.5 mt-0.5 pl-2">
                    {rph.aktiviti?.langkah_1 && (
                      <div>&bull; <strong>Langkah 1:</strong> {rph.aktiviti.langkah_1}</div>
                    )}
                    {rph.aktiviti?.langkah_2 && (
                      <div>&bull; <strong>Langkah 2:</strong> {rph.aktiviti.langkah_2}</div>
                    )}
                    {rph.aktiviti?.langkah_3 && (
                      <div>&bull; <strong>Langkah 3:</strong> {rph.aktiviti.langkah_3}</div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-800 text-[10.5px]">Penutup &amp; Rumusan (5 Minit):</span>
                  <div className="text-slate-800 mt-0.5">{rph.aktiviti?.penutup || '-'}</div>
                </div>
              </td>
            </tr>

            {/* Baris 9: Pengisian Kurikulum / Elemen Pedagogi & EMK (4 Kolum Horizontal Penuh) */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase align-top">
                Pengisian Kurikulum &amp; Pedagogi
              </th>
              <td colSpan={5} className="border border-slate-400 p-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9.5px]">
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Bahan Bantu Mengajar (BBM):</span>
                    <p className="text-slate-600">{(rph.pedagogi?.bbm || []).join(', ') || '-'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Elemen Merentas Kurikulum &amp; Nilai:</span>
                    <p className="text-slate-600">
                      {(rph.pedagogi?.emk || []).join(', ')} {(rph.pedagogi?.nilai_murni || []).length ? `• ${rph.pedagogi?.nilai_murni?.join(', ')}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Strategi &amp; PAK-21:</span>
                    <p className="text-slate-600">
                      {(rph.pedagogi?.alat_pemikiran_pak21 || []).join(', ')} • {(rph.pedagogi?.strategi || []).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Pentaksiran Bilik Darjah (PBD):</span>
                    <p className="text-slate-600">{(rph.pedagogi?.pentaksiran || []).join(', ') || '-'}</p>
                  </div>
                </div>
              </td>
            </tr>

            {/* Baris 10: Refleksi & Impak PdPc */}
            <tr>
              <th className="bg-slate-100 border border-slate-400 p-2 text-left font-bold text-slate-800 uppercase align-top">
                Refleksi &amp; Penilaian Impak
              </th>
              <td
                colSpan={5}
                className={`border border-slate-400 p-2.5 ${
                  !isPdPExecuted ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50/50 text-emerald-950'
                }`}
              >
                {!isPdPExecuted ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 font-extrabold text-rose-800 text-[11px]">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>PdP TIDAK DIJALANKAN ATAS SEBAB: {rph.refleksi?.sebab_tidak_dijalankan || 'Program Rasmi Sekolah / Peperiksaan'}</span>
                    </div>
                    {rph.refleksi?.bawa_ke_kelas_seterusnya && (
                      <p className="text-[10.5px] font-semibold text-rose-700 pl-5">
                        &rarr; Tindakan Susulan: Perancangan e-RPH ini dibawa ke kelas dan sesi pengajaran yang seterusnya.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-semibold text-emerald-900 leading-relaxed">
                      {rph.refleksi?.objektif_disalin || rph.objektif_pembelajaran || 'Murid berjaya menguasai standard pembelajaran yang ditetapkan.'}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-700 font-medium pt-1 border-t border-emerald-200">
                      <span>Kehadiran: <strong>{rph.refleksi?.bilangan_murid_hadir ?? 0} orang</strong></span>
                      <span>Mencapai Objektif: <strong>{rph.refleksi?.bilangan_murid_mencapai ?? 0} orang</strong> ({rph.refleksi?.peratus_mencapai ?? 0}%)</span>
                      {rph.refleksi?.intervensi_diperlukan && (
                        <span className="font-bold text-rose-700">
                          [Intervensi: {rph.refleksi?.pilihan_intervensi || 'Bimbingan Rakan Sebaya'}]
                        </span>
                      )}
                      {rph.refleksi?.catatan_tambahan && (
                        <span>Catatan: {rph.refleksi.catatan_tambahan}</span>
                      )}
                    </div>
                  </div>
                )}
              </td>
            </tr>

            {/* Baris 11: Ruang Pengesahan Pentadbir */}
            <tr>
              <td colSpan={3} className="border border-slate-400 p-2.5 bg-slate-50 text-[10px]">
                <div className="text-slate-500 font-bold uppercase text-[9px]">Disediakan Oleh:</div>
                <div className="font-extrabold text-slate-900 mt-0.5">{teacherName}</div>
                <div className="text-slate-500 text-[9px] mt-0.5">
                  Guru Mata Pelajaran &bull; Tarikh: {rph.tarikh || new Date().toISOString().split('T')[0]}
                </div>
              </td>
              <td colSpan={3} className="border border-slate-400 p-2.5 bg-slate-50 text-[10px] text-right">
                <div className="text-slate-500 font-bold uppercase text-[9px]">Disemak &amp; Disahkan Oleh:</div>
                <div className="font-extrabold text-slate-900 mt-0.5">Pengetua / PK Pentadbiran SMA Al-Hasanah</div>
                <div className="text-emerald-700 font-bold text-[9px] mt-0.5">
                  PENGESAHAN DIGITAL e-RPH KPM (ID DELIMA)
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
