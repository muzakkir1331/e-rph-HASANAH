'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Check, Layers } from 'lucide-react';
import sampleDSKP from '@/data/dskp_sample.json';
import { DSKPItem } from '@/types/erph';

interface DSKPSelectorProps {
  subject: string;
  form: string;
  selectedSK: string;
  selectedSP: string;
  onSelect: (item: { tema: string; tajuk: string; sk: string; sp: string; defaultObj?: string }) => void;
  isRTL: boolean;
  labels: Record<string, string>;
}

export default function DSKPSelector({
  subject,
  form,
  selectedSK,
  selectedSP,
  onSelect,
  isRTL,
  labels
}: DSKPSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Tapis data DSKP mengikut subjek dan tingkatan
  const filteredItems: DSKPItem[] = useMemo(() => {
    let items = (sampleDSKP as any[]) || [];
    
    // Tapis subjek
    if (subject) {
      const sLower = subject.trim().toLowerCase();
      const matched = items.filter(i => i.subjek.trim().toLowerCase() === sLower);
      if (matched.length > 0) items = matched;
    }

    // Tapis tingkatan
    if (form) {
      const fLower = form.toString().trim();
      const matched = items.filter(i => i.tingkatan.toString().trim() === fLower);
      if (matched.length > 0) items = matched;
    }

    // Carian kata kunci
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i => 
        i.sp.toLowerCase().includes(term) ||
        i.sk.toLowerCase().includes(term) ||
        i.tajuk.toLowerCase().includes(term) ||
        i.tema.toLowerCase().includes(term)
      );
    }

    return items.slice(0, 30);
  }, [subject, form, searchTerm]);

  return (
    <div className="space-y-4">
      
      {/* Paparan Pilihan Semasa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Kotak Standard Kandungan (SK) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{labels['STANDARD KANDUNGAN'] || 'STANDARD KANDUNGAN'}</span>
            <span className="text-[10px] text-slate-400 font-normal">DSKP KPM</span>
          </label>
          <textarea
            value={selectedSK}
            readOnly
            rows={2}
            placeholder={isRTL ? 'اختر معيار المحتوى أدناه...' : 'Pilih Standard Kandungan di bawah...'}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none resize-none"
          />
        </div>

        {/* Kotak Standard Pembelajaran (SP) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{labels['STANDARD PEMBELAJARAN'] || 'STANDARD PEMBELAJARAN'}</span>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isOpen ? 'Tutup Senarai' : 'Cari dalam DSKP'}</span>
            </button>
          </label>
          <textarea
            value={selectedSP}
            readOnly
            rows={2}
            placeholder={isRTL ? 'اختر معيار التعلم من بنك DSKP...' : 'Pilih Standard Pembelajaran dari DSKP...'}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none resize-none"
          />
        </div>

      </div>

      {/* Panel Dropdown Pemilih DSKP */}
      {isOpen && (
        <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-800">
                Pangkalan Data DSKP: {subject} (Tingkatan {form})
              </h4>
            </div>

            {/* Input Carian */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kata kunci topik, SK, atau SP..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Senarai Rekod DSKP */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Tiada rekod DSKP ditemui bagi kata kunci carian tersebut.
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = selectedSP === item.sp;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelect({
                        tema: item.tema,
                        tajuk: item.tajuk,
                        sk: item.sk,
                        sp: item.sp,
                        defaultObj: item.objektif_lalai
                      });
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium ring-1 ring-emerald-500'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {item.tajuk && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                            {item.tajuk}
                          </span>
                        )}
                        <p className="font-semibold text-slate-800">
                          <span className="text-emerald-700">SK:</span> {item.sk}
                        </p>
                        <p className="text-slate-600">
                          <span className="text-teal-700 font-semibold">SP:</span> {item.sp}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
}
