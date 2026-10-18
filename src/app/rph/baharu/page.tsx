import RPHFormDynamic from '@/components/form/RPHFormDynamic';

export const metadata = {
  title: 'Borang e-RPH Pintar Harian | e-RPH Pintar',
  description: 'Penyediaan Rancangan Pengajaran Harian dinamik dwiarah (LTR/RTL) dengan Co-Pilot Gemini AI dan penyambung RPT Google Sheets.',
};

export default function RPHBaharuPage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Borang Penyediaan e-RPH Harian Dinamik
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Sistem menukar bahasa 61 label dan arah teks (LTR/RTL) secara automatik mengikut subjek. Objektif disalin terus ke bahagian Refleksi.
        </p>
      </div>

      <RPHFormDynamic />
    </div>
  );
}
