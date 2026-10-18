'use client';

import React, { useMemo } from 'react';
import { Award, Users, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { RPHReflection } from '@/types/erph';

interface ReflectionMirrorBoxProps {
  learningObjective: string;
  reflection: RPHReflection;
  onChange: (updated: RPHReflection) => void;
  isRTL: boolean;
  languageCode: string;
  labels: Record<string, string>;
}

export default function ReflectionMirrorBox({
  learningObjective,
  reflection,
  onChange,
  isRTL,
  languageCode,
  labels
}: ReflectionMirrorBoxProps) {
  const hadir = reflection.bilangan_murid_hadir || 30;
  const mencapai = reflection.bilangan_murid_mencapai || 28;
  const belumMencapai = Math.max(0, hadir - mencapai);
  const peratus = hadir > 0 ? ((mencapai / hadir) * 100).toFixed(1) : '0';

  // Format Auto-Mirrored String
  const mirroredText = useMemo(() => {
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
  }, [learningObjective, mencapai, hadir, belumMencapai, peratus, languageCode, isRTL]);

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
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

        {/* Peratusan Pencapaian Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
          parseFloat(peratus) >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{peratus}% Menguasai</span>
        </div>
      </div>

      {/* Kalkulator Bilangan Murid */}
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

      {/* Paparan Teks Refleksi Auto-Mirrored */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
          <span>{labels['murid berjaya dan dapat'] || 'Rumusan Refleksi Guru'}</span>
          <span className="text-[10px] text-teal-600 font-medium flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Auto-Mirrored daripada Objektif</span>
          </span>
        </label>
        <textarea
          rows={3}
          value={mirroredText}
          readOnly
          className={`w-full text-xs p-3 rounded-xl border border-teal-200/80 bg-teal-50/30 text-slate-800 focus:outline-none leading-relaxed font-medium ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        />
      </div>

      {/* Pilihan Intervensi jika belum 100% mencapai */}
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
  );
}
