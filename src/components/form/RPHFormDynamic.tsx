'use client';

import React, { useState, useEffect } from 'react';
import { useSubjectLocale } from '@/hooks/useSubjectLocale';
import RPTConnectorBanner from '@/components/form/RPTConnectorBanner';
import DSKPSelector from '@/components/form/DSKPSelector';
import ActivityStepsEditor from '@/components/form/ActivityStepsEditor';
import PedagogyChecklist from '@/components/form/PedagogyChecklist';
import ReflectionMirrorBox from '@/components/form/ReflectionMirrorBox';
import AICoPilotModal from '@/components/form/AICoPilotModal';
import { RPHRecord, RPTItem, GeminiCoPilotResponse } from '@/types/erph';
import jadualData from '@/data/jadual_waktu.json';
import takwimData from '@/data/takwim_2026.json';
import {
  Sparkles,
  Printer,
  Save,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ExternalLink,
  Download,
  FolderCheck,
  Loader2,
  CloudUpload,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TimetableEditorModal from '@/components/jadual/TimetableEditorModal';
import { uploadRPHToMyDrive, formatRPHFileName, generateRPHHtml } from '@/lib/google-drive';

export default function RPHFormDynamic() {
  const router = useRouter();
  const { user, isDeLIMA, loading: authLoading, timetable, teacherName, teacherEmail, googleAccessToken, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || !isDeLIMA)) {
      router.push('/login');
    }
  }, [user, isDeLIMA, authLoading, router]);

  // Pilihan Jadual / Subjek
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const currentSlot = timetable[selectedSlotIndex] || timetable[0] || {
    subjek: 'اللغة العربية المعاصرة',
    tingkatan: '3',
    kelas: '3 MUSLIM',
    masa_mula: '11.00 PAGI',
    masa_tamat: '12.30 TGH HARI',
    hari: 'ISNIN',
    slot_ke: 1
  };

  const [isTimetableEditorOpen, setIsTimetableEditorOpen] = useState(false);

  if (authLoading || !user || !isDeLIMA) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan sesi ID DeLIMA...</p>
      </div>
    );
  }

  const [subject, setSubject] = useState<string>(currentSlot.subjek);
  const [form, setForm] = useState<string>(currentSlot.tingkatan);
  const [className, setClassName] = useState<string>(currentSlot.kelas);
  const [startTime, setStartTime] = useState<string>(currentSlot.masa_mula);
  const [endTime, setEndTime] = useState<string>(currentSlot.masa_tamat);
  const [currentWeek, setCurrentWeek] = useState<number>(34); // Minggu 34 daripada data_konfigurasi
  const [date, setDate] = useState<string>('2026-09-28');

  // State Kurikulum & Aktiviti
  const [tema, setTema] = useState<string>('');
  const [tajuk, setTajuk] = useState<string>('');
  const [sk, setSK] = useState<string>('1.1 الاستماع إلى الكلمات ونطقها');
  const [sp, setSP] = useState<string>('1.1.1 التمكن من الاستماع إلى الكلمات المشددة وغير المشددة وترديدها ترديدا صحيحا');
  const [rptSuggestion, setRptSuggestion] = useState<string>('');

  const [learningObjective, setLearningObjective] = useState<string>(
    'في نهاية التعليم والتعلم ، يمكن للطلاب الاستماع والترديد الصحيح للكلمات المشددة بنسبة ٨٥٪ على الأقل.'
  );
  const [successCriteria, setSuccessCriteria] = useState<string>(
    'الطلاب ناجحون إذا استطاعوا التمييز بين الحرف المشدد وغير المشدد في ٤ من ٥ كلمات.'
  );

  const [activities, setActivities] = useState({
    set_induksi: '(٥ دقائق) عرض شريط فيديو أو بطاقات مصورة للكلمات المستهدفة لجذب انتباه الطلاب.',
    langkah_1: '(١٥ دقيقة) قراءة النموذج من قبل المعلم والترديد الجماعي والفردي مع التركيز على مخارج الحروف.',
    langkah_2: '(٢٠ دقيقة) نشاط تفاعلي تعاوني بنظام المجموعات (Think-Pair-Share) باستخدام بطاقات الكلمات.',
    langkah_3: '(١٥ دقيقة) حل التدريبات في كراسة الأنشطة وتقييم مدى استيعاب الطلاب شفهيا وكتابيا.',
    penutup: '(٥ دقائق) تلخيص الدرس والتأكيد على النقاط الأساسية من قبل الطلاب والمعلم.'
  });

  const [pedagogy, setPedagogy] = useState({
    bbm: ['Komputer,LCD,DVD,buku teks,buku latihan,alat tulis', 'Kad bergambar, kad perkataan dan lembaran kerja.'],
    emk: ['Kreativiti dan Inovasi', 'Bahasa'],
    nilai_murni: ['Bekerjasama, Menjaga Kebersihan,', 'Kasih Sayang, menghormati'],
    peta_ithink: ['Peta Buih'],
    kecerdasan_pelbagai: ['Bahasa', 'Interpersonal'],
    kaedah: ['Bercerita'],
    strategi: ['Pendekatan Berpusatkan Murid'],
    alat_pemikiran_pak21: ['Think-Pair-Share'],
    pentaksiran: ['Latihan  bertulis / Lembaran kerja', 'Lisan']
  });

  const [reflection, setReflection] = useState({
    objektif_disalin: '',
    bilangan_murid_hadir: 30,
    bilangan_murid_mencapai: 28,
    peratus_mencapai: 93.3,
    intervensi_diperlukan: false,
    pilihan_intervensi: '',
    catatan_tambahan: ''
  });

  const [isCarryForwardActive, setIsCarryForwardActive] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Google Drive State & Modal
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState<boolean>(false);
  const [driveResult, setDriveResult] = useState<{
    success: boolean;
    fileName: string;
    folderName: string;
    webViewLink?: string;
    error?: string;
  } | null>(null);

  // Hook penukaran bahasa & arah teks RTL/LTR automatik
  const { isRTL, direction, fontClass, kodBahasa, getLabel, locale } = useSubjectLocale(subject);

  // Apabila slot jadual ditukar
  const handleSlotChange = (index: number) => {
    setSelectedSlotIndex(index);
    const slot = timetable[index];
    if (slot) {
      setSubject(slot.subjek);
      setForm(slot.tingkatan);
      setClassName(slot.kelas);
      setStartTime(slot.masa_mula);
      setEndTime(slot.masa_tamat);
      setIsCarryForwardActive(false);

      // Set default contoh mengikut bahasa
      if (slot.subjek.includes('ENGLISH')) {
        setSK('1.1 Understand meaning in a variety of familiar contexts');
        setSP('1.1.1 Understand with little or no support the main points in simple longer texts');
        setLearningObjective('By the end of the lesson, pupils will be able to read and extract at least 4 key points accurately.');
        setSuccessCriteria('Pupils succeed if they correctly answer 4 comprehension questions.');
        setActivities({
          set_induksi: '(5 mins) Teacher shows a short introductory video clip to stimulate discussion.',
          langkah_1: '(15 mins) Teacher introduces key vocabulary and guides pronunciation.',
          langkah_2: '(20 mins) Pair-work reading task utilizing Round Robin discussion.',
          langkah_3: '(15 mins) Independent worksheet assessment to gauge comprehension.',
          penutup: '(5 mins) Quick exit ticket recap.'
        });
      } else if (slot.subjek.includes('SAINS')) {
        setSK('1.1 Sains adalah sebahagian daripada kehidupan harian');
        setSP('1.1.1 Menghubungkaitkan aktiviti seharian dengan Sains');
        setLearningObjective('Pada akhir sesi PdPc, murid dapat menghuraikan 3 fenomena harian berkaitan Sains dengan tepat.');
        setSuccessCriteria('Murid berjaya sekiranya dapat melengkapkan peta buih dengan sekurang-kurangnya 3 contoh.');
        setActivities({
          set_induksi: '(5 Minit) Guru menunjukkan objek harian (contoh: cerek air mendidih) untuk mencungkil idea sains.',
          langkah_1: '(15 Minit) Penerangan konsep inkuiri saintifik dan perbincangan kelas.',
          langkah_2: '(20 Minit) Aktiviti berkumpulan Think-Pair-Share membina Peta Buih.',
          langkah_3: '(15 Minit) Menjawab soalan latihan dalam buku kerja.',
          penutup: '(5 Minit) Murid membuat rumusan dibimbing guru.'
        });
      }
    }
  };

  const handleApplyRPTItem = (item: RPTItem, carryForward = false) => {
    if (item.sk) setSK(item.sk);
    if (item.sp) setSP(item.sp);
    if (item.cadangan_aktiviti) setRptSuggestion(item.cadangan_aktiviti);
    setIsCarryForwardActive(carryForward);
  };

  const handleApplyAIContent = (res: GeminiCoPilotResponse) => {
    setLearningObjective(res.objektif_pembelajaran);
    if (res.kriteria_kejayaan) setSuccessCriteria(res.kriteria_kejayaan);
    if (res.aktiviti) setActivities(res.aktiviti);
  };

  const handleSaveDraft = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUploadToGoogleDrive = async () => {
    setIsDriveModalOpen(true);
    setIsUploadingDrive(true);
    setDriveResult(null);

    const currentRPH: Partial<RPHRecord> = {
      minggu_ke: currentWeek,
      tarikh: date,
      hari: currentSlot.hari,
      masa_mula: startTime,
      masa_tamat: endTime,
      tingkatan: form,
      kelas: className,
      subjek: subject,
      kod_bahasa: kodBahasa,
      arah_teks: isRTL ? 'rtl' : 'ltr',
      tema,
      tajuk,
      sk,
      sp,
      objektif_pembelajaran: learningObjective,
      kriteria_kejayaan: successCriteria,
      aktiviti: activities,
      pedagogi: pedagogy,
      refleksi: reflection,
      adalah_ditangguhkan: false,
      adalah_carry_forward: isCarryForwardActive,
      status: 'SELESAI',
    };

    if (!googleAccessToken) {
      setIsUploadingDrive(false);
      setDriveResult({
        success: false,
        fileName: formatRPHFileName(teacherName, currentWeek),
        folderName: 'e-RPH DeLIMA',
        error: 'Sesi capaian Google Drive belum diaktifkan dalam sesi ini. Anda boleh klik "Sambungkan Google Drive" di bawah untuk membenarkan akses My Drive, atau muat turun fail .html.'
      });
      return;
    }

    const res = await uploadRPHToMyDrive({
      rph: currentRPH,
      teacherName: teacherName || 'GURU',
      teacherEmail: teacherEmail || '',
      accessToken: googleAccessToken,
      schoolName: 'SEKOLAH MENENGAH AGAMA AL-HASANAH (SABK)'
    });

    setDriveResult(res);
    setIsUploadingDrive(false);
  };

  const handleDownloadHtmlFile = () => {
    const currentRPH: Partial<RPHRecord> = {
      minggu_ke: currentWeek,
      tarikh: date,
      hari: currentSlot.hari,
      masa_mula: startTime,
      masa_tamat: endTime,
      tingkatan: form,
      kelas: className,
      subjek: subject,
      kod_bahasa: kodBahasa,
      arah_teks: isRTL ? 'rtl' : 'ltr',
      tema,
      tajuk,
      sk,
      sp,
      objektif_pembelajaran: learningObjective,
      kriteria_kejayaan: successCriteria,
      aktiviti: activities,
      pedagogi: pedagogy,
      refleksi: reflection,
      status: 'SELESAI',
    };
    const htmlContent = generateRPHHtml(currentRPH, teacherName || 'GURU', teacherEmail || '');
    const fileName = formatRPHFileName(teacherName, currentWeek) + '.html';
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Pilihan Slot Jadual Waktu Mengajar (Quick Slot Bar) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm no-print">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Pilih Slot Mengajar: <span className="text-emerald-700 font-extrabold">{teacherName}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsTimetableEditorOpen(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Ubah Suai Jadual Mengajar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {timetable.map((slot, idx) => {
            const isSelected = selectedSlotIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSlotChange(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="font-extrabold text-[11px] uppercase tracking-wide opacity-90">
                  {slot.hari} (Slot {slot.slot_ke})
                </div>
                <div className="font-bold truncate mt-0.5">{slot.subjek}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{slot.kelas} &bull; {slot.masa_mula}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RPT Google Sheets Connection & Carry Forward Handler */}
      <RPTConnectorBanner
        currentWeek={currentWeek}
        subject={subject}
        form={form}
        onApplyRPTItem={handleApplyRPTItem}
        isCarryForwardActive={isCarryForwardActive}
      />

      {/* Tindakan Utama & Indikator Bahasa / RTL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold text-slate-700">Subjek Semasa:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            {subject} (Tingkatan {form})
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isRTL ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
          }`}>
            {direction.toUpperCase()} ({kodBahasa.toUpperCase()}) &bull; {fontClass}
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Co-Pilot Gemini AI</span>
          </button>

          <button
            type="button"
            onClick={handleUploadToGoogleDrive}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
            title="Hantar e-RPH ke Google Drive"
          >
            <CloudUpload className="w-4 h-4 text-emerald-100" />
            <span>Hantar ke Google Drive</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Simpan</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Rekod e-RPH berjaya disimpan ke dalam pangkalan data!</span>
        </div>
      )}

      {/* =========================================================================
          BORANG E-RPH DINAMIK UTAMA (MENGIKUT DIR LTR / RTL SECARA AUTOMATIK)
         ========================================================================= */}
      <div
        dir={direction}
        className={`bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-8 print-page ${fontClass}`}
      >
        
        {/* Header Rasmi Borang e-RPH */}
        <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <img
            src="/logo-al-hasanah.png"
            alt="Logo SMA Al-Hasanah"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow shrink-0"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900">
              RANCANGAN PENGAJARAN HARIAN (e-RPH KPM)
            </h2>
            <p className="text-xs sm:text-sm font-bold text-emerald-800">
              SEKOLAH MENENGAH AGAMA AL-HASANAH (SABK) PAHANG
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Sistem Pengurusan e-RPH Pintar Bersepadu &bull; Sesi Akademik 2026
            </p>
          </div>
        </div>

        {/* Bahagian 1: Maklumat Am (Tarikh, Hari, Minggu, Kelas, Masa, Subjek) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('TARIKH', 'TARIKH')}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 focus:outline-none mt-0.5"
            />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('HARI', 'HARI')}
            </span>
            <span className="font-bold text-slate-900 block mt-0.5">{currentSlot.hari}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('MINGGU', 'MINGGU')}
            </span>
            <span className="font-bold text-slate-900 block mt-0.5">M{currentWeek}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('KELAS', 'KELAS')}
            </span>
            <span className="font-bold text-slate-900 block mt-0.5">{className}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('MASA', 'MASA')}
            </span>
            <span className="font-bold text-slate-900 block mt-0.5">{startTime} - {endTime}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('SUBJEK', 'SUBJEK')}
            </span>
            <span className="font-bold text-slate-900 block mt-0.5 truncate">{subject}</span>
          </div>

        </div>

        {/* Bahagian 2: Standard Kandungan (SK) & Standard Pembelajaran (SP) DSKP */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              {getLabel('STANDARD KANDUNGAN', 'STANDARD KANDUNGAN')} &amp; {getLabel('STANDARD PEMBELAJARAN', 'STANDARD PEMBELAJARAN')}
            </h3>
          </div>

          <DSKPSelector
            subject={subject}
            form={form}
            selectedSK={sk}
            selectedSP={sp}
            onSelect={(item) => {
              setSK(item.sk);
              setSP(item.sp);
              setTema(item.tema);
              setTajuk(item.tajuk);
              if (item.defaultObj && !learningObjective) {
                setLearningObjective(item.defaultObj);
              }
            }}
            isRTL={isRTL}
            labels={locale.labels}
          />
        </div>

        {/* Bahagian 3: Objektif Pembelajaran (SMART) & Kriteria Kejayaan */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              {getLabel('OBJEKTIF PEMBELAJARAN', 'OBJEKTIF PEMBELAJARAN')}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold">Kriteria ABCD / SMART</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {getLabel('Pada akhir pengajaran dan pembelajaran,murid-murid dapat:', 'Pada akhir pengajaran dan pembelajaran, murid-murid dapat:')}
              </label>
              <textarea
                rows={3}
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                placeholder={isRTL ? 'اكتب أهداف التعلم هنا...' : 'Tulis objektif pembelajaran di sini...'}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {getLabel('KRITERIA KEJAYAAN', 'KRITERIA KEJAYAAN')}
              </label>
              <textarea
                rows={2}
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                placeholder={isRTL ? 'معايير النجاح المطلوبة...' : 'Kriteria kejayaan murid...'}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Bahagian 4: 5 Langkah Aktiviti Pengajaran & Pembelajaran (PdPc) */}
        <ActivityStepsEditor
          activities={activities}
          onChange={setActivities}
          isRTL={isRTL}
          labels={locale.labels}
        />

        {/* Bahagian 5: Elemen Pedagogi, BBM, EMK & PAK-21 */}
        <PedagogyChecklist
          pedagogy={pedagogy}
          onChange={setPedagogy}
          isRTL={isRTL}
          labels={locale.labels}
        />

        {/* Bahagian 6: Refleksi Dinamik (Auto-Mirror Objektif Pembelajaran) */}
        <ReflectionMirrorBox
          learningObjective={learningObjective}
          reflection={reflection}
          onChange={setReflection}
          isRTL={isRTL}
          languageCode={kodBahasa}
          labels={locale.labels}
        />

        {/* Tandatangan & Pengesahan KPM */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <span className="block font-bold uppercase text-[10px] text-slate-400">Disediakan Oleh:</span>
            <div className="mt-8 pt-1 border-t border-slate-400 font-bold text-slate-800">
              {teacherName}
            </div>
            <p className="text-[10px] text-slate-500">Guru Mata Pelajaran ({teacherEmail})</p>
          </div>

          <div className="text-right">
            <span className="block font-bold uppercase text-[10px] text-slate-400">Disemak &amp; Disahkan Oleh:</span>
            <div className="mt-8 pt-1 border-t border-slate-400 font-bold text-slate-800">
              Pengetua / Penolong Kanan
            </div>
            <p className="text-[10px] text-slate-500">SMA Al-Hasanah</p>
          </div>
        </div>

      </div>

      {/* Modal Co-Pilot Gemini AI */}
      <AICoPilotModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApply={handleApplyAIContent}
        subject={subject}
        form={form}
        languageCode={kodBahasa}
        sk={sk}
        sp={sp}
        rptActivitySuggestion={rptSuggestion}
        isRTL={isRTL}
      />

      {/* Modal Editor Jadual Waktu Boleh Ubah */}
      <TimetableEditorModal
        isOpen={isTimetableEditorOpen}
        onClose={() => setIsTimetableEditorOpen(false)}
      />

      {/* Modal Penghantaran Google Drive */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Hantar e-RPH ke Google Drive
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Folder Sasaran: <span className="font-semibold text-emerald-700">My Drive &gt; e-RPH DeLIMA</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nama Fail Mengikut Format Rasmi */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Format Nama Fail Rasmi:
              </span>
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-800 break-all">
                {formatRPHFileName(teacherName, currentWeek)}
              </div>
            </div>

            {/* Kandungan Status Muat Naik */}
            {isUploadingDrive ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Sedang Menjana &amp; Menghantar ke My Drive...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mencipta folder &bull; Memuat naik dokumen HTML rasmi &bull; Menjana pautan paparan
                  </p>
                </div>
              </div>
            ) : driveResult?.success ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>e-RPH Berjaya Dihantar ke My Drive!</span>
                  </div>
                  <p className="leading-relaxed pl-7 text-[11px]">
                    Fail <strong>{driveResult.fileName}</strong> telah berjaya disimpan ke dalam folder <strong>{driveResult.folderName}</strong> di akaun Google Drive pendidik ({teacherEmail}).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {driveResult.webViewLink && (
                    <a
                      href={driveResult.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
                    >
                      <span>Buka di Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadHtmlFile}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Salinan Tempatan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Pengesahan Google Drive Diperlukan</span>
                  </div>
                  <p className="leading-relaxed pl-7 text-[11px]">
                    {driveResult?.error || 'Sesi capaian Google Drive belum diaktifkan.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await signInWithGoogle();
                      handleUploadToGoogleDrive();
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Sambungkan Google Drive &amp; Hantar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadHtmlFile}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Muat Turun Fail .html</span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Tutup Tetingkap
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
