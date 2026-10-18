'use client';

import { useMemo } from 'react';
import { getSubjectLocale } from '@/lib/dictionary';
import { SubjectLocaleInfo } from '@/types/erph';

export function useSubjectLocale(subjectName?: string) {
  const localeInfo: SubjectLocaleInfo = useMemo(() => {
    return getSubjectLocale(subjectName);
  }, [subjectName]);

  const isRTL = localeInfo.arah_teks === 'rtl';

  /**
   * Mengambil label terjemahan berdasarkan kunci BM asal.
   */
  const getLabel = (canonicalKey: string, fallback?: string): string => {
    if (localeInfo.labels && localeInfo.labels[canonicalKey]) {
      return localeInfo.labels[canonicalKey];
    }
    return fallback || canonicalKey;
  };

  return {
    locale: localeInfo,
    isRTL,
    direction: localeInfo.arah_teks,
    fontClass: localeInfo.fon_keluarga,
    kodBahasa: localeInfo.kod_bahasa,
    getLabel
  };
}
