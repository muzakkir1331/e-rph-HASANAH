'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  Search,
  Check,
  X,
  Sparkles,
  Filter,
  Edit3,
  ListFilter,
  HelpCircle
} from 'lucide-react';
import { getTemaAndTajuk, resolveDSKPSubject } from '@/lib/dskp-topics';

interface TemaTajukSelectorProps {
  subject: string;
  form: string;
  selectedTema: string;
  selectedTajuk: string;
  onTemaChange: (tema: string) => void;
  onTajukChange: (tajuk: string) => void;
  isRTL: boolean;
  labels: Record<string, string>;
}

export default function TemaTajukSelector({
  subject,
  form,
  selectedTema,
  selectedTajuk,
  onTemaChange,
  onTajukChange,
  isRTL,
  labels
}: TemaTajukSelectorProps) {
  // Ambil data kurikulum tema & tajuk mengikut subjek dan tingkatan
  const curriculum = useMemo(() => {
    return getTemaAndTajuk(subject, form);
  }, [subject, form]);

  const { canonicalSubject, temas, tajuks: allTajuks, temaToTajuk } = curriculum;

  // Mod paparan: 'dropdown' atau 'manual'
  const [temaMode, setTemaMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [tajukMode, setTajukMode] = useState<'dropdown' | 'manual'>('dropdown');

  // Status popover terbuka (khusus untuk mobile & tablet)
  const [isTemaOpen, setIsTemaOpen] = useState(false);
  const [isTajukOpen, setIsTajukOpen] = useState(false);

  // Carian kata kunci dalam dropdown
  const [searchTema, setSearchTema] = useState('');
  const [searchTajuk, setSearchTajuk] = useState('');

  // Pilihan penapisan tajuk mengikut tema terpilih
  const [filterTajukByTema, setFilterTajukByTema] = useState(true);

  // Ref untuk klik di luar dropdown (desktop)
  const temaRef = useRef<HTMLDivElement>(null);
  const tajukRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown bila pengguna klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (temaRef.current && !temaRef.current.contains(event.target as Node)) {
        setIsTemaOpen(false);
      }
      if (tajukRef.current && !tajukRef.current.contains(event.target as Node)) {
        setIsTajukOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tajuk yang ditapis berdasarkan tema yang dipilih (jika penapisan diaktifkan)
  const availableTajuks = useMemo(() => {
    if (filterTajukByTema && selectedTema && temaToTajuk[selectedTema.trim()]) {
      const mapped = temaToTajuk[selectedTema.trim()];
      if (mapped && mapped.length > 0) return mapped;
    }
    return allTajuks;
  }, [filterTajukByTema, selectedTema, temaToTajuk, allTajuks]);

  // Tapis senarai tema mengikut carian
  const filteredTemas = useMemo(() => {
    if (!searchTema.trim()) return temas;
    const q = searchTema.toLowerCase();
    return temas.filter(t => t.toLowerCase().includes(q));
  }, [temas, searchTema]);

  // Tapis senarai tajuk mengikut carian
  const filteredTajuks = useMemo(() => {
    if (!searchTajuk.trim()) return availableTajuks;
    const q = searchTajuk.toLowerCase();
    return availableTajuks.filter(t => t.toLowerCase().includes(q));
  }, [availableTajuks, searchTajuk]);

  // Label tajuk seksyen
  const labelTema = labels['TEMA/BIDANG/TERAS'] || labels['TEMA / BIDANG'] || 'TEMA / BIDANG / TERAS';
  const labelTajuk = labels['TAJUK/KEMAHIRAN/NILAITERAS'] || labels['TAJUK / UNIT / BAB'] || labels['TAJUK'] || 'TAJUK / KEMAHIRAN / NILAI TERAS';

  // Bilangan tajuk yang sepadan dengan tema aktif
  const temaHasMappedTajuks = Boolean(selectedTema && temaToTajuk[selectedTema.trim()]?.length);

  return (
    <div className="space-y-4">
      {/* Header Seksyen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{labelTema} &amp; {labelTajuk}</span>
        </h3>
        <div className="flex items-center gap-2">
          {canonicalSubject ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>DSKP: {canonicalSubject} (T{curriculum.normalizedForm})</span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Pengisian Manual (Tiada Rekod DSKP)
            </span>
          )}
        </div>
      </div>

      {/* Grid 2 Komponen: Responsif Telefon (1 Lajur) & Tablet/Desktop (2 Lajur) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* ===================================================================== */}
        {/* KOMPONEN 1: TEMA / BIDANG / TERAS */}
        {/* ===================================================================== */}
        <div 
          ref={temaRef}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all flex flex-col justify-between"
        >
          {/* Bar Label Atas */}
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>{labelTema}</span>
            </label>

            {/* Kawalan Mod: Dropdown vs Manual */}
            <div className="flex items-center gap-1.5">
              {temas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTemaMode(m => m === 'dropdown' ? 'manual' : 'dropdown')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                  title="Tukar antara mod pilihan dropdown dan taip manual"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>{temaMode === 'dropdown' ? 'Taip Manual' : 'Pilih Dropdown'}</span>
                </button>
              )}
              {selectedTema && (
                <button
                  type="button"
                  onClick={() => onTemaChange('')}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                  title="Padam pilihan tema"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Kotak Pilihan Dropdown TEMA */}
          {temaMode === 'dropdown' && temas.length > 0 ? (
            <div className="relative">
              {/* Butang Pencetus Dropdown Mesra Telefon & Tablet */}
              <button
                type="button"
                onClick={() => {
                  setIsTemaOpen(prev => !prev);
                  setIsTajukOpen(false);
                }}
                className={`w-full min-h-[46px] p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  selectedTema
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex-1 truncate">
                  {selectedTema ? (
                    <span className="block truncate text-slate-800 font-bold">
                      {selectedTema}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {isRTL ? 'اختر الموضوع / المجال من القائمة...' : 'Pilih Tema / Bidang / Teras dari senarai DSKP...'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
                    {temas.length} Tema
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTemaOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </div>
              </button>

              {/* Panel Menu Dropdown / Popover (Mesra Skrin Sentuh Telefon & Tablet) */}
              {isTemaOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-emerald-500/40 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  
                  {/* Kotak Carian Pantas */}
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchTema}
                      onChange={(e) => setSearchTema(e.target.value)}
                      placeholder="Cari tema / bidang..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                    {searchTema && (
                      <button
                        type="button"
                        onClick={() => setSearchTema('')}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Senarai Pilihan Tema */}
                  <div className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                    {filteredTemas.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Tiada tema sepadan dengan carian.
                      </div>
                    ) : (
                      filteredTemas.map((temaItem, idx) => {
                        const isSelected = selectedTema === temaItem;
                        const tajukCount = temaToTajuk[temaItem.trim()]?.length || 0;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onTemaChange(temaItem);
                              setIsTemaOpen(false);
                              setSearchTema('');
                            }}
                            className={`w-full min-h-[44px] p-3 rounded-xl text-xs cursor-pointer flex items-center justify-between gap-2 text-left transition-colors touch-manipulation active:scale-[0.99] ${
                              isSelected
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'hover:bg-emerald-50/80 active:bg-emerald-100 text-slate-800'
                            }`}
                          >
                            <span className="flex-1 leading-snug break-words">
                              {temaItem}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {tajukCount > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  isSelected ? 'bg-emerald-700/60 text-emerald-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {tajukCount} tajuk
                                </span>
                              )}
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Tukar ke Taip Manual */}
                  <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      {filteredTemas.length} daripada {temas.length} tema
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTemaMode('manual');
                        setIsTemaOpen(false);
                      }}
                      className="text-emerald-700 hover:underline font-semibold"
                    >
                      Taip tema sendiri &rarr;
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            /* Ruangan Pengisian / Suntingan Manual */
            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={selectedTema}
                onChange={(e) => onTemaChange(e.target.value)}
                placeholder={isRTL ? 'اكتب الموضوع / المجال هنا...' : 'Taip Tema / Bidang / Teras secara manual di sini...'}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
              />
              {temas.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setTemaMode('dropdown')}
                    className="text-[10px] text-emerald-700 font-semibold hover:underline"
                  >
                    &larr; Pilih semula dari senarai DSKP ({temas.length} tema tersedia)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Paparan Pilihan Terpilih (Kecil di bahagian bawah jika dalam mod dropdown) */}
          {temaMode === 'dropdown' && selectedTema && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">
                <span className="font-semibold text-emerald-700">Terpilih:</span> {selectedTema}
              </span>
              <button
                type="button"
                onClick={() => setTemaMode('manual')}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium underline flex-shrink-0 ml-2"
              >
                Sunting Teks
              </button>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* KOMPONEN 2: TAJUK / KEMAHIRAN / NILAITERAS */}
        {/* ===================================================================== */}
        <div 
          ref={tajukRef}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all flex flex-col justify-between"
        >
          {/* Bar Label Atas */}
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-teal-600" />
              <span>{labelTajuk}</span>
            </label>

            {/* Kawalan Mod: Dropdown vs Manual */}
            <div className="flex items-center gap-1.5">
              {allTajuks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTajukMode(m => m === 'dropdown' ? 'manual' : 'dropdown')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1"
                  title="Tukar antara mod pilihan dropdown dan taip manual"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>{tajukMode === 'dropdown' ? 'Taip Manual' : 'Pilih Dropdown'}</span>
                </button>
              )}
              {selectedTajuk && (
                <button
                  type="button"
                  onClick={() => onTajukChange('')}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                  title="Padam pilihan tajuk"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Kotak Pilihan Dropdown TAJUK */}
          {tajukMode === 'dropdown' && allTajuks.length > 0 ? (
            <div className="relative">
              {/* Butang Pencetus Dropdown Mesra Telefon & Tablet */}
              <button
                type="button"
                onClick={() => {
                  setIsTajukOpen(prev => !prev);
                  setIsTemaOpen(false);
                }}
                className={`w-full min-h-[46px] p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  selectedTajuk
                    ? 'bg-teal-50/70 border-teal-300 text-slate-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex-1 truncate">
                  {selectedTajuk ? (
                    <span className="block truncate text-slate-800 font-bold">
                      {selectedTajuk}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {isRTL ? 'اختر عنوان الدرس / المهارة من القائمة...' : 'Pilih Tajuk / Kemahiran / Nilai Teras dari senarai DSKP...'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-white text-teal-700 border border-teal-200 shadow-2xs">
                    {availableTajuks.length} Tajuk
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTajukOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </div>
              </button>

              {/* Panel Menu Dropdown / Popover (Mesra Skrin Sentuh Telefon & Tablet) */}
              {isTajukOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-teal-500/40 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  
                  {/* Penapis Kaskad Mengikut Tema (Jika ada tema aktif) */}
                  {temaHasMappedTajuks && (
                    <div className="p-2 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1 truncate">
                        <Filter className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">Ditapis mengikut Tema semasa</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFilterTajukByTema(f => !f)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs flex-shrink-0"
                      >
                        {filterTajukByTema ? `Lihat Semua (${allTajuks.length})` : 'Tapis Tema'}
                      </button>
                    </div>
                  )}

                  {/* Kotak Carian Pantas */}
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchTajuk}
                      onChange={(e) => setSearchTajuk(e.target.value)}
                      placeholder="Cari tajuk / bab / kemahiran..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      autoFocus
                    />
                    {searchTajuk && (
                      <button
                        type="button"
                        onClick={() => setSearchTajuk('')}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Senarai Pilihan Tajuk */}
                  <div className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                    {filteredTajuks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Tiada tajuk sepadan dengan carian.
                      </div>
                    ) : (
                      filteredTajuks.map((tajukItem, idx) => {
                        const isSelected = selectedTajuk === tajukItem;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onTajukChange(tajukItem);
                              setIsTajukOpen(false);
                              setSearchTajuk('');
                            }}
                            className={`w-full min-h-[44px] p-3 rounded-xl text-xs cursor-pointer flex items-center justify-between gap-2 text-left transition-colors touch-manipulation active:scale-[0.99] ${
                              isSelected
                                ? 'bg-teal-600 text-white font-bold'
                                : 'hover:bg-teal-50/80 active:bg-teal-100 text-slate-800'
                            }`}
                          >
                            <span className="flex-1 leading-snug break-words">
                              {tajukItem}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Tukar ke Taip Manual */}
                  <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      {filteredTajuks.length} daripada {availableTajuks.length} tajuk
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTajukMode('manual');
                        setIsTajukOpen(false);
                      }}
                      className="text-teal-700 hover:underline font-semibold"
                    >
                      Taip tajuk sendiri &rarr;
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            /* Ruangan Pengisian / Suntingan Manual */
            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={selectedTajuk}
                onChange={(e) => onTajukChange(e.target.value)}
                placeholder={isRTL ? 'اكتب عنوان الدرس / المهارة هنا...' : 'Taip Tajuk / Kemahiran / Nilai Teras secara manual di sini...'}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 resize-none leading-relaxed"
              />
              {allTajuks.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setTajukMode('dropdown')}
                    className="text-[10px] text-teal-700 font-semibold hover:underline"
                  >
                    &larr; Pilih semula dari senarai DSKP ({allTajuks.length} tajuk tersedia)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Paparan Pilihan Terpilih (Kecil di bahagian bawah jika dalam mod dropdown) */}
          {tajukMode === 'dropdown' && selectedTajuk && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">
                <span className="font-semibold text-teal-700">Terpilih:</span> {selectedTajuk}
              </span>
              <button
                type="button"
                onClick={() => setTajukMode('manual')}
                className="text-[10px] text-teal-600 hover:text-teal-700 font-medium underline flex-shrink-0 ml-2"
              >
                Sunting Teks
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
