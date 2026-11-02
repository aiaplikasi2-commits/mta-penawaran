import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  Mail,
  Send,
  ExternalLink,
  CheckCircle2,
  FileText
} from 'lucide-react';
import type { CompanySettings, LetterData } from '../types/index.ts';
import { getLetterPDFFile, formatNumberIndo } from '../services/pdfGenerator.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: LetterData;
  settings: CompanySettings;
  onToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  letter,
  settings,
  onToast,
}) => {
  if (!isOpen) return null;

  const [activeChannel, setActiveChannel] = useState<'wa' | 'email'>('wa');
  const [waNumber, setWaNumber] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate Grand Total for message
  const subtotal = letter.items.reduce(
    (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  );
  const tradeInVal =
    letter.tradeInActive && letter.tradeIn
      ? (Number(letter.tradeIn.qty) || 1) * (Number(letter.tradeIn.unitValue) || 0)
      : 0;
  const afterTrade = Math.max(0, subtotal - tradeInVal);
  let disc = 0;
  if (letter.discountActive) {
    disc =
      letter.discountType === 'percent'
        ? (afterTrade * (Number(letter.discountValue) || 0)) / 100
        : Number(letter.discountValue) || 0;
  }
  const dpp = Math.max(0, afterTrade - disc);
  const ppn = letter.ppnActive ? (dpp * (Number(letter.ppnPercent) || 11)) / 100 : 0;
  const grandTotal = dpp + ppn;

  // Format phone to clean Indonesian standard (e.g. 0812... -> 62812...)
  const cleanPhoneForWA = (raw: string) => {
    let cleaned = raw.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  // WhatsApp Message
  const recipientGreeting = letter.recipientName
    ? `Bapak/Ibu ${letter.recipientName}`
    : letter.companyName
    ? `Pimpinan / Manajemen ${letter.companyName}`
    : 'Bapak/Ibu';

  const waText = `Kepada Yth. ${recipientGreeting},

Berikut kami sampaikan Surat Penawaran Harga resmi dari *CV. MULIA TEKHNIK ABADI*:

📄 *No. Surat:* ${letter.letterNumber || '-'}
📋 *Perihal:* ${letter.subject || '-'}
💰 *Total Penawaran:* Rp ${formatNumberIndo(grandTotal)}

File dokumen PDF resmi telah kami sertakan. Bila ada informasi atau klarifikasi teknis yang dibutuhkan, silakan hubungi kami.

Terima kasih atas perhatian dan kerja samanya.
*CV. MULIA TEKHNIK ABADI*
Telp: ${settings.phone}`;

  // Email Subject and Body
  const emailSubject = `Surat Penawaran Harga ${letter.letterNumber || ''} - ${letter.subject || 'CV. MULIA TEKHNIK ABADI'}`;
  const emailBody = `Kepada Yth.
${letter.recipientName ? letter.recipientName + '\n' : ''}${letter.companyName ? letter.companyName + '\n' : ''}Di Tempat

Dengan hormat,

Bersama ini kami lampirkan dokumen resmi Surat Penawaran Harga dari CV. MULIA TEKHNIK ABADI:

- Nomor Surat : ${letter.letterNumber || '-'}
- Perihal : ${letter.subject || '-'}
- Total Penawaran : Rp ${formatNumberIndo(grandTotal)}

Demikian penawaran harga ini kami sampaikan. Apabila ada hal yang perlu dikoordinasikan lebih lanjut, bapak / ibu dapat menghubungi kontak kami.

Hormat Kami,
CV. MULIA TEKHNIK ABADI
Telpon: ${settings.phone}
Email: ${settings.email}`;

  // Handle Share to WhatsApp
  const handleShareToWhatsApp = async () => {
    setIsProcessing(true);
    try {
      const { file, filename, doc } = await getLetterPDFFile(letter, settings);

      // Check if Web Share API with files is available
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Surat Penawaran MTA - ${letter.letterNumber}`,
            text: waText,
          });
          onToast('Pilih WhatsApp pada menu share untuk melampirkan file PDF');
          setIsProcessing(false);
          onClose();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            setIsProcessing(false);
            return;
          }
          console.warn('Share file aborted or not supported, using fallback', err);
        }
      }

      // Fallback: Download file automatically + open WhatsApp link
      doc.save(filename);
      const targetPhone = cleanPhoneForWA(waNumber);
      const waUrl = targetPhone
        ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(waText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

      window.open(waUrl, '_blank');
      onToast(`File "${filename}" telah diunduh ke HP & WhatsApp dibuka! Lampirkan PDF ke obrolan.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      onToast('Gagal memproses pengiriman: ' + (err.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Share to Email
  const handleShareToEmail = async () => {
    setIsProcessing(true);
    try {
      const { file, filename, doc } = await getLetterPDFFile(letter, settings);

      // Web Share API with files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: emailSubject,
            text: emailBody,
          });
          onToast('Pilih aplikasi Gmail/Email pada menu share untuk melampirkan PDF');
          setIsProcessing(false);
          onClose();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            setIsProcessing(false);
            return;
          }
          console.warn('Email share file fallback', err);
        }
      }

      // Fallback: Download file + open mailto
      doc.save(filename);
      const mailtoUrl = `mailto:${targetEmail.trim()}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;

      onToast(`File "${filename}" telah diunduh ke HP & aplikasi Email dibuka! Lampirkan PDF.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      onToast('Gagal memproses email: ' + (err.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[90vh] text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0b223d]">Bagikan Surat Penawaran</h3>
              <p className="text-[11px] text-slate-400">File PDF A4 resmi terlampir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Info Card */}
        <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#0b223d]">{letter.letterNumber || 'Draft'}</span>
            <span className="font-bold text-blue-900">Rp {formatNumberIndo(grandTotal)}</span>
          </div>
          <div className="text-slate-600 font-medium truncate">
            {letter.companyName || letter.recipientName || 'Pelanggan'}
          </div>
          <div className="text-[11px] text-slate-400 truncate">{letter.subject || '-'}</div>
        </div>

        {/* Channel Selection Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-3.5">
          <button
            type="button"
            onClick={() => setActiveChannel('wa')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeChannel === 'wa'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {/* WhatsApp Logo SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.053-1.637-.291-1.378-.475-2.28-1.854-2.35-1.947-.07-.093-.561-.749-.561-1.428 0-.678.353-1.013.479-1.15.126-.138.275-.172.368-.172.093 0 .185.002.268.006.088.004.204-.034.318.241.119.288.406 1.002.441 1.076.035.074.059.162.008.261-.051.099-.076.161-.151.248-.076.088-.16.196-.228.264-.078.077-.159.162-.068.318.09.155.402.664.862 1.074.593.528 1.094.691 1.249.768.156.077.247.069.34-.038.093-.107.401-.468.508-.629.108-.161.215-.135.361-.081.146.054.928.438 1.088.518.16.08.268.12.308.187.04.068.04.393-.104.798z" />
            </svg>
            <span>WhatsApp (WA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('email')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeChannel === 'email'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Kirim via Email</span>
          </button>
        </div>

        {/* Channel Form Details */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs">
          {activeChannel === 'wa' ? (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="Contoh: 081210852489 (Bisa dikosongkan untuk pilih kontak di WA)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Isi Pesan Pendamping:
                </label>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-700 text-[11px] leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto font-mono">
                  {waText}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Dokumen PDF A4 resmi akan langsung dilampirkan bersama pesan ini.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Email Penerima
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="Contoh: procurement@perusahaan.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subjek Email:
                </label>
                <input
                  type="text"
                  readOnly
                  value={emailSubject}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Isi Badan Email:
                </label>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-slate-700 text-[11px] leading-relaxed whitespace-pre-line max-h-28 overflow-y-auto font-mono">
                  {emailBody}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Dokumen PDF A4 resmi akan dilampirkan otomatis ke draft email.</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>

          {activeChannel === 'wa' ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleShareToWhatsApp}
              className="flex-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isProcessing ? 'Menyiapkan...' : 'Kirim PDF ke WhatsApp'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleShareToEmail}
              className="flex-2 py-3 rounded-2xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>{isProcessing ? 'Menyiapkan...' : 'Kirim PDF ke Email'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
