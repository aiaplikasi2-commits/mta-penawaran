import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Trash2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import type { InvoiceData } from '../../types/invoice.ts';
import type { CompanySettings } from '../../types/index.ts';
import { formatInvoiceDate, downloadInvoicePDF } from '../../services/invoicePdfGenerator.ts';
import { formatNumberIndo } from '../../services/pdfGenerator.ts';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  settings: CompanySettings;
  onDelete?: (id: string) => void;
  onToast: (msg: string) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
  onDelete,
  onToast,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !invoice) return null;

  const pdfFileName = `${invoice.invoiceNumber.replace(/[/\\?%*:|"<>]/g, '_')}_${(invoice.companyName || 'INVOICE').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const handleCopyText = async () => {
    const text = `*INVOICE*
No : ${invoice.invoiceNumber}
Tanggal : ${formatInvoiceDate(invoice.invoiceDate)}
PO : ${invoice.nomorPo || '-'}
----------------------------------------
Dari: ${settings.companyName || 'CV. MULIA TEKHNIK ABADI'}
Kepada: ${invoice.companyName} (${invoice.recipientName || '-'})
Alamat: ${invoice.address || '-'}

Rincian:
${(invoice.items || []).map((it, idx) => `${idx + 1}. ${it.description} | ${it.qty} ${it.satuan} | Rp ${formatNumberIndo(it.price)} = Rp ${formatNumberIndo(it.total)}`).join('\n')}

Subtotal : Rp ${formatNumberIndo(invoice.subtotal)}
${invoice.tradeInActive ? `- Trade In : -Rp ${formatNumberIndo(invoice.tradeInValue || 0)}\n` : ''}*TOTAL TAGIHAN : Rp ${formatNumberIndo(invoice.total)}*
Terbilang : "${invoice.terbilang}"

Pembayaran Transfer:
Bank : ${invoice.bankName || settings.bankName || 'Mandiri'}
A/N : ${invoice.bankAccountName || settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI'}
No. Rek : ${invoice.bankAccountNumber || settings.bankAccountNumber || '167-00-0529426-8'}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      onToast('Teks Invoice disalin');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      onToast('Gagal menyalin teks');
    }
  };

  const handleShareWA = () => {
    const text = `*INVOICE - CV. MULIA TEKHNIK ABADI*
No: *${invoice.invoiceNumber}*
Tanggal: *${formatInvoiceDate(invoice.invoiceDate)}*
PO: *${invoice.nomorPo || '-'}*

Kepada Yth:
*${invoice.companyName}*
Total Tagihan: *Rp ${formatNumberIndo(invoice.total)}*
("${invoice.terbilang}")

Pembayaran Transfer:
${invoice.bankName || settings.bankName || 'Mandiri'} - ${invoice.bankAccountNumber || settings.bankAccountNumber || '167-00-0529426-8'}
A/N ${invoice.bankAccountName || settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI'}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadInvoicePDF(invoice, settings);
      onToast(`File ${pdfFileName} diunduh`);
    } catch (err: any) {
      onToast('Gagal unduh PDF: ' + (err.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  const hasTradeIn = invoice.tradeInActive && (invoice.tradeInValue || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* COMPACT ACTION BAR (Mobile Friendly) */}
        <div className="bg-[#0b223d] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Menyimpan...' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWA}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WA</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus invoice ${invoice.invoiceNumber}?`)) {
                    onDelete(invoice.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-600/80 rounded-lg border border-rose-500/30"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 active:scale-95"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isCopied ? 'Disalin' : 'Salin'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW A4 - EXACT MATCH TO gambar_3f4d7e8e.png */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-5 flex justify-center bg-slate-200/70">
          <div
            id="invoice-printable"
            className="w-full max-w-[680px] bg-white text-black p-4 sm:p-8 shadow-2xl font-sans text-xs leading-normal border border-slate-300 print:p-0 print:border-none print:shadow-none"
            style={{ minHeight: '880px' }}
          >
            {/* 1. TOP HEADER */}
            <div className="flex justify-between items-start gap-4 mb-5">
              {/* Left Box: INVOICE / No / Tanggal */}
              <div className="w-[48%] border-2 border-black font-sans">
                {/* INVOICE Title: Color matching Logo (Navy blue #1a4b91) */}
                <div className="py-2 text-center border-b-2 border-black">
                  <span className="text-xl font-black tracking-widest text-[#1a4b91]">
                    INVOICE
                  </span>
                </div>
                {/* No */}
                <div className="flex border-b border-black text-xs font-bold">
                  <span className="w-20 px-2 py-1 border-r border-black font-semibold text-slate-700">No :</span>
                  <span className="px-2 py-1 flex-1 font-mono uppercase">{invoice.invoiceNumber}</span>
                </div>
                {/* Tanggal */}
                <div className="flex text-xs">
                  <span className="w-20 px-2 py-1 border-r border-black font-semibold text-slate-700">Tanggal :</span>
                  <span className="px-2 py-1 flex-1 font-medium">{formatInvoiceDate(invoice.invoiceDate)}</span>
                </div>
              </div>

              {/* Right: Logo MTA from settings + Company Name */}
              <div className="w-[45%] flex flex-col items-center justify-center text-center">
                <img
                  src={settings.logoImage || '/default-logo.png'}
                  alt="Logo MTA"
                  className="max-h-16 w-auto object-contain mb-1"
                />
                <span className="font-bold italic text-xs tracking-tight text-slate-900">
                  {settings.companyName || 'CV. MULIA TEKHNIK ABADI'}
                </span>
              </div>
            </div>

            {/* 2. DARI & KEPADA */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              {/* Dari */}
              <div>
                <p className="text-slate-500 text-[11px] mb-0.5">Dari:</p>
                <p className="font-bold text-sm text-slate-900">{settings.companyName || 'CV. MULIA TEKHNIK ABADI'}</p>
                <p className="text-slate-700 text-[11px] mt-0.5 whitespace-pre-line">
                  {settings.address || 'KP. Nagrak RT 05/03 Desa Nagrak Kec. Gunung Putri Bogor'}
                </p>
                <p className="text-slate-700 text-[11px]">Telp: {settings.phone || '0812 1085 2489'}</p>
                <p className="text-slate-700 text-[11px]">Email: {settings.email || 'cvmuliatekhnikabadi@gmail.com'}</p>
              </div>

              {/* Kepada */}
              <div>
                <p className="text-slate-500 text-[11px] mb-0.5">Kepada:</p>
                <p className="font-bold text-sm text-slate-900 uppercase">{invoice.companyName || '-'}</p>
                {invoice.recipientName && (
                  <p className="font-bold text-xs text-slate-800">{invoice.recipientName}</p>
                )}
                {invoice.address && (
                  <p className="text-slate-700 text-[11px] mt-0.5 whitespace-pre-line">{invoice.address}</p>
                )}
              </div>
            </div>

            {/* 3. REFERENSI PESANAN BOX (Hanya jika nomor PO diisi) */}
            {invoice.nomorPo && invoice.nomorPo.trim() && invoice.nomorPo.trim() !== '-' && (
              <div className="border border-black px-3 py-1.5 flex justify-between items-center text-xs mb-3 font-sans">
                <span className="text-slate-600 font-medium">Referensi Pesanan:</span>
                <span className="font-bold text-slate-900">
                  Sesuai dengan Nomor PO {invoice.nomorPo.trim()}
                </span>
              </div>
            )}

            {/* 4. ITEMS TABLE */}
            <div className="border-2 border-black mb-4 overflow-hidden">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-white font-bold text-center">
                    <th className="p-2 border-r border-black w-10">No.</th>
                    <th className="p-2 border-r border-black text-left">Uraian Pekerjaan / Keterangan</th>
                    <th className="p-2 border-r border-black w-12">Qty</th>
                    <th className="p-2 border-r border-black w-14">Satuan</th>
                    <th className="p-2 border-r border-black w-24">Harga Satuan</th>
                    <th className="p-2 w-28">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((it, idx) => (
                    <tr key={it.id || idx} className="border-b border-black last:border-b-0">
                      <td className="p-2 border-r border-black text-center align-top font-bold">{idx + 1}</td>
                      <td className="p-2 border-r border-black align-top font-medium">{it.description}</td>
                      <td className="p-2 border-r border-black text-center align-top font-bold">{it.qty}</td>
                      <td className="p-2 border-r border-black text-center align-top">{it.satuan || 'unit'}</td>
                      <td className="p-2 border-r border-black text-right align-top font-mono">{formatNumberIndo(it.price)}</td>
                      <td className="p-2 text-right align-top font-bold font-mono">{formatNumberIndo(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. BOTTOM SECTION: BANK & TERBILANG VS CALCULATION & SIGNATURE */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Left Column: Bank & Terbilang */}
              <div className="space-y-3">
                {/* Bank Box */}
                <div className="border border-black p-2.5">
                  <p className="font-bold text-xs uppercase mb-1">PEMBAYARAN TRANSFER MELALUI</p>
                  <p className="text-[11px]">Nama Bank: <strong>{invoice.bankName || settings.bankName || 'Mandiri'}</strong></p>
                  <p className="text-[11px]">Atas Nama: <strong>{invoice.bankAccountName || settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI'}</strong></p>
                  <p className="text-[11px]">No. Rekening: <strong>{invoice.bankAccountNumber || settings.bankAccountNumber || '167-00-0529426-8'}</strong></p>
                </div>

                {/* Terbilang Box */}
                <div className="border border-black p-2.5">
                  <p className="font-bold text-[10px] text-slate-500 uppercase">TERBILANG :</p>
                  <p className="font-bold italic text-xs mt-0.5">"{invoice.terbilang}"</p>
                </div>
              </div>

              {/* Right Column: Calculation & Signature */}
              <div className="space-y-2">
                {/* Subtotal & Deductions Box */}
                <div className="border border-black p-2.5 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal</span>
                    <span className="font-mono">Rp {formatNumberIndo(invoice.subtotal)}</span>
                  </div>
                  {hasTradeIn && (
                    <div className="flex justify-between font-semibold text-rose-600">
                      <span>- {invoice.tradeInName || 'Trade In Barang Bekas'}</span>
                      <span className="font-mono">-Rp {formatNumberIndo(invoice.tradeInValue || 0)}</span>
                    </div>
                  )}
                  {invoice.discountActive && (invoice.discountValue || 0) > 0 && (
                    <div className="flex justify-between font-semibold text-rose-600">
                      <span>- Diskon</span>
                      <span className="font-mono">-Rp {formatNumberIndo(invoice.discountValue || 0)}</span>
                    </div>
                  )}
                  {invoice.ppnActive && Boolean(invoice.ppnPercent) && (
                    <div className="flex justify-between">
                      <span>+ PPN ({invoice.ppnPercent}%)</span>
                      <span className="font-mono">
                        Rp {formatNumberIndo((invoice.subtotal * (invoice.ppnPercent || 11)) / 100)}
                      </span>
                    </div>
                  )}
                </div>

                {/* TOTAL TAGIHAN Black Banner */}
                <div className="bg-black text-white p-2.5 flex justify-between items-center font-bold">
                  <span className="text-xs uppercase tracking-wide">TOTAL TAGIHAN</span>
                  <span className="text-base font-extrabold font-mono">Rp {formatNumberIndo(invoice.total)}</span>
                </div>

                {/* Signature Box */}
                <div className="text-right pt-2">
                  <p className="font-semibold text-xs mb-1">Hormat Kami,</p>
                  <div className="h-12 flex justify-end items-center my-1">
                    <img
                      src={settings.signatureImage || '/default-ttd-stempel.png'}
                      alt="TTD"
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                  <p className="text-slate-400 text-[10px]">....................</p>
                  <div className="border-t border-black w-40 ml-auto my-0.5"></div>
                  <p className="font-bold text-xs uppercase text-slate-900">
                    {invoice.signatoryName || settings.signatoryName || 'MUHAMAD RIDHO'}
                  </p>
                  <p className="text-[10px] text-slate-600">{settings.companyName || 'CV. MULIA TEKHNIK ABADI'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM MODAL FOOTER */}
        <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-slate-200 text-xs">
          <span className="text-slate-500 font-mono text-[11px] truncate max-w-[200px]">
            {pdfFileName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200 text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
