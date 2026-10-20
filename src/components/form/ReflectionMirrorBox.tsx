'use client';

import React, { useMemo, useState } from 'react';
import { Award, Users, AlertTriangle, Sparkles, CheckCircle, ArrowRight, CalendarX, FileText } from 'lucide-react';
import { RPHReflection } from '@/types/erph';

interface ReflectionMirrorBoxProps {
  learningObjective: string;
  reflection: RPHReflection;
  onChange: (updated: RPHReflection) => void;
  isRTL: boolean;
  languageCode: string;
  labels: Record<string, string>;
  onCarryForwardToNextSlot?: () => void;
}

const COMMON_REASONS = [
  'Cuti Peristiwa / Cuti Umum',
  'Mesyuarat / Taklimat Guru',
  'Program / Aktiviti Rasmi Sekolah',
  'Guru Berkursus / Bengkel',
  'Guru Bertugas Luar / Pengiring',
  'Peperiksaan / Ujian Pentaksiran',
  'Bencana Alam / Cuaca Buruk',
  'Aktiviti Sukan & Kokurikulum'
];

export default function ReflectionMirrorBox({
  learningObjective,
  reflection,
  onChange,
  isRTL,
  languageCode,
  labels,
  onCarryForwardToNextSlot
}: ReflectionMirrorBoxProps) {
  const isPdpExecuted = reflection.pdp_dijalankan !== false;
  const sebabTidakDijalankan = reflection.sebab_tidak_dijalankan || '';
  const bawaKeKelasSeterusnya = reflection.bawa_ke_kelas_seterusnya ?? false;

  const hadir = reflection.bilangan_murid_hadir || 30;
  const mencapai = reflection.bilangan_murid_mencapai || 28;
  const belumMencapai = Math.max(0, hadir - mencapai);
  const peratus = hadir > 0 ? ((mencapai / hadir) * 100).toFixed(1) : '0';

  // Format Auto-Mirrored String mengikut mod: PdP Dijalankan VS Tidak Dijalankan
  const mirroredText = useMemo(() => {
    if (!isPdpExecuted) {
      const reasonText = sebabTidakDijalankan.trim() || 'Aktiviti / Program Rasmi Sekolah';
      
      if (languageCode === 'ar' || isRTL) {
        return `لم يتم تنفيذ التعليم والتعلم (PdP) بسبب: ${reasonText}.${
          bawaKeKelasSeterusnya ? ' تم تأجيل خطة التدريس وترحيلها إلى الحصة/الصفوف القادمة.' : ''
        }`;
      }

      if (languageCode === 'en') {
        return `PdP was not conducted due to: ${reasonText}.${
          bawaKeKelasSeterusnya ? ' Lesson plan will be carried forward to the next class session.' : ''
        }`;
      }

      return `PdP tidak dijalankan atas sebab: ${reasonText}.${
        bawaKeKelasSeterusnya ? ' Perancangan PdPc dibawa ke kelas seterusnya.' : ''
      }`;
    }

    // Standard reflection jika PdP dijalankan
    const cleanObj = learningObjective.trim() || (isRTL ? 'أهداف التعلم المحددة' : 'objektif pembelajaran yang ditetapkan');

    if (languageCode === 'ar' || isRTL) {
      return `نجح ${mencapai} / ${hadir} من الطلاب (${peratus}٪) في تحقيق أهداف التعلم وقادرون على: ${cleanObj}.${
        belumMencapai > 0
          ? ` بينما تم تقديم تدريب مكثف وتوجيه مستمر لعدد ${belumMencapai} من الطلاب.`
          : ' وأظهر الجميع استيعابا تاما للمفاهيم.'
      }`;
    }

    if (languageCode === 'en') {
      return `${mencapai} / ${hadir} pupils (${peratus}%) successfully achieved the learning objective: ${cleanObj}.${
        belumMencapai > 0
          ? ` Meanwhile, ${belumMencapai} pupils received remedial coaching and peer guidance.`
          : ' All pupils demonstrated mastery.'
      }`;
    }

    // Bahasa Melayu Standard KPM
    return `${mencapai} / ${hadir} orang murid (${peratus}%) berjaya mencapai objektif pembelajaran dan dapat: ${cleanObj}.${
      belumMencapai > 0
        ? ` Murid yang belum menguasai (${belumMencapai} orang) diberi bimbingan berterusan / latihan pemulihan.`
        : ' Keseluruhan murid menguasai standard pembelajaran dengan cemerlang.'
    }`;
  }, [
    isPdpExecuted,
    sebabTidakDijalankan,
    bawaKeKelasSeterusnya,
    learningObjective,
    mencapai,
    hadir,
    belumMencapai,
    peratus,
    languageCode,
    isRTL
  ]);

  const handleTogglePdpExecuted = (executed: boolean) => {
    onChange({
      ...reflection,
      pdp_dijalankan: executed,
      bawa_ke_kelas_seterusnya: !executed ? true : false,
      objektif_disalin: mirroredText
    });
  };

  const handleReasonChange = (reason: string) => {
    onChange({
      ...reflection,
      sebab_tidak_dijalankan: reason,
      objektif_disalin: mirroredText
    });
  };

  const handleToggleCarryForward = (checked: boolean) => {
    onChange({
      ...reflection,
      bawa_ke_kelas_seterusnya: checked,
      objektif_disalin: mirroredText
    });
  };

  const handleHadirChange = (val: number) => {
    const newHadir = Math.max(1, val);
    const newMencapai = Math.min(reflection.bilangan_murid_mencapai, newHadir);
    const newPct = parseFloat(((newMencapai / newHadir) * 100).toFixed(1));
    onChange({
      ...reflection,
      bilangan_murid_hadir: newHadir,
      bilangan_murid_mencapai: newMencapai,
      peratus_mencapai: newPct,
      objektif_disalin: mirroredText
    });
  };

  const handleMencapaiChange = (val: number) => {
    const newMencapai = Math.max(0, Math.min(val, hadir));
    const newPct = parseFloat(((newMencapai / hadir) * 100).toFixed(1));
    onChange({
      ...reflection,
      bilangan_murid_mencapai: newMencapai,
      peratus_mencapai: newPct,
      intervensi_diperlukan: newMencapai < hadir,
      objektif_disalin: mirroredText
    });
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Header Refleksi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              {labels['REFLEKSI'] || 'REFLEKSI & PENILAIAN IMPAK'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Objektif Pembelajaran disalin secara dinamik mengikut piawaian SPI Bil. 3/1999
            </p>
          </div>
        </div>

        {/* Tab Pilihan: PdP Dijalankan vs Tidak Dijalankan */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleTogglePdpExecuted(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isPdpExecuted
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PdP Dijalankan
          </button>
          <button
            type="button"
            onClick={() => handleTogglePdpExecuted(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              !isPdpExecuted
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <CalendarX className="w-3.5 h-3.5" />
            <span>PdP Tidak Dijalankan</span>
          </button>
        </div>
      </div>

      {/* BAHAGIAN 1: JIKA PDP TIDAK DIJALANKAN */}
      {!isPdpExecuted ? (
        <div className="bg-rose-50/70 border-2 border-rose-200/80 rounded-2xl p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 text-rose-800 font-extrabold text-xs">
            <CalendarX className="w-4 h-4 text-rose-600" />
            <span>PILIHAN: PDP TIDAK DIJALANKAN ATAS SEBAB</span>
          </div>

          {/* Butang Sebab Lazim */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Pilih Sebab Lazim (atau taip jawapan sendiri di bawah):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => handleReasonChange(reason)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
                    sebabTidakDijalankan === reason
                      ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-100/50 hover:border-rose-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Input Sebab Sendiri / Jawapan Sendiri */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              [PdP Tidak Dijalankan Atas Sebab... {'{Jawapan Sendiri}'}..]
            </label>
            <input
              type="text"
              value={sebabTidakDijalankan}
              onChange={(e) => handleReasonChange(e.target.value)}
              placeholder="Contoh: Program Sukan Tahunan Sekolah, Taklimat Khas PPD, Kursus Profesional..."
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-slate-800"
            />
          </div>

          {/* Pilihan: Bawa RPH ke kelas seterusnya */}
          <div className="p-3 bg-white border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={bawaKeKelasSeterusnya}
                onChange={(e) => handleToggleCarryForward(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Bawa RPH ke kelas seterusnya
                </span>
                <span className="text-[11px] text-slate-500">
                  Tandakan pilihan ini untuk membawa objektif &amp; perancangan PdPc ini ke jadual kelas seterusnya.
                </span>
              </div>
            </label>

            {onCarryForwardToNextSlot && bawaKeKelasSeterusnya && (
              <button
                type="button"
                onClick={onCarryForwardToNextSlot}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all shrink-0"
              >
                <span>Bawa ke Jadual Seterusnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* BAHAGIAN 2: JIKA PDP DIJALANKAN (STATISTIK BILANGAN MURID) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {labels['BIL MURID'] || 'Murid Hadir (Jumlah)'}
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={hadir}
                  onChange={(e) => handleHadirChange(parseInt(e.target.value) || 0)}
                  className="w-full text-xs pl-8 pr-2 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {labels['murid berjaya dan dapat:'] || 'Murid Mencapai Objektif'}
              </label>
              <input
                type="number"
                min="0"
                max={hadir}
                value={mencapai}
                onChange={(e) => handleMencapaiChange(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Perlu Bimbingan / Pemulihan
              </label>
              <input
                type="text"
                readOnly
                value={`${belumMencapai} orang`}
                className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold"
              />
            </div>
          </div>

          {/* Intervensi jika belum mencapai */}
          {belumMencapai > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{labels['Intervensi:'] || 'Tindakan Intervensi Murid Belum Menguasai:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Bimbingan Rakan Sebaya (Peer Coaching)',
                  'Latihan Pemulihan Berfokus',
                  'Aktiviti Pengulangan Konsep (Talaqqi Tambahan)',
                  'Bimbingan Individu (Klinikal Guru)'
                ].map((option, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChange({ ...reflection, pilihan_intervensi: option })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      reflection.pilihan_intervensi === option
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paparan Teks Refleksi Auto-Mirrored */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
          <span>{labels['murid berjaya dan dapat'] || 'Rumusan Refleksi Rasmi Guru'}</span>
          <span className="text-[10px] text-teal-600 font-medium flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>
              {!isPdpExecuted
                ? 'Status Penangguhan & Pemindahan PdP'
                : 'Auto-Mirrored daripada Objektif'}
            </span>
          </span>
        </label>
        <textarea
          rows={3}
          value={mirroredText}
          readOnly
          className={`w-full text-xs p-3 rounded-xl border ${
            !isPdpExecuted
              ? 'border-rose-200 bg-rose-50/40 text-rose-950 font-bold'
              : 'border-teal-200/80 bg-teal-50/30 text-slate-800 font-medium'
          } focus:outline-none leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
        />
      </div>

    </div>
  );
}
