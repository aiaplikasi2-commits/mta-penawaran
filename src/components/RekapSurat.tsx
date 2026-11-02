import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { CompanySettings, LetterData } from '../types/index.ts';
import { formatNumberIndo, formatIndoDate } from '../services/pdfGenerator.ts';

interface RekapSuratProps {
  letters: LetterData[];
  settings: CompanySettings;
  onEditLetter: (letter: LetterData) => void;
  onPreviewLetter: (letter: LetterData) => void;
  onDownloadLetter: (letter: LetterData) => Promise<void>;
  onShareLetter: (letter: LetterData) => void;
  onDeleteLetter: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export const RekapSurat: React.FC<RekapSuratProps> = ({
  letters,
  onEditLetter,
  onPreviewLetter,
  onDownloadLetter,
  onShareLetter,
  onDeleteLetter,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Extract unique years and customers for filters
  const years = useMemo(() => {
    const set = new Set<string>();
    letters.forEach((l) => {
      if (l.letterDate) {
        const y = l.letterDate.split('-')[0];
        if (y) set.add(y);
      }
    });
    return Array.from(set).sort().reverse();
  }, [letters]);

  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    letters.forEach((l) => {
      if (l.companyName && l.companyName.trim()) {
        set.add(l.companyName.trim());
      }
    });
    return Array.from(set).sort();
  }, [letters]);

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      // Search keyword
      const query = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (l.letterNumber || '').toLowerCase().includes(query) ||
        (l.companyName || '').toLowerCase().includes(query) ||
        (l.recipientName || '').toLowerCase().includes(query) ||
        (l.subject || '').toLowerCase().includes(query);

      // Month filter
      let matchMonth = true;
      if (selectedMonth !== 'all' && l.letterDate) {
        const m = l.letterDate.split('-')[1];
        matchMonth = m === selectedMonth;
      }

      // Year filter
      let matchYear = true;
      if (selectedYear !== 'all' && l.letterDate) {
        const y = l.letterDate.split('-')[0];
        matchYear = y === selectedYear;
      }

      // Customer filter
      let matchCustomer = true;
      if (selectedCustomer !== 'all') {
        matchCustomer = (l.companyName || '').trim() === selectedCustomer;
      }

      return matchSearch && matchMonth && matchYear && matchCustomer;
    });
  }, [letters, searchTerm, selectedMonth, selectedYear, selectedCustomer]);

  // Total summary of filtered letters
  const totalNominal = useMemo(() => {
    return filteredLetters.reduce((sum, l) => {
      const itemsTotal = l.items.reduce(
        (sub, it) => sub + (Number(it.qty) || 0) * (Number(it.price) || 0),
        0
      );
      const tradeInVal =
        l.tradeInActive && l.tradeIn
          ? (Number(l.tradeIn.qty) || 1) * (Number(l.tradeIn.unitValue) || 0)
          : 0;
      const afterTrade = Math.max(0, itemsTotal - tradeInVal);
      let disc = 0;
      if (l.discountActive) {
        disc =
          l.discountType === 'percent'
            ? (afterTrade * (Number(l.discountValue) || 0)) / 100
            : Number(l.discountValue) || 0;
      }
      const dpp = Math.max(0, afterTrade - disc);
      const ppn = l.ppnActive ? (dpp * (Number(l.ppnPercent) || 11)) / 100 : 0;
      return sum + (dpp + ppn);
    }, 0);
  }, [filteredLetters]);

  const confirmDelete = async () => {
    if (!deleteCandidateId) return;
    try {
      await onDeleteLetter(deleteCandidateId);
      setDeleteCandidateId(null);
      onToast('Surat berhasil dihapus');
    } catch {
      onToast('Gagal menghapus surat');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terkirim':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Diterima':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Ditolak':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="pb-24 pt-2 max-w-4xl mx-auto px-3 sm:px-4 space-y-4">
      {/* Header and Summary Cards */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0b223d] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Rekap Dokumen Penawaran</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh surat penawaran harga yang tersimpan di perangkat
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-blue-50 text-blue-900 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-semibold">
              Total: {filteredLetters.length} Surat
            </div>
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold">
              Rp {formatNumberIndo(totalNominal)}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3.5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor surat, pelanggan, atau perihal pekerjaan..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        {/* Filter Row */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Filter Bulan</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Filter Tahun</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>Filter Pelanggan</span>
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Semua Pelanggan</option>
              {uniqueCustomers.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Letters List */}
      <div className="space-y-3">
        {filteredLetters.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Belum ada surat penawaran</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedMonth !== 'all' || selectedYear !== 'all' || selectedCustomer !== 'all'
                ? 'Tidak ada surat yang cocok dengan kriteria pencarian atau filter Anda.'
                : 'Mulai buat penawaran harga baru melalui menu "Tambah Surat".'}
            </p>
          </div>
        ) : (
          filteredLetters.map((l) => {
            const itemsTotal = l.items.reduce(
              (sub, it) => sub + (Number(it.qty) || 0) * (Number(it.price) || 0),
              0
            );
            const tradeInVal =
              l.tradeInActive && l.tradeIn
                ? (Number(l.tradeIn.qty) || 1) * (Number(l.tradeIn.unitValue) || 0)
                : 0;
            const afterTrade = Math.max(0, itemsTotal - tradeInVal);
            let disc = 0;
            if (l.discountActive) {
              disc =
                l.discountType === 'percent'
                  ? (afterTrade * (Number(l.discountValue) || 0)) / 100
                  : Number(l.discountValue) || 0;
            }
            const dpp = Math.max(0, afterTrade - disc);
            const ppn = l.ppnActive ? (dpp * (Number(l.ppnPercent) || 11)) / 100 : 0;
            const letterGrandTotal = dpp + ppn;

            return (
              <div
                key={l.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 hover:border-blue-400 transition"
              >
                {/* Top Info Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#0b223d] bg-slate-100 px-2 py-0.5 rounded-md">
                        {l.letterNumber || 'Draft'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          l.status
                        )}`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {formatIndoDate(l.letterDate)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Nilai</span>
                    <span className="text-sm font-extrabold text-blue-900">
                      Rp {formatNumberIndo(letterGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="py-2.5 space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    {l.companyName || '(Pelanggan Tanpa Nama)'}
                    {l.recipientName ? ` — ${l.recipientName}` : ''}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {l.subject || '(Tidak ada perihal)'}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{l.items.length} Rincian Barang/Jasa</span>
                    {l.tradeInActive && <span className="text-amber-600">• Trade In Aktif</span>}
                    {l.discountActive && <span className="text-blue-600">• Diskon Aktif</span>}
                    {l.ppnActive && <span className="text-emerald-600">• PPN Aktif</span>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onPreviewLetter(l)}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                      title="Lihat Detail & Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditLetter(l)}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-blue-200 transition"
                      title="Edit Surat"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDownloadLetter(l)}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShareLetter(l)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                      title="Bagikan Surat"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bagikan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidateId(l.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition ml-1"
                      title="Hapus Surat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-slate-800 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-center font-bold text-base text-slate-900">
              Konfirmasi Hapus Surat
            </h3>
            <p className="text-center text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus surat penawaran ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
