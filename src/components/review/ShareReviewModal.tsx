'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RPHRecord } from '@/types/erph';

interface ShareReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  rphList: Partial<RPHRecord>[];
}

export default function ShareReviewModal({
  isOpen,
  onClose,
  currentWeek,
  rphList
}: ShareReviewModalProps) {
  const { user, userProfile, teacherName, teacherEmail } = useAuth();

  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek || 1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareResult, setShareResult] = useState<{
    shareToken: string;
    reviewUrl: string;
    fullReviewUrl: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    const schoolName = userProfile?.school_name || 'SEKOLAH SAYA';
    const schoolLogo = userProfile?.school_logo || '';

    try {
      const res = await fetch('/api/semak/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || userProfile?.user_id,
          teacherName: teacherName || userProfile?.full_name || 'Guru',
          teacherEmail: teacherEmail || userProfile?.email || '',
          schoolName,
          schoolLogo,
          weekNo: selectedWeek,
          academicYear: 2026,
          rphList: rphList || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShareResult({
          shareToken: data.shareToken,
          reviewUrl: data.reviewUrl,
          fullReviewUrl: data.fullReviewUrl
        });
      } else {
        setErrorMsg(data.error || 'Gagal menjana pautan semakan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat sambungan pelayan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (shareResult?.fullReviewUrl) {
      navigator.clipboard.writeText(shareResult.fullReviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!shareResult?.fullReviewUrl) return;
    const msg = `Assalamualaikum & Salam Sejahtera Tuan Pengetua/PGB,\n\nBerikut ialah pautan semakan e-RPH Minggu ${selectedWeek} saya (${teacherName || 'Guru'}, ${userProfile?.school_name || 'Sekolah'}) untuk disemak dan disahkan secara digital:\n\n${shareResult.fullReviewUrl}\n\nTerima kasih.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Share2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Pautan Semakan Pengetua (Magic Link)
              </h2>
              <p className="text-xs text-emerald-100">
                Pengetua / Guru Besar boleh menyemak dan menandatangani e-RPH tanpa perlu mendaftar akaun
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kandungan Modal */}
        <div className="p-6 space-y-5">
          
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 leading-relaxed flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Sistem Semakan Mesra B2C:</span>
              <p className="mt-0.5 text-emerald-900/90">
                Pautan ini selamat dan mengandungi paparan snapshot RPH bagi minggu yang dipilih. Pengetua boleh membuka pautan di telefon atau komputer, memberikan ulasan, dan menurunkan tandatangan digital.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilih Minggu Semakan</span>
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(Number(e.target.value));
                setShareResult(null);
              }}
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {Array.from({ length: 43 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Minggu {w} (Sesi 2026/2027)
                </option>
              ))}
            </select>
          </div>

          {/* Butang Jana Pautan */}
          {!shareResult && (
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-102 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isGenerating ? 'Menjana Pautan Semakan Luar...' : `Jana Pautan Semakan Minggu ${selectedWeek}`}</span>
            </button>
          )}

          {/* Paparan Pautan yang Telah Dijana */}
          {shareResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border border-emerald-300 bg-emerald-50/50 rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Pautan Semakan Tersedia:
                </span>
                
                <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-xl p-2.5 shadow-xs">
                  <input
                    type="text"
                    readOnly
                    value={shareResult.fullReviewUrl}
                    className="flex-1 text-xs font-mono text-slate-800 bg-transparent outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Disalin!' : 'Salin Pautan'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hantar ke WhatsApp Pengetua</span>
                  </button>

                  <a
                    href={shareResult.reviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <span>Buka Pratonton Semakan</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400">
            Pautan aktif selama 90 hari &bull; Mematuhi Panduan Penyeliaan PdPc SPI Bil. 3/1999
          </p>
        </div>

      </div>
    </div>
  );
}
