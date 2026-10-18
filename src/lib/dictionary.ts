import kamusDataRaw from '@/data/kamus_61_labels.json';
import { SubjectLocaleInfo } from '@/types/erph';

const kamusData: Record<string, SubjectLocaleInfo> = kamusDataRaw as any;

// Default standard Malay fallback labels
export const DEFAULT_FALLBACK_LABELS: Record<string, string> = {
  "TARIKH": "TARIKH",
  "HARI": "HARI",
  "MINGGU": "MINGGU",
  "MINGGU PEND. SIVIK:": "MINGGU PEND. SIVIK:",
  "KELAS": "KELAS",
  "MASA": "MASA",
  "HINGGA": "HINGGA",
  "SUBJEK": "SUBJEK",
  "TINGKATAN": "TINGKATAN",
  "TEMA/BIDANG/ TAJUK": "TEMA/BIDANG/ TAJUK",
  "TAJUK": "TAJUK",
  "STANDARD KANDUNGAN": "STANDARD KANDUNGAN",
  "STANDARD PEMBELAJARAN": "STANDARD PEMBELAJARAN",
  "Pada akhir pengajaran dan pembelajaran,murid-murid dapat:": "Pada akhir pengajaran dan pembelajaran, murid-murid dapat:",
  "AKTIVITI P&P": "AKTIVITI PDPC",
  "STRATEGI P&P": "STRATEGI P&P",
  "KAEDAH P&P": "KAEDAH P&P",
  "BAHAN BANTU MENGAJAR": "BAHAN BANTU MENGAJAR",
  "ALAT PEMIKIRAN": "ALAT PEMIKIRAN",
  "TAHAP PENGUASAAN": "TAHAP PENGUASAAN",
  "EMK:": "EMK:",
  "PENGAYAAN": "PENGAYAAN",
  "NILAI-NILAI MURNI": "NILAI-NILAI MURNI",
  "KRITERIA KEJAYAAN": "KRITERIA KEJAYAAN",
  "KEMAHIRAN BERFIKIR": "KEMAHIRAN BERFIKIR",
  "KECERDASAN PELBAGAI": "KECERDASAN PELBAGAI",
  "PENILAIAN/ PENTAKSIRAN": "PENILAIAN/ PENTAKSIRAN",
  "Penilaian dan pentaksiran untuk standard pembelajaran di atas telah dilakukan kepada semua murid dengan memberikan:": "Penilaian dan pentaksiran untuk standard pembelajaran di atas telah dilakukan kepada semua murid dengan memberikan:",
  "Latihan  bertulis / Lembaran kerja": "Latihan bertulis / Lembaran kerja",
  "Pemerhatian": "Pemerhatian",
  "Amali": "Amali",
  "Soal jawab / kuiz": "Soal jawab / kuiz",
  "REFLEKSI": "REFLEKSI",
  "murid berjaya dan dapat:": "murid berjaya dan dapat:",
  "Intervensi:": "Intervensi:",
  "murid berjaya dan dapat": "murid berjaya dan dapat",
  "daripada": "daripada",
  "OBJEKTIF PEMBELAJARAN": "OBJEKTIF PEMBELAJARAN",
  "AKTIVITI": "AKTIVITI",
  "AKTIVITI UTAMA": "AKTIVITI UTAMA",
  "AKTIVITI PENUTUP": "AKTIVITI PENUTUP",
  "CATATAN": "CATATAN",
  "RUJUKAN": "RUJUKAN",
  "BUKU TEKS": "BUKU TEKS"
};

/**
 * Mengembalikan maklumat bahasa, arah teks (LTR/RTL), dan kamus 61 label mengikut nama subjek.
 */
export function getSubjectLocale(subjectName?: string): SubjectLocaleInfo {
  if (!subjectName) {
    return {
      subjek_nama: 'DEFAULT',
      kod_bahasa: 'ms',
      arah_teks: 'ltr',
      fon_keluarga: 'font-sans',
      labels: DEFAULT_FALLBACK_LABELS
    };
  }

  // Exact match
  if (kamusData[subjectName]) {
    return kamusData[subjectName];
  }

  // Case-insensitive / partial match
  const normalized = subjectName.trim().toUpperCase();
  for (const [key, val] of Object.entries(kamusData)) {
    if (key.trim().toUpperCase() === normalized) {
      return val;
    }
  }

  // Check language hints
  const hasArabicChars = /[\u0600-\u06FF]/.test(subjectName);
  if (hasArabicChars || normalized.includes('ARAB') || normalized.includes('QURAN') || normalized.includes('SYARIAH')) {
    // Return Arabic mapping if available
    const arabKey = Object.keys(kamusData).find(k => k.includes('اللغة العربية') || k.includes('BAHASA ARAB'));
    if (arabKey && kamusData[arabKey]) {
      return {
        ...kamusData[arabKey],
        subjek_nama: subjectName
      };
    }
  }

  if (normalized.includes('ENGLISH') || normalized.includes('DLP')) {
    const engKey = Object.keys(kamusData).find(k => k.trim().toUpperCase() === 'ENGLISH');
    if (engKey && kamusData[engKey]) {
      return {
        ...kamusData[engKey],
        subjek_nama: subjectName
      };
    }
  }

  return {
    subjek_nama: subjectName,
    kod_bahasa: 'ms',
    arah_teks: 'ltr',
    fon_keluarga: 'font-sans',
    labels: DEFAULT_FALLBACK_LABELS
  };
}
