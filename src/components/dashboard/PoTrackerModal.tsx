import React, { useState, useMemo } from 'react';
import { Package, Search, X, Eye, FileText, FileCheck2, FileSpreadsheet } from 'lucide-react';
import type { LetterData } from '../../types/index.ts';
import type { BastData } from '../../types/bast.ts';
import type { InvoiceData } from '../../types/invoice.ts';

interface PoItemSummary {
  id: string;
  poNumber: string;
  docType: 'Surat Penawaran' | 'BAST' | 'Invoice';
  docNumber: string;
  clientName: string;
  date: string;
  sourceDoc: LetterData | BastData | InvoiceData;
}

interface PoTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  letters: LetterData[];
  basts: BastData[];
  invoices: InvoiceData[];
  onOpenLetter: (letter: LetterData) => void;
  onOpenBast: (bast: BastData) => void;
  onOpenInvoice: (invoice: InvoiceData) => void;
}

export const PoTrackerModal: React.FC<PoTrackerModalProps> = ({
  isOpen,
  onClose,
  letters,
  basts,
  invoices,
  onOpenLetter,
  onOpenBast,
  onOpenInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const poList = useMemo(() => {
    const list: PoItemSummary[] = [];

    // From Surat Penawaran
    letters.forEach((l) => {
      if (l.subject && l.subject.trim()) {
        list.push({
          id: `sp-${l.id}`,
          poNumber: l.subject,
          docType: 'Surat Penawaran',
          docNumber: l.letterNumber || 'Draft',
          clientName: l.companyName || '-',
          date: l.letterDate || '-',
          sourceDoc: l,
        });
      }
    });

    // From BAST
    basts.forEach((b) => {
      if (b.nomorPo && b.nomorPo.trim()) {
        list.push({
          id: `bast-${b.id}`,
          poNumber: b.nomorPo,
          docType: 'BAST',
          docNumber: b.nomorBast || 'BAST',
          clientName: b.pihakPertamaPerusahaan || '-',
          date: b.tanggalBast || '-',
          sourceDoc: b,
        });
      }
    });

    // From Invoice
    invoices.forEach((i) => {
      if (i.nomorPo && i.nomorPo.trim()) {
        list.push({
          id: `inv-${i.id}`,
          poNumber: i.nomorPo,
          docType: 'Invoice',
          docNumber: i.invoiceNumber || 'INV',
          clientName: i.companyName || '-',
          date: i.invoiceDate || '-',
          sourceDoc: i,
        });
      }
    });

    return list.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        p.poNumber.toLowerCase().includes(q) ||
        p.docNumber.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
      );
    });
  }, [letters, basts, invoices, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0b223d] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Pelacak Nomor PO</h3>
              <p className="text-[10px] text-sky-200">{poList.length} Referensi PO Terdaftar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nomor PO, Dokumen, atau Klien..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[60vh]">
          {poList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Tidak ada referensi nomor PO yang cocok.
            </div>
          ) : (
            poList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-blue-950 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      PO: {item.poNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.docType === 'BAST'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : item.docType === 'Invoice'
                          ? 'bg-amber-50 text-amber-700 border border-amber-300'
                          : 'bg-sky-50 text-sky-700 border border-sky-300'
                      }`}
                    >
                      {item.docType}
                    </span>
                  </div>

                  <p className="font-bold text-xs text-slate-800 mt-1 truncate">
                    {item.clientName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {item.docNumber} • {item.date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (item.docType === 'Surat Penawaran') {
                      onOpenLetter(item.sourceDoc as LetterData);
                    } else if (item.docType === 'BAST') {
                      onOpenBast(item.sourceDoc as BastData);
                    } else {
                      onOpenInvoice(item.sourceDoc as InvoiceData);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 transition shrink-0 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
