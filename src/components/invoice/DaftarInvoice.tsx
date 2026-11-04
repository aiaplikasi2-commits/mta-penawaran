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
  Receipt,
} from 'lucide-react';
import type { InvoiceData } from '../../types/invoice.ts';
import type { CompanySettings } from '../../types/index.ts';
import { formatInvoiceDate, downloadInvoicePDF, downloadRekapInvoicePDF } from '../../services/invoicePdfGenerator.ts';
import { formatNumberIndo } from '../../services/pdfGenerator.ts';

interface DaftarInvoiceProps {
  invoices: InvoiceData[];
  settings: CompanySettings;
  onCreateNew: () => void;
  onEdit: (invoice: InvoiceData) => void;
  onDuplicate: (invoice: InvoiceData) => void;
  onViewPdf: (invoice: InvoiceData) => void;
  onShare: (invoice: InvoiceData) => void;
  onDelete: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export type InvoiceFilterTab = 'Semua' | 'Bulan Ini' | 'Lunas' | 'Belum Lunas';

export const DaftarInvoice: React.FC<DaftarInvoiceProps> = ({
  invoices,
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
  const [activeFilterTab, setActiveFilterTab] = useState<InvoiceFilterTab>('Semua');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.companyName || '').toLowerCase().includes(q) ||
        (inv.nomorPo || '').toLowerCase().includes(q) ||
        (inv.invoiceDate || '').toLowerCase().includes(q);

      let matchTab = true;
      if (activeFilterTab === 'Bulan Ini') {
        matchTab = (inv.invoiceDate || '').startsWith(currentYearMonth);
      } else if (activeFilterTab === 'Lunas') {
        matchTab = inv.status === 'Lunas';
      } else if (activeFilterTab === 'Belum Lunas') {
        matchTab = inv.status === 'Belum Lunas';
      }

      return matchSearch && matchTab;
    });
  }, [invoices, searchTerm, activeFilterTab, currentYearMonth]);

  const handleDownloadRekap = async () => {
    if (filteredInvoices.length === 0) {
      onToast('Tidak ada data invoice');
      return;
    }
    await downloadRekapInvoicePDF(filteredInvoices, settings);
    onToast('File Rekap PDF diunduh');
  };

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      await onDelete(deleteCandidateId);
      setDeleteCandidateId(null);
      onToast('Invoice berhasil dihapus');
    } catch {
      onToast('Gagal menghapus');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2.5 sm:px-4 py-3.5 pb-28 space-y-3">
      {/* HEADER BAR - Compact & Mobile Friendly */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          Daftar Invoice
        </h2>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadRekap}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Rekap PDF</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>+ Buat</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white rounded-xl p-2 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Invoice, PO, PT..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg w-full md:w-auto justify-between md:justify-start">
          {(['Semua', 'Bulan Ini', 'Lunas', 'Belum Lunas'] as InvoiceFilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilterTab(tab)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition whitespace-nowrap ${
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

      {/* INVOICE CARD LIST - ULTRA COMPACT: NO INVOICE, PO, TANGGAL, NAMA PT, NOMINAL */}
      <div className="space-y-2">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-1.5">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-700">Belum ada invoice</h3>
          </div>
        ) : (
          filteredInvoices.map((inv, idx) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl p-3 shadow-xs border-l-4 border-l-blue-700 border-y border-r border-slate-200 hover:border-slate-300 transition space-y-2"
            >
              {/* Line 1: Meta Info */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-extrabold text-slate-400">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md font-mono">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">
                    PO: <strong className="text-slate-900">{inv.nomorPo || '-'}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">
                    {formatInvoiceDate(inv.invoiceDate)}
                  </span>
                </div>

                {inv.status === 'Lunas' ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                    LUNAS
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                    BELUM LUNAS
                  </span>
                )}
              </div>

              {/* Line 2: Nama PT & Total Tagihan */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 uppercase truncate">
                  {inv.companyName || '-'}
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-blue-900 font-mono shrink-0">
                  Rp {formatNumberIndo(inv.total)}
                </span>
              </div>

              {/* Line 3: Action Buttons (Short, responsive, fit screen) */}
              <div className="border-t border-slate-100 pt-2 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onViewPdf(inv)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>VIEW</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(inv)}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicate(inv)}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Duplikat</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadInvoicePDF(inv, settings)}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShare(inv)}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 active:scale-95 text-blue-700 font-semibold text-xs rounded-lg border border-blue-300"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteCandidateId(inv.id)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl w-full max-w-xs p-4 shadow-2xl text-slate-800 space-y-3">
            <h3 className="text-center font-bold text-sm text-slate-900">
              Hapus Invoice ini?
            </h3>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
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
