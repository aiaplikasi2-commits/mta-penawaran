import { jsPDF } from 'jspdf';
import type { InvoiceData } from '../types/invoice.ts';
import type { CompanySettings } from '../types/index.ts';
import { formatNumberIndo } from './pdfGenerator.ts';

// Format Indonesian Date (e.g. 3 November 2026)
export function formatInvoiceDate(isoDateStr: string): string {
  if (!isoDateStr) return '-';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${day} ${months[monthIdx] || ''} ${year}`;
}

// Helper to load image safely
async function loadImageData(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 150;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Generate A4 Invoice PDF matching gambar_3f4d7e8e.png exactly
export async function generateInvoicePDF(
  invoice: InvoiceData,
  settings: CompanySettings
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 15;
  const contentWidth = 180;
  let currentY = 15;

  // 1. TOP HEADER SECTION
  // A. Top-Left Box: INVOICE | No | Tanggal (Width: 85mm, Height: 26mm)
  const boxW = 85;
  const boxH = 26;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(marginX, currentY, boxW, boxH);

  // Row 1: INVOICE title in Brand Blue matching Logo (CV MTA blue: #1a4b91)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(26, 75, 145); // Brand color matching logo
  doc.text('I N V O I C E', marginX + boxW / 2, currentY + 7.5, { align: 'center' });

  // Divider 1
  doc.setDrawColor(0, 0, 0);
  doc.line(marginX, currentY + 11, marginX + boxW, currentY + 11);

  // Vertical Divider in rows 2 & 3
  const labelColW = 22;
  doc.line(marginX + labelColW, currentY + 11, marginX + labelColW, currentY + boxH);

  // Row 2: No : | {invoiceNumber}
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('No :', marginX + 3, currentY + 15.5);
  doc.text(invoice.invoiceNumber || '-', marginX + labelColW + 3, currentY + 15.5);

  // Divider 2
  doc.line(marginX, currentY + 18.5, marginX + boxW, currentY + 18.5);

  // Row 3: Tanggal : | {invoiceDate}
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Tanggal :', marginX + 3, currentY + 23);
  doc.text(formatInvoiceDate(invoice.invoiceDate), marginX + labelColW + 3, currentY + 23);

  // B. Top-Right Section: Logo MTA from settings + Company Name
  const logoRightX = 145;
  const logoW = 48;
  const logoH = 18;

  try {
    const logoImg = await loadImageData(settings.logoImage || '/default-logo.png');
    if (logoImg) {
      doc.addImage(logoImg.dataUrl, 'PNG', logoRightX, currentY - 1, logoW, logoH, undefined, 'FAST');
    }
  } catch {
    // fallback if image unavailable
  }

  // Company Name below logo
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    settings.companyName || 'CV. MULIA TEKHNIK ABADI',
    logoRightX + logoW / 2,
    currentY + logoH + 3,
    { align: 'center' }
  );

  currentY += boxH + 6;

  // 2. DARI & KEPADA SECTION
  const colLeftX = marginX;
  const colRightX = marginX + 92;

  // Dari:
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Dari:', colLeftX, currentY);

  // Kepada:
  doc.text('Kepada:', colRightX, currentY);

  currentY += 4.5;

  // Sender Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(settings.companyName || 'CV. MULIA TEKHNIK ABADI', colLeftX, currentY);

  // Recipient Details
  doc.text((invoice.companyName || '-').toUpperCase(), colRightX, currentY);

  currentY += 4.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  // Sender Address (compact 1-2 lines)
  const senderAddr = doc.splitTextToSize(
    settings.address || 'KP. Nagrak RT 05/03 Desa Nagrak Kec. Gunung Putri Bogor',
    82
  );
  doc.text(senderAddr, colLeftX, currentY);

  // Recipient PIC / Contact
  if (invoice.recipientName) {
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.recipientName, colRightX, currentY);
    doc.setFont('helvetica', 'normal');
  }

  const senderAddrH = senderAddr.length * 3.5;
  currentY += Math.max(senderAddrH, 4);

  // Sender Telp & Email
  doc.text(`Telp: ${settings.phone || '0812 1085 2489'}`, colLeftX, currentY);

  // Recipient Address
  if (invoice.address) {
    const recipientAddr = doc.splitTextToSize(invoice.address, 85);
    doc.text(recipientAddr, colRightX, currentY);
  }

  currentY += 3.8;
  doc.text(`Email: ${settings.email || 'cvmuliatekhnikabadi@gmail.com'}`, colLeftX, currentY);

  currentY += 7;

  // 3. REFERENSI PESANAN BOX (Hanya ditampilkan jika nomor PO diisi)
  const hasPoRef = Boolean(invoice.nomorPo && invoice.nomorPo.trim() && invoice.nomorPo.trim() !== '-');
  if (hasPoRef) {
    const refBoxH = 6.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(marginX, currentY, contentWidth, refBoxH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('Referensi Pesanan:', marginX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const poRefText = `Sesuai dengan Nomor PO ${invoice.nomorPo.trim()}`;
    doc.text(poRefText, marginX + contentWidth - 3, currentY + 4.5, { align: 'right' });

    currentY += refBoxH + 4.5;
  } else {
    currentY += 1.5;
  }

  // 4. ITEMS TABLE
  // Columns: No(12), Uraian Pekerjaan / Keterangan(82), Qty(14), Satuan(18), Harga Satuan(26), Jumlah(Rp)(28) = 180mm
  const colNoW = 12;
  const colDescW = 82;
  const colQtyW = 14;
  const colSatuanW = 18;
  const colPriceW = 26;
  const colTotalW = 28;

  const headerH = 7.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(marginX, currentY, contentWidth, headerH);

  let curX = marginX;
  const cols = [
    { title: 'No.', w: colNoW, align: 'center' },
    { title: 'Uraian Pekerjaan / Keterangan', w: colDescW, align: 'left' },
    { title: 'Qty', w: colQtyW, align: 'center' },
    { title: 'Satuan', w: colSatuanW, align: 'center' },
    { title: 'Harga Satuan', w: colPriceW, align: 'center' },
    { title: 'Jumlah (Rp)', w: colTotalW, align: 'center' },
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  cols.forEach((col, idx) => {
    if (idx > 0) {
      doc.line(curX, currentY, curX, currentY + headerH);
    }
    const textX = col.align === 'center' ? curX + col.w / 2 : curX + 2.5;
    doc.text(col.title, textX, currentY + 5, { align: col.align as any });
    curX += col.w;
  });

  currentY += headerH;

  // Table Data Rows
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [{
    id: '1',
    description: '-',
    qty: 1,
    satuan: 'unit',
    price: invoice.subtotal || 0,
    total: invoice.subtotal || 0,
  }];

  items.forEach((it, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const splitDesc = doc.splitTextToSize(it.description || '-', colDescW - 5);
    const rowH = Math.max(6.5, splitDesc.length * 3.8 + 2.5);

    doc.rect(marginX, currentY, contentWidth, rowH);

    let rowX = marginX;

    // No
    doc.text(String(idx + 1), rowX + colNoW / 2, currentY + 4.5, { align: 'center' });
    rowX += colNoW;
    doc.line(rowX, currentY, rowX, currentY + rowH);

    // Description
    doc.text(splitDesc, rowX + 2.5, currentY + 4.2);
    rowX += colDescW;
    doc.line(rowX, currentY, rowX, currentY + rowH);

    // Qty
    doc.setFont('helvetica', 'bold');
    doc.text(String(it.qty || 1), rowX + colQtyW / 2, currentY + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    rowX += colQtyW;
    doc.line(rowX, currentY, rowX, currentY + rowH);

    // Satuan
    doc.text(it.satuan || 'unit', rowX + colSatuanW / 2, currentY + 4.5, { align: 'center' });
    rowX += colSatuanW;
    doc.line(rowX, currentY, rowX, currentY + rowH);

    // Harga Satuan
    doc.text(formatNumberIndo(it.price || 0), rowX + colPriceW - 2.5, currentY + 4.5, { align: 'right' });
    rowX += colPriceW;
    doc.line(rowX, currentY, rowX, currentY + rowH);

    // Jumlah (Rp)
    doc.setFont('helvetica', 'bold');
    doc.text(formatNumberIndo(it.total || 0), rowX + colTotalW - 2.5, currentY + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += rowH;
  });

  currentY += 4.5;

  // 5. BOTTOM SECTION: PEMBAYARAN & TERBILANG (LEFT) VS TOTAL TAGIHAN & TTD (RIGHT)
  const leftBoxW = 86;
  const rightBoxW = 90;
  const rightBoxX = marginX + contentWidth - rightBoxW;

  const startBottomY = currentY;

  // A. Left Box: PEMBAYARAN TRANSFER MELALUI
  const bankBoxH = 20;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, leftBoxW, bankBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('PEMBAYARAN TRANSFER MELALUI', marginX + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nama Bank: ${invoice.bankName || settings.bankName || 'Mandiri'}`, marginX + 3, currentY + 9.5);
  doc.text(`Atas Nama: ${invoice.bankAccountName || settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI'}`, marginX + 3, currentY + 13.5);
  doc.text(`No. Rekening: ${invoice.bankAccountNumber || settings.bankAccountNumber || '167-00-0529426-8'}`, marginX + 3, currentY + 17.5);

  // B. Left Box: TERBILANG
  const terbilangY = currentY + bankBoxH + 3.5;
  const terbilangBoxH = 14;
  doc.rect(marginX, terbilangY, leftBoxW, terbilangBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.text('TERBILANG :', marginX + 3, terbilangY + 4.5);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const terbilangText = `"${invoice.terbilang || 'Nol Rupiah'}"`;
  const splitTerbilang = doc.splitTextToSize(terbilangText, leftBoxW - 6);
  doc.text(splitTerbilang, marginX + 3, terbilangY + 8.5);

  // C. Right Box: Subtotal, Trade-In, Diskon, PPN Calculations
  let calcY = startBottomY;
  const hasTradeIn = invoice.tradeInActive && (invoice.tradeInValue || 0) > 0;
  const hasDiscount = invoice.discountActive && (invoice.discountValue || 0) > 0;
  const hasPpn = invoice.ppnActive && (invoice.ppnPercent || 0) > 0;

  let calcRows = 1;
  if (hasTradeIn) calcRows++;
  if (hasDiscount) calcRows++;
  if (hasPpn) calcRows++;

  const calcBoxH = Math.max(12, calcRows * 5.2 + 2);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(rightBoxX, calcY, rightBoxW, calcBoxH);

  // Subtotal
  let curCalcRowY = calcY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal', rightBoxX + 3, curCalcRowY);
  doc.text(`Rp ${formatNumberIndo(invoice.subtotal)}`, rightBoxX + rightBoxW - 3, curCalcRowY, { align: 'right' });

  // Trade-In (in Red, matching reference image)
  if (hasTradeIn) {
    curCalcRowY += 5;
    doc.setTextColor(204, 0, 0);
    doc.text(`- ${invoice.tradeInName || 'Trade In Barang Bekas'}`, rightBoxX + 3, curCalcRowY);
    doc.text(`-Rp ${formatNumberIndo(invoice.tradeInValue || 0)}`, rightBoxX + rightBoxW - 3, curCalcRowY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  // Diskon (in Red if active)
  if (hasDiscount) {
    curCalcRowY += 5;
    doc.setTextColor(204, 0, 0);
    doc.text('- Diskon', rightBoxX + 3, curCalcRowY);
    doc.text(`-Rp ${formatNumberIndo(invoice.discountValue || 0)}`, rightBoxX + rightBoxW - 3, curCalcRowY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  // PPN
  if (hasPpn) {
    curCalcRowY += 5;
    const ppnVal = (invoice.subtotal * (invoice.ppnPercent || 11)) / 100;
    doc.text(`+ PPN (${invoice.ppnPercent}%)`, rightBoxX + 3, curCalcRowY);
    doc.text(`Rp ${formatNumberIndo(ppnVal)}`, rightBoxX + rightBoxW - 3, curCalcRowY, { align: 'right' });
  }

  calcY += calcBoxH;

  // D. TOTAL TAGIHAN Banner (Black filled box with white text, matching reference image)
  const totalBannerH = 9.5;
  doc.setFillColor(0, 0, 0);
  doc.rect(rightBoxX, calcY, rightBoxW, totalBannerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TAGIHAN', rightBoxX + 3, calcY + 6.2);

  doc.setFontSize(11);
  doc.text(`Rp ${formatNumberIndo(invoice.total)}`, rightBoxX + rightBoxW - 3, calcY + 6.2, { align: 'right' });

  // E. Signature Section (below Total Tagihan)
  let sigY = calcY + totalBannerH + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Hormat Kami,', rightBoxX + rightBoxW - 3, sigY, { align: 'right' });

  // Sesuai instruksi: Invoice tidak membubuhkan stempel atau ttd (ruang tanda tangan bersih)
  sigY += 20;

  // Dotted Line & Underline
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 140);
  doc.text('....................', rightBoxX + rightBoxW - 3, sigY - 1, { align: 'right' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(rightBoxX + 30, sigY + 0.5, rightBoxX + rightBoxW - 3, sigY + 0.5);

  sigY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    (invoice.signatoryName || settings.signatoryName || 'MUHAMAD RIDHO').toUpperCase(),
    rightBoxX + rightBoxW - 3,
    sigY,
    { align: 'right' }
  );

  sigY += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(settings.companyName || 'CV. MULIA TEKHNIK ABADI', rightBoxX + rightBoxW - 3, sigY, { align: 'right' });

  return doc;
}

// Download single Invoice PDF
export async function downloadInvoicePDF(
  invoice: InvoiceData,
  settings: CompanySettings
): Promise<void> {
  const doc = await generateInvoicePDF(invoice, settings);
  const cleanNum = (invoice.invoiceNumber || 'INVOICE').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanPt = (invoice.companyName || 'KLIEN').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${cleanNum}_${cleanPt}.pdf`);
}

// Download Rekap Invoice PDF - Strictly No, Nomor Invoice, Nomor PO, Tanggal, Nama PT, Total
export async function downloadRekapInvoicePDF(
  invoices: InvoiceData[],
  settings: CompanySettings
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 15;
  let startY = 15;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 75, 145);
  doc.text(settings.companyName || 'CV. MULIA TEKHNIK ABADI', 105, startY, { align: 'center' });

  startY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(
    settings.address || 'KP. Nagrak RT 05/03 Desa Nagrak Kec. Gunung Putri Bogor',
    105,
    startY,
    { align: 'center' }
  );

  startY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('REKAPITULASI DOKUMEN INVOICE', 105, startY, { align: 'center' });

  startY += 7;

  // Columns: No(10), Nomor Invoice(38), Nomor PO(32), Tanggal(28), Nama PT(42), Total(30) = 180mm
  const cols = [
    { title: 'No', width: 10 },
    { title: 'Nomor Invoice', width: 38 },
    { title: 'Nomor PO', width: 32 },
    { title: 'Tanggal', width: 28 },
    { title: 'Nama PT (Klien)', width: 42 },
    { title: 'Total Tagihan', width: 30 },
  ];

  const totalTableWidth = 180;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginX, startY, totalTableWidth, 7);

  let currentX = marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  cols.forEach((col) => {
    doc.text(col.title, currentX + col.width / 2, startY + 4.8, { align: 'center' });
    doc.line(currentX, startY, currentX, startY + 7);
    currentX += col.width;
  });
  doc.line(currentX, startY, currentX, startY + 7);

  startY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  invoices.forEach((inv, idx) => {
    const rowH = 7;
    doc.rect(marginX, startY, totalTableWidth, rowH);

    let cx = marginX;
    // 1. No
    doc.text(String(idx + 1), cx + cols[0].width / 2, startY + 4.8, { align: 'center' });
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[0].width;

    // 2. Nomor Invoice
    doc.setFont('helvetica', 'bold');
    doc.text(inv.invoiceNumber || '-', cx + 2.5, startY + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[1].width;

    // 3. Nomor PO
    doc.text(inv.nomorPo || '-', cx + cols[2].width / 2, startY + 4.8, { align: 'center' });
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[2].width;

    // 4. Tanggal
    doc.text(formatInvoiceDate(inv.invoiceDate), cx + cols[3].width / 2, startY + 4.8, { align: 'center' });
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[3].width;

    // 5. Nama PT
    doc.setFont('helvetica', 'bold');
    doc.text((inv.companyName || '-').toUpperCase(), cx + 2.5, startY + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[4].width;

    // 6. Total
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${formatNumberIndo(inv.total)}`, cx + cols[5].width - 2, startY + 4.8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.line(cx, startY, cx, startY + rowH);

    startY += rowH;

    if (startY > 275) {
      doc.addPage();
      startY = 15;
    }
  });

  doc.save(`REKAP_INVOICE_MTA_${new Date().toISOString().slice(0, 10)}.pdf`);
}
