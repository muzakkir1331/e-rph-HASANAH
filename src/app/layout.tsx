import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { AuthProvider } from '@/context/AuthContext';
import ModalContainer from '@/components/layout/ModalContainer';

export const metadata: Metadata = {
  title: 'e-RPH SMA Al-Hasanah | Sistem Pengurusan RPH Digital Guru',
  description: 'Sistem e-RPH Digital rasmi untuk warga pendidik Sekolah Menengah Agama Al-Hasanah. Dilengkapi integrasi DSKP, Takwim KPM, Penyambung RPT Google Sheets, dan Bantuan Pintar AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased font-sans">
        <AuthProvider>
          <Navbar />
          <ModalContainer />
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8">
            {children}
          </main>
          <MobileBottomNav />
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print pb-24 md:pb-6">
            <p>&copy; 2026/2027 e-RPH SMA Al-Hasanah &bull; Sekolah Menengah Agama Al-Hasanah &bull; Mematuhi Piawaian SPI Bil. 3/1999 &amp; Inisiatif TS25 KPM</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
