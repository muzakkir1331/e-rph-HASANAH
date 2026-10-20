'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Check, RotateCcw, Clock, BookOpen, Users, AlertCircle, Cloud, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { JadualSlot } from '@/types/erph';
import dskpCatalog from '@/data/dskp_catalog.json';
import pedagogiOptions from '@/data/pedagogi_options.json';

interface TimetableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimetableEditorModal({ isOpen, onClose }: TimetableEditorModalProps) {
  const { timetable, addSlot, updateSlot, deleteSlot, resetTimetable, teacherName, teacherEmail, cloudSyncStatus } = useAuth();
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [activeDayFilter, setActiveDayFilter] = useState<string>('SEMUA');

  // Form State untuk Tambah / Edit Slot
  const [formDay, setFormDay] = useState<string>('ISNIN');
  const [formSlotNum, setFormSlotNum] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('09:00 PAGI');
  const [formEndTime, setFormEndTime] = useState<string>('10:00 PAGI');
  const [formSubject, setFormSubject] = useState<string>('اللغة العربية المعاصرة');
  const [formTingkatan, setFormTingkatan] = useState<string>('3');
  const [formKelas, setFormKelas] = useState<string>('3 MUSLIM');
  const [formMurid, setFormMurid] = useState<number>(30);

  if (!isOpen) return null;

  const days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
  const dayIndices: Record<string, number> = {
    'ISNIN': 1,
    'SELASA': 2,
    'RABU': 3,
    'KHAMIS': 4,
    'JUMAAT': 5
  };

  const primarySubjects = [
    'أصول الدين',
    'اللغة العربية المعاصرة',
    'الشريعة اسلامية',
    'الأدب والبلاغة',
    'مناهج العلوم إسلامية',
    'Bahasa Arab',
    'Bahasa Melayu',
    'Bahasa Inggeris',
    'Sains',
    'Matematik',
    'Perniagaan',
    'PJPK',
    'Pendidikan Seni Visual',
    'Geografi'
  ];
  const subjectList = Array.from(new Set([...primarySubjects, ...Object.keys(dskpCatalog)])).sort();

  const handleStartEdit = (index: number) => {
    const slot = timetable[index];
    if (!slot) return;
    setEditingIndex(index);
    setIsAddingNew(false);
    setFormDay(slot.hari);
    setFormSlotNum(slot.slot_ke);
    setFormStartTime(slot.masa_mula);
    setFormEndTime(slot.masa_tamat);
    setFormSubject(slot.subjek);
    setFormTingkatan(slot.tingkatan);
    setFormKelas(slot.kelas);
    setFormMurid(slot.bilangan_murid || 30);
  };

  const handleStartAdd = () => {
    setEditingIndex(null);
    setIsAddingNew(true);
    setFormDay(activeDayFilter === 'SEMUA' ? 'ISNIN' : activeDayFilter);
    setFormSlotNum(timetable.filter(s => s.hari === (activeDayFilter === 'SEMUA' ? 'ISNIN' : activeDayFilter)).length + 1);
    setFormStartTime('08:00 PAGI');
    setFormEndTime('09:00 PAGI');
    setFormSubject('اللغة العربية المعاصرة');
    setFormTingkatan('3');
    setFormKelas('3 MUSLIM');
    setFormMurid(30);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: JadualSlot = {
      tahun_akademik: 2026,
      hari: formDay,
      hari_index: dayIndices[formDay] || 1,
      slot_ke: formSlotNum,
      masa_mula: formStartTime,
      masa_tamat: formEndTime,
      subjek: formSubject,
      tingkatan: formTingkatan,
      kelas: formKelas,
      bilangan_murid: formMurid
    };

    if (editingIndex !== null) {
      updateSlot(editingIndex, newSlot);
      setEditingIndex(null);
    } else if (isAddingNew) {
      addSlot(newSlot);
      setIsAddingNew(false);
    }
  };

  const filteredSlots = activeDayFilter === 'SEMUA'
    ? timetable
    : timetable.filter(s => s.hari === activeDayFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Clock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base">Ubah Suai Jadual Waktu Mengajar</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-emerald-100 rounded-md flex items-center space-x-1" title="Data disimpan dalam profil awan masing-masing">
                  <Cloud className="w-3 h-3" />
                  <span>Profil Cloud DeLIMA</span>
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Disimpan dalam profil cloud peribadi guru: <span className="font-semibold">{teacherEmail || teacherName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Bar Tindakan & Tapis Hari */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              {['SEMUA', ...days].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDayFilter(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeDayFilter === day
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Waktu Mengajar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Adakah anda pasti ingin memulihkan jadual waktu asal SMA Al-Hasanah?')) {
                    resetTimetable();
                  }
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium flex items-center space-x-1"
                title="Pulihkan Jadual Lalai"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Borang Tambah / Edit Slot Terpilih */}
          {(isAddingNew || editingIndex !== null) && (
            <form onSubmit={handleSaveSlot} className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                  {editingIndex !== null ? `Kemaskini Slot Mengajar #${formSlotNum}` : 'Tambah Slot Mengajar Baharu'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setIsAddingNew(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Hari</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Slot Ke-</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formSlotNum}
                    onChange={(e) => setFormSlotNum(parseInt(e.target.value) || 1)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Masa Mula</label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="Contoh: 08.00 PAGI"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Masa Tamat</label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="Contoh: 09.30 PAGI"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Mata Pelajaran (236 Subjek DSKP)
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {subjectList.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tingkatan</label>
                  <select
                    value={formTingkatan}
                    onChange={(e) => setFormTingkatan(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {['1', '2', '3', '4', '5', '6', 'Peralihan'].map(t => (
                      <option key={t} value={t}>Tingkatan {t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Kelas</label>
                  <input
                    type="text"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    placeholder="Contoh: 3 MUSLIM"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setIsAddingNew(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          )}

          {/* Senarai Slot Semasa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Menunjukkan {filteredSlots.length} waktu mengajar</span>
              <span>Klik mana-mana slot untuk mengedit maklumat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredSlots.map((slot, idx) => {
                const globalIndex = timetable.findIndex(s => s === slot);
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 hover:border-emerald-400 p-3.5 rounded-2xl shadow-xs transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase">
                          {slot.hari} (Slot {slot.slot_ke})
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700">
                          {slot.masa_mula} &ndash; {slot.masa_tamat}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                        {slot.subjek}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Kelas: <span className="font-semibold text-slate-700">{slot.kelas}</span> &bull; Tingkatan {slot.tingkatan}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(globalIndex)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                        title="Edit Slot"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Padam waktu mengajar ${slot.subjek} (${slot.hari})?`)) {
                            deleteSlot(globalIndex);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 flex items-center justify-center transition-colors"
                        title="Padam Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Jadual disimpan secara automatik dan disegerakkan dengan borang e-RPH harian.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
