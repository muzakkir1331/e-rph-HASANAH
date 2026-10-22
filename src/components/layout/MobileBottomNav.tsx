'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, Clock, Sheet, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hanya papar jika pengguna telah log masuk dan bukan di halaman login atau semak
  if (!user || pathname === '/login' || pathname.startsWith('/semak')) {
    return null;
  }

  const items = [
    { href: '/', label: 'Utama', icon: BookOpen },
    { href: '/jadual', label: 'Jadual', icon: Clock },
    { href: '/rph/baharu', label: 'e-RPH', icon: Sparkles, highlight: true },
    { href: '/rpt', label: 'RPT', icon: Sheet },
    { href: '/takwim', label: 'Takwim', icon: Calendar },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg pb-[env(safe-area-inset-bottom)] no-print"
      aria-label="Navigasi Mudah Alih Bawah"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center relative -top-3 group touch-manipulation"
                id="bottom-nav-erph-btn"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 group-active:scale-95 transition-transform border-2 border-white">
                  <Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-black tracking-tight text-emerald-800 mt-0.5">
                  + {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-all touch-manipulation ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700 font-bold' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight leading-tight mt-0.5 ${
                  isActive ? 'font-extrabold text-emerald-800' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
