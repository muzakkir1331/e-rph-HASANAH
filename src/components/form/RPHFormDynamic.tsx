'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSubjectLocale } from '@/hooks/useSubjectLocale';
import RPTConnectorBanner from '@/components/form/RPTConnectorBanner';
import TemaTajukSelector from '@/components/form/TemaTajukSelector';
import KarakterRPHSection from '@/components/form/KarakterRPHSection';
import DSKPSelector from '@/components/form/DSKPSelector';
import ActivityStepsEditor from '@/components/form/ActivityStepsEditor';
import PedagogyChecklist from '@/components/form/PedagogyChecklist';
import ReflectionMirrorBox from '@/components/form/ReflectionMirrorBox';
import AICoPilotModal from '@/components/form/AICoPilotModal';
import CopyRPHModal from '@/components/form/CopyRPHModal';
import A4PortraitPreviewModal from '@/components/form/A4PortraitPreviewModal';
import RPHGeneratedTableView from '@/components/form/RPHGeneratedTableView';
import { RPHRecord, RPHReflection, RPTItem, GeminiCoPilotResponse } from '@/types/erph';
import {
  findRPTRecord,
  convertToRPTItem,
  getSynchronizedWeeks,
  getCurrentWeekFromDate,
  dropdownOptions,
  rptCatalog,
  RPTDatabaseRecord
} from '@/lib/rpt-helper';
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
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Database,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Copy,
  Clipboard,
  Share2,
  Eye,
  FileText,
  FileDown
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TimetableEditorModal from '@/components/jadual/TimetableEditorModal';
import ShareReviewModal from '@/components/review/ShareReviewModal';
import {
  uploadWeeklyRPHToMyDrive,
  formatRPHFileName,
  generateWeeklyRPHHtml,
  generateSingleRPHCardHtml
} from '@/lib/google-drive';
import { calculateWeekDatesFromMonday, printOrSaveRPH, downloadRPHPdf } from '@/lib/print-rph';
import { getSubjectLocale } from '@/lib/dictionary';

export default function RPHFormDynamic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isDeLIMA,
    loading: authLoading,
    timetable,
    updateSlot,
    teacherName,
    teacherEmail,
    googleAccessToken,
    signInWithGoogle,
    userProfile,
    planType,
    setIsUpgradeModalOpen
  } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Tab Utama: 'jadual' (Berdasarkan Jadual & RPT) vs 'kustom' (e-RPH Kustom) vs 'karakter' (Pembentukan Karakter 15 Minit)
  const paramMode = searchParams ? searchParams.get('mode') : null;
  const [activeTab, setActiveTab] = useState<'jadual' | 'kustom' | 'karakter'>(
    paramMode === 'karakter' ? 'karakter' : (paramMode === 'kustom' ? 'kustom' : 'jadual')
  );

  // Senarai minggu takwim yang diselaraskan dengan RPT (44 minggu + 4 cuti)
  const synchronizedWeeks = getSynchronizedWeeks();
  const teachingWeeks = synchronizedWeeks.filter(w => !w.adalah_cuti && w.minggu_ke !== null);

  // Ambil parameter carian URL jika ada (?minggu=5&subjek=Sains&tingkatan=1&slot=0&hari=ISNIN)
  const paramWeek = searchParams ? searchParams.get('minggu') : null;
  const paramSubject = searchParams ? searchParams.get('subjek') : null;
  const paramForm = searchParams ? searchParams.get('tingkatan') : null;
  const paramSlot = searchParams ? searchParams.get('slot') : null;
  const paramDay = searchParams ? searchParams.get('hari') : null;

  // Kira minggu awal
  const initialWeekNum = paramWeek ? parseInt(paramWeek, 10) : 1;
  const [currentWeek, setCurrentWeek] = useState<number>(initialWeekNum || 1);

  // Maklumat minggu aktif
  const currentWeekInfo = synchronizedWeeks.find(w => w.minggu_ke === currentWeek) || synchronizedWeeks[0];

  // Pilihan Jadual Slot (Mod Jadual)
  const initialSlotNum = paramSlot ? parseInt(paramSlot, 10) : 0;
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(
    !isNaN(initialSlotNum) && initialSlotNum >= 0 ? initialSlotNum : 0
  );
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

  // State e-RPH Kustom
  const [customSessionType, setCustomSessionType] = useState<string>('Kelas Biasa');
  const [customDay, setCustomDay] = useState<string>('ISNIN');
  const [isManualSubjectInput, setIsManualSubjectInput] = useState<boolean>(false);

  // Status Auto-save Real-time & Sinkronisasi Jadual
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isInitialMount = React.useRef<boolean>(true);
  const hasInitializedRef = React.useRef<boolean>(false);
  const prevTimetableSignature = React.useRef<string>('');
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // State Medan Utama Borang
  const [subject, setSubject] = useState<string>(currentSlot.subjek);
  const [form, setForm] = useState<string>(currentSlot.tingkatan);
  const [className, setClassName] = useState<string>(currentSlot.kelas || dropdownOptions.kelas[0]);
  const [startTime, setStartTime] = useState<string>(currentSlot.masa_mula || dropdownOptions.waktu[0].formatted);
  const [endTime, setEndTime] = useState<string>(currentSlot.masa_tamat || dropdownOptions.waktu[2].formatted);
  const [date, setDate] = useState<string>(currentWeekInfo ? currentWeekInfo.tarikh_mula : '2027-01-04');

  // Tarikh Isnin bagi minggu aktif & Automasi Tarikh Hari Persekolahan Seterusnya (Selasa - Jumaat)
  const [mondayDate, setMondayDate] = useState<string>(
    currentWeekInfo ? currentWeekInfo.tarikh_mula : '2027-01-04'
  );
  const weekDates = useMemo(() => calculateWeekDatesFromMonday(mondayDate), [mondayDate]);

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
    langkah_3: '(١٥ دقيقة) حل التدريبات في كraسة الأنشطة وتقييم مدى استيعاب الطلاب شفهيا وكتابيا.',
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

  const [reflection, setReflection] = useState<RPHReflection>({
    pdp_dijalankan: true,
    sebab_tidak_dijalankan: '',
    bawa_ke_kelas_seterusnya: false,
    objektif_disalin: '',
    bilangan_murid_hadir: 30,
    bilangan_murid_mencapai: 28,
    peratus_mencapai: 93.3,
    intervensi_diperlukan: false,
    pilihan_intervensi: '',
    catatan_tambahan: ''
  });

  // State Papan Klip Salin / Tampal RPH ke Jadual Kelas Berbeza
  const [clipboardData, setClipboardData] = useState<any | null>(null);
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [isPreviewA4ModalOpen, setIsPreviewA4ModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'form' | 'table'>('form');

  // Map rekod e-RPH tersimpan mengikut slot & minggu (Pengasingan Data Menyeluruh)
  const [savedRecordsMap, setSavedRecordsMap] = useState<Record<string, RPHRecord>>({});
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Ambil data clipboard & rekod tersimpan dari storan tempatan jika ada
  useEffect(() => {
    try {
      const savedClip = localStorage.getItem('erph_clipboard_rph');
      if (savedClip) {
        setClipboardData(JSON.parse(savedClip));
      }
      const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;
      const savedRecords = localStorage.getItem(storageKey);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (parsed && typeof parsed === 'object') {
          setSavedRecordsMap(parsed);
        }
      }
    } catch {}
  }, [user, teacherEmail]);

  const [isCarryForwardActive, setIsCarryForwardActive] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Google Drive State & Modal (Format PDF Seminggu)
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState<boolean>(false);
  const [driveResult, setDriveResult] = useState<{
    success: boolean;
    fileName: string;
    folderName: string;
    webViewLink?: string;
    isPDF?: boolean;
    slotsCount?: number;
    error?: string;
  } | null>(null);

  // Hook penukaran bahasa & arah teks RTL/LTR automatik
  const { isRTL, direction, fontClass, kodBahasa, getLabel, locale } = useSubjectLocale(subject);

  // ---------------------------------------------------------------------------
  // TEMPLAT BERSIH MENGIKUT BAHASA & SUBJEK (MENGELAKKAN PERTINDIHAN MAKLUMAT)
  // ---------------------------------------------------------------------------
  const getCleanDefaultActivities = (subj: string, langCode: string) => {
    if (langCode === 'ar' || /[\u0600-\u06FF]/.test(subj) || subj.toLowerCase().includes('arab')) {
      return {
        set_induksi: '(٥ دقائق) عرض شريط فيديو أو بطاقات مصورة للكلمات المستهدفة لجذب انتباه الطلاب.',
        langkah_1: '(١٥ دقيقة) قراءة النموذج من قبل المعلم والترديد الجماعي والفردي مع التركيز على مخارج الحروف.',
        langkah_2: '(٢٠ دقيقة) نشاط تفاعلي تعاوني بنظام المجموعات (Think-Pair-Share) menggunakan kad perkataan.',
        langkah_3: '(١٥ دقيقة) حل التدريبات في كراسة الأنشطة وتقييم مدى استيعاب الطلاب شفهيا وكتابيا.',
        penutup: '(٥ دقائق) تلخيص الدرس والتأكيد على النقاط الأساسية من قبل الطلاب والمعلم.'
      };
    }
    if (langCode === 'en' || subj.toLowerCase().includes('english') || subj.toLowerCase().includes('inggeris')) {
      return {
        set_induksi: '(5 mins) Teacher shows a short stimulus video clip to elicit pupils\' prior knowledge.',
        langkah_1: '(15 mins) Teacher introduces key vocabulary and models language structures explicitly.',
        langkah_2: '(20 mins) Collaborative group activity (PAK-21: Think-Pair-Share / Gallery Walk).',
        langkah_3: '(15 mins) Guided independent practice and worksheet assessment.',
        penutup: '(5 mins) Summary of lesson and pupil self-reflection.'
      };
    }
    return {
      set_induksi: '(5 minit) Set induksi dan tayangan rangsangan topik pembelajaran untuk mencungkil idea murid.',
      langkah_1: '(15 minit) Penerangan konsep utama dan pemodelan tajuk oleh guru.',
      langkah_2: '(20 minit) Aktiviti interaktif murid secara kolaboratif (PAK-21: Think-Pair-Share).',
      langkah_3: '(15 minit) Latihan pengukuhan bertulis / lembaran kerja pemulihan murid.',
      penutup: '(5 minit) Rumusan isi pelajaran dan refleksi kendiri murid bersama guru.'
    };
  };

  const getCleanDefaultPedagogy = () => {
    return {
      bbm: ['Buku Teks', 'Lembaran Kerja', 'Buku Latihan / Alat Tulis'],
      emk: ['Bahasa', 'Nilai Murni'],
      nilai_murni: ['Bekerjasama', 'Kasih Sayang', 'Menghormati'],
      peta_ithink: ['Peta Buih'],
      kecerdasan_pelbagai: ['Verbal Linguistik', 'Interpersonal'],
      kaedah: ['Perbincangan', 'Bercerita'],
      strategi: ['Pendekatan Berpusatkan Murid'],
      alat_pemikiran_pak21: ['Think-Pair-Share'],
      pentaksiran: ['Latihan  bertulis / Lembaran kerja', 'Lisan']
    };
  };

  const getCleanDefaultReflection = (bilanganMurid?: number, langCode?: string): RPHReflection => {
    const total = bilanganMurid || 30;
    const achieve = Math.round(total * 0.9);
    return {
      pdp_dijalankan: true,
      sebab_tidak_dijalankan: '',
      bawa_ke_kelas_seterusnya: false,
      objektif_disalin: langCode === 'ar'
        ? 'حقق معظم الطلاب الأهداف التعليمية بنجاح.'
        : 'Keseluruhan murid berjaya mencapai objektif pembelajaran yang ditetapkan.',
      bilangan_murid_hadir: total,
      bilangan_murid_mencapai: achieve,
      peratus_mencapai: Math.round((achieve / total) * 100),
      intervensi_diperlukan: false,
      pilihan_intervensi: '',
      catatan_tambahan: ''
    };
  };

  // Fungsi bina snapshot lengkap rekod e-RPH semasa
  const getCurrentSnapshot = (): RPHRecord => {
    const activeDay = activeTab === 'jadual' ? currentSlot.hari : customDay;
    const dayUpper = (activeDay || '').toUpperCase();
    const effectiveDate = (activeTab === 'jadual' && weekDates[dayUpper]) ? weekDates[dayUpper] : date;
    const recordId = activeTab === 'jadual'
      ? `week_${currentWeek}_slot_${selectedSlotIndex}`
      : `week_${currentWeek}_custom_${subject}_${className}_${activeDay}`;

    return {
      id: recordId,
      jadual_id: activeTab === 'jadual' ? currentSlot.id || `slot_${selectedSlotIndex}` : undefined,
      tahun_akademik: 2027,
      minggu_ke: currentWeek,
      tarikh: effectiveDate,
      hari: activeDay,
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
      aktiviti: { ...activities },
      pedagogi: { ...pedagogy },
      refleksi: { ...reflection },
      adalah_ditangguhkan: !reflection.pdp_dijalankan,
      sebab_penangguhan: reflection.sebab_tidak_dijalankan,
      adalah_carry_forward: !!reflection.bawa_ke_kelas_seterusnya,
      status: 'SELESAI',
      updated_at: new Date().toISOString()
    };
  };

  // Fungsi menyuntik semula rekod tersimpan ke dalam borang
  const applyRecordToForm = (rec: Partial<RPHRecord>) => {
    if (rec.subjek !== undefined) setSubject(rec.subjek);
    if (rec.tingkatan !== undefined) setForm(rec.tingkatan);
    if (rec.kelas !== undefined) setClassName(rec.kelas);
    if (rec.masa_mula !== undefined) setStartTime(rec.masa_mula);
    if (rec.masa_tamat !== undefined) setEndTime(rec.masa_tamat);
    if (rec.tarikh !== undefined) setDate(rec.tarikh);
    if (rec.tema !== undefined) setTema(rec.tema);
    if (rec.tajuk !== undefined) setTajuk(rec.tajuk);
    if (rec.sk !== undefined) setSK(rec.sk);
    if (rec.sp !== undefined) setSP(rec.sp);
    if (rec.objektif_pembelajaran !== undefined) setLearningObjective(rec.objektif_pembelajaran);
    if (rec.kriteria_kejayaan !== undefined) setSuccessCriteria(rec.kriteria_kejayaan);
    if (rec.aktiviti) setActivities({ ...rec.aktiviti });
    if (rec.pedagogi) setPedagogy({ ...rec.pedagogi });
    if (rec.refleksi) setReflection({ ...rec.refleksi });
  };

  // Fungsi menukar kelas dengan dropdown dropdown_data.csv
  const handleClassChange = (newClass: string) => {
    setClassName(newClass);
    // Ekstrak angka tingkatan dari nama kelas (contoh: '2 BUKHARI' -> '2')
    const match = newClass.match(/\d+/);
    if (match) {
      const detectedForm = match[0];
      setForm(detectedForm);
      // Jika dalam mod kustom, cuba semak RPT untuk subjek dan tingkatan baharu
      if (activeTab === 'kustom') {
        const targetLocale = getSubjectLocale(subject);
        const rptRec = findRPTRecord(subject, detectedForm, currentWeek);
        if (rptRec && !rptRec.adalah_cuti) {
          handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLocale.kod_bahasa);
        }
      }
    }
  };

  // Fungsi menukar waktu mula dengan dropdown dropdown_data.csv
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    // Beri cadangan waktu tamat 1 jam atau 30 minit kemudian secara pintar
    const currentIndex = dropdownOptions.waktu.findIndex(w => w.formatted === newStart);
    let calculatedEnd = endTime;
    if (currentIndex !== -1 && currentIndex + 2 < dropdownOptions.waktu.length) {
      calculatedEnd = dropdownOptions.waktu[currentIndex + 2].formatted;
      setEndTime(calculatedEnd);
    } else if (currentIndex !== -1 && currentIndex + 1 < dropdownOptions.waktu.length) {
      calculatedEnd = dropdownOptions.waktu[currentIndex + 1].formatted;
      setEndTime(calculatedEnd);
    }

    // Jika dalam mod jadual, kemas kini juga slot jadual guru secara langsung agar kekal selaras
    if (activeTab === 'jadual' && timetable && timetable[selectedSlotIndex] && updateSlot) {
      const curSlot = timetable[selectedSlotIndex];
      updateSlot(selectedSlotIndex, {
        ...curSlot,
        masa_mula: newStart,
        masa_tamat: calculatedEnd
      });
    }
  };

  // Fungsi menukar waktu tamat dengan dropdown
  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    // Jika dalam mod jadual, kemas kini juga slot jadual guru secara langsung
    if (activeTab === 'jadual' && timetable && timetable[selectedSlotIndex] && updateSlot) {
      const curSlot = timetable[selectedSlotIndex];
      updateSlot(selectedSlotIndex, {
        ...curSlot,
        masa_tamat: newEnd
      });
    }
  };

  // Fungsi menyuntik item RPT ke dalam borang (Menggunakan bahasa subjek sasaran secara eksplisit)
  const handleApplyRPTItem = (
    item: RPTItem,
    carryForwardOrLang?: boolean | string,
    explicitLangArg?: string
  ) => {
    const isCF = typeof carryForwardOrLang === 'boolean' ? carryForwardOrLang : false;
    const explicitLang = typeof carryForwardOrLang === 'string' ? carryForwardOrLang : explicitLangArg;
    const activeLang = explicitLang || kodBahasa;

    if (item.tema) setTema(item.tema);
    if (item.tajuk) setTajuk(item.tajuk);
    if (item.sk) setSK(item.sk);
    if (item.sp) setSP(item.sp);
    if (item.cadangan_aktiviti) setRptSuggestion(item.cadangan_aktiviti);
    
    // Jana objektif pembelajaran & kriteria kejayaan yang sepadan dengan SP
    if (item.sp) {
      const cleanSP = item.sp.split('\n')[0].replace(/^\d+(\.\d+)*\s*/, '').trim();
      if (activeLang === 'ar') {
        setLearningObjective(`في نهاية التعليم والتعلم ، يمكن للطلاب ${cleanSP.slice(0, 90)} بنجاح.`);
        setSuccessCriteria('الطلاب ناجحون إذا استطاعوا إتمام التدريبات بدقة وبنسبة ٨٠٪ على الأقل.');
      } else if (activeLang === 'en') {
        setLearningObjective(`By the end of the lesson, pupils will be able to: ${cleanSP.slice(0, 110)} with guidance.`);
        setSuccessCriteria('Pupils succeed if they complete the worksheet and reading tasks accurately.');
      } else {
        setLearningObjective(`Pada akhir sesi PdPc, murid dapat: ${cleanSP.slice(0, 110)} dengan betul.`);
        setSuccessCriteria('Murid berjaya sekiranya dapat melengkapkan sekurang-kurangnya 3 daripada 4 latihan yang diberikan.');
      }
    }

    if (item.standard_prestasi) {
      setPedagogy(prev => ({
        ...prev,
        pentaksiran: prev.pentaksiran.includes(item.standard_prestasi!)
          ? prev.pentaksiran
          : [...prev.pentaksiran, item.standard_prestasi!]
      }));
    }

    setIsCarryForwardActive(isCF);
  };

  // Fungsi pertukaran minggu persekolahan
  const handleWeekChange = (newWeek: number) => {
    let updatedMap = savedRecordsMap;
    // 1. Simpan auto-cache keadaan slot lama sebelum bertukar minggu
    if (activeTab === 'jadual') {
      const currentSlotKey = `week_${currentWeek}_slot_${selectedSlotIndex}`;
      const prevSnapshot = getCurrentSnapshot();
      const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;
      updatedMap = {
        ...savedRecordsMap,
        [currentSlotKey]: prevSnapshot
      };
      setSavedRecordsMap(updatedMap);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedMap));
      } catch (e) {}
    }

    setCurrentWeek(newWeek);
    const wInfo = synchronizedWeeks.find(w => w.minggu_ke === newWeek);
    if (wInfo) {
      setMondayDate(wInfo.tarikh_mula);
      setDate(wInfo.tarikh_mula);
    }

    if (activeTab === 'jadual') {
      const targetSlotKey = `week_${newWeek}_slot_${selectedSlotIndex}`;
      const savedForTarget = updatedMap[targetSlotKey];
      if (savedForTarget) {
        applyRecordToForm(savedForTarget);
      } else {
        const slot = timetable[selectedSlotIndex] || currentSlot;
        const targetLocale = getSubjectLocale(slot.subjek);
        const rptRec = findRPTRecord(slot.subjek, slot.tingkatan, newWeek);
        if (rptRec && !rptRec.adalah_cuti) {
          handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLocale.kod_bahasa);
        }
        setActivities(getCleanDefaultActivities(slot.subjek, targetLocale.kod_bahasa));
        setReflection(getCleanDefaultReflection(slot.bilangan_murid, targetLocale.kod_bahasa));
      }
    } else {
      const targetLocale = getSubjectLocale(subject);
      const rptRec = findRPTRecord(subject, form, newWeek);
      if (rptRec && !rptRec.adalah_cuti) {
        handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLocale.kod_bahasa);
      }
    }
  };

  // Fungsi menyelaraskan borang dengan slot jadual (Menjamin subjek sentiasa mengikut penetapan jadual waktu guru)
  const syncWithSlot = (
    newIndex: number,
    tt: typeof timetable,
    forceReset: boolean = false,
    customRecordsMap?: Record<string, RPHRecord>
  ) => {
    const slots = tt && tt.length > 0 ? tt : timetable;
    if (!slots || slots.length === 0) return;
    const targetSlot = slots[newIndex] || slots[0];
    if (!targetSlot) return;

    const targetDay = (targetSlot.hari || '').toUpperCase();
    const autoDayDate = weekDates[targetDay] || mondayDate || date;
    const targetSlotKey = `week_${currentWeek}_slot_${newIndex}`;
    const mapToUse = customRecordsMap || savedRecordsMap;
    const savedForTarget = mapToUse[targetSlotKey];
    const targetLocale = getSubjectLocale(targetSlot.subjek);
    const targetLang = targetLocale.kod_bahasa;

    // Pastikan jika penetapan jadual waktu guru mempunyai subjek baharu, subjek dari jadual diutamakan!
    if (savedForTarget && savedForTarget.subjek === targetSlot.subjek && !forceReset) {
      applyRecordToForm({
        ...savedForTarget,
        subjek: targetSlot.subjek,
        tingkatan: targetSlot.tingkatan,
        kelas: targetSlot.kelas,
        masa_mula: savedForTarget.masa_mula || targetSlot.masa_mula,
        masa_tamat: savedForTarget.masa_tamat || targetSlot.masa_tamat,
        tarikh: autoDayDate
      });
      setDate(autoDayDate);
      setIsCarryForwardActive(!!savedForTarget.adalah_carry_forward);
    } else {
      // Subjek atau slot bertukar dari penetapan jadual: muatkan kurikulum baharu yang sepadan
      setSubject(targetSlot.subjek);
      setForm(targetSlot.tingkatan);
      setClassName(targetSlot.kelas);
      setStartTime(savedForTarget?.masa_mula || targetSlot.masa_mula);
      setEndTime(savedForTarget?.masa_tamat || targetSlot.masa_tamat);
      setDate(autoDayDate);
      setIsCarryForwardActive(false);

      const rptRec = findRPTRecord(targetSlot.subjek, targetSlot.tingkatan, currentWeek);
      if (rptRec && !rptRec.adalah_cuti) {
        handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLang);
      } else {
        setTema('');
        setTajuk('');
        setSK('');
        setSP('');
        setRptSuggestion('');
        if (targetLang === 'ar') {
          setLearningObjective('في نهاية التعليم والتعلم ، يمكن للطلاب تحقيق أهداف الدرس بنجاح.');
          setSuccessCriteria('الطلاب ناجحون إذا استطاعوا إتمام التدريبات بدقة وبنسبة ٨٠٪ على الأقل.');
        } else if (targetLang === 'en') {
          setLearningObjective('By the end of the lesson, pupils will be able to achieve the lesson objectives.');
          setSuccessCriteria('Pupils succeed if they complete the worksheet and reading tasks accurately.');
        } else {
          setLearningObjective('Pada akhir sesi PdPc, murid dapat mencapai objektif pembelajaran yang ditetapkan.');
          setSuccessCriteria('Murid berjaya sekiranya dapat melengkapkan latihan yang diberikan dengan betul.');
        }
      }

      setActivities(getCleanDefaultActivities(targetSlot.subjek, targetLang));
      setPedagogy(getCleanDefaultPedagogy());
      setReflection(getCleanDefaultReflection(targetSlot.bilangan_murid, targetLang));
    }
  };

  // Apabila slot jadual ditukar (Mod Jadual)
  const handleSlotChange = (newIndex: number) => {
    let updatedMap = savedRecordsMap;

    // 1. Simpan auto-cache keadaan slot lama supaya perubahan guru tidak hilang
    if (activeTab === 'jadual') {
      const currentSlotKey = `week_${currentWeek}_slot_${selectedSlotIndex}`;
      const prevSnapshot = getCurrentSnapshot();
      const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;
      updatedMap = {
        ...savedRecordsMap,
        [currentSlotKey]: prevSnapshot
      };
      setSavedRecordsMap(updatedMap);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedMap));
      } catch (e) {}

      // Jika masa slot semasa telah diubah, kemas kini juga slot jadual guru
      if (timetable && timetable[selectedSlotIndex] && updateSlot) {
        const curSlot = timetable[selectedSlotIndex];
        if (curSlot.masa_mula !== prevSnapshot.masa_mula || curSlot.masa_tamat !== prevSnapshot.masa_tamat) {
          updateSlot(selectedSlotIndex, {
            ...curSlot,
            masa_mula: prevSnapshot.masa_mula || curSlot.masa_mula,
            masa_tamat: prevSnapshot.masa_tamat || curSlot.masa_tamat
          });
        }
      }
    }

    // 2. Berpindah ke slot baharu & selaraskan dengan jadual (hantar updatedMap agar data snapshot sedia ada tidak hilang)
    setSelectedSlotIndex(newIndex);
    syncWithSlot(newIndex, timetable, false, updatedMap);

    const targetSlot = timetable[newIndex];
    if (targetSlot) {
      setClipboardToast(`Beralih ke: ${targetSlot.subjek} (${targetSlot.kelas} • ${targetSlot.hari})`);
      setTimeout(() => setClipboardToast(null), 3000);
    }
  };

  // Fungsi pertukaran subjek dalam Mod Kustom (MENGELAKKAN PERTINDIHAN DENGAN SUBJEK LAIN)
  const handleCustomSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    const targetLocale = getSubjectLocale(newSubject);
    const targetLang = targetLocale.kod_bahasa;

    // Cari RPT atau DSKP untuk subjek baharu
    const rptRec = findRPTRecord(newSubject, form, currentWeek);
    if (rptRec && !rptRec.adalah_cuti) {
      handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLang);
    } else {
      setTema('');
      setTajuk('');
      setSK('');
      setSP('');
      setRptSuggestion('');
      if (targetLang === 'ar') {
        setLearningObjective('في نهاية التعليم والتعلم ، يمكن للطلاب تحقيق أهداف الدرس بنجاح.');
        setSuccessCriteria('الطلاب ناجحون إذا استطاعوا إتمام التدريبات المحددة بدقة.');
      } else if (targetLang === 'en') {
        setLearningObjective('By the end of the lesson, pupils will be able to achieve the lesson objectives.');
        setSuccessCriteria('Pupils succeed if they complete the assigned exercises accurately.');
      } else {
        setLearningObjective('Pada akhir sesi PdPc, murid dapat mencapai objektif pembelajaran yang ditetapkan.');
        setSuccessCriteria('Murid berjaya sekiranya dapat melengkapkan latihan tugasan dengan betul.');
      }
    }

    // Set semula aktiviti, pedagogi & refleksi agar tidak bertindih dengan subjek terdahulu
    setActivities(getCleanDefaultActivities(newSubject, targetLang));
    setPedagogy(getCleanDefaultPedagogy());
    setReflection(getCleanDefaultReflection(30, targetLang));

    setClipboardToast(`Subjek ditukar kepada: ${newSubject} • Data diselaraskan`);
    setTimeout(() => setClipboardToast(null), 3000);
  };

  // Fungsi pertukaran tingkatan dalam Mod Kustom
  const handleCustomFormChange = (newForm: string) => {
    setForm(newForm);
    const targetLocale = getSubjectLocale(subject);
    const targetLang = targetLocale.kod_bahasa;

    const rptRec = findRPTRecord(subject, newForm, currentWeek);
    if (rptRec && !rptRec.adalah_cuti) {
      handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLang);
    } else {
      setTema('');
      setTajuk('');
      setSK('');
      setSP('');
    }
  };

  // Fungsi menyegerakkan RPT secara manual dalam Mod Kustom
  const handleSyncCustomRPT = () => {
    const targetLocale = getSubjectLocale(subject);
    const rptRec = findRPTRecord(subject, form, currentWeek);
    if (rptRec && !rptRec.adalah_cuti) {
      handleApplyRPTItem(convertToRPTItem(rptRec), false, targetLocale.kod_bahasa);
      setSaveSuccess(true);
      setSaveSuccessMessage(`RPT ${subject} Tingkatan ${form} berjaya disegerakkan!`);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(`Tiada rekod RPT khusus ditemui bagi ${subject} Tingkatan ${form} Minggu ${currentWeek}. Anda boleh isi secara manual atau jana dengan AI.`);
    }
  };

  // Fungsi kosongkan medan untuk RPH Kustom baharu
  const handleResetForm = () => {
    setTema('');
    setTajuk('');
    setSK('');
    setSP('');
    setLearningObjective('');
    setSuccessCriteria('');
    const targetLocale = getSubjectLocale(subject);
    setActivities(getCleanDefaultActivities(subject, targetLocale.kod_bahasa));
    setPedagogy(getCleanDefaultPedagogy());
    setReflection(getCleanDefaultReflection(30, targetLocale.kod_bahasa));
    setRptSuggestion('');
    setIsCarryForwardActive(false);
  };

  // Dengar perubahan penetapan jadual atau penukaran minggu/parameter untuk memastikan subjek sentiasa terkini dari jadual
  useEffect(() => {
    if (activeTab === 'jadual' && timetable && timetable.length > 0) {
      const currentSignature = JSON.stringify(
        timetable.map(s => `${s.hari}_${s.slot_ke}_${s.subjek}_${s.kelas}`)
      );
      const isChanged = prevTimetableSignature.current !== '' && prevTimetableSignature.current !== currentSignature;
      const isFirstLoad = !hasInitializedRef.current;

      if (isChanged || isFirstLoad) {
        prevTimetableSignature.current = currentSignature;
        hasInitializedRef.current = true;

        let targetIndex = selectedSlotIndex;
        if (paramSlot !== null) {
          const parsed = parseInt(paramSlot, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < timetable.length) {
            targetIndex = parsed;
            setSelectedSlotIndex(parsed);
          }
        } else if (paramDay !== null) {
          const idx = timetable.findIndex(s => s.hari?.toUpperCase() === paramDay.toUpperCase());
          if (idx !== -1) {
            targetIndex = idx;
            setSelectedSlotIndex(idx);
          }
        } else if (paramSubject !== null) {
          const idx = timetable.findIndex(s => s.subjek?.toLowerCase().includes(paramSubject.toLowerCase()));
          if (idx !== -1) {
            targetIndex = idx;
            setSelectedSlotIndex(idx);
          }
        }

        const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;
        let loadedRecords: Record<string, RPHRecord> = savedRecordsMap;
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              loadedRecords = parsed;
              setSavedRecordsMap(parsed);
            }
          }
        } catch {}

        syncWithSlot(targetIndex, timetable, false, loadedRecords);
      }
    }
  }, [timetable, selectedSlotIndex, activeTab, currentWeek, paramSlot, paramDay, paramSubject]);

  // Real-time Auto-save: Maklumat pengisian disimpan secara automatik dalam masa nyata tanpa perlu menekan simpan setiap kali siap
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const snapshot = getCurrentSnapshot();
      const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;

      setSavedRecordsMap(prevMap => {
        const updated = {
          ...prevMap,
          [snapshot.id!]: snapshot
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn('Gagal menyimpan real-time:', e);
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTimestamp(timeStr);
      setSaveStatus('saved');
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    subject,
    form,
    className,
    startTime,
    endTime,
    date,
    tema,
    tajuk,
    sk,
    sp,
    rptSuggestion,
    learningObjective,
    successCriteria,
    activities,
    pedagogy,
    reflection,
    currentWeek,
    selectedSlotIndex,
    activeTab,
    customDay
  ]);

  const handleApplyAIContent = (res: GeminiCoPilotResponse) => {
    setLearningObjective(res.objektif_pembelajaran);
    if (res.kriteria_kejayaan) setSuccessCriteria(res.kriteria_kejayaan);
    if (res.aktiviti) setActivities(res.aktiviti);
  };

  // ---------------------------------------------------------------------------
  // FUNGSI SIMPAN e-RPH SEBAGAI DRAF (SECARA MANUAL JIKA DIPERLUKAN)
  // ---------------------------------------------------------------------------
  const handleSaveDraft = () => {
    const snapshot = getCurrentSnapshot();
    const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;
    const updatedMap = {
      ...savedRecordsMap,
      [snapshot.id!]: snapshot
    };
    setSavedRecordsMap(updatedMap);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedMap));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage:', e);
    }

    const timeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    setLastSavedTimestamp(timeStr);
    setSaveStatus('saved');
    setSaveSuccess(true);
    setSaveSuccessMessage(`RPH bagi ${subject} (${className}) Minggu ${currentWeek} berjaya disimpan pada jam ${timeStr}!`);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // ---------------------------------------------------------------------------
  // FUNGSI PENGUBAHSUAIAN TARIKH DENGAN AUTOMASI HARI BERIKUTNYA DARI ISNIN
  // ---------------------------------------------------------------------------
  const handleDateChange = (newDate: string) => {
    setDate(newDate);

    const activeDay = (activeTab === 'kustom' ? customDay : (currentSlot?.hari || '')).toUpperCase();

    if (activeDay === 'ISNIN') {
      // Guru mengubah tarikh pada hari Isnin -> Automate tarikh hari-hari berikutnya (Selasa - Jumaat)
      setMondayDate(newDate);
      const newWeekDates = calculateWeekDatesFromMonday(newDate);

      // Kemas kini semua rekod slot tersimpan dalam savedRecordsMap yang mempunyai hari Selasa-Jumaat
      setSavedRecordsMap(prevMap => {
        const updated = { ...prevMap };

        Object.keys(updated).forEach(key => {
          const rec = updated[key];
          if (rec && rec.hari) {
            const dayUpper = rec.hari.toUpperCase();
            if (newWeekDates[dayUpper] && rec.tarikh !== newWeekDates[dayUpper]) {
              updated[key] = {
                ...rec,
                tarikh: newWeekDates[dayUpper]
              };
            }
          }
        });

        try {
          const storageKey = `erph_saved_records_${user?.uid || teacherEmail || 'alhasanah'}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {}

        return updated;
      });

      setClipboardToast(`Tarikh Isnin (${newDate}) disimpan. Tarikh Selasa hingga Jumaat diselaraskan secara automatik!`);
      setTimeout(() => setClipboardToast(null), 4500);
    }
  };

  const handlePrint = () => {
    printOrSaveRPH({
      rphList: getWeeklyRPHList(),
      teacherName: teacherName || userProfile?.full_name || 'GURU',
      teacherEmail: teacherEmail || '',
      weekNo: currentWeek,
      schoolName: userProfile?.school_name || 'SEKOLAH SAYA',
      schoolLogo: userProfile?.school_logo,
      planType: planType,
      teacherSignature: userProfile?.teacher_signature
    });
  };

  const handleSavePdf = async () => {
    await downloadRPHPdf({
      rphList: getWeeklyRPHList(),
      teacherName: teacherName || userProfile?.full_name || 'GURU',
      teacherEmail: teacherEmail || '',
      weekNo: currentWeek,
      schoolName: userProfile?.school_name || 'SEKOLAH SAYA',
      schoolLogo: userProfile?.school_logo,
      planType: planType,
      teacherSignature: userProfile?.teacher_signature
    });
  };

  // ---------------------------------------------------------------------------
  // FUNGSI COPY & PASTE RPH ANTARA JADUAL KELAS (Keperluan Pengguna 4)
  // ---------------------------------------------------------------------------
  const handleCopyRPH = () => {
    const activeDay = activeTab === 'kustom' ? customDay : currentSlot.hari;
    const payload = {
      sourceSubject: subject,
      sourceClass: className,
      sourceDay: activeDay,
      sourceTime: `${startTime} - ${endTime}`,
      tema,
      tajuk,
      sk,
      sp,
      rptSuggestion,
      learningObjective,
      successCriteria,
      activities: { ...activities },
      pedagogy: { ...pedagogy },
      reflection: { ...reflection },
      copiedAt: new Date().toLocaleTimeString('ms-MY')
    };

    setClipboardData(payload);
    try {
      localStorage.setItem('erph_clipboard_rph', JSON.stringify(payload));
    } catch {}

    setClipboardToast(`RPH (${subject} - ${className}) telah disalin! Anda boleh menukar slot jadual/kelas dan klik "Tampal RPH".`);
    setTimeout(() => setClipboardToast(null), 4500);
  };

  const handlePasteRPH = () => {
    if (!clipboardData) {
      alert('Papan klip RPH kosong. Sila klik "Salin RPH" terlebih dahulu pada mana-mana kelas.');
      return;
    }

    if (clipboardData.tema !== undefined) setTema(clipboardData.tema);
    if (clipboardData.tajuk !== undefined) setTajuk(clipboardData.tajuk);
    if (clipboardData.sk !== undefined) setSK(clipboardData.sk);
    if (clipboardData.sp !== undefined) setSP(clipboardData.sp);
    if (clipboardData.rptSuggestion !== undefined) setRptSuggestion(clipboardData.rptSuggestion);
    if (clipboardData.learningObjective !== undefined) setLearningObjective(clipboardData.learningObjective);
    if (clipboardData.successCriteria !== undefined) setSuccessCriteria(clipboardData.successCriteria);
    if (clipboardData.activities) setActivities({ ...clipboardData.activities });
    if (clipboardData.pedagogy) setPedagogy({ ...clipboardData.pedagogy });
    if (clipboardData.reflection) setReflection({ ...clipboardData.reflection });

    setClipboardToast(`RPH berjaya ditampal ke kelas ${className}!`);
    setTimeout(() => setClipboardToast(null), 4500);
  };

  const handleSelectTargetSlotForCopy = (targetIndex: number) => {
    handleCopyRPH();
    handleSlotChange(targetIndex);
    setTimeout(() => {
      handlePasteRPH();
      setIsCopyModalOpen(false);
    }, 120);
  };

  const handleCarryForwardToNextSlot = () => {
    handleCopyRPH();
    const nextIndex = (selectedSlotIndex + 1) % timetable.length;
    handleSlotChange(nextIndex);
    setTimeout(() => {
      handlePasteRPH();
      setIsCarryForwardActive(true);
      setClipboardToast(`RPH berjaya dibawa ke jadual kelas seterusnya: ${timetable[nextIndex]?.kelas} (${timetable[nextIndex]?.hari})`);
      setTimeout(() => setClipboardToast(null), 4500);
    }, 150);
  };

  // ---------------------------------------------------------------------------
  // PENGUMPULAN RPH SEMINGGU PENUH (ISNIN - JUMAAT) & PENGHANTARAN GOOGLE DRIVE PDF
  // ---------------------------------------------------------------------------
  const getWeeklyRPHList = (): Partial<RPHRecord>[] => {
    const weekDays = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
    const currentActiveDay = activeTab === 'kustom' ? customDay : currentSlot.hari;

    // Ambil semua slot mengajar Isnin-Jumaat daripada jadual guru
    const scheduledSlots = timetable.filter(s => weekDays.includes(s.hari?.toUpperCase() || ''));
    const effectiveSlots = scheduledSlots.length > 0 ? scheduledSlots : [currentSlot];

    return effectiveSlots.map((slot, idx) => {
      const slotDay = (slot.hari || '').toUpperCase();
      const slotDate = weekDates[slotDay] || mondayDate || date;

      const isCurrentlyActiveSlot = (activeTab === 'jadual' && selectedSlotIndex === idx) ||
        (slot.hari === currentActiveDay && slot.subjek === subject && slot.kelas === className);

      if (isCurrentlyActiveSlot) {
        const snap = getCurrentSnapshot();
        return {
          ...snap,
          tarikh: slotDate
        };
      }

      // Semak jika terdapat rekod tersimpan bagi slot ini
      const slotKey = `week_${currentWeek}_slot_${idx}`;
      if (savedRecordsMap[slotKey]) {
        return {
          ...savedRecordsMap[slotKey],
          tarikh: slotDate
        };
      }

      const rptRec = findRPTRecord(slot.subjek, slot.tingkatan, currentWeek);
      const slotLocale = getSubjectLocale(slot.subjek);
      const isArabicSlot = slotLocale.kod_bahasa === 'ar';
      const langCode = slotLocale.kod_bahasa;

      return {
        id: slotKey,
        tahun_akademik: 2027,
        minggu_ke: currentWeek,
        tarikh: slotDate,
        hari: slot.hari,
        masa_mula: slot.masa_mula,
        masa_tamat: slot.masa_tamat,
        tingkatan: slot.tingkatan,
        kelas: slot.kelas,
        subjek: slot.subjek,
        kod_bahasa: langCode,
        arah_teks: isArabicSlot ? 'rtl' : 'ltr',
        tema: rptRec?.tema || 'Standard Kurikulum DSKP',
        tajuk: rptRec?.label_minggu || `Minggu ${currentWeek}`,
        sk: rptRec?.sk || 'Standard Kandungan KPM',
        sp: rptRec?.sp || 'Standard Pembelajaran KPM',
        objektif_pembelajaran: rptRec?.sp
          ? (langCode === 'ar'
              ? `في نهاية التعليم والتعلم ، يمكن للطلاب استيعاب: ${rptRec.sp.slice(0, 90)} بنجاح.`
              : `Pada akhir sesi PdPc, murid dapat menguasai: ${rptRec.sp}`)
          : (langCode === 'ar'
              ? 'في نهاية التعليم والتعلم ، يمكن للطلاب تحقيق أهداف الدرس بنجاح.'
              : 'Pada akhir PdPc murid dapat mencapai objektif standard.'),
        kriteria_kejayaan: langCode === 'ar'
          ? 'الطلاب ناجحون إذا استطاعوا إتمام التدريبات المحددة بدقة.'
          : 'Murid berjaya sekiranya melengkapkan latihan tugasan dengan betul.',
        aktiviti: getCleanDefaultActivities(slot.subjek, langCode),
        pedagogi: getCleanDefaultPedagogy(),
        refleksi: getCleanDefaultReflection(slot.bilangan_murid, langCode),
        status: 'SELESAI'
      };
    });
  };

  const handleUploadToGoogleDrive = async () => {
    setIsDriveModalOpen(true);
    setIsUploadingDrive(true);
    setDriveResult(null);

    const weeklyList = getWeeklyRPHList();

    if (!googleAccessToken) {
      setIsUploadingDrive(false);
      setDriveResult({
        success: false,
        fileName: `${formatRPHFileName(teacherName, currentWeek)}.pdf`,
        folderName: `e-RPH DeLIMA / Minggu ${String(currentWeek).padStart(2, '0')}`,
        isPDF: true,
        slotsCount: weeklyList.length,
        error: 'Sesi capaian Google Drive belum diaktifkan dalam sesi ini. Sila klik "Sambungkan Google Drive" di bawah untuk membenarkan akses My Drive, atau muat turun fail seminggu secara terus.'
      });
      return;
    }

    const res = await uploadWeeklyRPHToMyDrive({
      rphList: weeklyList,
      teacherName: teacherName || 'GURU',
      teacherEmail: teacherEmail || '',
      weekNo: currentWeek,
      accessToken: googleAccessToken,
      schoolName: userProfile?.school_name || 'SEKOLAH SAYA'
    });

    setDriveResult(res);
    setIsUploadingDrive(false);
  };

  const handleDownloadHtmlFile = () => {
    const weeklyList = getWeeklyRPHList();
    const htmlContent = generateWeeklyRPHHtml({
      rphList: weeklyList,
      teacherName: teacherName || userProfile?.full_name || 'GURU',
      teacherEmail: teacherEmail || '',
      weekNo: currentWeek,
      schoolName: userProfile?.school_name || 'SEKOLAH SAYA',
      schoolLogo: userProfile?.school_logo,
      planType: planType,
      teacherSignature: userProfile?.teacher_signature
    });
    const fileName = `${formatRPHFileName(teacherName, currentWeek)}.html`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user || !isDeLIMA) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Mengesahkan sesi ID DeLIMA...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="no-print erph-form-editor space-y-6">
      
      {/* =========================================================================
          TAB PILIHAN MOD: E-RPH BERJADUAL VS E-RPH KUSTOM (TAB BERASINGAN)
         ========================================================================= */}
      <div className="flex items-center space-x-2 p-1.5 bg-slate-200/80 rounded-2xl no-print max-w-fit shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('jadual')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'jadual'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>e-RPH Berjadual (Jadual Guru &amp; RPT)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kustom')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'kustom'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>e-RPH Kustom (Bebas / Relief / Khas)</span>
          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-gradient-to-r from-amber-500 to-emerald-600 text-white rounded-full">
            Tab Kustom
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('karakter')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'karakter'
              ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>e-RPH Pembentukan Karakter (15 Minit)</span>
          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-400 text-slate-950 rounded-full">
            Kurikulum 2027
          </span>
        </button>
      </div>

      {/* =========================================================================
          KANDUNGAN TAB 1: MOD E-RPH BERJADUAL (SLOT JADUAL WAKTU & RPT SEGERAK)
         ========================================================================= */}
      {activeTab === 'jadual' && (
        <div className="space-y-4 animate-fade-in">
          {/* Bar Maklumat Minggu & Navigasi RPT */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-md no-print border border-emerald-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-extrabold text-base text-emerald-300 shadow-inner shrink-0">
                  M{currentWeek}
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                      Maklumat Minggu Persekolahan: Minggu {currentWeek}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-200 rounded-full border border-emerald-400/30">
                      {currentWeekInfo?.penggal || 'Penggal Persekolahan'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                    Julat Tarikh: <span className="text-white font-bold">{currentWeekInfo?.tarikh_teks || `${currentWeekInfo?.tarikh_mula} – ${currentWeekInfo?.tarikh_tamat}`}</span> &bull; 44 Minggu Persekolahan Diselaraskan
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto justify-end shrink-0">
                <button
                  type="button"
                  disabled={currentWeek <= 1}
                  onClick={() => handleWeekChange(Math.max(1, currentWeek - 1))}
                  className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl text-white transition-colors"
                  title="Minggu Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={currentWeek}
                  onChange={(e) => handleWeekChange(Number(e.target.value))}
                  className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold border border-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  {teachingWeeks.map((w) => (
                    <option key={w.minggu_ke} value={w.minggu_ke!} className="bg-slate-900 text-white">
                      Minggu {w.minggu_ke} ({w.tarikh_teks})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={currentWeek >= 44}
                  onClick={() => handleWeekChange(Math.min(44, currentWeek + 1))}
                  className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl text-white transition-colors"
                  title="Minggu Seterusnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Pilihan Slot Jadual Waktu Mengajar (Quick Slot Bar) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm no-print">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Pilih Slot Mengajar: <span className="text-emerald-700 font-extrabold">{teacherName}</span>
                </span>
              </div>
<<<<<<< HEAD
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-1">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-3 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95"
                  title="Jana pautan semakan mingguan untuk Pengetua / Guru Besar"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Semakan Pengetua</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWeeklyAIModalOpen(true)}
                  className="text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-indigo-700 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95"
                  title="Jana RPH untuk semua slot jadual minggu ini secara serentak dengan Gemini AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                  <span>Jana RPH Seminggu (AI)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimetableEditorOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah Suai Jadual</span>
                </button>
              </div>
=======
              <button
                type="button"
                onClick={() => setIsTimetableEditorOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Suai Jadual Mengajar</span>
              </button>
>>>>>>> parent of 22f68d3 (gemini,jana rph seminggu)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {timetable.map((slot, idx) => {
                const isSelected = selectedSlotIndex === idx;
                const slotKey = `week_${currentWeek}_slot_${idx}`;
                const isSaved = !!savedRecordsMap[slotKey];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSlotChange(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs relative ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] uppercase tracking-wide opacity-90">
                        {slot.hari} (Slot {slot.slot_ke})
                      </span>
                      {isSaved && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center ${
                          isSelected ? 'bg-emerald-950/70 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          <span>Disimpan</span>
                        </span>
                      )}
                    </div>
                    <div className="font-bold truncate mt-0.5">{slot.subjek}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{slot.kelas} &bull; {slot.masa_mula}</div>
                  </button>
                );
              })}
            </div>

            {/* BAR PINTAR COPY & PASTE RPH ANTARA JADUAL KELAS */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Salin &amp; Tampal e-RPH ke Jadual Kelas Lain
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {clipboardData
                      ? `Disalin: ${clipboardData.sourceSubject} (${clipboardData.sourceClass} • ${clipboardData.sourceDay})`
                      : 'Salin perancangan RPH ini untuk ditampal ke mana-mana jadual kelas yang berbeza.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleCopyRPH}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-all hover:scale-105"
                  title="Salin semua kandungan RPH kelas semasa"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salin RPH</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasteRPH}
                  disabled={!clipboardData}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-all hover:scale-105"
                  title="Tampal kandungan RPH yang telah disalin ke slot semasa"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Tampal RPH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(true)}
                  className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-all hover:scale-105"
                  title="Salin terus ke jadual kelas lain dalam jadual guru"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Salin ke Kelas Lain...</span>
                </button>
              </div>
            </div>
          </div>

          {clipboardToast && (
            <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-between animate-in fade-in no-print">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{clipboardToast}</span>
              </div>
              <button type="button" onClick={() => setClipboardToast(null)} className="text-white hover:text-emerald-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* RPT Connector Banner & Carry Forward Handler */}
          <RPTConnectorBanner
            currentWeek={currentWeek}
            subject={subject}
            form={form}
            onApplyRPTItem={(item, isCF) => handleApplyRPTItem(item, isCF)}
            isCarryForwardActive={isCarryForwardActive}
          />
        </div>
      )}

      {/* =========================================================================
          KANDUNGAN TAB 2: MOD E-RPH KUSTOM (BEBAS / KELAS GANTI / PROGRAM KHAS)
         ========================================================================= */}
      {activeTab === 'kustom' && (
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-800 space-y-5 no-print animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-extrabold border border-amber-400/30 shadow-inner shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>Mod Penyediaan e-RPH Kustom &amp; Fleksibel</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full">
                    Bebas
                  </span>
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Sesuai untuk kelas ganti (relief), bengkel/amali makmal, topik tambahan, atau aktiviti khas tanpa sekatan slot jadual tetap.
                </p>
              </div>
            </div>

            {/* Butang Tindakan Pantas Kustom */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleSyncCustomRPT}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                title="Muat data RPT yang sepadan dengan subjek & minggu pilihan"
              >
                <Database className="w-3.5 h-3.5 text-emerald-200" />
                <span>Muat RPT Minggu Ini</span>
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                title="Kosongkan kandungan aktiviti dan objektif"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            </div>
          </div>

          {/* Pilihan Tag Jenis Sesi Kustom */}
          <div>
            <label className="block text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider mb-2">
              Kategori / Jenis Sesi Pengajaran:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Kelas Biasa',
                'Pembentukan Karakter (15 minit)',
                'Kelas Ganti (Relief)',
                'Kelas Tambahan / Pengukuhan',
                'Amali Makmal / Bengkel',
                'Ulang Kaji / Pentaksiran UASA',
                'Aktiviti Khas / Ko-Kurikulum'
              ].map((type) => {
                const isSelected = customSessionType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (type === 'Pembentukan Karakter (15 minit)') {
                        setActiveTab('karakter');
                      } else {
                        setCustomSessionType(type);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : 'bg-white/10 text-emerald-200 hover:bg-white/20'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Konfigurasi: Subjek, Tingkatan, Kelas, Hari, Minggu, Masa Mula, Masa Tamat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            
            {/* Pilihan Subjek */}
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-emerald-300">
                  Subjek
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualSubjectInput(!isManualSubjectInput)}
                  className="text-[10px] text-amber-300 hover:underline font-semibold"
                >
                  {isManualSubjectInput ? 'Pilih dari senarai RPT' : 'Taip Nama Lain'}
                </button>
              </div>

              {isManualSubjectInput ? (
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleCustomSubjectChange(e.target.value)}
                  placeholder="Contoh: Reka Bentuk & Teknologi, Sejarah..."
                  className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              ) : (
                <select
                  value={subject}
                  onChange={(e) => handleCustomSubjectChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  {Object.keys(rptCatalog).map((subj) => (
                    <option key={subj} value={subj} className="bg-slate-900 text-white">
                      {subj}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Pilihan Tingkatan */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                Tingkatan
              </label>
              <select
                value={form}
                onChange={(e) => handleCustomFormChange(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {['1', '2', '3', '4', '5', '6'].map((f) => (
                  <option key={f} value={f} className="bg-slate-900 text-white">
                    Tingkatan {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Kelas (Dropdown dari dropdown_data.csv) */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                Kelas (dropdown_data)
              </label>
              <select
                value={className}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {dropdownOptions.kelas.map((cls) => (
                  <option key={cls} value={cls} className="bg-slate-900 text-white">
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Hari */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                Hari
              </label>
              <select
                value={customDay}
                onChange={(e) => setCustomDay(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'].map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Minggu */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                Minggu
              </label>
              <select
                value={currentWeek}
                onChange={(e) => handleWeekChange(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {teachingWeeks.map((w) => (
                  <option key={w.minggu_ke} value={w.minggu_ke!} className="bg-slate-900 text-white">
                    Minggu {w.minggu_ke}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Masa Mula (Dropdown dari dropdown_data.csv) */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                Masa Mula (dropdown_data)
              </label>
              <select
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {!dropdownOptions.waktu.some(t => t.formatted === startTime) && startTime && (
                  <option value={startTime} className="bg-slate-900 text-white">{startTime}</option>
                )}
                {dropdownOptions.waktu.map((t) => (
                  <option key={`cstart-${t.value}`} value={t.formatted} className="bg-slate-900 text-white">
                    {t.formatted}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Masa Tamat (Dropdown dari dropdown_data.csv) */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">
                Masa Tamat (dropdown_data)
              </label>
              <select
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-800/90 border border-emerald-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {!dropdownOptions.waktu.some(t => t.formatted === endTime) && endTime && (
                  <option value={endTime} className="bg-slate-900 text-white">{endTime}</option>
                )}
                {dropdownOptions.waktu.map((t) => (
                  <option key={`cend-${t.value}`} value={t.formatted} className="bg-slate-900 text-white">
                    {t.formatted}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}

      {/* Bar Pemilihan Mod Paparan: Borang Dinamik vs Templat Jadual Siap Dijana */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-3 sm:p-4 rounded-2xl text-white shadow-md border border-emerald-800/60 no-print">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
            {viewMode === 'table' ? (
              <FileText className="w-4 h-4 text-emerald-400" />
            ) : (
              <Edit3 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-xs font-extrabold flex items-center space-x-1.5">
              <span>Pilihan Mod:</span>
              <span className="text-emerald-300">
                {viewMode === 'table' ? 'Templat Jadual Rasmi (KPM Table)' : 'Borang Input Dinamik'}
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              {viewMode === 'table'
                ? 'Struktur jadual rasmi siap dijana, kemas berkotak, dan mematuhi standard KPM 1 muka surat A4.'
                : 'Isi atau sunting perincian kurikulum, langkah PdPc, pedagogi, dan refleksi.'}
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'form'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-white hover:text-emerald-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Borang Input</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-white hover:text-emerald-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Templat Jadual (Siap Dijana)</span>
          </button>
        </div>
      </div>

      {/* Tindakan Utama & Indikator Bahasa / RTL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          <span className="text-xs font-bold text-slate-700">Subjek Semasa:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            {subject} (Tingkatan {form})
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            Kelas: {className}
          </span>
          {activeTab === 'kustom' && (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
              {customSessionType}
            </span>
          )}
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isRTL ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
          }`}>
            {direction.toUpperCase()} ({kodBahasa.toUpperCase()}) &bull; {fontClass}
          </span>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end flex-wrap gap-y-2">
          {/* Status Simpanan Real-time (Auto-save) */}
          <div className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 transition-all shadow-xs">
            {saveStatus === 'saving' ? (
              <span className="text-amber-700 flex items-center space-x-1.5 animate-pulse font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Menyimpan real-time...</span>
              </span>
            ) : (
              <span className="text-emerald-800 flex items-center space-x-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Disimpan real-time {lastSavedTimestamp ? `(${lastSavedTimestamp})` : ''}</span>
              </span>
            )}
          </div>

          {/* 1. Butang CO-PILOT AI */}
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95"
            title="Buka Pembantu Pintar Co-Pilot AI"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>CO-PILOT AI</span>
          </button>

          {/* 2. Butang SIMPAN PDF */}
          <button
            type="button"
            onClick={handleSavePdf}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
            title="Simpan e-RPH sebagai fail PDF berkualiti tinggi"
          >
            <FileDown className="w-4 h-4" />
            <span>SIMPAN PDF</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PILIHAN MOD: TEMPLAT JADUAL SIAP DIJANA (TABLE KPM) VS BORANG DINAMIK
         ========================================================================= */}
      {activeTab === 'karakter' ? (
        <KarakterRPHSection
          currentWeek={currentWeek}
          initialDate={date}
          initialForm={form}
          initialClass={className}
          classList={dropdownOptions.kelas}
          teacherName={teacherName || 'GURU'}
          teacherEmail={teacherEmail || ''}
          savedRecord={getCurrentSnapshot()}
          onSaveRecord={(record) => {
            if (record.tarikh) setDate(record.tarikh);
            if (record.tingkatan) setForm(record.tingkatan);
            if (record.kelas) setClassName(record.kelas);
            if (record.masa_mula) setStartTime(record.masa_mula);
            if (record.masa_tamat) setEndTime(record.masa_tamat);
            if (record.sp) setSP(record.sp);
            if (record.kriteria_kejayaan) setSuccessCriteria(record.kriteria_kejayaan);
            handleSaveDraft();
          }}
        />
      ) : viewMode === 'table' ? (
        <RPHGeneratedTableView
          rph={getCurrentSnapshot()}
          teacherName={teacherName || userProfile?.full_name || 'GURU'}
          teacherEmail={teacherEmail || ''}
          slotIndex={selectedSlotIndex + 1}
          totalSlots={timetable.length}
          schoolName={userProfile?.school_name || 'SEKOLAH SAYA'}
          schoolLogo={userProfile?.school_logo}
          planType={planType}
          teacherSignature={userProfile?.teacher_signature}
          onPrint={handlePrint}
          onDownloadHtml={handleDownloadHtmlFile}
          onSwitchToForm={() => setViewMode('form')}
        />
      ) : (
        <div
          dir={direction}
          className={`bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-8 ${fontClass}`}
        >
        
        {/* Header Rasmi Borang e-RPH */}
        <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <img
            src={userProfile?.school_logo || '/logo-al-hasanah.png'}
            alt="Logo Sekolah"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow shrink-0"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900">
              RANCANGAN PENGAJARAN HARIAN (e-RPH KPM)
            </h2>
            <p className="text-xs sm:text-sm font-bold text-emerald-800 uppercase">
              {userProfile?.school_name || 'SEKOLAH SAYA'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Sistem Pengurusan e-RPH Pintar Bersepadu &bull; Sesi Akademik 2026/2027 &bull;{' '}
              {activeTab === 'kustom' ? `Sesi Kustom (${customSessionType})` : 'Diselaraskan RPT Panitia'}
            </p>
          </div>
        </div>

        {/* Bahagian 1: Maklumat Am (Tarikh, Hari, Minggu, Kelas, Masa, Subjek) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          
          {/* TARIKH DENGAN AUTOMASI ISNIN */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">
                {getLabel('TARIKH', 'TARIKH')}
              </span>
              {(activeTab === 'kustom' ? customDay : (currentSlot?.hari || '')).toUpperCase() === 'ISNIN' ? (
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Isnin (Induk)
                </span>
              ) : (
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 py-0.2 rounded">
                  Auto
                </span>
              )}
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 focus:outline-none mt-0.5 cursor-pointer"
            />
          </div>

          {/* HARI */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
            <span className="font-bold text-slate-500 block uppercase text-[10px]">
              {getLabel('HARI', 'HARI')}
            </span>
            {activeTab === 'kustom' ? (
              <select
                value={customDay}
                onChange={(e) => setCustomDay(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 focus:outline-none mt-0.5 cursor-pointer text-xs"
              >
                {['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900 block mt-0.5">{currentSlot.hari}</span>
            )}
          </div>

          {/* MINGGU */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">
                {getLabel('MINGGU', 'MINGGU')}
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">RPT</span>
            </div>
            <select
              value={currentWeek}
              onChange={(e) => handleWeekChange(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-slate-900 focus:outline-none mt-0.5 text-xs cursor-pointer"
            >
              {teachingWeeks.map((w) => (
                <option key={w.minggu_ke} value={w.minggu_ke!}>
                  M{w.minggu_ke}
                </option>
              ))}
            </select>
          </div>

          {/* KELAS (DROPDOWN MENGIKUT dropdown_data.csv) */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">
                {getLabel('KELAS', 'KELAS')}
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">PILIH</span>
            </div>
            <select
              value={className}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 focus:outline-none mt-0.5 text-xs cursor-pointer"
            >
              {dropdownOptions.kelas.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* MASA (DROPDOWN MENGIKUT dropdown_data.csv) */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">
                {getLabel('MASA', 'MASA')}
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">WAKTU</span>
            </div>
            <div className="flex items-center space-x-1 mt-0.5">
              <select
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-1/2 bg-transparent font-bold text-slate-900 focus:outline-none text-[11px] cursor-pointer"
                title="Waktu Mula"
              >
                {!dropdownOptions.waktu.some(t => t.formatted === startTime) && startTime && (
                  <option value={startTime}>{startTime}</option>
                )}
                {dropdownOptions.waktu.map((t) => (
                  <option key={`mula-${t.value}`} value={t.formatted}>
                    {t.formatted}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 font-bold text-[10px]">&ndash;</span>
              <select
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-1/2 bg-transparent font-bold text-slate-900 focus:outline-none text-[11px] cursor-pointer"
                title="Waktu Tamat"
              >
                {!dropdownOptions.waktu.some(t => t.formatted === endTime) && endTime && (
                  <option value={endTime}>{endTime}</option>
                )}
                {dropdownOptions.waktu.map((t) => (
                  <option key={`tamat-${t.value}`} value={t.formatted}>
                    {t.formatted}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SUBJEK (Pengisian / Pilihan Manual) */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 block uppercase text-[10px]">
                {getLabel('SUBJEK', 'SUBJEK')}
              </span>
              <button
                type="button"
                onClick={() => setIsManualSubjectInput(!isManualSubjectInput)}
                className="text-[9px] text-emerald-700 hover:underline font-bold"
                title="Tukar atau taip subjek lain secara manual"
              >
                {isManualSubjectInput ? 'Pilih' : 'Manual'}
              </button>
            </div>
            {isManualSubjectInput ? (
              <input
                type="text"
                value={subject}
                onChange={(e) => handleCustomSubjectChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none text-xs mt-0.5"
                placeholder="Nama subjek..."
              />
            ) : (
              <select
                value={subject}
                onChange={(e) => handleCustomSubjectChange(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 focus:outline-none mt-0.5 text-xs cursor-pointer truncate"
              >
                <option value={subject}>{subject}</option>
                {Object.keys(rptCatalog)
                  .filter((s) => s !== subject)
                  .map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
              </select>
            )}
          </div>

        </div>

        {/* Bahagian 2: Pilihan Dropdown & Manual TEMA/BIDANG/TERAS & TAJUK/KEMAHIRAN/NILAITERAS */}
        <TemaTajukSelector
          subject={subject}
          form={form}
          selectedTema={tema}
          selectedTajuk={tajuk}
          onTemaChange={setTema}
          onTajukChange={setTajuk}
          isRTL={isRTL}
          labels={locale.labels}
        />

        {/* Bahagian 3: Standard Kandungan (SK) & Standard Pembelajaran (SP) DSKP (Pengisian Manual & Bank DSKP) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{getLabel('STANDARD KANDUNGAN', 'STANDARD KANDUNGAN')} &amp; {getLabel('STANDARD PEMBELAJARAN', 'STANDARD PEMBELAJARAN')}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Pengisian Manual &amp; Bank DSKP
              </span>
            </h3>
          </div>

          <DSKPSelector
            subject={subject}
            form={form}
            selectedSK={sk}
            selectedSP={sp}
            onSKChange={setSK}
            onSPChange={setSP}
            onSelect={(item) => {
              setSK(item.sk);
              setSP(item.sp);
              if (item.tema) setTema(item.tema);
              if (item.tajuk) setTajuk(item.tajuk);
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
                placeholder={isRTL ? 'معايير النجاح...' : 'Murid berjaya jika dapat...'}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Bahagian 4: Langkah-langkah Pengajaran (Aktiviti PdPc) */}
        <ActivityStepsEditor
          activities={activities}
          onChange={setActivities}
          isRTL={isRTL}
          labels={locale.labels}
          rptSuggestion={rptSuggestion}
        />

        {/* Bahagian 5: Elemen Pedagogi, EMK & PAK-21 */}
        <PedagogyChecklist
          pedagogy={pedagogy}
          onChange={setPedagogy}
          isRTL={isRTL}
          labels={locale.labels}
        />

        {/* Bahagian 6: Refleksi Dinamik Terpaut (Mirroring) */}
        <ReflectionMirrorBox
          learningObjective={learningObjective}
          reflection={reflection}
          onChange={setReflection}
          isRTL={isRTL}
          languageCode={kodBahasa}
          labels={locale.labels}
          onCarryForwardToNextSlot={handleCarryForwardToNextSlot}
        />

      </div>
      )}

      {/* Modal Salin RPH ke Jadual Kelas Berbeza */}
      <CopyRPHModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        currentSubject={subject}
        currentClass={className}
        currentDay={activeTab === 'jadual' ? currentSlot.hari : customDay}
        timetable={timetable}
        selectedSlotIndex={selectedSlotIndex}
        onSelectTargetSlot={handleSelectTargetSlotForCopy}
      />

      {/* Modal Pratonton A4 Portrait 1 Muka Surat Setiap Subjek */}
      <A4PortraitPreviewModal
        isOpen={isPreviewA4ModalOpen}
        onClose={() => setIsPreviewA4ModalOpen(false)}
        weeklyRphList={getWeeklyRPHList()}
        teacherName={teacherName || 'GURU'}
        teacherEmail={teacherEmail || ''}
        weekNo={currentWeek}
        onPrint={handlePrint}
        onDownloadHtml={handleDownloadHtmlFile}
        onSavePdf={handleSavePdf}
      />

      {/* Modal Co-Pilot AI */}
      <AICoPilotModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        subject={subject}
        form={form}
        sk={sk}
        sp={sp}
        languageCode={kodBahasa}
        rptActivitySuggestion={rptSuggestion}
        onApply={handleApplyAIContent}
        isRTL={isRTL}
      />

      {/* Modal Editor Jadual Waktu Guru */}
      <TimetableEditorModal
        isOpen={isTimetableEditorOpen}
        onClose={() => setIsTimetableEditorOpen(false)}
      />

      {/* Modal Kongsi Semakan Pengetua */}
      <ShareReviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentWeek={currentWeek}
        rphList={getWeeklyRPHList()}
      />

      {/* Modal Google Drive Upload Status */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CloudUpload className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  Google Drive e-RPH Penghantaran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isUploadingDrive ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-700">
                  Mencipta folder &amp; memuat naik fail e-RPH ke Google Drive...
                </p>
                <p className="text-[11px] text-slate-400">
                  Folder: &ldquo;e-RPH DeLIMA&rdquo; / Minggu {currentWeek}
                </p>
              </div>
            ) : driveResult ? (
              <div className="space-y-4">
                {driveResult.success ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold text-sm">Berjaya Dihantar ke Google Drive!</span>
                    </div>
                    <p className="text-slate-600">
                      Fail <strong>{driveResult.fileName}</strong> telah dimuat naik ke folder rasmi e-RPH di akaun DeLIMA anda.
                    </p>
                    {driveResult.webViewLink && (
                      <a
                        href={driveResult.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 hover:text-emerald-800 underline mt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka fail dalam Google Drive &rarr;</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <span className="font-bold text-sm">Sambungan Google Drive Diperlukan</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {driveResult.error}
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={signInWithGoogle}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <CloudUpload className="w-4 h-4" />
                        <span>Sambungkan Google Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadHtmlFile}
                        className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Muat Turun .HTML</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      </div>

      {/* =========================================================================
          SUSUN ATUR CETAKAN A4 LANDSCAPE SATU MUKA SURAT SETIAP SUBJEK (PRINT-ONLY)
         ========================================================================= */}
      <div className="print-only">
        {getWeeklyRPHList().map((rphItem, idx) => (
          <div
            key={`print-a4-slot-${idx}`}
            className="a4-landscape-page"
            dangerouslySetInnerHTML={{
              __html: generateSingleRPHCardHtml(
                rphItem,
                teacherName || 'GURU',
                teacherEmail || '',
                idx + 1,
                getWeeklyRPHList().length
              )
            }}
          />
        ))}
      </div>

    </div>
  );
}
