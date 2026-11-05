import React, { useState } from 'react';
import {
  Search,
  FileText,
  Calendar,
  Building,
  DollarSign,
  Trash2,
  Eye,
  FileCheck2,
  Receipt,
  ExternalLink,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';
import type { PurchaseOrderData } from '../../types/po.ts';

interface PoHistoryListProps {
  purchaseOrders: PurchaseOrderData[];
  onSelectPo: (po: PurchaseOrderData) => void;
  onDeletePo: (id: string, nomorPo: string) => void;
  onNavigateToInvoice?: (po: PurchaseOrderData) => void;
  onNavigateToBast?: (po: PurchaseOrderData) => void;
}

export const PoHistoryList: React.FC<PoHistoryListProps> = ({
  purchaseOrders,
  onSelectPo,
  onDeletePo,
  onNavigateToInvoice,
  onNavigateToBast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttachmentPo, setSelectedAttachmentPo] = useState<PurchaseOrderData | null>(null);

  const filtered = purchaseOrders.filter((po) => {
    const term = searchTerm.toLowerCase();
    const poNum = (po.nomorPo || '').toLowerCase();
    const buyer = (po.buyerCompany || '').toLowerCase();
    const date = (po.tanggalPo || '').toLowerCase();
    return poNum.includes(term) || buyer.includes(term) || date.includes(term);
  });

  const formatCurrency = (val: number, cur = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: cur || 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nomor PO, Perusahaan, atau Tanggal..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium px-2 text-right">
          Total: <strong className="text-blue-700">{filtered.length}</strong> PO Tersimpan
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-800 text-sm md:text-base">
            {searchTerm ? 'Tidak ada PO yang cocok dengan pencarian' : 'Belum Ada Purchase Order'}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchTerm
              ? 'Coba gunakan kata kunci pencarian yang lain.'
              : 'Silakan upload dokumen PO pertama Anda menggunakan tab "Upload & Ekstraksi AI" di atas.'}
          </p>
        </div>
      ) : (
        /* Card / Table List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Purchase Order
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mt-1 line-clamp-1 font-mono">
                      {po.nomorPo}
                    </h3>
                  </div>

                  {po.fileDataUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedAttachmentPo(po)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Lihat lampiran dokumen asli"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold mt-2 line-clamp-1">
                  <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{po.buyerCompany}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2.5 text-xs text-gray-600 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Tanggal PO:
                  </span>
                  <span className="font-medium text-gray-800">{formatDate(po.tanggalPo)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-gray-400" /> Rincian Item:
                  </span>
                  <span className="font-medium text-gray-800">{po.items?.length || 0} Barang/Jasa</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Grand Total:
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(po.grandTotal || 0, po.currency)}
                  </span>
                </div>

                {po.paymentTerms && (
                  <div className="text-[11px] text-gray-500 line-clamp-1">
                    TOP: <strong>{po.paymentTerms}</strong>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {onNavigateToInvoice && (
                    <button
                      type="button"
                      onClick={() => onNavigateToInvoice(po)}
                      className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 rounded-lg transition inline-flex items-center gap-1"
                      title="Buat invoice menggunakan PO ini"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>+ Invoice</span>
                    </button>
                  )}
                  {onNavigateToBast && (
                    <button
                      type="button"
                      onClick={() => onNavigateToBast(po)}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1"
                      title="Buat BAST menggunakan PO ini"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>+ BAST</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectPo(po)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-gray-200 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition shadow-2xs"
                  >
                    Buka / Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePo(po.id, po.nomorPo)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Hapus PO dari cloud database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Preview Modal */}
      {selectedAttachmentPo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-xs md:text-sm font-bold">
                    Dokumen Lampiran PO: {selectedAttachmentPo.nomorPo}
                  </h4>
                  <p className="text-[11px] text-gray-400">{selectedAttachmentPo.buyerCompany}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttachmentPo(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              {selectedAttachmentPo.fileDataUrl?.startsWith('data:image') ? (
                <img
                  src={selectedAttachmentPo.fileDataUrl}
                  alt={selectedAttachmentPo.nomorPo}
                  className="max-h-[70vh] object-contain rounded-lg shadow-md"
                />
              ) : selectedAttachmentPo.fileDataUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedAttachmentPo.fileDataUrl}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-lg border border-gray-300"
                />
              ) : (
                <div className="text-center p-6 text-gray-500">
                  <p>Format file dokumen: {selectedAttachmentPo.fileType || 'Dokumen'}</p>
                  {selectedAttachmentPo.fileDataUrl && (
                    <a
                      href={selectedAttachmentPo.fileDataUrl}
                      download={`PO_${selectedAttachmentPo.nomorPo}`}
                      className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Unduh Berkas Lampiran
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-white border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAttachmentPo(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
