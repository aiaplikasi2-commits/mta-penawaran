import { jsPDF } from 'jspdf';
import type { CompanySettings, LetterData } from '../types/index.ts';

// Helper to format currency numbers matching reference (e.g. 9,975,000)
export function formatNumberIndo(val: number): string {
  if (isNaN(val)) return '0';
  return Math.round(val)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Indonesian month names for formal dates
const BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${BULAN_INDO[d.getMonth()]} ${d.getFullYear()}`;
}

// Convert image url to base64 for jsPDF
async function loadImageData(urlOrBase64: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!urlOrBase64) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = urlOrBase64;
  });
}

export async function generateLetterPDF(
  letter: LetterData,
  settings: CompanySettings
): Promise<jsPDF> {
  // A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight; // 180mm
  const marginBottom = 18;

  let currentY = 10;

  // 1. KOP SURAT
  if (settings.kopImage) {
    try {
      const kopData = await loadImageData(settings.kopImage);
      if (kopData) {
        const targetWidth = contentWidth;
        const aspectRatio = kopData.width / kopData.height;
        const targetHeight = Math.min(36, targetWidth / aspectRatio);

        doc.addImage(
          kopData.dataUrl,
          'PNG',
          marginLeft,
          currentY,
          targetWidth,
          targetHeight,
          undefined,
          'FAST'
        );
        currentY += targetHeight + 4;
      }
    } catch (e) {
      console.warn('Failed to load kop image', e);
      // Fallback text header if image fails
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 43, 72);
      doc.text(settings.companyName, pageWidth / 2, currentY + 6, { align: 'center' });
      currentY += 12;
    }
  } else {
    // If no KOP image uploaded, draw standard clean double line
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 43, 72);
    doc.text(settings.companyName, pageWidth / 2, currentY + 6, { align: 'center' });
    currentY += 10;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const addrLines = settings.address.split('\n');
    addrLines.forEach((l) => {
      doc.text(l, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    });
    doc.text(`Email: ${settings.email} | Telp: ${settings.phone}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    // Double line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.6);
    doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);
    currentY += 1;
    doc.setLineWidth(0.2);
    doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);
    currentY += 5;
  }

  // 2. TANGGAL SURAT (Rata Kanan)
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  const cityDate = `${settings.city || 'Bogor'}, ${formatIndoDate(letter.letterDate)}`;
  doc.text(cityDate, marginLeft + contentWidth, currentY, { align: 'right' });
  currentY += 5;

  // 3. IDENTITAS SURAT (Nomor, Lampiran, Perihal) - Rata Kiri
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const labelWidth = 22;
  const colonX = marginLeft + labelWidth;
  const valueX = colonX + 3;

  doc.text('Nomor', marginLeft, currentY);
  doc.text(':', colonX, currentY);
  doc.text(letter.letterNumber || '-', valueX, currentY);
  currentY += 4.5;

  doc.text('Lampiran', marginLeft, currentY);
  doc.text(':', colonX, currentY);
  doc.text(letter.attachment || '-', valueX, currentY);
  currentY += 4.5;

  doc.text('perihal', marginLeft, currentY);
  doc.text(':', colonX, currentY);
  const subjLines = doc.splitTextToSize(letter.subject || '-', contentWidth - (valueX - marginLeft));
  doc.text(subjLines, valueX, currentY);
  currentY += subjLines.length * 4.5 + 2;

  // 4. ALAMAT TUJUAN (Sebelah Kiri)
  doc.text('Kepada Yth.', marginLeft, currentY);
  currentY += 4.5;
  if (letter.recipientName) {
    doc.text(letter.recipientName, marginLeft, currentY);
    currentY += 4.5;
  }
  if (letter.companyName) {
    doc.text(letter.companyName, marginLeft, currentY);
    currentY += 4.5;
  }
  if (letter.address) {
    const addressLines = doc.splitTextToSize(letter.address, 90);
    doc.text(addressLines, marginLeft, currentY);
    currentY += addressLines.length * 4.5;
  }
  doc.text(letter.city ? `Di ${letter.city}` : 'Di Tempat', marginLeft, currentY);
  currentY += 7;

  // 5. PARAGRAF PEMBUKA
  const opening = letter.openingParagraph ||
    'Bersama ini kami mengajukan surat penawaran harga, berikut ini daftar harga yang kami tawarkan :';
  const openingLines = doc.splitTextToSize(opening, contentWidth);
  doc.text(openingLines, marginLeft, currentY);
  currentY += openingLines.length * 4.5 + 3;

  // 6. TABEL PENAWARAN (Kolom: NO, DESKRIPSI, Qty, SATUAN, HARGA, TOTAL)
  // Total width: 180mm
  const colWidths = {
    no: 10,
    desc: 85,
    qty: 12,
    satuan: 18,
    harga: 26,
    total: 29,
  };

  const colPositions = {
    no: marginLeft,
    desc: marginLeft + colWidths.no,
    qty: marginLeft + colWidths.no + colWidths.desc,
    satuan: marginLeft + colWidths.no + colWidths.desc + colWidths.qty,
    harga: marginLeft + colWidths.no + colWidths.desc + colWidths.qty + colWidths.satuan,
    total: marginLeft + colWidths.no + colWidths.desc + colWidths.qty + colWidths.satuan + colWidths.harga,
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(220, 229, 224); // Sage/mint header background from reference
    doc.rect(marginLeft, y, contentWidth, 7, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(marginLeft, y, contentWidth, 7, 'S');

    // Column dividers
    let curX = marginLeft;
    [colWidths.no, colWidths.desc, colWidths.qty, colWidths.satuan, colWidths.harga].forEach((w) => {
      curX += w;
      doc.line(curX, y, curX, y + 7);
    });

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    doc.text('NO', colPositions.no + colWidths.no / 2, y + 4.8, { align: 'center' });
    doc.text('DESKRIPSI', colPositions.desc + colWidths.desc / 2, y + 4.8, { align: 'center' });
    doc.text('Qty', colPositions.qty + colWidths.qty / 2, y + 4.8, { align: 'center' });
    doc.text('SATUAN', colPositions.satuan + colWidths.satuan / 2, y + 4.8, { align: 'center' });
    doc.text('HARGA', colPositions.harga + colWidths.harga / 2, y + 4.8, { align: 'center' });
    doc.text('TOTAL', colPositions.total + colWidths.total / 2, y + 4.8, { align: 'center' });

    return y + 7;
  };

  // Helper for pagination check
  const checkPageOverflow = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 15;
      currentY = drawTableHeader(currentY);
    }
  };

  currentY = drawTableHeader(currentY);

  // Rows
  let subtotal = 0;
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);

  letter.items.forEach((item, index) => {
    const itemTotal = (item.qty || 0) * (item.price || 0);
    subtotal += itemTotal;

    // Wrap description text
    const descLines = doc.splitTextToSize(item.description || '-', colWidths.desc - 4);
    const rowHeight = Math.max(6, descLines.length * 4.2 + 2);

    checkPageOverflow(rowHeight);

    // Draw borders
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'S');

    // Column vertical lines
    let curX = marginLeft;
    [colWidths.no, colWidths.desc, colWidths.qty, colWidths.satuan, colWidths.harga].forEach((w) => {
      curX += w;
      doc.line(curX, currentY, curX, currentY + rowHeight);
    });

    // Text content
    const textBaseY = currentY + 4.2;
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);

    // No
    doc.text(String(index + 1), colPositions.no + colWidths.no / 2, textBaseY, { align: 'center' });
    // Desc
    doc.text(descLines, colPositions.desc + 2, textBaseY);
    // Qty
    doc.text(String(item.qty || 0), colPositions.qty + colWidths.qty / 2, textBaseY, { align: 'center' });
    // Satuan
    doc.text(item.satuan || 'unit', colPositions.satuan + colWidths.satuan / 2, textBaseY, { align: 'center' });
    // Harga
    doc.text(formatNumberIndo(item.price || 0), colPositions.harga + colWidths.harga - 2, textBaseY, { align: 'right' });
    // Total
    doc.text(formatNumberIndo(itemTotal), colPositions.total + colWidths.total - 2, textBaseY, { align: 'right' });

    currentY += rowHeight;
  });

  // Calculate Trade In, Discount, DPP, PPN, Grand Total
  let tradeInNominal = 0;
  if (letter.tradeInActive && letter.tradeIn) {
    tradeInNominal = (letter.tradeIn.qty || 1) * (letter.tradeIn.unitValue || 0);
  }

  let afterTradeIn = Math.max(0, subtotal - tradeInNominal);

  let discountNominal = 0;
  if (letter.discountActive) {
    if (letter.discountType === 'percent') {
      discountNominal = (afterTradeIn * (letter.discountValue || 0)) / 100;
    } else {
      discountNominal = letter.discountValue || 0;
    }
  }

  const dpp = Math.max(0, afterTradeIn - discountNominal);

  let ppnNominal = 0;
  if (letter.ppnActive) {
    ppnNominal = (dpp * (letter.ppnPercent || 11)) / 100;
  }

  const grandTotal = dpp + ppnNominal;

  // Helper function to draw a summary row
  const drawSummaryRow = (label: string, valueStr: string, bgColor?: [number, number, number], isBold = false) => {
    checkPageOverflow(6.5);
    const rowHeight = 6.5;

    if (bgColor) {
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'S');

    // Split between label area (up to total column) and total value column
    const labelAreaWidth = contentWidth - colWidths.total;
    doc.line(marginLeft + labelAreaWidth, currentY, marginLeft + labelAreaWidth, currentY + rowHeight);

    doc.setFont('times', isBold ? 'bold' : 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(label, marginLeft + 2, currentY + 4.5);
    doc.text(valueStr, marginLeft + contentWidth - 2, currentY + 4.5, { align: 'right' });

    currentY += rowHeight;
  };

  // Subtotal row (like in reference image: empty label or Subtotal with value 49,310,000, soft blue tint #d7e0ea)
  drawSummaryRow('', formatNumberIndo(subtotal), [215, 224, 234], true);

  // Trade In if active
  if (letter.tradeInActive && tradeInNominal > 0) {
    drawSummaryRow(`Trade In (${letter.tradeIn.name || 'Barang Bekas'})`, `-${formatNumberIndo(tradeInNominal)}`, [240, 244, 248], true);
  }

  // Diskon row (highlighted with soft blue #d7e0ea, e.g. 810,000)
  if (letter.discountActive && discountNominal > 0) {
    drawSummaryRow('Diskon', formatNumberIndo(discountNominal), [215, 224, 234], true);
  }

  // PPN row
  if (letter.ppnActive) {
    drawSummaryRow(`PPN (${letter.ppnPercent || 11}%)`, formatNumberIndo(ppnNominal), undefined, true);
  } else {
    // Empty PPN row matching reference visual
    drawSummaryRow('PPN', '', undefined, false);
  }

  // Grand Total row (sage/mint green highlight #e2ece9, bold total e.g. 48,500,000)
  drawSummaryRow('Total', formatNumberIndo(grandTotal), [226, 236, 233], true);

  currentY += 5;

  // 7. PARAGRAF PENUTUP
  checkPageOverflow(30);
  const closing = letter.closingParagraph ||
    `Demikian Penawaran harga ini kami sampaikan, bilamana ada informasi yang perlu diketahui mengenai penawaran ini lebih lanjut, maka bapak / ibu dapat menghubungi kami lebih lanjut.\n\nAtas perhatiannya kami ucapkan terima kasih.`;

  const closingLines = doc.splitTextToSize(closing, contentWidth);
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(closingLines, marginLeft, currentY);
  currentY += closingLines.length * 4.5 + 8;

  // 8. TANDA TANGAN (Kanan Bawah)
  checkPageOverflow(40);
  const signBlockWidth = 60;
  const signBlockX = marginLeft + contentWidth - signBlockWidth;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Hormat Kami,', signBlockX + signBlockWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  // Stamp and signature image overlay
  const signImgToUse = settings.signatureImage || settings.stampImage;
  if (signImgToUse) {
    try {
      const signData = await loadImageData(signImgToUse);
      if (signData) {
        const targetW = 42;
        const targetH = Math.min(22, (targetW * signData.height) / signData.width);
        doc.addImage(
          signData.dataUrl,
          'PNG',
          signBlockX + (signBlockWidth - targetW) / 2,
          currentY,
          targetW,
          targetH,
          undefined,
          'FAST'
        );
        currentY += targetH + 2;
      } else {
        currentY += 18;
      }
    } catch {
      currentY += 18;
    }
  } else {
    currentY += 18;
  }

  // Signatory Name in Bold
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text(settings.signatoryName || 'Muhamad Ridho', signBlockX + signBlockWidth / 2, currentY, { align: 'center' });

  return doc;
}

// Generate PDF filename following exact requirement: PENAWARAN_MTA016(nomor)10(Bulan)26(tahun)
export function getExportFilename(letter: LetterData): string {
  let numPart = '016';
  const numMatch = (letter.letterNumber || '').match(/\d+/);
  if (numMatch) {
    numPart = numMatch[0].padStart(3, '0');
  }

  let monthPart = '10';
  let year2Part = '26';

  if (letter.letterDate) {
    const parts = letter.letterDate.split('-');
    if (parts.length >= 3) {
      year2Part = parts[0].slice(-2);
      monthPart = parts[1].padStart(2, '0');
    }
  } else {
    const now = new Date();
    monthPart = String(now.getMonth() + 1).padStart(2, '0');
    year2Part = String(now.getFullYear()).slice(-2);
  }

  return `PENAWARAN_MTA${numPart}${monthPart}${year2Part}.pdf`;
}

// Generate PDF File object for attachments and sharing
export async function getLetterPDFFile(
  letter: LetterData,
  settings: CompanySettings
): Promise<{ file: File; filename: string; blob: Blob; doc: jsPDF }> {
  const doc = await generateLetterPDF(letter, settings);
  const filename = getExportFilename(letter);
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });
  return { file, filename, blob: pdfBlob, doc };
}

// Download PDF helper
export async function downloadLetterPDF(letter: LetterData, settings: CompanySettings): Promise<void> {
  const { doc, filename } = await getLetterPDFFile(letter, settings);
  doc.save(filename);
}

// Share PDF helper using Web Share API
export async function shareLetterPDF(letter: LetterData, settings: CompanySettings): Promise<boolean> {
  const { doc, filename, file } = await getLetterPDFFile(letter, settings);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Surat Penawaran MTA - ${letter.letterNumber}`,
        text: `Surat Penawaran Harga ${letter.subject} dari CV. MULIA TEKHNIK ABADI`,
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error, falling back to download', err);
        doc.save(filename);
      }
      return false;
    }
  } else {
    // Fallback: download directly
    doc.save(filename);
    return false;
  }
}
