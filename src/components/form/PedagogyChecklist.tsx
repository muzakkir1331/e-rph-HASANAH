'use client';

import React from 'react';
import { RPHPedagogy } from '@/types/erph';
import pedagogiOptions from '@/data/pedagogi_options.json';
import { Palette, Cpu, Heart, Share2, Compass, CheckSquare } from 'lucide-react';

interface PedagogyChecklistProps {
  pedagogy: RPHPedagogy;
  onChange: (updated: RPHPedagogy) => void;
  isRTL: boolean;
  labels: Record<string, string>;
}

export default function PedagogyChecklist({
  pedagogy,
  onChange,
  isRTL,
  labels
}: PedagogyChecklistProps) {
  const toggleArrayItem = (key: keyof RPHPedagogy, item: string) => {
    const list = pedagogy[key] || [];
    const exists = list.includes(item);
    const updated = exists ? list.filter((i) => i !== item) : [...list, item];
    onChange({
      ...pedagogy,
      [key]: updated
    });
  };

  const sections = [
    {
      key: 'bbm' as const,
      label: labels['BAHAN BANTU MENGAJAR'] || 'Bahan Bantu Mengajar (BBM)',
      icon: Palette,
      options: pedagogiOptions.bbm.slice(0, 8)
    },
    {
      key: 'emk' as const,
      label: labels['EMK:'] || 'Elemen Merentas Kurikulum (EMK)',
      icon: Cpu,
      options: pedagogiOptions.emk.slice(0, 8)
    },
    {
      key: 'nilai_murni' as const,
      label: labels['NILAI-NILAI MURNI'] || 'Nilai-Nilai Murni',
      icon: Heart,
      options: pedagogiOptions.nilai_murni.slice(0, 8)
    },
    {
      key: 'peta_ithink' as const,
      label: labels['ALAT PEMIKIRAN'] || 'Peta Pemikiran I-Think',
      icon: Share2,
      options: pedagogiOptions.peta_ithink.slice(0, 8)
    },
    {
      key: 'alat_pemikiran_pak21' as const,
      label: 'Alat Pemikiran / Aktiviti PAK-21',
      icon: Compass,
      options: [
        'Think-Pair-Share',
        'Round Robin',
        'Rally Table',
        'Gallery Walk',
        'Hot Seat',
        'Mix-N-Match',
        'The Yarn Yarn',
        'Same Different'
      ]
    },
    {
      key: 'pentaksiran' as const,
      label: labels['PENILAIAN/ PENTAKSIRAN'] || 'Penilaian & Pentaksiran Formatif',
      icon: CheckSquare,
      options: pedagogiOptions.pentaksiran
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="font-bold text-sm text-slate-800">
          Elemen Merentas Kurikulum, BBM &amp; Pedagogi Abad Ke-21 (PAK-21)
        </h3>
        <p className="text-[11px] text-slate-500">
          Pilih elemen yang diaplikasikan dalam sesi PdPc ini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const selectedList = pedagogy[sec.key] || [];

          return (
            <div key={sec.key} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {sec.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {sec.options.map((opt, idx) => {
                  const isChecked = selectedList.includes(opt);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleArrayItem(sec.key, opt)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
