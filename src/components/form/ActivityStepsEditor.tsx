'use client';

import React from 'react';
import { RPHActivities } from '@/types/erph';
import { Clock, Play, BookOpen, Users, CheckSquare, Flag } from 'lucide-react';

interface ActivityStepsEditorProps {
  activities: RPHActivities;
  onChange: (updated: RPHActivities) => void;
  isRTL: boolean;
  labels: Record<string, string>;
  rptSuggestion?: string;
}

export default function ActivityStepsEditor({
  activities,
  onChange,
  isRTL,
  labels,
  rptSuggestion
}: ActivityStepsEditorProps) {
  const handleChange = (key: keyof RPHActivities, value: string) => {
    onChange({
      ...activities,
      [key]: value
    });
  };

  const steps = [
    {
      key: 'set_induksi' as const,
      label: isRTL ? 'التمهيد / Set Induksi' : 'Set Induksi',
      duration: '5 Minit',
      icon: Play,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      hint: isRTL ? 'جذب انتباه الطلاب وتنشيط المعرفة السابقة...' : 'Menarik minat murid dan mencungkil pengetahuan sedia ada...'
    },
    {
      key: 'langkah_1' as const,
      label: isRTL ? 'الخطوة ١: شرح المفاهيم' : 'Langkah 1: Penerangan & Pemodelan Guru',
      duration: '15 Minit',
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      hint: isRTL ? 'شرح المعلم للمفاهيم الأساسية والألفاظ المقررة...' : 'Penerangan konsep utama dan bimbingan guru...'
    },
    {
      key: 'langkah_2' as const,
      label: isRTL ? 'الخطوة ٢: الأنشطة التعاونية (PAK-21)' : 'Langkah 2: Aktiviti Kolaboratif Murid (PAK-21)',
      duration: '20 Minit',
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      hint: isRTL ? 'أنشطة تفاعلية ومجموعات عمل...' : 'Aktiviti berpusatkan murid secara kumpulan / berpasangan...'
    },
    {
      key: 'langkah_3' as const,
      label: isRTL ? 'الخطوة ٣: التعزيز والتقييم' : 'Langkah 3: Pengukuhan & Pentaksiran Formatif',
      duration: '15 Minit',
      icon: CheckSquare,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      hint: isRTL ? 'حل التمارين وأوراق العمل...' : 'Latihan individu / lembaran kerja pengukuhan...'
    },
    {
      key: 'penutup' as const,
      label: isRTL ? 'الخاتمة / Penutup' : 'Penutup',
      duration: '5 Minit',
      icon: Flag,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      hint: isRTL ? 'تلخيص الدرس والتقييم الختامي...' : 'Rumusan kognitif dan afektif murid...'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          {labels['AKTIVITI P&P'] || labels['AKTIVITI'] || 'AKTIVITI PENGAJARAN & PEMBELAJARAN (PdPc)'}
        </label>
        <span className="text-[11px] text-slate-400 font-medium">5 Fasa Berstruktur TS25</span>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs ${step.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{step.label}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{step.duration}</span>
                </span>
              </div>

              <textarea
                rows={2}
                value={activities[step.key] || ''}
                onChange={(e) => handleChange(step.key, e.target.value)}
                placeholder={step.hint}
                className={`w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed font-medium resize-y ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
