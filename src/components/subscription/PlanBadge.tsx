'use client';

import React from 'react';
import { Crown, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PlanBadge() {
  const { planType, aiCreditsRemaining, setIsUpgradeModalOpen } = useAuth();
  const isPro = planType === 'pro';

  return (
    <button
      type="button"
      onClick={() => setIsUpgradeModalOpen(true)}
      className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-xs hover:scale-105 ${
        isPro
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white ring-2 ring-amber-400/30'
          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
      }`}
      title={isPro ? 'Akaun Pelan PRO Aktif - Akses Tanpa Had' : 'Pelan Percuma - Klik untuk naik taraf'}
    >
      {isPro ? (
        <>
          <Crown className="w-3.5 h-3.5 text-amber-200 fill-amber-200 animate-pulse" />
          <span className="tracking-wide">PRO AKTIF</span>
        </>
      ) : (
        <>
          <Zap className="w-3 h-3 text-emerald-600" />
          <span>FREE &bull; {aiCreditsRemaining} Kredit AI</span>
          <span className="ml-1 px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[10px] font-black uppercase">
            UPGRADE
          </span>
        </>
      )}
    </button>
  );
}
