'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  School,
  User,
  PenTool,
  RotateCcw,
  AlertCircle,
  Loader2,
  Check,
  Award
} from 'lucide-react';
import { SharedReviewRecord, RPHRecord } from '@/types/erph';

export default function PublicReviewPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [loading, setLoading] = useState<boolean>(true);
  const [review, setReview] = useState<SharedReviewRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Borang Pengesahan Pengetua
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewerPosition, setReviewerPosition] = useState<string>('Pengetua / Guru Besar');
  const [reviewerComments, setReviewerComments] = useState<string>(
    'e-RPH disemak dan disahkan menepati standard SPI Bil. 3/1999 dan aktiviti PAK-21.'
  );
  const [reviewerSignature, setReviewerSignature] = useState<string>('');

  // Canvas Pad Tandatangan Pengetua
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Ambil data semakan daripada API
  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/semak/${token}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReview(data.review);
      } else {
        setError(data.error || 'Pautan semakan tidak dijumpai.');
      }
    } catch (err: any) {
      setError(err.message || 'Ralat sambungan pelayan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReview();
    }
  }, [token]);

  // Pengendalian Lukisan Tandatangan Digital
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setReviewerSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setReviewerSignature('');
    setHasDrawn(false);
  };

  // Hantar Pengesahan & Tandatangan Pengetua
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      alert('Sila masukkan Nama Penyemak / Pengetua.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/semak/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaPenyemak: reviewerName.trim(),
          jawatanPenyemak: reviewerPosition.trim(),
          ulasanPenyemak: reviewerComments.trim(),
          tandatanganPenyemak: reviewerSignature,
          status: 'DISEMAK'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(true);
        setReview(data.review);
      } else {
        alert(data.error || 'Gagal menghantar pengesahan.');
      }
    } catch (err: any) {
      alert(err.message || 'Ralat pelayan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat turun pautan semakan rasmi e-RPH...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-800">Pautan Semakan Tidak Ditemui</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'Pautan ini mungkin telah tamat tempoh atau tidak sah. Sila hubungi guru berkenaan untuk mendapatkan pautan baharu.'}
          </p>
        </div>
      </div>
    );
  }

  // Senarai RPH snapshot (sama ada array atau map)
  const rphList: Partial<RPHRecord>[] = Array.isArray(review.rph_snapshot)
    ? review.rph_snapshot
    : Object.values(review.rph_snapshot || {});

  const isAlreadyReviewed = review.status === 'DISEMAK';

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Kepala Surat Rasmi (Letterhead) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 text-center sm:text-left">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 flex-shrink-0 shadow-xs">
                {review.school_logo ? (
                  <img
                    src={review.school_logo}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <School className="w-10 h-10 text-emerald-700" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  KEMENTERIAN PENDIDIKAN MALAYSIA
                </span>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                  {review.school_name}
                </h1>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">
                  Portal Semakan Rasmi e-RPH &bull; Minggu {review.minggu_ke} (Sesi {review.tahun_akademik})
                </p>
              </div>
            </div>

            {/* Status Lencana Semakan */}
            <div>
              {isAlreadyReviewed ? (
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>DISEMAK &amp; DISAHKAN</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>MENUNGGU SEMAKAN PENTADBIR</span>
                </div>
              )}
            </div>
          </div>

          {/* Maklumat Ringkas Guru */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Guru Mata Pelajaran</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">{review.teacher_name}</strong>
              {review.teacher_email && (
                <span className="text-[11px] text-slate-500 font-mono">{review.teacher_email}</span>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Minggu Persekolahan</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">Minggu {review.minggu_ke}</strong>
              <span className="text-[11px] text-emerald-700 font-semibold">Tahun Akademik {review.tahun_akademik}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Slot Mengajar</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">{rphList.length} Waktu Rekod e-RPH</strong>
              <span className="text-[11px] text-slate-500">Isnin &ndash; Jumaat</span>
            </div>
          </div>
        </div>

        {/* Paparan Senarai RPH Minggu Tersebut */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h2 className="font-black text-slate-800 text-base">
              Senarai Rekod e-RPH Minggu {review.minggu_ke}
            </h2>
          </div>

          {rphList.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              Tiada slot RPH direkodkan untuk minggu ini.
            </div>
          ) : (
            rphList.map((slot, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Header Slot */}
                <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-sm text-slate-900">{slot.subjek || 'Mata Pelajaran'}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        Tingkatan {slot.tingkatan || '-'} &bull; <strong>{slot.kelas || '-'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-600">
                    <span className="font-bold text-emerald-800">{slot.hari || '-'}</span> ({slot.tarikh || '-'}) &bull; {slot.masa_mula || '-'} &ndash; {slot.masa_tamat || '-'}
                  </div>
                </div>

                {/* Kandungan Slot */}
                <div className="p-6 space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Tema &amp; Tajuk</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {slot.tema || '-'} {slot.tajuk ? `• ${slot.tajuk}` : ''}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Standard Kandungan &amp; Pembelajaran</span>
                      <p className="text-slate-800 mt-0.5 font-medium">
                        <strong>SK:</strong> {slot.sk || '-'} | <strong>SP:</strong> {slot.sp || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Objektif Pembelajaran</span>
                    <p className="text-slate-800 mt-0.5 font-medium leading-relaxed">
                      {slot.objektif_pembelajaran || '-'}
                    </p>
                  </div>

                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kriteria Kejayaan</span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {slot.kriteria_kejayaan || '-'}
                    </p>
                  </div>

                  {slot.aktiviti && (
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Rangka Aktiviti PdPc</span>
                      <div className="space-y-1 text-slate-700">
                        {slot.aktiviti.set_induksi && (
                          <p><strong className="text-emerald-700">Set Induksi:</strong> {slot.aktiviti.set_induksi}</p>
                        )}
                        {slot.aktiviti.langkah_1 && (
                          <p><strong className="text-emerald-700">Langkah 1:</strong> {slot.aktiviti.langkah_1}</p>
                        )}
                        {slot.aktiviti.langkah_2 && (
                          <p><strong className="text-emerald-700">Langkah 2:</strong> {slot.aktiviti.langkah_2}</p>
                        )}
                        {slot.aktiviti.penutup && (
                          <p><strong className="text-emerald-700">Penutup:</strong> {slot.aktiviti.penutup}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {slot.refleksi && (
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Refleksi &amp; Impak</span>
                      <p className="text-emerald-950 mt-0.5 font-medium">
                        {slot.refleksi.objektif_disalin || slot.objektif_pembelajaran || 'Objektif pembelajaran tercapai.'}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Kehadiran: <strong>{slot.refleksi.bilangan_murid_hadir ?? 0} orang</strong> | Mencapai: <strong>{slot.refleksi.bilangan_murid_mencapai ?? 0} orang</strong> ({slot.refleksi.peratus_mencapai ?? 0}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bahagian Pengesahan & Tandatangan Digital Pengetua */}
        <div className="bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Ruangan Pengesahan &amp; Tandatangan Pengetua / PGB
              </h2>
              <p className="text-xs text-slate-500">
                Penyeliaan Rasmi Kurikulum Mengikut Arahan SPI Bil. 3/1999
              </p>
            </div>
          </div>

          {/* JIKA TELAH DISEMAK: PAPARKAN MAKLUMAT LENGKAP */}
          {isAlreadyReviewed ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                <span>e-RPH ini telah disemak dan disahkan secara rasmi.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Penyemak</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">{review.nama_penyemak}</strong>
                  <span className="text-emerald-800 font-semibold">{review.jawatan_penyemak}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tarikh &amp; Masa Pengesahan</span>
                  <strong className="text-slate-800 mt-0.5 block font-mono">
                    {review.tarikh_disemak ? new Date(review.tarikh_disemak).toLocaleString('ms-MY') : '-'}
                  </strong>
                  <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                    PENGESAHAN DIGITAL SAAS
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ulasan / Catatan Penyemak</span>
                <p className="text-slate-800 mt-1 italic font-medium leading-relaxed">
                  &ldquo;{review.ulasan_penyemak}&rdquo;
                </p>
              </div>

              {review.tandatangan_penyemak && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                    Tandatangan Digital Penyemak
                  </span>
                  <div className="w-64 h-24 bg-white border border-slate-300 rounded-xl p-2 flex items-center justify-center">
                    <img
                      src={review.tandatangan_penyemak}
                      alt="Tandatangan Pengetua"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* JIKA BELUM DISEMAK: PAPARKAN BORANG PENGESAHAN */
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Penyemak (Pengetua / Guru Besar / GPK) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Contoh: TN. HJ. AHMAD BIN MOHD YUSOF"
                    required
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jawatan / Gred
                  </label>
                  <input
                    type="text"
                    value={reviewerPosition}
                    onChange={(e) => setReviewerPosition(e.target.value)}
                    placeholder="Contoh: Pengetua Cemerlang / PK Pentadbiran"
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ulasan &amp; Bimbingan Pentadbir
                </label>
                <textarea
                  rows={3}
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  placeholder="Tuliskan ulasan atau panduan ringkas..."
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Pad Tandatangan Digital Pengetua */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Turunkan Tandatangan Digital Anda</span>
                  </label>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[11px] text-rose-600 font-bold hover:underline flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Padam Semula</span>
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 touch-none cursor-crosshair bg-white"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-medium">
                      Gunakan jari atau stylus untuk menandatangani di sini...
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !reviewerName.trim()}
                  className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all hover:scale-101"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>
                    {isSubmitting ? 'Menghantar Pengesahan...' : 'Sahkan & Tandatangan e-RPH Minggu Ini'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          Sistem e-RPH Pintar SaaS &bull; Platform Pengurusan RPH Self-Serve B2C Pendidik Malaysia
        </div>

      </div>
    </div>
  );
}
