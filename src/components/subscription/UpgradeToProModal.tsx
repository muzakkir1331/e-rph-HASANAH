'use client';

import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Zap,
  CreditCard,
  Gift,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeToProModal({ isOpen, onClose, reason }: UpgradeToProModalProps) {
  const { planType, aiCreditsRemaining, upgradeToPro } = useAuth();
  const isPro = planType === 'pro';

  const [voucherCode, setVoucherCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  // Penebusan Kod Baucar / Lesen PRO
  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      setErrorMsg('Sila masukkan kod baucar atau lesen anda.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await upgradeToPro(voucherCode.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2500);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Simulasi Langganan Terus (FPX / Kad)
  const handleDirectSubscribe = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Simulasi langganan aktif segera
    const res = await upgradeToPro('SAAS2026');
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Langganan anda berjaya diaktifkan! Selamat menikmati Pelan PRO tanpa had.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2500);
    } else {
      setErrorMsg('Ralat semasa mengaktifkan langganan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Crown className="w-5 h-5 text-amber-200 fill-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Naik Taraf ke Pelan PRO Pendidik
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-300 text-slate-900 rounded-full uppercase tracking-wider">
                  B2C Self-Serve
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Buka potensi penuh janaan AI tanpa had, PDF bebas watermark, dan semakan luar automatik
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

        {/* Notis Alasan Pembukaan Paywall (Jika Kuota Habis) */}
        {reason && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center space-x-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{reason}</span>
          </div>
        )}

        {/* Kandungan Modal (Boleh Skrol) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Kad Perbandingan Pelan: Percuma vs PRO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pelan Percuma */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pelan Percuma</span>
                  {!isPro && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-200 text-slate-700 rounded-full">
                      Pelan Semasa
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">RM 0</div>
                <p className="text-xs text-slate-500 mt-0.5">Sesuai untuk mencuba sistem e-RPH</p>

                <ul className="space-y-2.5 mt-4 text-xs text-slate-700">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Terhad kepada <strong>5 Kredit Janaan AI</strong> ({aiCreditsRemaining} baki)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Cetakan PDF mengandungi <strong>Watermark Rasmi</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Templat e-RPH Asas KPM</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-200">
                Akaun percuma tidak luput
              </div>
            </div>

            {/* Pelan PRO Pendidik */}
            <div className="border-2 border-amber-500 rounded-2xl p-5 bg-gradient-to-b from-amber-50/50 to-emerald-50/40 space-y-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 font-extrabold text-[10px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                Paling Popular
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pelan PRO Pendidik</span>
                  </span>
                </div>
                
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    {selectedBillingCycle === 'yearly' ? 'RM 79' : 'RM 15'}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    {selectedBillingCycle === 'yearly' ? '/ tahun (RM6.50/bulan)' : '/ bulan'}
                  </span>
                </div>

                <ul className="space-y-2.5 mt-4 text-xs text-slate-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Janaan AI Gemini 3.8 Flash Tanpa Had</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>PDF Bersih 100% Bebas Watermark</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Pautan Semakan Luar Pengetua</strong> (Magic Link)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Sokongan Penuh Tulisan Arab &amp; Jawi (RTL) KBD</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Simpanan Auto-Sync Google Drive &amp; Cloud Profile</span>
                  </li>
                </ul>
              </div>

              {/* Pilihan Kitaran Langganan */}
              <div className="pt-2 flex items-center justify-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle('yearly')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    selectedBillingCycle === 'yearly'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Tahunan (Jimat 56%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    selectedBillingCycle === 'monthly'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Bulanan
                </button>
              </div>

              <button
                type="button"
                onClick={handleDirectSubscribe}
                disabled={loading || isPro}
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-102 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isPro ? 'Pelan PRO Telah Aktif' : 'Langgan Sekarang & Buka Akses'}</span>
                {!isPro && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Bahagian Tebus Baucar / Kod Lesen */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Penebusan Kod Baucar / Kod Lesen PRO
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Ada kod baucar daripada program penataran, bengkel TS25, atau tajaan sekolah? Masukkan kod baucar anda di bawah:
            </p>

            <form onSubmit={handleRedeemVoucher} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Contoh: GURUPRO2026 atau CIKGUJUARA"
                disabled={loading}
                className="flex-1 text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-amber-500 tracking-wider"
              />
              <button
                type="submit"
                disabled={loading || !voucherCode.trim()}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Mengesahkan...' : 'Tebus Baucar'}</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
              <span>Kod Ujian Sedia Ada:</span>
              <button
                type="button"
                onClick={() => setVoucherCode('GURUPRO2026')}
                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono hover:bg-amber-100"
              >
                GURUPRO2026
              </button>
              <button
                type="button"
                onClick={() => setVoucherCode('CIKGUJUARA')}
                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono hover:bg-amber-100"
              >
                CIKGUJUARA
              </button>
              <button
                type="button"
                onClick={() => setVoucherCode('HASANAHPRO')}
                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono hover:bg-amber-100"
              >
                HASANAHPRO
              </button>
            </div>
          </div>

          {/* Mesej Ralat & Kejayaan */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

        </div>

        {/* Footer Makluman */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Pembayaran selamat B2C SaaS &bull; Jaminan pulangan wang 14 hari</span>
          </p>
        </div>

      </div>
    </div>
  );
}
