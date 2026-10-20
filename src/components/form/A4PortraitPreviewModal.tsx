'use client';

import React, { useState } from 'react';
import { X, Printer, Download, Eye, FileText, CheckCircle2, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { RPHRecord } from '@/types/erph';
import { generateSingleRPHCardHtml, formatRPHFileName } from '@/lib/google-drive';

interface A4PortraitPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyRphList: Partial<RPHRecord>[];
  teacherName: string;
  teacherEmail: string;
  weekNo: number | string;
  onPrint: () => void;
  onDownloadHtml: () => void;
  onSavePdf?: () => void;
}

export default function A4PortraitPreviewModal({
  isOpen,
  onClose,
  weeklyRphList,
  teacherName,
  teacherEmail,
  weekNo,
  onPrint,
  onDownloadHtml,
  onSavePdf
}: A4PortraitPreviewModalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'weekly'>('single');

  if (!isOpen) return null;

  const currentRPH = weeklyRphList[currentPageIndex] || weeklyRphList[0] || {};
  const totalPages = weeklyRphList.length;

  const handleSavePdf = () => {
    const originalTitle = typeof document !== 'undefined' ? document.title : '';
    const formattedTitle = formatRPHFileName(teacherName, weekNo);
    if (typeof document !== 'undefined') {
      document.title = formattedTitle;
    }

    if (onSavePdf) {
      onSavePdf();
    } else {
      window.print();
    }

    setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.title = originalTitle;
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Pratonton Layout RPH A4 Potrait (Satu Muka Surat Setiap Subjek)
              </h3>
              <p className="text-xs text-slate-500">
                Mematuhi Piawaian Cetakan A4 Potrait KPM, TS25 &amp; JPN Pahang &bull; Minggu {weekNo}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold mr-2">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'single' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Halaman Semasa
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'weekly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Semua Seminggu ({totalPages} Subjek)
              </button>
            </div>

            {/* Butang Simpan PDF */}
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all hover:scale-105"
              title="Simpan e-RPH sebagai fail PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak A4</span>
            </button>

            <button
              type="button"
              onClick={onDownloadHtml}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun .HTML</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header Paging (Single Mode) */}
        {viewMode === 'single' && totalPages > 1 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold shrink-0">
            <span className="text-slate-600">
              Subjek {currentPageIndex + 1} daripada {totalPages}:{' '}
              <span className="text-emerald-800">{currentRPH.subjek}</span> ({currentRPH.hari} &bull; {currentRPH.kelas})
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={currentPageIndex <= 0}
                onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <span className="px-2 font-mono">
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPageIndex >= totalPages - 1}
                onClick={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center space-x-1"
              >
                <span>Seterusnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Preview Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col items-center">
          {viewMode === 'single' ? (
            <div
              className="w-full max-w-[210mm] bg-white shadow-xl rounded-md p-6 sm:p-8 border border-slate-300"
              dangerouslySetInnerHTML={{
                __html: generateSingleRPHCardHtml(
                  currentRPH,
                  teacherName,
                  teacherEmail,
                  currentPageIndex + 1,
                  totalPages
                )
              }}
            />
          ) : (
            weeklyRphList.map((rph, idx) => (
              <div
                key={idx}
                className="w-full max-w-[210mm] bg-white shadow-xl rounded-md p-6 sm:p-8 border border-slate-300 relative"
              >
                <div className="absolute top-2 right-4 text-[10px] font-bold text-slate-400 uppercase">
                  MUKA SURAT {idx + 1} DARI {totalPages}
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateSingleRPHCardHtml(
                      rph,
                      teacherName,
                      teacherEmail,
                      idx + 1,
                      totalPages
                    )
                  }}
                />
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
