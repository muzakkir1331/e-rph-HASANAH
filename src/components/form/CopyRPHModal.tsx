'use client';

import React from 'react';
import { X, Copy, ArrowRight, Check, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { JadualSlot } from '@/types/erph';

interface CopyRPHModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: string;
  currentClass: string;
  currentDay: string;
  timetable: JadualSlot[];
  selectedSlotIndex: number;
  onSelectTargetSlot: (slotIndex: number) => void;
}

export default function CopyRPHModal({
  isOpen,
  onClose,
  currentSubject,
  currentClass,
  currentDay,
  timetable,
  selectedSlotIndex,
  onSelectTargetSlot
}: CopyRPHModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                Salin RPH ke Jadual Kelas Lain
              </h3>
              <p className="text-xs text-slate-500">
                Gandakan kandungan e-RPH semasa ke mana-mana jadual kelas yang berbeza
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Maklumat RPH Asal yang Disalin */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">RPH SUMBER (SEDANG DISALIN):</span>
            <div className="font-extrabold text-sm text-slate-900 mt-0.5">{currentSubject}</div>
            <div className="text-slate-600 font-medium mt-0.5">
              {currentClass} &bull; {currentDay}
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shadow-sm">
            Disalin
          </span>
        </div>

        {/* Senarai Slot Sasaran */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Pilih Jadual Kelas Sasaran Untuk Ditampal:
          </label>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {timetable.map((slot, idx) => {
              const isCurrent = idx === selectedSlotIndex;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (!isCurrent) {
                      onSelectTargetSlot(idx);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                      : 'bg-white hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-400 text-slate-800 cursor-pointer shadow-sm hover:shadow'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isCurrent ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {slot.slot_ke}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900">{slot.kelas}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {slot.hari}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {slot.subjek} &bull; {slot.masa_mula} - {slot.masa_tamat}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-2 py-1 rounded-md">
                        Kelas Semasa
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors">
                        <span>Tampal Ke Sini</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px]">
            Nota: Kelas &amp; masa slot sasaran dikekalkan secara automatik.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
