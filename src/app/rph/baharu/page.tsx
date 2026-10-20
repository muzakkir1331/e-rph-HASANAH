import { Suspense } from 'react';
import RPHFormDynamic from '@/components/form/RPHFormDynamic';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Borang e-RPH Pintar Harian | e-RPH Pintar',
  description: 'Penyediaan Rancangan Pengajaran Harian dinamik dwiarah (LTR/RTL) dengan penyelarasan Takwim & RPT serta Co-Pilot Gemini AI.',
};

export default function RPHBaharuPage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Borang Penyediaan e-RPH Harian Dinamik
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Sistem menukar bahasa 61 label dan arah teks (LTR/RTL) secara automatik mengikut subjek, diselaraskan dengan Takwim &amp; RPT Panitia.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuatkan data kurikulum &amp; RPT...</p>
          </div>
        }
      >
        <RPHFormDynamic />
      </Suspense>
    </div>
  );
}
