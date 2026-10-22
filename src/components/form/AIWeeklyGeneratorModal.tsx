'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  Layers,
  Bot,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { JadualSlot, RPHRecord, GeminiCoPilotRequest, GeminiCoPilotResponse } from '@/types/erph';
import { findRPTRecord, takwimData } from '@/lib/rpt-helper';
import { getSubjectLocale } from '@/lib/dictionary';
import { useAuth } from '@/context/AuthContext';

interface AIWeeklyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: JadualSlot[];
  currentWeek: number;
  weekDates: Record<string, string>;
  mondayDate: string;
  onApplyWeeklyRPH: (generatedRecords: Record<string, RPHRecord>) => void;
  existingRecords: Record<string, RPHRecord>;
}

export default function AIWeeklyGeneratorModal({
  isOpen,
  onClose,
  timetable,
  currentWeek,
  weekDates,
  mondayDate,
  onApplyWeeklyRPH,
  existingRecords
}: AIWeeklyGeneratorModalProps) {
  const { planType, aiCreditsRemaining, deductAICredit, setIsUpgradeModalOpen } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek || 1);
  const [selectedSlotIndexes, setSelectedSlotIndexes] = useState<number[]>(() =>
    timetable.map((_, idx) => idx)
  );

  // Tetapan Pedagogi Global
  const [selectedPAK21, setSelectedPAK21] = useState<string>('Dinamik');
  const [selectedIThink, setSelectedIThink] = useState<string>('Dinamik');
  const [selectedBBM, setSelectedBBM] = useState<string>('Buku Teks, Lembaran Kerja & LCD Projector');

  // Keadaan Penjanaan
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [currentSlotProcessing, setCurrentSlotProcessing] = useState<string>('');
  const [slotStatusMap, setSlotStatusMap] = useState<Record<number, 'idle' | 'generating' | 'done' | 'error'>>({});
  const [generatedRecords, setGeneratedRecords] = useState<Record<string, RPHRecord>>({});
  const [expandedPreviewIndex, setExpandedPreviewIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const pak21List = [
    'Think-Pair-Share',
    'Round Robin',
    'Gallery Walk',
    'Hot Seat',
    'Rally Table',
    'Mix-N-Match',
    'Jigsaw',
    'Pembentangan Kumpulan'
  ];

  const ithinkList = [
    'Peta Buih',
    'Peta Bulatan',
    'Peta Alir',
    'Peta Pokok',
    'Peta Dakap',
    'Peta Buih Berganda'
  ];

  const teachingWeeks = takwimData.filter(t => !t.adalah_cuti && t.minggu_ke !== null);

  // Toggle pilihan slot
  const handleToggleSlot = (idx: number) => {
    if (isGenerating) return;
    setSelectedSlotIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (isGenerating) return;
    setSelectedSlotIndexes(timetable.map((_, idx) => idx));
  };

  const handleDeselectAll = () => {
    if (isGenerating) return;
    setSelectedSlotIndexes([]);
  };

  // Fungsi mengira durasi minit berdasarkan masa mula dan tamat
  const calculateDuration = (start: string, end: string): number => {
    try {
      const parseTime = (t: string) => {
        const clean = t.replace(/[^\d:.]/g, '').replace('.', ':');
        const [hStr, mStr] = clean.split(':');
        let h = parseInt(hStr, 10) || 0;
        const m = parseInt(mStr, 10) || 0;
        const isPM = /PTG|PETANG|PM/i.test(t);
        if (isPM && h < 12) h += 12;
        return h * 60 + m;
      };
      const diff = parseTime(end) - parseTime(start);
      return diff > 0 && diff <= 180 ? diff : 60;
    } catch {
      return 60;
    }
  };

  // Mula menjana RPH untuk semua slot yang dipilih
  const handleStartWeeklyGeneration = async () => {
    if (selectedSlotIndexes.length === 0) return;

    if (planType === 'free' && aiCreditsRemaining <= 0) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setProgressCount(0);
    const newStatusMap: Record<number, 'idle' | 'generating' | 'done' | 'error'> = {};
    selectedSlotIndexes.forEach(idx => {
      newStatusMap[idx] = 'idle';
    });
    setSlotStatusMap(newStatusMap);

    const accumulatedRecords: Record<string, RPHRecord> = { ...generatedRecords };

    for (let i = 0; i < selectedSlotIndexes.length; i++) {
      if (planType === 'free') {
        const creditRes = await deductAICredit(1);
        if (!creditRes.success && !creditRes.isPro) {
          setIsUpgradeModalOpen(true);
          break;
        }
      }

      const slotIndex = selectedSlotIndexes[i];
      const slot = timetable[slotIndex];
      if (!slot) continue;

      const slotDay = (slot.hari || '').toUpperCase();
      const slotDate = weekDates[slotDay] || mondayDate || new Date().toISOString().split('T')[0];
      const slotKey = `week_${selectedWeek}_slot_${slotIndex}`;

      setSlotStatusMap(prev => ({ ...prev, [slotIndex]: 'generating' }));
      setCurrentSlotProcessing(`Slot ${slot.slot_ke} (${slot.hari}): ${slot.subjek} - ${slot.kelas}`);

      // Dapatkan maklumat kurikulum daripada RPT atau DSKP
      const rptRec = findRPTRecord(slot.subjek, slot.tingkatan, selectedWeek);
      const subjectLocale = getSubjectLocale(slot.subjek);
      const langCode = subjectLocale.kod_bahasa;
      const isArabic = langCode === 'ar' || /[\u0600-\u06FF]/.test(slot.subjek);
      const isEnglish = langCode === 'en' || slot.subjek.toUpperCase().includes('ENGLISH');

      // Tentukan strategi PAK-21 & I-Think
      const pak21 = selectedPAK21 === 'Dinamik'
        ? pak21List[i % pak21List.length]
        : selectedPAK21;
      const ithink = selectedIThink === 'Dinamik'
        ? ithinkList[i % ithinkList.length]
        : selectedIThink;

      const durasiMinit = calculateDuration(slot.masa_mula, slot.masa_tamat);

      const requestPayload: GeminiCoPilotRequest = {
        subjek: slot.subjek,
        tingkatan: slot.tingkatan,
        kod_bahasa: langCode,
        sk: rptRec?.sk || (isArabic ? 'معيار المحتوى الرسمي' : 'Standard Kandungan KPM'),
        sp: rptRec?.sp || (isArabic ? 'معيار التعلم الرسمي' : 'Standard Pembelajaran KPM'),
        cadangan_aktiviti_rpt: rptRec?.catatan,
        pilihan_pedagogi: {
          pak21,
          ithink,
          bbm: selectedBBM,
          durasi_minit: durasiMinit
        }
      };

      try {
        const response = await fetch('/api/ai/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        let aiResult: GeminiCoPilotResponse;
        if (response.ok) {
          aiResult = await response.json();
        } else {
          throw new Error('Fallback diperlukan');
        }

        const totalStudents = slot.bilangan_murid || 30;
        const achieveCount = Math.round(totalStudents * 0.88);

        const fullRecord: RPHRecord = {
          id: slotKey,
          jadual_id: slot.id || `slot_${slotIndex}`,
          tahun_akademik: 2027,
          minggu_ke: selectedWeek,
          tarikh: slotDate,
          hari: slot.hari,
          masa_mula: slot.masa_mula,
          masa_tamat: slot.masa_tamat,
          tingkatan: slot.tingkatan,
          kelas: slot.kelas,
          subjek: slot.subjek,
          kod_bahasa: langCode,
          arah_teks: isArabic ? 'rtl' : 'ltr',

          tema: rptRec?.tema || (isArabic ? 'المحتوى الدراسي المعتمد' : 'Standard Kurikulum DSKP'),
          tajuk: rptRec?.label_minggu || rptRec?.tema || `Minggu ${selectedWeek}`,
          sk: rptRec?.sk || (isArabic ? 'معيار المحتوى' : 'Standard Kandungan KPM'),
          sp: rptRec?.sp || (isArabic ? 'معيار التعلم' : 'Standard Pembelajaran KPM'),

          objektif_pembelajaran: aiResult.objektif_pembelajaran,
          kriteria_kejayaan: aiResult.kriteria_kejayaan,

          aktiviti: {
            set_induksi: aiResult.aktiviti?.set_induksi || '(5 minit) Set induksi dan rangsangan topik.',
            langkah_1: aiResult.aktiviti?.langkah_1 || '(15 minit) Penerangan konsep utama.',
            langkah_2: aiResult.aktiviti?.langkah_2 || `(20 minit) Aktiviti kolaboratif berpusatkan murid (${pak21}).`,
            langkah_3: aiResult.aktiviti?.langkah_3 || '(15 minit) Latihan pengukuhan & penilaian formatif.',
            penutup: aiResult.aktiviti?.penutup || '(5 minit) Rumusan kognitif dan refleksi kendiri murid.'
          },

          pedagogi: {
            bbm: selectedBBM.split(',').map(s => s.trim()),
            emk: ['Bahasa', 'Nilai Murni', 'Kreativiti & Inovasi'],
            nilai_murni: ['Bekerjasama', 'Kasih Sayang', 'Menghormati'],
            peta_ithink: [ithink],
            kecerdasan_pelbagai: ['Verbal Linguistik', 'Interpersonal'],
            kaedah: ['Inkuiri Penemuan', 'Perbincangan'],
            strategi: [pak21, 'Pendekatan Berpusatkan Murid'],
            alat_pemikiran_pak21: [pak21],
            pentaksiran: [rptRec?.standard_prestasi || 'Latihan Bertulis & Pentaksiran Formatif']
          },

          refleksi: {
            pdp_dijalankan: true,
            sebab_tidak_dijalankan: '',
            bawa_ke_kelas_seterusnya: false,
            objektif_disalin: aiResult.cadangan_refleksi || (isArabic
              ? 'حقق معظم الطلاب أهداف الدرس بنjاح وتم إعطاء تدريبات إضافية.'
              : isEnglish
              ? 'Most pupils successfully achieved the stated learning objectives.'
              : 'Majoriti murid berjaya mencapai objektif pembelajaran yang ditetapkan.'),
            bilangan_murid_hadir: totalStudents,
            bilangan_murid_mencapai: achieveCount,
            peratus_mencapai: Math.round((achieveCount / totalStudents) * 100),
            intervensi_diperlukan: false,
            pilihan_intervensi: '',
            catatan_tambahan: ''
          },

          adalah_ditangguhkan: false,
          adalah_carry_forward: false,
          status: 'SELESAI',
          updated_at: new Date().toISOString()
        };

        accumulatedRecords[slotKey] = fullRecord;
        setGeneratedRecords({ ...accumulatedRecords });
        setSlotStatusMap(prev => ({ ...prev, [slotIndex]: 'done' }));
      } catch (err) {
        console.warn(`Gagal jana AI untuk slot ${slotIndex}, jana templat sandaran...`, err);

        // Fallback templat kurikulum jika berlaku gangguan rangkaian
        const totalStudents = slot.bilangan_murid || 30;
        const achieveCount = Math.round(totalStudents * 0.9);

        const fallbackRecord: RPHRecord = {
          id: slotKey,
          jadual_id: slot.id || `slot_${slotIndex}`,
          tahun_akademik: 2027,
          minggu_ke: selectedWeek,
          tarikh: slotDate,
          hari: slot.hari,
          masa_mula: slot.masa_mula,
          masa_tamat: slot.masa_tamat,
          tingkatan: slot.tingkatan,
          kelas: slot.kelas,
          subjek: slot.subjek,
          kod_bahasa: langCode,
          arah_teks: isArabic ? 'rtl' : 'ltr',

          tema: rptRec?.tema || 'Standard Kurikulum DSKP',
          tajuk: rptRec?.label_minggu || `Minggu ${selectedWeek}`,
          sk: rptRec?.sk || 'Standard Kandungan KPM',
          sp: rptRec?.sp || 'Standard Pembelajaran KPM',

          objektif_pembelajaran: isArabic
            ? `في نهاية التعليم والتعلم ، يمكن للطلاب استيعاب وتطبيق معيار التعلم (${rptRec?.sp?.slice(0, 80) || 'المحتوى المقترح'}) بنجاح.`
            : isEnglish
            ? `By the end of the lesson, pupils will be able to master the learning standard (${rptRec?.sp?.slice(0, 90) || 'curriculum standard'}) accurately.`
            : `Pada akhir sesi PdPc, murid dapat menguasai standard pembelajaran (${rptRec?.sp?.slice(0, 100) || 'kemahiran tajuk'}) dengan betul.`,
          kriteria_kejayaan: isArabic
            ? 'ينجح الطلاب إذا استطاعوا إتمام التدريبات المحددة بنسبة ٨٠٪ على الأقل.'
            : isEnglish
            ? 'Pupils succeed if they complete the assigned exercises and collaborative tasks with minimal guidance.'
            : 'Murid berjaya sekiranya dapat melengkapkan latihan lembaran kerja dan menjawab soalan guru dengan betul.',

          aktiviti: {
            set_induksi: isArabic ? '(٥ دقائق) عرض نموذج أو صور تحفيزية لجذب انتباه الطلاب.' : '(5 minit) Rangsangan visual / set induksi menarik perhatian murid.',
            langkah_1: isArabic ? '(١٥ دقيقة) شرح المفهوم الأساسي ونمذجة المعلم.' : '(15 minit) Penerangan konsep utama dan pemodelan tajuk oleh guru.',
            langkah_2: isArabic ? `(٢٠ دقيقة) نشاط تعاوني متمركز حول الطالب (${pak21}).` : `(20 minit) Aktiviti kolaboratif murid berpusatkan murid (${pak21}).`,
            langkah_3: isArabic ? '(١٥ دقيقة) تمارين كتابية وتثبيت المفاهيم.' : '(15 minit) Latihan pengukuhan lembaran kerja dan pentaksiran formatif.',
            penutup: isArabic ? '(٥ دقائق) تلخيص الدرس والتأمل الذاتي.' : '(5 minit) Rumusan kognitif dan refleksi kendiri murid.'
          },

          pedagogi: {
            bbm: selectedBBM.split(',').map(s => s.trim()),
            emk: ['Bahasa', 'Nilai Murni'],
            nilai_murni: ['Bekerjasama', 'Kasih Sayang'],
            peta_ithink: [ithink],
            kecerdasan_pelbagai: ['Verbal Linguistik'],
            kaedah: ['Perbincangan', 'Latihan'],
            strategi: [pak21, 'Pendekatan Berpusatkan Murid'],
            alat_pemikiran_pak21: [pak21],
            pentaksiran: [rptRec?.standard_prestasi || 'Latihan Bertulis']
          },

          refleksi: {
            pdp_dijalankan: true,
            sebab_tidak_dijalankan: '',
            bawa_ke_kelas_seterusnya: false,
            objektif_disalin: isArabic
              ? 'حقق معظم الطلاب أهداف الدرس بنجاح.'
              : 'Majoriti murid berjaya mencapai objektif pembelajaran yang ditetapkan.',
            bilangan_murid_hadir: totalStudents,
            bilangan_murid_mencapai: achieveCount,
            peratus_mencapai: Math.round((achieveCount / totalStudents) * 100),
            intervensi_diperlukan: false,
            pilihan_intervensi: '',
            catatan_tambahan: ''
          },

          adalah_ditangguhkan: false,
          adalah_carry_forward: false,
          status: 'SELESAI',
          updated_at: new Date().toISOString()
        };

        accumulatedRecords[slotKey] = fallbackRecord;
        setGeneratedRecords({ ...accumulatedRecords });
        setSlotStatusMap(prev => ({ ...prev, [slotIndex]: 'done' }));
      }

      setProgressCount(i + 1);
    }

    setIsGenerating(false);
    setCurrentSlotProcessing('');
  };

  // Terapkan semua rekod seminggu yang dijana ke borang utama
  const handleApplyAll = () => {
    onApplyWeeklyRPH(generatedRecords);
    onClose();
  };

  const totalGeneratedCount = Object.keys(generatedRecords).filter(k =>
    k.startsWith(`week_${selectedWeek}_`)
  ).length;

  const isAllGenerated =
    selectedSlotIndexes.length > 0 &&
    selectedSlotIndexes.every(idx => slotStatusMap[idx] === 'done');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">Penjana RPH Seminggu Pintar</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Bot className="w-3 h-3 mr-0.5" />
                  <span>Gemini 3.8 Flash</span>
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Jana automatik Objektif Pembelajaran SMART &amp; 5 Langkah PdPc bagi semua slot mengajar seminggu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kandungan Modal (Boleh Skrol) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Bar Pilihan Minggu & Konfigurasi Cepat */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4">
            <div>
              <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>Pilih Minggu Sasaran</span>
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(Number(e.target.value));
                  setSlotStatusMap({});
                }}
                disabled={isGenerating}
                className="w-full text-xs p-2 bg-white border border-purple-300 rounded-xl font-bold text-purple-950 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {teachingWeeks.map((w) => (
                  <option key={w.minggu_ke} value={w.minggu_ke!}>
                    Minggu {w.minggu_ke} ({w.tarikh_teks})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Strategi PAK-21
              </label>
              <select
                value={selectedPAK21}
                onChange={(e) => setSelectedPAK21(e.target.value)}
                disabled={isGenerating}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="Dinamik">✨ Pelbagai Strategi Dinamik (Disyorkan)</option>
                {pak21List.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Peta I-Think
              </label>
              <select
                value={selectedIThink}
                onChange={(e) => setSelectedIThink(e.target.value)}
                disabled={isGenerating}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="Dinamik">✨ Pelbagai Peta Dinamik (Disyorkan)</option>
                {ithinkList.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                BBM Utama
              </label>
              <select
                value={selectedBBM}
                onChange={(e) => setSelectedBBM(e.target.value)}
                disabled={isGenerating}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="Buku Teks, Lembaran Kerja & LCD Projector">Buku Teks &amp; LCD</option>
                <option value="Slaid Digital, LCD Projector & Lembaran Kerja">Slaid Digital &amp; Modul</option>
                <option value="Papan Putih Mini, Kad Imbasan & Modul PdPc">Papan Mini &amp; Kad</option>
              </select>
            </div>
          </div>

          {/* Bar Kemajuan (Jika Sedang Dijana) */}
          {isGenerating && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  <span>{currentSlotProcessing || 'Sedang memproses penjanaan kurikulum...'}</span>
                </span>
                <span>
                  {progressCount} / {selectedSlotIndexes.length} Slot ({Math.round((progressCount / selectedSlotIndexes.length) * 100)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-purple-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(progressCount / selectedSlotIndexes.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Senarai Slot Jadual Guru */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Slot Jadual Mengajar ({timetable.length} Slot Tersedia &bull; {selectedSlotIndexes.length} Dipilih)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={isGenerating}
                  className="text-purple-700 hover:text-purple-900 font-bold"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={isGenerating}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Nyahpilih
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {timetable.map((slot, idx) => {
                const isSelected = selectedSlotIndexes.includes(idx);
                const status = slotStatusMap[idx] || 'idle';
                const slotKey = `week_${selectedWeek}_slot_${idx}`;
                const hasExisting = !!existingRecords[slotKey];
                const generated = generatedRecords[slotKey];
                const rptRec = findRPTRecord(slot.subjek, slot.tingkatan, selectedWeek);
                const isExpanded = expandedPreviewIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`border rounded-2xl transition-all overflow-hidden ${
                      status === 'generating'
                        ? 'border-purple-400 bg-purple-50/50 shadow-md ring-2 ring-purple-300'
                        : status === 'done'
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : isSelected
                        ? 'border-slate-300 bg-white hover:border-purple-300 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSlot(idx)}
                          disabled={isGenerating}
                          className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-800 text-white tracking-wide">
                              {slot.hari} (Slot {slot.slot_ke})
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {slot.masa_mula} &ndash; {slot.masa_tamat}
                            </span>
                            {rptRec ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center">
                                <Check className="w-2.5 h-2.5 mr-0.5" />
                                <span>RPT Ditemui</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                DSKP Standard
                              </span>
                            )}
                            {hasExisting && status === 'idle' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                                Sudah Ada Draf
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm font-bold text-slate-900 mt-1">
                            {slot.subjek} &bull; <span className="text-emerald-700 font-extrabold">{slot.kelas}</span>{' '}
                            <span className="text-xs font-normal text-slate-500">(Tingkatan {slot.tingkatan})</span>
                          </div>

                          {rptRec && (
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              <span className="font-semibold text-slate-700">SP:</span> {rptRec.sp}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status / Tindakan */}
                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        {status === 'generating' && (
                          <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold flex items-center space-x-1 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                            <span>Menjana AI...</span>
                          </span>
                        )}

                        {status === 'done' && (
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Siap Dijana</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedPreviewIndex(isExpanded ? null : idx)}
                              className="p-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center space-x-1"
                              title="Lihat Hasil Jana"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isExpanded ? 'Tutup' : 'Lihat'}</span>
                            </button>
                          </div>
                        )}

                        {status === 'idle' && (
                          <span className="text-xs text-slate-400 font-medium">
                            {isSelected ? 'Sedia untuk dijana' : 'Dikecualikan'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prebiu Accordion Jika Siap Dijana */}
                    {isExpanded && generated && (
                      <div
                        dir={generated.arah_teks}
                        className={`p-4 bg-white border-t border-emerald-200/80 space-y-3 text-xs animate-in fade-in ${
                          generated.arah_teks === 'rtl' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-emerald-800 uppercase block mb-0.5">
                            🎯 Objektif Pembelajaran
                          </span>
                          <p className="whitespace-pre-line text-slate-800 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            {generated.objektif_pembelajaran}
                          </p>
                        </div>

                        <div>
                          <span className="font-extrabold text-emerald-800 uppercase block mb-0.5">
                            ✅ Kriteria Kejayaan
                          </span>
                          <p className="whitespace-pre-line text-slate-800 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            {generated.kriteria_kejayaan}
                          </p>
                        </div>

                        <div>
                          <span className="font-extrabold text-emerald-800 uppercase block mb-0.5">
                            📝 5 Langkah Aktiviti PdPc
                          </span>
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                            <div><strong className="text-emerald-700">Set Induksi:</strong> {generated.aktiviti?.set_induksi}</div>
                            <div><strong className="text-emerald-700">Langkah 1:</strong> {generated.aktiviti?.langkah_1}</div>
                            <div><strong className="text-emerald-700">Langkah 2:</strong> {generated.aktiviti?.langkah_2}</div>
                            <div><strong className="text-emerald-700">Langkah 3:</strong> {generated.aktiviti?.langkah_3}</div>
                            <div><strong className="text-emerald-700">Penutup:</strong> {generated.aktiviti?.penutup}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Bar Tindakan */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {totalGeneratedCount > 0 ? (
              <span className="text-emerald-700 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{totalGeneratedCount} rekod RPH berjaya dirangka dan sedia untuk diterapkan ke borang!</span>
              </span>
            ) : (
              <span>Pilih slot di atas dan klik &apos;Mula Jana RPH Seminggu&apos; untuk memulakan Co-Pilot AI.</span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Batal
            </button>

            {totalGeneratedCount > 0 ? (
              <button
                type="button"
                onClick={handleApplyAll}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Terapkan {totalGeneratedCount} RPH Seminggu ke Borang</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartWeeklyGeneration}
                disabled={isGenerating || selectedSlotIndexes.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-600/30 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Sedang Menjana Seminggu...' : `Mula Jana RPH Seminggu (${selectedSlotIndexes.length} Slot)`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
