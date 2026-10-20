import rptDatabaseRaw from '@/data/rpt_database.json';
import rptCatalogRaw from '@/data/rpt_catalog.json';
import takwimDataRaw from '@/data/takwim_2027.json';
import dropdownOptionsRaw from '@/data/dropdown_options.json';
import dskpDataRaw from '@/data/dskp_sample.json';
import { TakwimMinggu, RPTItem } from '@/types/erph';

export interface DropdownTimeOption {
  value: string;
  raw: string;
  label: string;
  formatted: string;
}

export interface DropdownOptionsData {
  kelas: string[];
  waktu_raw: string[];
  waktu: DropdownTimeOption[];
}

export interface RPTDatabaseRecord {
  id: string;
  fail_asal: string;
  subjek: string;
  tingkatan: string;
  tingkatan_label: string;
  minggu_ke: number | null;
  kod_minggu: string;
  label_minggu: string;
  tarikh_teks: string;
  tarikh_mula: string;
  tarikh_tamat: string;
  adalah_cuti: boolean;
  tema: string;
  sk: string;
  sp: string;
  standard_prestasi: string;
  catatan: string;
}

export const rptDatabase: RPTDatabaseRecord[] = rptDatabaseRaw as RPTDatabaseRecord[];
export const rptCatalog = rptCatalogRaw as Record<string, { subjek: string; tingkatan_list: string[] }>;
export const takwimData: TakwimMinggu[] = takwimDataRaw as TakwimMinggu[];
export const dropdownOptions: DropdownOptionsData = dropdownOptionsRaw as DropdownOptionsData;
export const dskpDatabase = dskpDataRaw as any[];

/**
 * Memetakan sebarang variasi nama subjek kepada nama kanonikal dalam fail RPT
 * MEMASTIKAN Bahasa Arab dan LAM dipisahkan dengan tepat dan tidak mengambil maklumat subjek lain!
 */
export function normalizeSubjectName(inputName: string): string {
  if (!inputName) return '';
  const cleaned = inputName.trim();
  const lower = cleaned.toLowerCase();

  // 1. Al Lughah Al Arabiah Al Muasirah (LAM) - rpt_lam.csv
  if (
    lower === 'rpt_lam' ||
    lower.includes('muasirah') ||
    cleaned.includes('معاصرة') ||
    lower === 'lam' ||
    lower.includes('lughah muasirah') ||
    lower.includes('al lughah al arabiah al muasirah') ||
    cleaned.includes('اللغة العربية المعاصرة')
  ) {
    return 'Al Lughah Al Arabiah Al Muasirah';
  }

  // 2. Bahasa Arab / اللغة العربية (KSSM)
  if (
    cleaned === 'اللغة العربية' ||
    lower === 'bahasa arab' ||
    lower === 'arab' ||
    lower === 'ba' ||
    cleaned.includes('اللغة العربية') ||
    cleaned.includes('العربية') ||
    (lower.includes('arab') && !lower.includes('muasirah') && !lower.includes('lam'))
  ) {
    return 'Bahasa Arab';
  }

  // 3. Adab Wa Al Balaghah / الأدب والبلاغة - rpt_adab.csv
  if (
    lower === 'rpt_adab' ||
    lower.includes('adab') ||
    lower.includes('balaghah') ||
    cleaned.includes('أدب') ||
    cleaned.includes('بلاغة') ||
    cleaned.includes('الأدب والبلاغة') ||
    cleaned.includes('الأدب و البلاغة')
  ) {
    return 'Adab Wa Al Balaghah';
  }

  // 4. Usuluddin / أصول الدين - rpt_usulaldin.csv
  if (
    lower === 'rpt_usulaldin' ||
    lower.includes('usulaldin') ||
    lower.includes('usuluddin') ||
    lower.includes('usul') ||
    cleaned.includes('أصول') ||
    cleaned.includes('أصول الدين')
  ) {
    return 'Usuluddin';
  }

  // 5. Syariah / الشريعة اسلامية - rpt_syariah.csv
  if (
    lower === 'rpt_syariah' ||
    lower.includes('syariah') ||
    lower.includes('shariah') ||
    cleaned.includes('شريعة') ||
    cleaned.includes('الشريعة') ||
    cleaned.includes('الشريعة اسلامية') ||
    cleaned.includes('الشريعة الإسلامية')
  ) {
    return 'Syariah';
  }

  // 6. Manahij al-Ulum al-Islamiyyah / مناهج العلوم إسلامية - rpt_manahij.csv
  if (
    lower === 'rpt_manahij' ||
    lower.includes('manahij') ||
    cleaned.includes('مناهج') ||
    cleaned.includes('مناهج العلوم') ||
    cleaned.includes('مناهج العلوم إسلامية') ||
    cleaned.includes('مناهج العلوم الإسلامية')
  ) {
    return 'Manahij Al Ulum Al Islamiah';
  }

  // 7. Maharat al-Quran / مهارات القرءان
  if (lower.includes('maharat') || cleaned.includes('مهارات')) {
    return 'مهارات القرءان';
  }

  // 8. Hifz al-Quran / حفظ القرأن
  if (lower.includes('hifz') || cleaned.includes('حفظ')) {
    return 'حفظ القرأن';
  }

  // 9. KKQ
  if (lower.includes('kkq') || cleaned.includes('كماهيرن')) {
    return 'كماهيرن ممباچ دان مڠحفظ القرءان(KKQ)';
  }

  // 10. Tasmi
  if (lower.includes('tasmi') || cleaned.includes('تسميع')) {
    return 'تسميع';
  }

  // 11. Bahasa Inggeris
  if (lower.includes('inggeris') || lower.includes('english') || lower === 'bi') {
    return 'Bahasa Inggeris';
  }

  // 12. Bahasa Melayu
  if (lower.includes('melayu') || lower === 'bm') {
    return 'Bahasa Melayu';
  }

  // 13. Sains
  if (lower.includes('sains') || lower.includes('science')) {
    return 'Sains';
  }

  // 14. Matematik
  if (lower.includes('matematik') || lower.includes('math')) {
    return 'Matematik';
  }

  // 15. Geografi
  if (lower.includes('geografi') || lower.includes('geo')) {
    return 'Geografi';
  }

  // 16. PJPK
  if (lower.includes('pjpk') || lower.includes('jasmani') || lower.includes('kesihatan')) {
    return 'PJPK';
  }

  // 17. PSV
  if (lower.includes('psv') || lower.includes('seni visual') || lower.includes('seni')) {
    return 'Pendidikan Seni Visual';
  }

  // 18. Perniagaan
  if (lower.includes('perniagaan') || lower.includes('business')) {
    return 'Perniagaan';
  }

  return cleaned;
}

/**
 * Pemadanan tepat subjek DSKP untuk mengelakkan kesilapan mengambil subjek lain
 */
export function matchDSKPSubject(inputSubject: string, candidateSubject: string): boolean {
  if (!inputSubject || !candidateSubject) return false;
  const inNorm = inputSubject.trim().toLowerCase();
  const candNorm = candidateSubject.trim().toLowerCase();

  if (inNorm === candNorm) return true;

  // Bahasa Arab vs اللغة العربية (Bukan LAM)
  const isInputBA = inNorm === 'bahasa arab' || inNorm === 'arab' || inNorm === 'اللغة العربية' || inNorm.includes('اللغة العربية');
  const isCandBA = candNorm === 'bahasa arab' || candNorm === 'arab' || candNorm === 'اللغة العربية' || candNorm.includes('اللغة العربية');
  if (isInputBA && isCandBA && !inNorm.includes('معاصرة') && !candNorm.includes('معاصرة') && !inNorm.includes('muasirah') && !candNorm.includes('muasirah')) {
    return true;
  }

  // LAM vs اللغة العربية المعاصرة (rpt_lam)
  const isInputLAM = inNorm.includes('muasirah') || inNorm.includes('معاصرة') || inNorm === 'lam' || inNorm === 'rpt_lam' || inNorm.includes('al lughah al arabiah al muasirah');
  const isCandLAM = candNorm.includes('muasirah') || candNorm.includes('معاصرة') || candNorm === 'lam' || candNorm === 'rpt_lam' || candNorm.includes('al lughah al arabiah al muasirah');
  if (isInputLAM && isCandLAM) return true;

  // Usuluddin vs أصول الدين (rpt_usulaldin)
  const isInputUsul = inNorm.includes('usul') || inNorm.includes('أصول') || inNorm === 'rpt_usulaldin';
  const isCandUsul = candNorm.includes('usul') || candNorm.includes('أصول') || candNorm === 'rpt_usulaldin';
  if (isInputUsul && isCandUsul) return true;

  // Syariah vs الشريعة اسلامية (rpt_syariah)
  const isInputSyariah = inNorm.includes('syariah') || inNorm.includes('shariah') || inNorm.includes('شريعة') || inNorm === 'rpt_syariah';
  const isCandSyariah = candNorm.includes('syariah') || candNorm.includes('shariah') || candNorm.includes('شريعة') || candNorm === 'rpt_syariah';
  if (isInputSyariah && isCandSyariah) return true;

  // Adab Wa Balaghah vs الأدب والبلاغة (rpt_adab)
  const isInputAdab = inNorm.includes('adab') || inNorm.includes('balaghah') || inNorm.includes('أدب') || inNorm.includes('بلاغة') || inNorm === 'rpt_adab';
  const isCandAdab = candNorm.includes('adab') || candNorm.includes('balaghah') || candNorm.includes('أدب') || candNorm.includes('بلاغة') || candNorm === 'rpt_adab';
  if (isInputAdab && isCandAdab) return true;

  // Manahij Al-Ulum vs مناهج العلوم إسلامية (rpt_manahij)
  const isInputManahij = inNorm.includes('manahij') || inNorm.includes('مناهج') || inNorm === 'rpt_manahij';
  const isCandManahij = candNorm.includes('manahij') || candNorm.includes('مناهج') || candNorm === 'rpt_manahij';
  if (isInputManahij && isCandManahij) return true;

  // Non-arabic exact matching
  if (inNorm.includes('english') && candNorm.includes('english')) return true;
  if ((inNorm.includes('melayu') || inNorm === 'bm') && candNorm.includes('melayu')) return true;
  if (inNorm.includes('sains') && candNorm.includes('sains')) return true;
  if (inNorm.includes('matematik') && candNorm.includes('matematik')) return true;
  if (inNorm.includes('geografi') && candNorm.includes('geografi')) return true;

  return inNorm === candNorm;
}

/**
 * Menormalkan nilai tingkatan (e.g. 'Tingkatan 1' -> '1', 'T3' -> '3')
 */
export function normalizeFormNumber(formStr: string): string {
  if (!formStr) return '1';
  const match = formStr.match(/\d+/);
  return match ? match[0] : formStr.trim();
}

/**
 * Mengambil rekod RPT untuk subjek, tingkatan dan minggu tertentu
 */
export function findRPTRecord(
  subject: string,
  form: string,
  week: number | string
): RPTDatabaseRecord | null {
  const normSubj = normalizeSubjectName(subject);
  const normForm = normalizeFormNumber(form);
  const targetWeekNum = typeof week === 'number' ? week : parseInt(String(week).replace(/\D/g, ''), 10) || 1;
  const rawSubjLower = (subject || '').toLowerCase().trim();

  // 1. Padanan tepat dalam fail RPT sedia ada
  const found = rptDatabase.find(item => {
    // Padanan terus fail_asal berdasarkan 5 subjek rpt
    const isDirectFileMatch =
      ((normSubj === 'Usuluddin' || rawSubjLower === 'rpt_usulaldin' || rawSubjLower.includes('أصول')) && item.fail_asal === 'rpt_usulaldin.csv') ||
      ((normSubj === 'Al Lughah Al Arabiah Al Muasirah' || rawSubjLower === 'rpt_lam' || rawSubjLower.includes('معاصرة')) && item.fail_asal === 'rpt_lam.csv') ||
      ((normSubj === 'Syariah' || rawSubjLower === 'rpt_syariah' || rawSubjLower.includes('شريعة')) && item.fail_asal === 'rpt_syariah.csv') ||
      ((normSubj === 'Adab Wa Al Balaghah' || rawSubjLower === 'rpt_adab' || rawSubjLower.includes('أدب') || rawSubjLower.includes('بلاغة')) && item.fail_asal === 'rpt_adab.csv') ||
      ((normSubj === 'Manahij Al Ulum Al Islamiah' || rawSubjLower === 'rpt_manahij' || rawSubjLower.includes('مناهج')) && item.fail_asal === 'rpt_manahij.csv');

    const isSubjMatch = isDirectFileMatch || matchDSKPSubject(item.subjek, subject) || item.subjek.toLowerCase() === normSubj.toLowerCase();
    const isFormMatch = item.tingkatan === normForm;
    const isWeekMatch = item.minggu_ke === targetWeekNum;
    return isSubjMatch && isFormMatch && isWeekMatch;
  });

  if (found) return found;

  // 2. Jika tidak ditemui dalam fail RPT (contoh: Bahasa Arab / اللغة العربية / Subjek Dini lain daripada dskp_master),
  // ambil rekod kurikulum tepat daripada pangkalan data DSKP master
  const matchedDSKP = dskpDatabase.filter(item => {
    const isSubjMatch = matchDSKPSubject(item.subjek, subject);
    const isFormMatch = item.tingkatan.toString().trim() === normForm;
    return isSubjMatch && isFormMatch;
  });

  if (matchedDSKP.length > 0) {
    const index = Math.min((targetWeekNum - 1) % matchedDSKP.length, matchedDSKP.length - 1);
    const dskpRec = matchedDSKP[index];
    const wInfo = takwimData.find(w => w.minggu_ke === targetWeekNum) || takwimData[0];

    return {
      id: `dskp-${dskpRec.id}`,
      fail_asal: 'dskp_master.csv',
      subjek: subject,
      tingkatan: normForm,
      tingkatan_label: `Tingkatan ${normForm}`,
      minggu_ke: targetWeekNum,
      kod_minggu: `M${targetWeekNum}`,
      label_minggu: wInfo?.label_minggu || `Minggu ${targetWeekNum}`,
      tarikh_teks: wInfo?.tarikh_teks || `${wInfo?.tarikh_mula} – ${wInfo?.tarikh_tamat}`,
      tarikh_mula: wInfo?.tarikh_mula || '2027-01-04',
      tarikh_tamat: wInfo?.tarikh_tamat || '2027-01-08',
      adalah_cuti: false,
      tema: dskpRec.tema || dskpRec.tajuk || 'Kemahiran Bahasa Arab',
      sk: dskpRec.sk,
      sp: dskpRec.sp,
      standard_prestasi: 'TP 1 - TP 6 Berasaskan DSKP KPM',
      catatan: dskpRec.aktiviti_cadangan || 'Aktiviti PdPc berpandukan standard kandungan & pembelajaran DSKP.'
    };
  }

  return null;
}

/**
 * Menukar RPTDatabaseRecord kepada RPTItem yang serasi dengan borang e-RPH
 */
export function convertToRPTItem(record: RPTDatabaseRecord): RPTItem {
  return {
    minggu: record.minggu_ke || 1,
    tarikh: record.tarikh_teks,
    sk: record.sk,
    sp: record.sp,
    cadangan_aktiviti: record.catatan || 'Aktiviti pembelajaran berasaskan standard pembelajaran DSKP dan kemahiran PAK-21.',
    catatan: record.standard_prestasi ? `Tahap Penguasaan: ${record.standard_prestasi}` : record.catatan
  };
}

/**
 * Mengambil senarai maklumat semua minggu daripada Takwim Persekolahan yang disegerakkan
 */
export function getSynchronizedWeeks() {
  return takwimData;
}

/**
 * Mengambil rekod minggu persekolahan semasa berdasarkan tarikh hari ini
 */
export function getCurrentWeekFromDate(todayDate?: string): TakwimMinggu {
  const targetDate = todayDate || new Date().toISOString().split('T')[0];
  
  // Cuba cari minggu yang memadankan julat tarikh
  const found = takwimData.find(item => {
    return targetDate >= item.tarikh_mula && targetDate <= item.tarikh_tamat;
  });

  if (found) return found;

  // Jika tarikh semasa sebelum minggu 1 atau selepas minggu 44, kembali ke Minggu 1 atau Minggu semasa persekolahan
  const firstNonHoliday = takwimData.find(w => !w.adalah_cuti && w.minggu_ke === 1);
  return firstNonHoliday || takwimData[0];
}

/**
 * Carian rekod RPT merentas pangkalan data
 */
export function searchRPTRecords(query: string, subject?: string, form?: string): RPTDatabaseRecord[] {
  if (!query && !subject && !form) return rptDatabase.slice(0, 50);

  const q = query.toLowerCase().trim();
  const normSubj = subject ? normalizeSubjectName(subject).toLowerCase() : '';
  const normForm = form ? normalizeFormNumber(form) : '';

  return rptDatabase.filter(item => {
    if (normSubj && !item.subjek.toLowerCase().includes(normSubj)) return false;
    if (normForm && item.tingkatan !== normForm) return false;
    if (!q) return true;

    return (
      item.tema.toLowerCase().includes(q) ||
      item.sk.toLowerCase().includes(q) ||
      item.sp.toLowerCase().includes(q) ||
      item.standard_prestasi.toLowerCase().includes(q) ||
      item.catatan.toLowerCase().includes(q) ||
      item.label_minggu.toLowerCase().includes(q)
    );
  });
}
