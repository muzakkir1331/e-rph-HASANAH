'use client';

import React from 'react';
import { School, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PlanBadge() {
  const { userProfile, setIsOnboardingModalOpen } = useAuth();
  const schoolName = userProfile?.school_name || 'SMA Al-Hasanah';

  return (
    <button
      type="button"
      onClick={() => setIsOnboardingModalOpen(true)}
      className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-all shadow-xs"
      title="Akses Rasmi Warga Pendidik SMA Al-Hasanah"
    >
      <School className="w-3.5 h-3.5 text-emerald-700" />
      <span className="tracking-wide uppercase font-black">{schoolName}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
    </button>
  );
}
