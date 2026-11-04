import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Share2,
  Trash2,
  Edit,
  Eye,
  Copy,
  Calendar,
  Building2,
  FileCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import type { BastData } from '../../types/bast.ts';
import type { CompanySettings } from '../../types/index.ts';
import { formatBastDate, downloadBastPDF, downloadRekapBastPDF } from '../../services/bastPdfGenerator.ts';

interface DaftarBastProps {
  basts: BastData[];
  settings: CompanySettings;
  onCreateNew: () => void;
  onEdit: (bast: BastData) => void;
  onDuplicate: (bast: BastData) => void;
  onViewPdf: (bast: BastData) => void;
  onShare: (bast: BastData) => void;
  onDelete: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export type BastFilterTab = 'Semua' | 'Bulan Ini' | 'Draft' | 'Selesai';

export const DaftarBast: React.FC<DaftarBastProps> = ({
  basts,
  settings,
  onCreateNew,
  onEdit,
  onDuplicate,
  onViewPdf,
  onShare,
  onDelete,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<BastFilterTab>('Semua');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Filter logic
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const filteredBasts = useMemo(() => {
    return basts.filter((b) => {
      // Search
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (b.nomorBast || '').toLowerCase().includes(q) ||
        (b.pihakPertamaPerusahaan || '').toLowerCase().includes(q) ||
        (b.pihakPertamaNama || '').toLowerCase().includes(q) ||
        (b.nomorPo || '').toLowerCase().includes(q) ||
        (b.tanggalBast || '').toLowerCase().includes(q);

      // Tab filter
      let matchTab = true;
      if (activeFilterTab === 'Bulan Ini') {
        matchTab = (b.tanggalBast || '').startsWith(currentYearMonth);
      } else if (activeFilterTab === 'Draft') {
        matchTab = b.status === 'Draft';
      } else if (activeFilterTab === 'Selesai') {
        matchTab = b.status === 'Selesai';
      }

      return matchSearch && matchTab;
    });
  }, [basts, searchTerm, activeFilterTab, currentYearMonth]);

  const handleDownloadRekap = async () => {
    if (filteredBasts.length === 0) {
      onToast('Tidak ada dokumen BAST untuk diekspor!');
      return;
    }
    await downloadRekapBastPDF(filteredBasts, settings);
    onToast('File PDF Rekap BAST berhasil diunduh!');
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      await onDelete(deleteCandidateId);
      setDeleteCandidateId(null);
      onToast('Dokumen BAST berhasil dihapus');
    } catch {
      onToast('Gagal menghapus dokumen BAST');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-3.5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Daftar BAST
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadRekap}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Rekap PDF</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>+ Buat BAST</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nomor BAST, PO, atau Nama PT..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto justify-between md:justify-start">
          {(['Semua', 'Bulan Ini', 'Draft', 'Selesai'] as BastFilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilterTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeFilterTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* REKAP BAST CARD LIST - ULTRA EFISIEN: HANYA NO BAST, NO PO, TANGGAL & NAMA PT */}
      <div className="space-y-2.5">
        {filteredBasts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-700">Belum ada dokumen BAST</h3>
          </div>
        ) : (
          filteredBasts.map((bast, idx) => (
            <div
              key={bast.id}
              className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border-l-4 border-l-emerald-600 border-y border-r border-slate-200 hover:border-slate-300 transition space-y-2"
            >
              {/* Baris 1: Meta Utama (Nomor BAST, Nomor PO, Tanggal, Status) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-extrabold text-slate-400">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg font-mono">
                    {bast.nomorBast}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">
                    PO: <strong className="text-slate-900">{bast.nomorPo || '-'}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">
                    {formatBastDate(bast.tanggalBast)}
                  </span>
                </div>

                {bast.status === 'Selesai' ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 self-start sm:self-auto">
                    SELESAI
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 self-start sm:self-auto">
                    DRAFT
                  </span>
                )}
              </div>

              {/* Baris 2: Nama PT */}
              <div className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                {bast.pihakPertamaPerusahaan || bast.pihakPertamaNama || 'Pihak Pertama'}
              </div>

              {/* Baris 3: Tombol Aksi Lengkap & Berfungsi Penuh */}
              <div className="border-t border-slate-100 pt-2 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onViewPdf(bast)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>VIEW PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(bast)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicate(bast)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Duplikat</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadBastPDF(bast, settings)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShare(bast)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-50 active:scale-95 text-blue-700 font-semibold text-xs rounded-xl border border-blue-300 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteCandidateId(bast.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 active:scale-95 rounded-xl transition border border-rose-200"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xs p-4 shadow-2xl text-slate-800 space-y-3">
            <h3 className="text-center font-bold text-sm text-slate-900">
              Hapus BAST ini?
            </h3>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
