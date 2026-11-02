import React, { useState } from 'react';
import type { CompanySettings, LetterData } from '../types/index.ts';
import { formatNumberIndo, formatIndoDate } from '../services/pdfGenerator.ts';
import { Smartphone, FileText, ZoomIn, ZoomOut } from 'lucide-react';

interface LetterPreviewProps {
  letter: LetterData;
  settings: CompanySettings;
}

export const LetterPreview: React.FC<LetterPreviewProps> = ({ letter, settings }) => {
  const [viewMode, setViewMode] = useState<'mobile' | 'a4'>('mobile');
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Calculate items total
  const subtotal = letter.items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);

  // Trade In
  const tradeInNominal = letter.tradeInActive && letter.tradeIn
    ? (Number(letter.tradeIn.qty) || 1) * (Number(letter.tradeIn.unitValue) || 0)
    : 0;

  const afterTradeIn = Math.max(0, subtotal - tradeInNominal);

  // Discount
  let discountNominal = 0;
  if (letter.discountActive) {
    if (letter.discountType === 'percent') {
      discountNominal = (afterTradeIn * (Number(letter.discountValue) || 0)) / 100;
    } else {
      discountNominal = Number(letter.discountValue) || 0;
    }
  }

  const dpp = Math.max(0, afterTradeIn - discountNominal);

  // PPN
  const ppnNominal = letter.ppnActive
    ? (dpp * (Number(letter.ppnPercent) || 11)) / 100
    : 0;

  const grandTotal = dpp + ppnNominal;

  const cityDate = `${settings.city || 'Bogor'}, ${formatIndoDate(letter.letterDate)}`;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Mode Controls */}
      <div className="w-full flex items-center justify-between bg-slate-200/80 p-1.5 rounded-xl mb-3 text-xs">
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('mobile');
              setZoomScale(1);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
              viewMode === 'mobile'
                ? 'bg-[#0b223d] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Tampilan HP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('a4');
              setZoomScale(1);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
              viewMode === 'a4'
                ? 'bg-[#0b223d] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Format A4</span>
          </button>
        </div>

        {viewMode === 'a4' && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
              className="p-1 rounded bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(1.4, prev + 0.1))}
              className="p-1 rounded bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Document Sheet Canvas */}
      <div className="w-full overflow-x-auto flex justify-center pb-4">
        <div
          style={{
            transform: viewMode === 'a4' && zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
          }}
          className={`bg-white text-black font-document shadow-xl border border-slate-300 transition-all ${
            viewMode === 'mobile'
              ? 'w-full max-w-[620px] p-4 sm:p-7 text-[12px] leading-relaxed rounded-lg'
              : 'w-[794px] min-h-[1123px] p-12 text-[13px] leading-relaxed'
          }`}
        >
          {/* 1. KOP SURAT */}
          <div className="w-full mb-3">
            {settings.kopImage ? (
              <div className="w-full flex justify-center">
                <img
                  src={settings.kopImage}
                  alt="Kop Surat CV. Mulia Tekhnik Abadi"
                  className="w-full max-h-32 object-contain"
                />
              </div>
            ) : (
              <div className="text-center pb-2 border-b-2 border-black">
                <h2 className="text-xl font-bold text-[#0b223d] uppercase tracking-wide">
                  {settings.companyName}
                </h2>
                <p className="text-xs text-slate-700 whitespace-pre-line mt-0.5">{settings.address}</p>
                <p className="text-xs text-slate-700 mt-0.5">
                  Email : <span className="underline">{settings.email}</span> | Telpon : {settings.phone}
                </p>
                <div className="w-full border-b border-black mt-1" />
              </div>
            )}
          </div>

          {/* 2. TANGGAL SURAT (Rata Kanan) */}
          <div className="text-right font-bold text-[13px] mb-3 text-black">
            {cityDate}
          </div>

          {/* 3. IDENTITAS SURAT (Nomor, Lampiran, perihal) */}
          <div className="space-y-0.5 mb-3 text-[12.5px]">
            <div className="flex">
              <span className="w-20 inline-block">Nomor</span>
              <span className="w-4 text-center">:</span>
              <span className="font-medium">{letter.letterNumber || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-20 inline-block">Lampiran</span>
              <span className="w-4 text-center">:</span>
              <span>{letter.attachment || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-20 inline-block">perihal</span>
              <span className="w-4 text-center">:</span>
              <span className="font-medium flex-1">{letter.subject || '-'}</span>
            </div>
          </div>

          {/* 4. ALAMAT TUJUAN */}
          <div className="mb-4 text-[12.5px] leading-snug">
            <div>Kepada Yth.</div>
            {letter.recipientName && <div>{letter.recipientName}</div>}
            {letter.companyName && <div className="font-semibold">{letter.companyName}</div>}
            {letter.address && <div className="whitespace-pre-line">{letter.address}</div>}
            <div>{letter.city ? `Di ${letter.city}` : 'Di Tempat'}</div>
          </div>

          {/* 5. PEMBUKA SURAT */}
          <div className="mb-3 text-[12.5px] text-justify leading-relaxed">
            {letter.openingParagraph ||
              'Bersama ini kami mengajukan surat penawaran harga pemasangan AC, berikut ini daftar harga yang kami tawarkan :'}
          </div>

          {/* 6. TABEL PENAWARAN (Kolom: NO, DESKRIPSI, Qty, SATUAN, HARGA, TOTAL) */}
          <div className="w-full overflow-x-auto mb-3">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-[#dce5e0] text-black font-bold border-b border-black">
                  <th className="border border-black py-1.5 px-1 text-center w-[6%]">NO</th>
                  <th className="border border-black py-1.5 px-2 text-center w-[46%]">DESKRIPSI</th>
                  <th className="border border-black py-1.5 px-1 text-center w-[7%]">Qty</th>
                  <th className="border border-black py-1.5 px-1 text-center w-[10%]">SATUAN</th>
                  <th className="border border-black py-1.5 px-2 text-center w-[15%]">HARGA</th>
                  <th className="border border-black py-1.5 px-2 text-center w-[16%]">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {letter.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-black py-4 text-center text-slate-400 italic">
                      Belum ada baris penawaran
                    </td>
                  </tr>
                ) : (
                  letter.items.map((it, idx) => {
                    const rowTotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
                    return (
                      <tr key={it.id || idx} className="border-b border-black">
                        <td className="border border-black py-1 px-1 text-center align-top">{idx + 1}</td>
                        <td className="border border-black py-1 px-2 text-left align-top">{it.description || '-'}</td>
                        <td className="border border-black py-1 px-1 text-center align-top">{it.qty}</td>
                        <td className="border border-black py-1 px-1 text-center align-top">{it.satuan || 'unit'}</td>
                        <td className="border border-black py-1 px-2 text-right align-top whitespace-nowrap">
                          {formatNumberIndo(it.price)}
                        </td>
                        <td className="border border-black py-1 px-2 text-right align-top whitespace-nowrap">
                          {formatNumberIndo(rowTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Subtotal row (like reference: empty first 4 cols or label, right total with soft blue tint) */}
                <tr className="border-t border-black bg-[#d7e0ea] font-bold">
                  <td colSpan={5} className="border border-black py-1 px-2 text-left">
                    {/* Empty cell per reference */}
                  </td>
                  <td className="border border-black py-1 px-2 text-right whitespace-nowrap">
                    {formatNumberIndo(subtotal)}
                  </td>
                </tr>

                {/* Trade In if active */}
                {letter.tradeInActive && tradeInNominal > 0 && (
                  <tr className="border-t border-black bg-slate-50 font-semibold">
                    <td colSpan={5} className="border border-black py-1 px-2 text-left text-slate-700">
                      Trade In {letter.tradeIn.name ? `(${letter.tradeIn.name})` : ''}
                    </td>
                    <td className="border border-black py-1 px-2 text-right whitespace-nowrap text-red-700">
                      -{formatNumberIndo(tradeInNominal)}
                    </td>
                  </tr>
                )}

                {/* Diskon row */}
                {letter.discountActive && discountNominal > 0 ? (
                  <tr className="border-t border-black bg-[#d7e0ea] font-bold">
                    <td colSpan={5} className="border border-black py-1 px-2 text-left">
                      Diskon {letter.discountType === 'percent' ? `(${letter.discountValue}%)` : ''}
                    </td>
                    <td className="border border-black py-1 px-2 text-right whitespace-nowrap">
                      {formatNumberIndo(discountNominal)}
                    </td>
                  </tr>
                ) : null}

                {/* PPN row */}
                <tr className="border-t border-black">
                  <td colSpan={5} className="border border-black py-1 px-2 font-bold text-left">
                    PPN {letter.ppnActive ? `(${letter.ppnPercent || 11}%)` : ''}
                  </td>
                  <td className="border border-black py-1 px-2 text-right whitespace-nowrap font-bold">
                    {letter.ppnActive ? formatNumberIndo(ppnNominal) : ''}
                  </td>
                </tr>

                {/* Total row (soft green background #e2ece9) */}
                <tr className="border-t-2 border-black bg-[#e2ece9] font-bold text-[13px]">
                  <td colSpan={5} className="border border-black py-1 px-2 text-left">
                    Total
                  </td>
                  <td className="border border-black py-1 px-2 text-right whitespace-nowrap">
                    {formatNumberIndo(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. PENUTUP SURAT */}
          <div className="mb-6 text-[12.5px] leading-relaxed whitespace-pre-line text-justify">
            {letter.closingParagraph ||
              `Demikian Penawaran harga ini kami sampaikan, bilamana ada informasi yang perlu diketahui mengenai penawaran ini lebih lanjut, maka bapak / ibu dapat menghubungi kami lebih lanjut.\n\nAtas perhatiannya kami ucapkan terima kasih.`}
          </div>

          {/* 8. TANDA TANGAN (Kanan Bawah) */}
          <div className="flex justify-end mt-4">
            <div className="w-56 text-center text-[12.5px]">
              <div>Hormat Kami,</div>
              <div className="my-1.5 h-16 flex items-center justify-center">
                {settings.signatureImage || settings.stampImage ? (
                  <img
                    src={settings.signatureImage || settings.stampImage}
                    alt="Tanda Tangan & Stempel"
                    className="max-h-16 max-w-44 object-contain"
                  />
                ) : (
                  <div className="h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-300 text-[10px]">
                    (Tanda Tangan / Stempel)
                  </div>
                )}
              </div>
              <div className="font-bold underline text-[13px]">
                {settings.signatoryName || 'Muhamad Ridho'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
