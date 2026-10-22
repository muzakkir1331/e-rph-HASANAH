import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/context/AuthContext';

import ModalContainer from '@/components/layout/ModalContainer';

export const metadata: Metadata = {
  title: 'e-RPH Pintar SaaS | Platform Pengurusan RPH Pendidik Malaysia',
  description: 'Aplikasi web e-RPH Pintar SaaS B2C generasi baharu dengan integrasi DSKP, Takwim KPM, Penyambung RPT Google Sheets, Semakan Magic Link Pengetua, dan Co-Pilot Gemini AI.',
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
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
            <p>&copy; 2026/2027 e-RPH Pintar SaaS &bull; Mematuhi Piawaian SPI Bil. 3/1999 &amp; Inisiatif TS25 KPM &bull; Platform Self-Serve Guru Seluruh Malaysia</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
