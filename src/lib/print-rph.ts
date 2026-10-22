import { RPHRecord } from '@/types/erph';
import { generateWeeklyRPHHtml, formatRPHFileName } from '@/lib/google-drive';

/**
 * Mengira tarikh bagi setiap hari persekolahan (Isnin hingga Jumaat)
 * berasaskan tarikh hari Isnin yang dipilih oleh guru.
 */
export function calculateWeekDatesFromMonday(mondayIsoDate: string): Record<string, string> {
  if (!mondayIsoDate) {
    const today = new Date().toISOString().split('T')[0];
    return {
      'ISNIN': today,
      'SELASA': today,
      'RABU': today,
      'KHAMIS': today,
      'JUMAAT': today
    };
  }

  const parts = mondayIsoDate.split('-');
  if (parts.length < 3) {
    return {
      'ISNIN': mondayIsoDate,
      'SELASA': mondayIsoDate,
      'RABU': mondayIsoDate,
      'KHAMIS': mondayIsoDate,
      'JUMAAT': mondayIsoDate
    };
  }

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const formatIso = (dt: Date): string => {
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  };

  const addDays = (num: number): string => {
    const next = new Date(y, m, d + num);
    return formatIso(next);
  };

  const baseDate = new Date(y, m, d);

  return {
    'ISNIN': formatIso(baseDate),
    'SELASA': addDays(1),
    'RABU': addDays(2),
    'KHAMIS': addDays(3),
    'JUMAAT': addDays(4)
  };
}

/**
 * Memuat turun e-RPH sebagai fail PDF secara TERUS (Direct Download)
 * Menggunakan enjin penukaran Chromium backend tanpa membuka paparan print (print dialog)
 */
export async function downloadRPHPdf({
  rphList,
  teacherName,
  teacherEmail,
  weekNo,
  schoolName = 'SEKOLAH SAYA',
  schoolLogo,
  planType = 'free',
  teacherSignature
}: {
  rphList: Partial<RPHRecord>[];
  teacherName: string;
  teacherEmail: string;
  weekNo: number | string;
  schoolName?: string;
  schoolLogo?: string;
  planType?: 'free' | 'pro';
  teacherSignature?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const fileName = `${formatRPHFileName(teacherName, weekNo)}.pdf`;

  const fullHtml = generateWeeklyRPHHtml({
    rphList,
    teacherName,
    teacherEmail,
    weekNo,
    schoolName,
    schoolLogo,
    planType,
    teacherSignature
  });

  try {
    const res = await fetch('/api/pdf/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: fullHtml,
        fileName
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
      return true;
    }
  } catch (err) {
    console.warn('Janaan PDF terus via API tidak berjaya, beralih ke mod cetakan:', err);
  }

  // Fallback sekiranya enjin API belum bersedia
  printOrSaveRPH({
    rphList,
    teacherName,
    teacherEmail,
    weekNo,
    schoolName,
    schoolLogo,
    planType,
    teacherSignature
  });
  return false;
}

/**
 * Mencetak atau Menyimpan e-RPH sebagai PDF berkualiti tinggi standard A4 Landscape
 * Mengasingkan paparan secara mutlak supaya HANYA halaman RPH sahaja yang dicetak,
 * tanpa 5 muka surat borang/input/navbar yang tidak berkaitan.
 */
export function printOrSaveRPH({
  rphList,
  teacherName,
  teacherEmail,
  weekNo,
  schoolName = 'SEKOLAH SAYA',
  schoolLogo,
  planType = 'free',
  teacherSignature
}: {
  rphList: Partial<RPHRecord>[];
  teacherName: string;
  teacherEmail: string;
  weekNo: number | string;
  schoolName?: string;
  schoolLogo?: string;
  planType?: 'free' | 'pro';
  teacherSignature?: string;
}) {
  if (typeof window === 'undefined') return;

  // Jana kandungan HTML yang 100% SAMA dengan fail Google Drive & Pratinjau
  const fullHtml = generateWeeklyRPHHtml({
    rphList,
    teacherName,
    teacherEmail,
    weekNo,
    schoolName,
    schoolLogo,
    planType,
    teacherSignature
  });

  const formattedTitle = formatRPHFileName(teacherName, weekNo);

  // Gunakan elemen iframe cetakan khas yang terasing daripada DOM borang utama
  let printIframe = document.getElementById('erph-print-isolated-iframe') as HTMLIFrameElement;
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'erph-print-isolated-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(fullHtml);
  iframeDoc.close();

  // Berikan sedikit masa untuk render jadual dan fon sebelum memicu cetakan/simpanan PDF
  setTimeout(() => {
    const prevTitle = document.title;
    document.title = formattedTitle;

    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print fallback to window.print:', e);
      window.print();
    }

    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  }, 350);
}

