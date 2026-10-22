'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Sheet,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  Settings,
  Menu,
  X,
  School,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentWeekFromDate } from '@/lib/rpt-helper';
import PlanBadge from '@/components/subscription/PlanBadge';

export default function Navbar() {
  const pathname = usePathname();
  const {
    user,
    teacherName,
    teacherEmail,
    isDeLIMA,
    userProfile,
    signOutUser,
    setIsOnboardingModalOpen
  } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tutup menu bila navigasi bertukar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Kunci scroll badan semasa modal menu mobile dibuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Kira minggu persekolahan semasa berdasarkan tarikh hari ini
  const currentWeekInfo = useMemo(() => {
    return getCurrentWeekFromDate();
  }, []);

  const navLinks = [
    { href: '/', label: 'Papan Pemuka', icon: BookOpen, desc: 'Ringkasan jadual & aktiviti' },
    { href: '/rph/baharu', label: 'Borang e-RPH Pintar', icon: Sparkles, badge: 'AI', desc: 'Bina & jana e-RPH digital' },
    { href: '/jadual', label: 'Jadual Waktu Guru', icon: Clock, desc: 'Paparan & susunan kelas' },
    { href: '/rpt', label: 'Penyambung RPT', icon: Sheet, desc: 'Rancangan Pengajaran Tahunan' },
    { href: '/takwim', label: 'Takwim Persekolahan', icon: Calendar, desc: 'Minggu akademik 2026/2027' },
  ];

  const currentSchool = userProfile?.school_name || 'SMA Al-Hasanah';
  const schoolLogo = userProfile?.school_logo || '/logo-al-hasanah.png';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & School Title Khusus Guru SMA Al-Hasanah */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center p-1 overflow-hidden shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  <img
                    src={schoolLogo}
                    alt="Logo SMA Al-Hasanah"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-700 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-xs">
                      {currentSchool}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                      GURU
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[150px] sm:max-w-xs">
                    Sistem e-RPH Digital &bull; Sesi 2026/2027
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-emerald-600 text-white rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-2">
              
              {/* Lencana Guru SMA Al-Hasanah */}
              {user && <PlanBadge />}

              {/* Minggu Takwim Semasa */}
              <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-700">
                  {currentWeekInfo?.label_minggu || 'Minggu 1'}
                </span>
              </div>

              {user ? (
                <div className="flex items-center space-x-1.5 sm:space-x-2 border-l border-slate-200 pl-2">
                  {/* Butang Profil Sekolah */}
                  <button
                    type="button"
                    onClick={() => setIsOnboardingModalOpen(true)}
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
                    title="Tetapan Profil & Maklumat Sekolah"
                    aria-label="Tetapan Profil Sekolah"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Avatar Pengguna */}
                  <div
                    onClick={() => setIsOnboardingModalOpen(true)}
                    className="cursor-pointer hidden sm:flex items-center space-x-2 group"
                    title="Profil Pendidik SMA Al-Hasanah"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all">
                      {(teacherName || 'CG').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="hidden xl:block text-left max-w-[120px]">
                      <p className="text-xs font-bold text-slate-800 leading-none truncate group-hover:text-emerald-700">
                        {teacherName || 'Guru'}
                      </p>
                      <span className="inline-flex items-center space-x-0.5 text-[9.5px] text-emerald-700 font-mono mt-0.5 truncate">
                        {isDeLIMA ? (
                          <>
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">DeLIMA</span>
                          </>
                        ) : (
                          <span className="truncate">{teacherEmail}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Butang Log Keluar (Desktop) */}
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="hidden sm:inline-flex p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Log Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log Masuk</span>
                </Link>
              )}

              {/* Hamburger Toggle Button for Mobile Portrait Mode */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all touch-manipulation focus:outline-hidden"
                aria-label={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
                id="mobile-nav-toggle-btn"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-emerald-800" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700" />
                )}
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer / Overlay Menu untuk Paparan Telefon (Portrait Mode) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200 no-print">
          {/* Backdrop gelap boleh ditekan untuk menutup menu */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200 animate-in slide-in-from-right duration-200">
            
            {/* Header Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20">
                  <img
                    src={schoolLogo}
                    alt="Logo SMA Al-Hasanah"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">{currentSchool}</h3>
                  <p className="text-[10px] text-emerald-200">Sistem e-RPH Digital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Guru Semasa */}
            {user && (
              <div className="p-4 bg-emerald-50/70 border-b border-emerald-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                    {(teacherName || 'CG').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 truncate">{teacherName || 'Guru'}</p>
                    <p className="text-[11px] text-emerald-800 truncate font-mono">
                      {isDeLIMA ? `DeLIMA: ${teacherEmail}` : teacherEmail}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-200/80 text-emerald-900">
                      Warga Pendidik SMA Al-Hasanah
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Senarai Pautan Navigasi Mesra Telefon */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <p className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Menu Utama Pendidik
              </p>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all touch-manipulation ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-emerald-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate">{link.label}</span>
                          {link.badge && (
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${
                                isActive ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {link.badge}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] font-normal truncate mt-0.5 ${
                            isActive ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          {link.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-200' : 'text-slate-300'}`} />
                  </Link>
                );
              })}

              {/* Tetapan Profil Sekolah Modal Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsOnboardingModalOpen(true);
                  }}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-all border border-slate-200/80 touch-manipulation"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span>Tetapan Profil Sekolah</span>
                      <p className="text-[10px] font-normal text-slate-400">Nama, jawatan &amp; tandatangan</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

            </div>

            {/* Footer Drawer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Status Takwim:</span>
                <span className="font-bold text-emerald-700">
                  {currentWeekInfo?.label_minggu || 'Minggu 1'}
                </span>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOutUser();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center space-x-2 transition-colors border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Keluar Sesi</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log Masuk Pendidik</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
