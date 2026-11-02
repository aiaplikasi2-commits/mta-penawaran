import React from 'react';
import { X, Download, Share2, Printer } from 'lucide-react';
import type { CompanySettings, LetterData } from '../types/index.ts';
import { LetterPreview } from './LetterPreview.tsx';
import { downloadLetterPDF } from '../services/pdfGenerator.ts';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: LetterData;
  settings: CompanySettings;
  onToast: (msg: string) => void;
  onShareClick?: (letter: LetterData) => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  letter,
  settings,
  onToast,
  onShareClick,
}) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      await downloadLetterPDF(letter, settings);
      onToast('PDF berhasil diunduh!');
    } catch {
      onToast('Gagal mengunduh PDF');
    }
  };

  const handleShare = () => {
    if (onShareClick) {
      onShareClick(letter);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs">
      {/* Modal Header */}
      <div className="bg-[#0b223d] text-white px-4 py-3 flex items-center justify-between border-b border-blue-950 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">Preview Dokumen Surat</span>
          <span className="text-xs text-sky-300">({letter.letterNumber || 'Draft'})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-sky-200 transition"
            title="Cetak"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/90 flex justify-center">
        <div className="w-full max-w-3xl">
          <LetterPreview letter={letter} settings={settings} />
        </div>
      </div>
    </div>
  );
};
