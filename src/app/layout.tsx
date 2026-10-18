import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'e-RPH Pintar | Sistem Pengurusan RPH KPM',
  description: 'Aplikasi web e-RPH Pintar generasi baharu dengan integrasi DSKP, Takwim 2026, Penyambung RPT Google Sheets, dan Co-Pilot Gemini AI.',
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
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
            <p>&copy; 2026 e-RPH Pintar &bull; Mematuhi Piawaian SPI Bil. 3/1999 &amp; TS25 KPM &bull; SMA Al-Hasanah</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
