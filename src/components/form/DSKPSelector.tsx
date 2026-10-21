'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Check, Layers } from 'lucide-react';
import sampleDSKP from '@/data/dskp_sample.json';
import { DSKPItem } from '@/types/erph';

import { matchDSKPSubject } from '@/lib/rpt-helper';

interface DSKPSelectorProps {
  subject: string;
  form: string;
  selectedSK: string;
  selectedSP: string;
  onSelect: (item: { tema: string; tajuk: string; sk: string; sp: string; defaultObj?: string }) => void;
  isRTL: boolean;
  labels: Record<string, string>;
  onSKChange?: (sk: string) => void;
  onSPChange?: (sp: string) => void;
}

export default function DSKPSelector({
  subject,
  form,
  selectedSK,
  selectedSP,
  onSelect,
  isRTL,
  labels,
  onSKChange,
  onSPChange
}: DSKPSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Tapis data DSKP mengikut subjek dan tingkatan dengan ketat
  const filteredItems: DSKPItem[] = useMemo(() => {
    let items = (sampleDSKP as any[]) || [];
    
    // Tapis subjek - KETAT: Elakkan sama sekali mengambil rekod subjek lain!
    if (subject) {
      items = items.filter(i => matchDSKPSubject(subject, i.subjek));
    }

    // Tapis tingkatan
    if (form) {
      const fClean = form.toString().replace(/\D/g, '') || form.toString().trim();
      items = items.filter(i => i.tingkatan.toString().trim() === fClean);
    }

    // Carian kata kunci
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i => 
        (i.sp && i.sp.toLowerCase().includes(term)) ||
        (i.sk && i.sk.toLowerCase().includes(term)) ||
        (i.tajuk && i.tajuk.toLowerCase().includes(term)) ||
        (i.tema && i.tema.toLowerCase().includes(term))
      );
    }

    return items.slice(0, 100);
  }, [subject, form, searchTerm]);

  return (
    <div className="space-y-4">
      
      {/* Paparan Pilihan Semasa / Ruangan Pengisian Manual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Kotak Standard Kandungan (SK) - Pengisian Manual & DSKP */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{labels['STANDARD KANDUNGAN'] || 'STANDARD KANDUNGAN'}</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
              Boleh Ditaip / Diedit Manual
            </span>
          </label>
          <textarea
            value={selectedSK}
            onChange={(e) => onSKChange && onSKChange(e.target.value)}
            readOnly={!onSKChange}
            rows={3}
            placeholder={isRTL ? 'اكتب معيار المحتوى هنا أو اختر من DSKP...' : 'Taip Standard Kandungan secara manual atau pilih dari senarai DSKP...'}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:bg-white resize-none leading-relaxed"
          />
        </div>

        {/* Kotak Standard Pembelajaran (SP) - Pengisian Manual & DSKP */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{labels['STANDARD PEMBELAJARAN'] || 'STANDARD PEMBELAJARAN'}</span>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold hidden sm:inline">
                Manual / DSKP
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isOpen ? 'Tutup Senarai' : 'Cari dalam DSKP'}</span>
              </button>
            </div>
          </label>
          <textarea
            value={selectedSP}
            onChange={(e) => onSPChange && onSPChange(e.target.value)}
            readOnly={!onSPChange}
            rows={3}
            placeholder={isRTL ? 'اكتب معيار التعلم هنا أو اختر من بنك DSKP...' : 'Taip Standard Pembelajaran secara manual atau pilih dari bank DSKP...'}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:bg-white resize-none leading-relaxed"
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
