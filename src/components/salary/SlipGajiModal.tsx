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
import type { SlipGaji, SalarySettings } from '../../types/salary.ts';
import {
  formatRupiah,
  formatRupiahAlways,
  formatSlipDate,
  downloadSlipGajiPDF,
} from '../../services/salaryPdfGenerator.ts';

interface SlipGajiModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: SlipGaji | null;
  settings: SalarySettings;
  onDelete?: (id: string) => void;
  onToast: (msg: string) => void;
}

export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({
  isOpen,
  onClose,
  slip,
  settings,
  onDelete,
  onToast,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !slip) return null;

  const cleanName = (slip.nama || 'Karyawan').replace(/\s+/g, '_').toUpperCase();
  const cleanPeriod = (slip.periodeBulan || 'Bulan').replace(/\s+/g, '_');
  const year = slip.tahun || 2026;
  const pdfFileName = `slip_Gaji_${cleanName}_${cleanPeriod}_${year}.pdf`;

  // Salin teks slip gaji ke clipboard
  const handleCopyText = async () => {
    const text = `*SLIP GAJI KARYAWAN*
*CV MULIA TEKHNIK ABADI*
----------------------------------------
Nama: ${slip.nama.toUpperCase()}
Jabatan: ${slip.jabatan.toUpperCase()}
NIK: ${slip.nik || '-'}
Nomor Slip: ${slip.nomorSlip}
Tanggal: ${formatSlipDate(slip.tanggal)}
Periode: ${slip.periodeBulan} ${slip.tahun}
----------------------------------------
*PENDAPATAN:*
• Gaji Pokok: ${formatRupiahAlways(slip.gajiPokok)}
• Uang Makan: ${formatRupiah(slip.uangMakan)}
• Transport: ${formatRupiah(slip.transport)}
• THR: ${formatRupiah(slip.thr)}
• Bonus: ${formatRupiah(slip.bonus)}
• Lemburan: ${formatRupiah(slip.lemburan)} (${slip.jamLembur || 0} Jam)
• Masuk Kerja: ${slip.masukKerja || 0} hari
*TOTAL PENDAPATAN: ${formatRupiahAlways(slip.totalPendapatan)}*

*PEMOTONGAN:*
• Pinjaman/Kasbon: ${formatRupiah(slip.pinjaman)}
• BPJS: ${formatRupiah(slip.bpjsKetenagakerjaan)}
• PPh21: ${formatRupiah(slip.pph21)}
• Lain-lain: ${formatRupiah(slip.lainLain)}
• Potongan Uang Makan: ${formatRupiah(slip.potonganUangMakan)}
*TOTAL POTONGAN: ${formatRupiahAlways(slip.totalPotongan)}*
----------------------------------------
*GAJI BERSIH (TAKE HOME PAY): ${formatRupiahAlways(slip.gajiBersih)}*
----------------------------------------
Di Setuju oleh: ${settings.signatoryName || 'Muhamad Ridho'}
Diterima Oleh: ${slip.nama.toUpperCase()}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      onToast('Teks slip gaji berhasil disalin!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onToast('Gagal menyalin teks');
    }
  };

  // Bagikan via WhatsApp
  const handleShareWA = () => {
    const text = `*SLIP GAJI KARYAWAN - CV MULIA TEKHNIK ABADI*
Yth. Sdr/i *${slip.nama.toUpperCase()}* (${slip.jabatan})

Berikut ringkasan Slip Gaji periode *${slip.periodeBulan} ${slip.tahun}*:
- Nomor Slip: *${slip.nomorSlip}*
- Total Pendapatan: *${formatRupiahAlways(slip.totalPendapatan)}*
- Total Potongan: *${formatRupiahAlways(slip.totalPotongan)}*
==============================
*GAJI BERSIH DITERIMA: ${formatRupiahAlways(slip.gajiBersih)}*
==============================
_Dokumen resmi CV Mulia Tekhnik Abadi._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadSlipGajiPDF(slip, settings);
      onToast(`File ${pdfFileName} berhasil diunduh!`);
    } catch (err: any) {
      onToast('Gagal membuat PDF: ' + (err.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  // Cetak Dokumen Langsung (Browser Print)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-100 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:max-h-[96vh] animate-in fade-in zoom-in-95 duration-150">
        {/* TOP ACTION BAR */}
        <div className="bg-[#0b223d] px-2.5 sm:px-4 py-2.5 flex items-center justify-between gap-1.5 border-b border-blue-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Button Cetak */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg transition shadow-xs active:scale-95 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {/* Button Simpan PDF */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg transition shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Menyimpan...' : 'PDF'}</span>
            </button>

            {/* Button Bagikan WA */}
            <button
              type="button"
              onClick={handleShareWA}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg transition shadow-xs active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WA</span>
            </button>

            {/* Delete button */}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus slip gaji #${slip.nomorSlip} untuk ${slip.nama}?`)) {
                    onDelete(slip.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-600/80 rounded-lg transition border border-rose-500/30"
                title="Hapus Slip Gaji"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}
          </div>

          {/* Right side: Salin Teks & Close */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg transition shadow-xs border border-slate-200 active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTAINER - 100% RESPONSIVE FOR ANDROID VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-5 flex justify-center bg-slate-200/70">
          <div
            id="slip-gaji-printable"
            className="w-full max-w-[620px] bg-white text-black p-2.5 sm:p-6 shadow-xl border-2 border-black font-sans leading-tight print:p-0 print:border-none print:shadow-none text-[10px] sm:text-xs"
            style={{ minHeight: '580px' }}
          >
            {/* ROW 1: HEADER BOX */}
            <div className="grid grid-cols-2 border border-black">
              {/* Left Box */}
              <div className="p-2 sm:p-3 border-r border-black flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <img
                    src={settings.logoImage || '/default-logo.png'}
                    alt="Logo Perusahaan"
                    className="h-7 sm:h-9 w-auto max-w-[120px] sm:max-w-[140px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <h2 className="text-xs sm:text-base font-black tracking-wide mt-1.5 text-black">
                  SLIP GAJI KARYAWAN
                </h2>
              </div>

              {/* Right Box */}
              <div className="p-2 sm:p-3 flex flex-col justify-center text-left">
                <h3 className="font-extrabold text-xs sm:text-base text-[#1a4b91] uppercase tracking-wide">
                  {settings.companyName || 'CV MULIA TEKHNIK ABADI'}
                </h3>
                <p className="text-[9px] sm:text-[11px] text-slate-700 mt-0.5 leading-snug">
                  Jln. Letda Nasir No. 58 Desa Cikeas Udik
                  <br />
                  Kec. Gunung Putri - Kab. Bogor Kode Pos 16966
                  <br />
                  Telp: {settings.phone || '0812 - 1085 - 2489 / 0878 - 4062 - 0432'}
                </p>
              </div>
            </div>

            {/* ROW 2: IDENTITAS KARYAWAN & SLIP */}
            <div className="grid grid-cols-2 border-x border-b border-black text-[10px] sm:text-xs">
              {/* Left Column */}
              <div className="p-1.5 sm:p-2.5 border-r border-black space-y-1">
                <div className="grid grid-cols-[48px_8px_1fr] sm:grid-cols-[68px_14px_1fr] items-center">
                  <span className="font-bold">NAMA</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold uppercase truncate">{slip.nama}</span>
                </div>
                <div className="grid grid-cols-[48px_8px_1fr] sm:grid-cols-[68px_14px_1fr] items-center">
                  <span className="font-bold">JABATAN</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold uppercase truncate">{slip.jabatan}</span>
                </div>
                <div className="grid grid-cols-[48px_8px_1fr] sm:grid-cols-[68px_14px_1fr] items-center">
                  <span className="font-bold">NIK</span>
                  <span className="font-bold">:</span>
                  <span className="truncate">{slip.nik || '-'}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="p-1.5 sm:p-2.5 space-y-1">
                <div className="grid grid-cols-[54px_8px_1fr] sm:grid-cols-[74px_14px_1fr] items-center">
                  <span className="font-bold">SLIP GAJI</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold">{slip.nomorSlip}</span>
                </div>
                <div className="grid grid-cols-[54px_8px_1fr] sm:grid-cols-[74px_14px_1fr] items-center">
                  <span className="font-bold">TANGGAL</span>
                  <span className="font-bold">:</span>
                  <span className="truncate">{formatSlipDate(slip.tanggal)}</span>
                </div>
                <div className="grid grid-cols-[54px_8px_1fr] sm:grid-cols-[74px_14px_1fr] items-center">
                  <span className="font-bold">PERIODE</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold truncate">{slip.periodeBulan}</span>
                </div>
              </div>
            </div>

            {/* ROW 3: SECTION HEADERS */}
            <div className="grid grid-cols-2 border-x border-b border-black text-[11px] sm:text-sm font-black bg-slate-50/50">
              <div className="p-1.5 sm:p-2 border-r border-black">
                PENDAPATAN
              </div>
              <div className="p-1.5 sm:p-2">
                PEMOTONGAN
              </div>
            </div>

            {/* ROW 4: BODY CONTENT */}
            <div className="grid grid-cols-2 border-x border-b border-black text-[10px] sm:text-xs">
              {/* Pendapatan Column */}
              <div className="p-1.5 sm:p-2.5 border-r border-black space-y-1 flex flex-col justify-start">
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                  <span>Gaji Pokok</span>
                  <span>:</span>
                  <span className="font-mono text-right font-medium">{formatRupiahAlways(slip.gajiPokok)}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                  <span>Uang Makan</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.uangMakan)}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                  <span>Transport</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.transport)}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                  <span>THR</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.thr)}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                  <span>Bonus</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.bonus)}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                  <span>Lemburan</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.lemburan)}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center text-slate-700">
                  <span>Jam Lembur</span>
                  <span>:</span>
                  <span className="font-mono text-right">{slip.jamLembur ? `${slip.jamLembur} Jam` : '-'}</span>
                </div>
                <div className="grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center text-slate-700">
                  <span>Masuk Kerja</span>
                  <span>:</span>
                  <span className="font-mono text-right">{slip.masukKerja ? `${slip.masukKerja} hari` : '0 hari'}</span>
                </div>
              </div>

              {/* Pemotongan Column */}
              <div className="p-1.5 sm:p-2.5 space-y-1 flex flex-col justify-start">
                <div className="grid grid-cols-[72px_8px_1fr] sm:grid-cols-[128px_14px_1fr] items-center">
                  <span>Pinjaman</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.pinjaman)}</span>
                </div>
                <div className="grid grid-cols-[72px_8px_1fr] sm:grid-cols-[128px_14px_1fr] items-center">
                  <span>BPJS</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.bpjsKetenagakerjaan)}</span>
                </div>
                <div className="grid grid-cols-[72px_8px_1fr] sm:grid-cols-[128px_14px_1fr] items-center">
                  <span>PPh21</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.pph21)}</span>
                </div>
                <div className="grid grid-cols-[72px_8px_1fr] sm:grid-cols-[128px_14px_1fr] items-center">
                  <span>Lain-lain</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.lainLain)}</span>
                </div>
                <div className="grid grid-cols-[72px_8px_1fr] sm:grid-cols-[128px_14px_1fr] items-center">
                  <span>Uang Makan</span>
                  <span>:</span>
                  <span className="font-mono text-right">{formatRupiah(slip.potonganUangMakan)}</span>
                </div>
              </div>
            </div>

            {/* ROW 5: TOTAL PENDAPATAN & TOTAL POTONGAN */}
            <div className="grid grid-cols-2 border-x border-b border-black text-[10px] sm:text-xs font-black bg-slate-50/70">
              <div className="p-1.5 sm:p-2 border-r border-black grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center">
                <span className="truncate">TOTAL PENDAPATAN</span>
                <span>:</span>
                <span className="font-mono text-right text-[11px] sm:text-sm">
                  {formatRupiahAlways(slip.totalPendapatan)}
                </span>
              </div>
              <div className="p-1.5 sm:p-2 grid grid-cols-[72px_8px_1fr] sm:grid-cols-[128px_14px_1fr] items-center">
                <span className="truncate">TOTAL POTONGAN</span>
                <span>:</span>
                <span className="font-mono text-right text-[11px] sm:text-sm">
                  {formatRupiahAlways(slip.totalPotongan)}
                </span>
              </div>
            </div>

            {/* ROW 6: GAJI BERSIH */}
            <div className="border-x border-b border-black p-2 sm:p-3 grid grid-cols-[64px_8px_1fr] sm:grid-cols-[105px_14px_1fr] items-center bg-slate-100/60 font-black">
              <span className="text-xs sm:text-base tracking-wider whitespace-nowrap">GAJI BERSIH</span>
              <span className="text-xs sm:text-base">:</span>
              <span className="font-mono text-sm sm:text-xl tracking-tight text-right text-black font-extrabold">
                {formatRupiahAlways(slip.gajiBersih)}
              </span>
            </div>

            {/* ROW 7: SIGNATURES - Fully visible without cut off */}
            <div className="grid grid-cols-2 border-x border-b border-black text-[10px] sm:text-xs">
              {/* Left: Di Setuju oleh */}
              <div className="p-2 sm:p-4 border-r border-black flex flex-col justify-between min-h-[120px] sm:min-h-[145px]">
                <p className="font-medium">Di Setuju oleh,</p>
                <div className="relative my-1 h-12 sm:h-16 flex items-center">
                  <img
                    src={settings.signatureImage || '/default-ttd-stempel.png'}
                    alt="TTD & Stempel"
                    className="max-h-12 sm:max-h-16 max-w-[120px] sm:max-w-[150px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="pt-1">
                  <p className="font-bold text-black text-[11px] sm:text-sm truncate">
                    ( {settings.signatoryName || 'Muhamad Ridho'} )
                  </p>
                  <p className="text-[9px] text-slate-400 select-none overflow-hidden tracking-wider leading-none mt-0.5">
                    ..................................................................
                  </p>
                </div>
              </div>

              {/* Right: Diterima Oleh */}
              <div className="p-2 sm:p-4 flex flex-col justify-between min-h-[120px] sm:min-h-[145px]">
                <p className="font-medium">Diterima Oleh,</p>
                <div className="h-12 sm:h-16" />
                <div className="pt-1">
                  <p className="font-bold text-black text-[11px] sm:text-sm truncate">
                    ( {(slip.nama || 'Karyawan').toUpperCase()} )
                  </p>
                  <p className="text-[9px] text-slate-400 select-none overflow-hidden tracking-wider leading-none mt-0.5">
                    ..................................................................
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM MODAL FOOTER */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 text-xs">
          <span className="text-slate-500 font-mono text-[11px] truncate max-w-[280px]">
            {pdfFileName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition active:scale-95 border border-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
