import rawData from '@/data/dskp_tema_tajuk.json';

export interface FormTopicsData {
  temas: string[];
  tajuks: string[];
  tema_to_tajuk: Record<string, string[]>;
}

export interface SubjectTopicsData {
  forms: string[];
  data: Record<string, FormTopicsData>;
}

export interface DSKPTemaTajukDatabase {
  metadata: {
    title: string;
    source: string;
    components: string[];
    total_rows: number;
    total_subjects: number;
    generated_at: string;
  };
  aliases: Record<string, string>;
  subjects: Record<string, SubjectTopicsData>;
}

const db: DSKPTemaTajukDatabase = rawData as any;

/**
 * Normalise tingkatan/form string (e.g., "Tingkatan 1" -> "1", "T2" -> "2")
 */
export function normalizeForm(formStr: string | number | undefined | null): string {
  if (!formStr) return '1';
  const str = formStr.toString().trim();
  const digitMatch = str.match(/\d+/);
  if (digitMatch) return digitMatch[0];
  return str.toUpperCase();
}

/**
 * Cari kunci subjek kanonikal dalam pangkalan data
 */
export function resolveDSKPSubject(inputSubject: string | undefined | null): string | null {
  if (!inputSubject) return null;
  const s = inputSubject.trim();
  const sLower = s.toLowerCase();
  const sUpper = s.toUpperCase();

  // 1. Direct match
  if (db.subjects[s]) return s;

  // 2. Alias lookup
  if (db.aliases[sLower]) {
    const target = db.aliases[sLower];
    if (db.subjects[target]) return target;
  }
  if (db.aliases[sUpper]) {
    const target = db.aliases[sUpper];
    if (db.subjects[target]) return target;
  }

  // 3. Case-insensitive exact search
  const allSubjKeys = Object.keys(db.subjects);
  const foundExactCi = allSubjKeys.find(k => k.toLowerCase() === sLower);
  if (foundExactCi) return foundExactCi;

  // 4. Arabic specific normalization
  if (sLower.includes('muasirah') || s.includes('معاصرة') || sLower === 'lam' || sLower.includes('lughah muasirah')) {
    if (db.subjects['اللغة العربية المعاصرة']) return 'اللغة العربية المعاصرة';
  }
  if (sLower.includes('arab') || s.includes('العربية')) {
    if (db.subjects['اللغة العربية']) return 'اللغة العربية';
  }
  if (sLower.includes('usul') || s.includes('أصول')) {
    if (db.subjects['USULUDDIN']) return 'USULUDDIN';
    if (db.subjects['أصول الدين']) return 'أصول الدين';
  }
  if (sLower.includes('syariah') || s.includes('شريعة')) {
    if (db.subjects['SYARIAH']) return 'SYARIAH';
    if (db.subjects['الشريعة اسلامية']) return 'الشريعة اسلامية';
  }
  if (sLower.includes('adab') || s.includes('أدب') || s.includes('بلاغة')) {
    if (db.subjects['الأدب و البلاغة']) return 'الأدب و البلاغة';
  }
  if (sLower.includes('manahij') || s.includes('مناهج')) {
    if (db.subjects['مناهج العلوم الإسلامية']) return 'مناهج العلوم الإسلامية';
  }

  // 5. Partial substring search (e.g. "Sains Komputer" -> "SAINS KOMPUTER")
  const foundPartial = allSubjKeys.find(k => k.toUpperCase().includes(sUpper) || sUpper.includes(k.toUpperCase()));
  if (foundPartial) return foundPartial;

  return null;
}

/**
 * Dapatkan senarai tingkatan yang tersedia bagi subjek
 */
export function getAvailableForms(subject: string): string[] {
  const canonical = resolveDSKPSubject(subject);
  if (!canonical || !db.subjects[canonical]) return ['1', '2', '3', '4', '5', '6'];
  return db.subjects[canonical].forms || [];
}

/**
 * Dapatkan data lengkap Tema & Tajuk bagi subjek dan tingkatan
 */
export function getTemaAndTajuk(
  subject: string,
  form: string | number
): {
  canonicalSubject: string | null;
  normalizedForm: string;
  temas: string[];
  tajuks: string[];
  temaToTajuk: Record<string, string[]>;
} {
  const canonical = resolveDSKPSubject(subject);
  const normForm = normalizeForm(form);

  if (!canonical || !db.subjects[canonical]) {
    return {
      canonicalSubject: null,
      normalizedForm: normForm,
      temas: [],
      tajuks: [],
      temaToTajuk: {}
    };
  }

  const subjData = db.subjects[canonical];
  // Semak jika tingkatan tepat wujud
  let formData = subjData.data[normForm];

  // Jika tiada (contoh tingkatan 6 tapi subjek cuma ada PERALIHAN atau sebaliknya), semak tingkatan yang ada
  if (!formData && subjData.forms.length > 0) {
    const fallbackForm = subjData.forms[0];
    formData = subjData.data[fallbackForm];
  }

  if (!formData) {
    return {
      canonicalSubject: canonical,
      normalizedForm: normForm,
      temas: [],
      tajuks: [],
      temaToTajuk: {}
    };
  }

  return {
    canonicalSubject: canonical,
    normalizedForm: normForm,
    temas: formData.temas || [],
    tajuks: formData.tajuks || [],
    temaToTajuk: formData.tema_to_tajuk || {}
  };
}

/**
 * Dapatkan senarai TEMA / BIDANG / TERAS
 */
export function getTemaList(subject: string, form: string | number): string[] {
  const res = getTemaAndTajuk(subject, form);
  return res.temas;
}

/**
 * Dapatkan senarai TAJUK / KEMAHIRAN / NILAITERAS
 * Jika tema diberikan, tapis tajuk yang berpadanan (jika ada)
 */
export function getTajukList(
  subject: string,
  form: string | number,
  selectedTema?: string
): { tajuks: string[]; isFilteredByTema: boolean } {
  const res = getTemaAndTajuk(subject, form);
  
  if (selectedTema && selectedTema.trim() && res.temaToTajuk[selectedTema.trim()]) {
    const filtered = res.temaToTajuk[selectedTema.trim()];
    if (filtered && filtered.length > 0) {
      return {
        tajuks: filtered,
        isFilteredByTema: true
      };
    }
  }

  return {
    tajuks: res.tajuks,
    isFilteredByTema: false
  };
}

export default db;
