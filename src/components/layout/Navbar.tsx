'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Calendar, Clock, BookOpen, Sheet, LogIn, LogOut, ShieldCheck, User, Settings, Crown, Share2 } from 'lucide-react';
import { useMemo } from 'react';
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
    setIsOnboardingModalOpen,
    setIsUpgradeModalOpen
  } = useAuth();

  // Kira minggu persekolahan semasa berdasarkan tarikh hari ini
  const currentWeekInfo = useMemo(() => {
    return getCurrentWeekFromDate();
  }, []);

  const navLinks = [
    { href: '/', label: 'Papan Pemuka', icon: BookOpen },
    { href: '/rph/baharu', label: 'Borang e-RPH Pintar', icon: Sparkles, badge: 'AI' },
    { href: '/jadual', label: 'Jadual Waktu Guru', icon: Clock },
    { href: '/rpt', label: 'Penyambung RPT', icon: Sheet },
    { href: '/takwim', label: 'Takwim Persekolahan', icon: Calendar },
  ];

  const currentSchool = userProfile?.school_name || 'e-RPH Pintar SaaS';
  const schoolLogo = userProfile?.school_logo;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Title (Dinamik mengikut Profil Guru) */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                {schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src="/logo-al-hasanah.png"
                    alt="Logo Default e-RPH"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent truncate max-w-[170px] sm:max-w-xs">
                    {currentSchool}
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                    SaaS B2C
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                  {userProfile?.position || 'Guru Akademik'} &bull; Sesi 2026/2027
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-emerald-500 text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Info, Plan Badge & Onboarding Trigger */}
          <div className="flex items-center space-x-2.5">
            
            {/* Lencana Pelan SaaS (Free/Pro) */}
            {user && <PlanBadge />}

            {/* Minggu Takwim Semasa */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-slate-700">
                {currentWeekInfo?.label_minggu || 'Minggu 1'}
              </span>
            </div>

            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-2.5">
                {/* Butang Profil / Onboarding Setup */}
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
                  title="Tetapan Profil & Logo Sekolah"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Avatar Pengguna */}
                <div
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="cursor-pointer flex items-center space-x-2 group"
                  title="Klik untuk kemaskini profil sekolah"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20 flex-shrink-0 group-hover:ring-emerald-500">
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

                <button
                  type="button"
                  onClick={signOutUser}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                  title="Log Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log Masuk Pendidik</span>
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
