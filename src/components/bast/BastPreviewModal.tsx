import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Trash2,
  Copy,
  Check,
  X,
  FileText,
} from 'lucide-react';
import type { BastData } from '../../types/bast.ts';
import type { CompanySettings } from '../../types/index.ts';
import { formatBastDate, downloadBastPDF } from '../../services/bastPdfGenerator.ts';

interface BastPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bast: BastData | null;
  settings: CompanySettings;
  onDelete?: (id: string) => void;
  onToast: (msg: string) => void;
}

export const BastPreviewModal: React.FC<BastPreviewModalProps> = ({
  isOpen,
  onClose,
  bast,
  settings,
  onDelete,
  onToast,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !bast) return null;

  const pdfFileName = `${bast.nomorBast.replace(/[/\\?%*:|"<>]/g, '_')}_${(bast.pihakPertamaPerusahaan || 'BAST').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const handleCopyText = async () => {
    const p1Lines: string[] = [];
    if (bast.pihakPertamaNama?.trim()) p1Lines.push(`- Nama: ${bast.pihakPertamaNama.trim()}`);
    if (bast.pihakPertamaJabatan?.trim()) p1Lines.push(`- Jabatan: ${bast.pihakPertamaJabatan.trim()}`);
    if (bast.pihakPertamaPerusahaan?.trim()) p1Lines.push(`- Perusahaan: ${bast.pihakPertamaPerusahaan.trim()}`);
    if (bast.pihakPertamaAlamat?.trim()) p1Lines.push(`- Alamat: ${bast.pihakPertamaAlamat.trim()}`);

    const text = `*BERITA ACARA SERAH TERIMA*
Nomor: ${bast.nomorBast}
----------------------------------------
Pada hari ini ${bast.hariTerbilang || '-'}, kami yang bertanda tangan di bawah ini :

*PIHAK PERTAMA (KLIEN):*
${p1Lines.length > 0 ? p1Lines.join('\n') : '- (Tidak diisi)'}

*PIHAK KEDUA (PELAKSANA):*
- Nama: ${bast.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO'}
- Perusahaan: ${settings.companyName || 'CV. MULIA TEKHNIK ABADI'}
- Alamat: ${bast.pihakKeduaAlamat || settings.address}

Menerangkan bahwa pekerjaan dengan Nomor PO: *${bast.nomorPo || '-'}* telah selesai dikerjakan dengan rincian:
${(bast.items || []).map((it, idx) => `${idx + 1}. ${it.name} (${it.keterangan || 'Sesuai'})`).join('\n')}

Telah selesai dikerjakan yang dimulai tanggal ${formatBastDate(bast.tanggalMulai)} s/d ${formatBastDate(bast.tanggalSelesai)} dalam kondisi baik dan berfungsi.
----------------------------------------
${bast.kota || 'Bogor'}, ${formatBastDate(bast.tanggalBast)}
Pihak Pertama: ${[bast.pihakPertamaNama, bast.pihakPertamaJabatan, bast.pihakPertamaPerusahaan].filter(Boolean).join(' - ') || '-'}
Pihak Kedua: ${bast.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO'}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      onToast('Teks BAST berhasil disalin!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onToast('Gagal menyalin teks');
    }
  };

  const handleShareWA = () => {
    const penerima = [bast.pihakPertamaNama, bast.pihakPertamaJabatan, bast.pihakPertamaPerusahaan]
      .filter(Boolean)
      .join(' - ');

    const text = `*BERITA ACARA SERAH TERIMA (BAST)*
*CV. MULIA TEKHNIK ABADI*
Nomor: *${bast.nomorBast}*
PO: *${bast.nomorPo || '-'}*

Kepada Yth:
*${penerima || 'Pihak Pertama'}*

Pekerjaan telah selesai dikerjakan dan diserahterimakan dalam kondisi baik dan berfungsi.
Tanggal: *${formatBastDate(bast.tanggalBast)}*

_Dokumen resmi CV. Mulia Tekhnik Abadi._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadBastPDF(bast, settings);
      onToast(`File ${pdfFileName} berhasil diunduh!`);
    } catch (err: any) {
      onToast('Gagal membuat PDF: ' + (err.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[96vh] animate-in fade-in zoom-in-95 duration-150">
        {/* ACTION BAR */}
        <div className="bg-[#0b223d] px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs active:scale-95 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Menyimpan...' : 'Simpan PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWA}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan WA</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus dokumen ${bast.nomorBast}?`)) {
                    onDelete(bast.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-300 hover:text-white hover:bg-rose-600/80 rounded-xl transition border border-rose-500/30"
                title="Hapus Dokumen BAST"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs px-3 py-2 rounded-xl transition shadow-xs border border-slate-200 active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 BAST DOCUMENT CONTAINER - EXACT MATCH TO SCREENSHOT 1 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center bg-slate-200/70">
          <div
            id="bast-printable"
            className="w-full max-w-[700px] bg-white text-black p-6 sm:p-10 shadow-2xl font-serif text-[13px] leading-relaxed border border-slate-300 print:p-0 print:border-none print:shadow-none"
            style={{ minHeight: '900px' }}
          >
            {/* 1. KOP SURAT (Tanpa garis bawaan jika memakai KOP upload) */}
            {settings.kopImage ? (
              <div className="w-full pb-2 mb-3">
                <img
                  src={settings.kopImage}
                  alt="KOP Surat"
                  className="w-full max-h-24 object-contain mx-auto"
                />
              </div>
            ) : (
              <>
                <div className="border-b-2 border-t-0 border-x-0 border-black pb-1 mb-0.5 text-center font-sans">
                  <h1 className="text-lg font-black text-[#1a4b91]">
                    {settings.companyName || 'CV. MULIA TEKHNIK ABADI'}
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    Jln. Letda Nasir No. 58 Desa Cikeas Udik Kec. Gunung Putri Kab. Bogor Kode Pos 16966
                  </p>
                </div>
                <div className="border-b border-black mb-5"></div>
              </>
            )}

            {/* 2. JUDUL BAST */}
            <div className="text-center mb-6">
              <h2 className="text-base font-bold underline tracking-wide uppercase font-sans">
                BERITA ACARA SERAH TERIMA
              </h2>
              <p className="text-xs font-medium text-slate-900 mt-1">
                Nomor : {bast.nomorBast}
              </p>
            </div>

            {/* 3. PARAGRAF PEMBUKA */}
            <p className="text-justify mb-4">
              Pada hari ini {bast.hariTerbilang || 'Senin tanggal Dua Bulan November Tahun Dua Ribu Dua Puluh Enam'}, kami yang bertanda tangan di bawah ini :
            </p>

            {/* 4. PIHAK PERTAMA (Hanya tampilkan bidang yang diisi) */}
            <div className="mb-4 space-y-1">
              <p className="font-semibold">Yang disebut Pihak Pertama,</p>
              <div className="pl-0 space-y-1">
                {bast.pihakPertamaNama && bast.pihakPertamaNama.trim() && (
                  <div className="grid grid-cols-[100px_14px_1fr]">
                    <span>Nama</span>
                    <span>:</span>
                    <span className="font-medium">{bast.pihakPertamaNama}</span>
                  </div>
                )}
                {bast.pihakPertamaJabatan && bast.pihakPertamaJabatan.trim() && (
                  <div className="grid grid-cols-[100px_14px_1fr]">
                    <span>Jabatan</span>
                    <span>:</span>
                    <span className="font-medium">{bast.pihakPertamaJabatan}</span>
                  </div>
                )}
                {bast.pihakPertamaPerusahaan && bast.pihakPertamaPerusahaan.trim() && (
                  <div className="grid grid-cols-[100px_14px_1fr]">
                    <span>Perusahaan</span>
                    <span>:</span>
                    <span className="font-bold uppercase">{bast.pihakPertamaPerusahaan}</span>
                  </div>
                )}
                {bast.pihakPertamaAlamat && bast.pihakPertamaAlamat.trim() && (
                  <div className="grid grid-cols-[100px_14px_1fr]">
                    <span>Alamat</span>
                    <span>:</span>
                    <span>{bast.pihakPertamaAlamat}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. PIHAK KEDUA */}
            <div className="mb-4 space-y-1">
              <p className="font-semibold">Selanjutnya disebut Pihak Kedua,</p>
              <div className="pl-0 space-y-1">
                <div className="grid grid-cols-[100px_14px_1fr]">
                  <span>Nama</span>
                  <span>:</span>
                  <span className="font-bold uppercase">
                    {bast.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO'}
                  </span>
                </div>
                <div className="grid grid-cols-[100px_14px_1fr]">
                  <span>Alamat</span>
                  <span>:</span>
                  <span>
                    {bast.pihakKeduaAlamat || settings.address || 'Jln. Letda Nasir No. 58 Bogor, 16966 Kel. Cikeas Udik Kec. Gunung Putri Bogor'}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. PERNYATAAN PO */}
            <p className="text-justify mb-3">
              Dengan ini menerangkan bahwa pekerjaan dengan nomor PO <strong>{bast.nomorPo || '-'}</strong> telah selesai dikerjakan dengan rincian sebagai berikut :
            </p>

            {/* 7. TABEL BARANG / JASA */}
            <div className="mb-4 border border-black font-sans text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black bg-slate-50 font-bold">
                    <th className="p-2 border-r border-black w-12 text-center">No</th>
                    <th className="p-2 border-r border-black text-center">Nama Barang / Jasa</th>
                    <th className="p-2 w-32 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {(bast.items || []).map((it, idx) => (
                    <tr key={it.id || idx} className="border-b border-black last:border-b-0">
                      <td className="p-2 border-r border-black text-center align-top">{idx + 1}</td>
                      <td className="p-2 border-r border-black align-top font-medium">{it.name}</td>
                      <td className="p-2 text-center italic align-top">{it.keterangan || 'Sesuai'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 8. PARAGRAF PELAKSANAAN & PENUTUP */}
            <p className="text-justify mb-3">
              Telah selesai dikerjakan oleh Pihak Kedua yang dimulai pada tanggal {formatBastDate(bast.tanggalMulai)} dan selesai pada tanggal {formatBastDate(bast.tanggalSelesai)} dan selanjutnya diserahkan kepada Pihak Pertama dalam kondisi baik dan berfungsi.
            </p>

            <p className="text-justify mb-8">
              Demikian Berita Acara Serah Terima ini dibuat untuk dapat digunakan sebagaimana mestinya.
            </p>

            {/* 9. TANDA TANGAN (Berjauhan dan Rapi) */}
            <div className="flex justify-between items-start text-xs font-sans mt-8 px-2">
              {/* Kiri: Pihak Pertama */}
              <div className="w-56 text-left">
                <p>{bast.kota || 'Bogor'}, {formatBastDate(bast.tanggalBast)}</p>
                <p className="font-semibold mb-12">Pihak Pertama</p>
                {bast.pihakPertamaNama ? (
                  <>
                    <p className="font-bold uppercase">{bast.pihakPertamaNama}</p>
                    {(bast.pihakPertamaJabatan || bast.pihakPertamaPerusahaan) && (
                      <p className="text-[11px] text-slate-700">
                        {[bast.pihakPertamaJabatan, bast.pihakPertamaPerusahaan].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </>
                ) : bast.pihakPertamaPerusahaan ? (
                  <>
                    <p className="font-bold uppercase">{bast.pihakPertamaPerusahaan}</p>
                    {bast.pihakPertamaJabatan && (
                      <p className="text-[11px] text-slate-700">{bast.pihakPertamaJabatan}</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 font-mono">( .................................... )</p>
                )}
              </div>

              {/* Kanan: Pihak Kedua (MTA) */}
              <div className="w-56 text-left">
                <p className="invisible">Bogor</p>
                <p className="font-semibold mb-2">Pihak Kedua</p>
                <div className="h-14 flex items-center">
                  <img
                    src={settings.signatureImage || '/default-ttd-stempel.png'}
                    alt="TTD & Stempel MTA"
                    className="max-h-14 w-auto object-contain"
                  />
                </div>
                <p className="font-bold uppercase mt-2">
                  {bast.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
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
