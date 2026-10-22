'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, BookOpen, Clock, Lightbulb } from 'lucide-react';
import { GeminiCoPilotRequest, GeminiCoPilotResponse } from '@/types/erph';
import pedagogiData from '@/data/pedagogi_options.json';

interface AICoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (content: GeminiCoPilotResponse) => void;
  subject: string;
  form: string;
  languageCode: string;
  sk: string;
  sp: string;
  rptActivitySuggestion?: string;
  isRTL: boolean;
}

import { useAuth } from '@/context/AuthContext';

export default function AICoPilotModal({
  isOpen,
  onClose,
  onApply,
  subject,
  form,
  languageCode,
  sk,
  sp,
  rptActivitySuggestion,
  isRTL
}: AICoPilotModalProps) {
  const { planType, aiCreditsRemaining, deductAICredit, setIsUpgradeModalOpen } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPAK21, setSelectedPAK21] = useState('Think-Pair-Share');
  const [selectedIThink, setSelectedIThink] = useState('Peta Buih');
  const [selectedBBM, setSelectedBBM] = useState('Lembaran kerja, LCD Projector');
  const [duration, setDuration] = useState(60);
  const [generatedResult, setGeneratedResult] = useState<GeminiCoPilotResponse | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await deductAICredit(1);

      const payload: GeminiCoPilotRequest = {
        subjek: subject,
        tingkatan: form,
        kod_bahasa: languageCode,
        sk,
        sp,
        cadangan_aktiviti_rpt: rptActivitySuggestion,
        pilihan_pedagogi: {
          pak21: selectedPAK21,
          ithink: selectedIThink,
          bbm: selectedBBM,
          durasi_minit: duration
        }
      };

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setGeneratedResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (generatedResult) {
      onApply(generatedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">Co-Pilot Gemini AI</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full uppercase tracking-wider">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Penjana Objektif SMART &amp; 5 Langkah Aktiviti PdPc (Bahasa: {languageCode.toUpperCase()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Ringkasan Konteks Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Kandungan</span>
              <p className="font-medium text-slate-800 line-clamp-2 mt-0.5">{sk || 'Belum dipilih'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Pembelajaran</span>
              <p className="font-medium text-slate-800 line-clamp-2 mt-0.5">{sp || 'Belum dipilih'}</p>
            </div>
            {rptActivitySuggestion && (
              <div className="md:col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Cadangan Aktiviti RPT Luaran</span>
                <p className="text-slate-700 mt-0.5 font-medium">{rptActivitySuggestion}</p>
              </div>
            )}
          </div>

          {/* Konfigurasi Pilihan Pedagogi AI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Strategi PAK-21</label>
              <select
                value={selectedPAK21}
                onChange={(e) => setSelectedPAK21(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Think-Pair-Share">Think-Pair-Share</option>
                <option value="Round Robin">Round Robin</option>
                <option value="Rally Table">Rally Table</option>
                <option value="Gallery Walk">Gallery Walk</option>
                <option value="Hot Seat">Hot Seat</option>
                <option value="Mix-N-Match">Mix-N-Match</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Peta I-Think</label>
              <select
                value={selectedIThink}
                onChange={(e) => setSelectedIThink(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Peta Bulatan">Peta Bulatan</option>
                <option value="Peta Buih">Peta Buih</option>
                <option value="Peta Buih Berganda">Peta Buih Berganda</option>
                <option value="Peta Pokok">Peta Pokok</option>
                <option value="Peta Alir">Peta Alir</option>
                <option value="Peta Dakap">Peta Dakap</option>
                <option value="Peta Titi">Peta Titi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tempoh PdPc</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value={30}>30 Minit (1 Waktu)</option>
                <option value={60}>60 Minit (2 Waktu)</option>
                <option value={90}>90 Minit (3 Waktu)</option>
              </select>
            </div>
          </div>

          {/* Butang Trigger Jana AI */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !sp}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Sedang Merangka dengan Gemini 3.8 Flash...' : 'Jana Objektif & 5 Langkah PdPc Sekarang'}</span>
            </button>
          </div>

          {/* Paparan Hasil Jana AI */}
          {generatedResult && (
            <div className={`mt-6 space-y-4 pt-6 border-t border-slate-200 animate-in fade-in ${isRTL ? 'text-right' : 'text-left'}`}>
              
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide block">
                  🎯 Objektif Pembelajaran (SMART / ABCD):
                </span>
                <p className="text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                  {generatedResult.objektif_pembelajaran}
                </p>

                {generatedResult.kriteria_kejayaan && (
                  <div className="pt-2 border-t border-emerald-200/60 mt-2">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                      Kriteria Kejayaan (Success Criteria):
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-line mt-0.5">
                      {generatedResult.kriteria_kejayaan}
                    </p>
                  </div>
                )}
              </div>

              {/* 5 Langkah Aktiviti PdPc */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block">
                  📝 Cadangan 5 Langkah Aktiviti PdPc Terperinci:
                </span>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-emerald-700 block mb-0.5">Set Induksi (5 Minit)</span>
                    <p className="text-slate-700">{generatedResult.aktiviti.set_induksi}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-emerald-700 block mb-0.5">Langkah 1: Penerangan Konsep Asas (15 Minit)</span>
                    <p className="text-slate-700">{generatedResult.aktiviti.langkah_1}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-teal-700 block mb-0.5">Langkah 2: Aktiviti Kolaboratif Murid - PAK-21 (20 Minit)</span>
                    <p className="text-slate-700">{generatedResult.aktiviti.langkah_2}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-emerald-700 block mb-0.5">Langkah 3: Pengukuhan &amp; Pentaksiran Formatif (15 Minit)</span>
                    <p className="text-slate-700">{generatedResult.aktiviti.langkah_3}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-emerald-700 block mb-0.5">Penutup: Rumusan Kognitif &amp; Afektif (5 Minit)</span>
                    <p className="text-slate-700">{generatedResult.aktiviti.penutup}</p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Batal
          </button>

          {generatedResult && (
            <button
              type="button"
              onClick={handleApplyToForm}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Kandungan AI ke Borang e-RPH</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
