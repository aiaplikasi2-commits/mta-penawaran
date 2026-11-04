import { jsPDF } from 'jspdf';
import type { SlipGaji, SalarySettings } from '../types/salary.ts';

export function formatRupiah(val: number): string {
  if (val === undefined || val === null || val === 0) return '-';
  return (
    'Rp ' +
    Math.round(val)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

export function formatRupiahAlways(val: number): string {
  return (
    'Rp ' +
    Math.round(val || 0)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
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

// Helper to format date DD/MM/YYYY
export function formatSlipDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export async function generateSlipGajiPDF(
  slip: SlipGaji,
  settings: SalarySettings
): Promise<jsPDF> {
  // A4 portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 14;
  const boxWidth = 182; // 210 - 28
  let startY = 18;

  // Outer border lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);

  // TOP SECTION: Left (Pure Logo + SLIP GAJI KARYAWAN) | Right (Company Details)
  const headerHeight = 28;
  doc.rect(marginX, startY, boxWidth / 2, headerHeight);
  doc.rect(marginX + boxWidth / 2, startY, boxWidth / 2, headerHeight);

  // Pure Logo (NO KOP letterhead)
  try {
    const logoSrc = settings.logoImage || '/default-logo.png';
    const logoImg = await loadImageData(logoSrc);
    if (logoImg) {
      // Calculate proportional dimensions (max width 36mm, max height 11mm)
      const maxW = 36;
      const maxH = 11;
      let drawW = maxW;
      let drawH = (logoImg.height / logoImg.width) * drawW;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = (logoImg.width / logoImg.height) * drawH;
      }
      doc.addImage(logoImg.dataUrl, 'PNG', marginX + 6, startY + 2.5, drawW, drawH);
    }
  } catch (e) {
    // Fallback text if logo not loaded
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(26, 75, 145);
    doc.text('MTA', marginX + 6, startY + 11);
  }

  // Text "SLIP GAJI KARYAWAN" directly beneath logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('SLIP GAJI KARYAWAN', marginX + 6, startY + 22);

  // Right Header: CV MULIA TEKHNIK ABADI (Matching MTA logo corporate blue)
  const rightX = marginX + boxWidth / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 75, 145); // Corporate royal blue matching MTA logo
  doc.text(settings.companyName || 'CV MULIA TEKHNIK ABADI', rightX, startY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 55, 55);
  const addressLines = (settings.address || 'Jln. Letda Nasir No. 58 Desa Cikeas Udik\nKec. Gunung Putri - Kab. Bogor Kode Pos 16966').split('\n');
  let addrY = startY + 12;
  addressLines.forEach((line) => {
    doc.text(line, rightX, addrY);
    addrY += 4;
  });
  doc.text(`Telp: ${settings.phone || '0812 - 1085 - 2489 / 0878 - 4062 - 0432'}`, rightX, addrY);

  startY += headerHeight;

  // ROW 2: Employee Details (Left) | Slip Details (Right) - Perfectly Aligned Colons
  const metaHeight = 22;
  doc.rect(marginX, startY, boxWidth / 2, metaHeight);
  doc.rect(marginX + boxWidth / 2, startY, boxWidth / 2, metaHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  // Left Meta (Colon precisely at marginX + 22)
  doc.text('NAMA', marginX + 4, startY + 6);
  doc.text(':', marginX + 22, startY + 6);
  doc.text((slip.nama || '').toUpperCase(), marginX + 25, startY + 6);

  doc.text('JABATAN', marginX + 4, startY + 12);
  doc.text(':', marginX + 22, startY + 12);
  doc.text((slip.jabatan || '').toUpperCase(), marginX + 25, startY + 12);

  doc.text('NIK', marginX + 4, startY + 18);
  doc.text(':', marginX + 22, startY + 18);
  doc.text(slip.nik || '-', marginX + 25, startY + 18);

  // Right Meta (Colon precisely at rMetaX + 22)
  const rMetaX = marginX + boxWidth / 2 + 4;
  doc.text('SLIP GAJI', rMetaX, startY + 6);
  doc.text(':', rMetaX + 22, startY + 6);
  doc.text(slip.nomorSlip || '-', rMetaX + 25, startY + 6);

  doc.text('TANGGAL', rMetaX, startY + 12);
  doc.text(':', rMetaX + 22, startY + 12);
  doc.text(formatSlipDate(slip.tanggal), rMetaX + 25, startY + 12);

  doc.text('PERIODE', rMetaX, startY + 18);
  doc.text(':', rMetaX + 22, startY + 18);
  doc.text(slip.periodeBulan || '-', rMetaX + 25, startY + 18);

  startY += metaHeight;

  // ROW 3: Column Headers: PENDAPATAN & PEMOTONGAN
  const colHeaderH = 7.5;
  doc.rect(marginX, startY, boxWidth / 2, colHeaderH);
  doc.rect(marginX + boxWidth / 2, startY, boxWidth / 2, colHeaderH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('PENDAPATAN', marginX + 4, startY + 5.2);
  doc.text('PEMOTONGAN', marginX + boxWidth / 2 + 4, startY + 5.2);

  startY += colHeaderH;

  // ROW 4: Table Content Rows - STRICT SEJAJAR COLON ALIGNMENT
  const bodyHeight = 58;
  doc.rect(marginX, startY, boxWidth / 2, bodyHeight);
  doc.rect(marginX + boxWidth / 2, startY, boxWidth / 2, bodyHeight);

  // Items Pendapatan
  const pendapatanItems = [
    { label: 'Gaji Pokok', val: formatRupiahAlways(slip.gajiPokok) },
    { label: 'Uang Makan', val: formatRupiah(slip.uangMakan) },
    { label: 'Transport', val: formatRupiah(slip.transport) },
    { label: 'THR', val: formatRupiah(slip.thr) },
    { label: 'Bonus', val: formatRupiah(slip.bonus) },
    { label: 'Lemburan', val: formatRupiah(slip.lemburan) },
    { label: 'Jam Lembur', val: slip.jamLembur ? `${slip.jamLembur} Jam` : '-' },
    { label: 'Masuk Kerja', val: slip.masukKerja ? `${slip.masukKerja} hari` : '0 hari' },
  ];

  // Items Pemotongan
  const pemotonganItems = [
    { label: 'Pinjaman', val: formatRupiah(slip.pinjaman) },
    { label: 'BPJS Ketenagakerjaan', val: formatRupiah(slip.bpjsKetenagakerjaan) },
    { label: 'PPh21', val: formatRupiah(slip.pph21) },
    { label: 'Lain - lain', val: formatRupiah(slip.lainLain) },
    { label: 'Uang Makan', val: formatRupiah(slip.potonganUangMakan) },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(0, 0, 0);

  // Render Pendapatan lines (Colon fixed at marginX + 36)
  const leftColonX = marginX + 36;
  const leftValX = marginX + boxWidth / 2 - 4;
  let pY = startY + 6;
  pendapatanItems.forEach((item) => {
    doc.text(item.label, marginX + 4, pY);
    doc.text(':', leftColonX, pY);
    doc.text(item.val, leftValX, pY, { align: 'right' });
    pY += 6.5;
  });

  // Render Pemotongan lines (Colon fixed at rx + 40)
  const rx = marginX + boxWidth / 2 + 4;
  const rightColonX = rx + 40;
  const rightValX = marginX + boxWidth - 4;
  let mY = startY + 6;
  pemotonganItems.forEach((item) => {
    doc.text(item.label, rx, mY);
    doc.text(':', rightColonX, mY);
    doc.text(item.val, rightValX, mY, { align: 'right' });
    mY += 6.5;
  });

  startY += bodyHeight;

  // ROW 5: TOTAL PENDAPATAN & TOTAL POTONGAN (Colons strictly aligned with table items)
  const subtotalH = 8.5;
  doc.rect(marginX, startY, boxWidth / 2, subtotalH);
  doc.rect(marginX + boxWidth / 2, startY, boxWidth / 2, subtotalH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL PENDAPATAN', marginX + 4, startY + 5.5);
  doc.text(':', leftColonX, startY + 5.5);
  doc.text(formatRupiahAlways(slip.totalPendapatan), leftValX, startY + 5.5, {
    align: 'right',
  });

  doc.text('TOTAL POTONGAN', rx, startY + 5.5);
  doc.text(':', rightColonX, startY + 5.5);
  doc.text(formatRupiahAlways(slip.totalPotongan), rightValX, startY + 5.5, {
    align: 'right',
  });

  startY += subtotalH;

  // ROW 6: GAJI BERSIH (Highlight Bar - Colon strictly aligned)
  const bersihH = 9.5;
  doc.rect(marginX, startY, boxWidth, bersihH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('GAJI BERSIH', marginX + 4, startY + 6.5);
  doc.text(':', leftColonX, startY + 6.5);
  doc.text(formatRupiahAlways(slip.gajiBersih), rightValX, startY + 6.5, {
    align: 'right',
  });

  startY += bersihH;

  // ROW 7: Signatures (Di Setuju oleh & Diterima Oleh) - Amply sized so text is never cut off
  const sigH = 44;
  doc.rect(marginX, startY, boxWidth / 2, sigH);
  doc.rect(marginX + boxWidth / 2, startY, boxWidth / 2, sigH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Di Setuju oleh,', marginX + 4, startY + 6);
  doc.text('Diterima Oleh,', marginX + boxWidth / 2 + 4, startY + 6);

  // Load signature & stamp image if available
  try {
    const ttdImg = await loadImageData(settings.signatureImage || '/default-ttd-stempel.png');
    if (ttdImg) {
      const maxW = 38;
      const maxH = 18;
      let drawW = maxW;
      let drawH = (ttdImg.height / ttdImg.width) * drawW;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = (ttdImg.width / ttdImg.height) * drawH;
      }
      doc.addImage(ttdImg.dataUrl, 'PNG', marginX + 4, startY + 8.5, drawW, drawH);
    }
  } catch (e) {
    // ignore
  }

  // Signatory names & dotted lines - guaranteed clear, prominent, and unclipped
  const nameY = startY + 34;
  const dotY = startY + 38;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`( ${settings.signatoryName || 'Muhamad Ridho'} )`, marginX + 4, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('..................................................................', marginX + 4, dotY);

  const empRightX = marginX + boxWidth / 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`( ${(slip.nama || 'Karyawan').toUpperCase()} )`, empRightX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('..................................................................', empRightX, dotY);

  return doc;
}

export async function downloadSlipGajiPDF(
  slip: SlipGaji,
  settings: SalarySettings
): Promise<void> {
  const doc = await generateSlipGajiPDF(slip, settings);
  const cleanName = (slip.nama || 'Karyawan').replace(/\s+/g, '_').toUpperCase();
  const cleanPeriod = (slip.periodeBulan || 'Bulan').replace(/\s+/g, '_');
  const year = slip.tahun || 2026;
  const filename = `slip_Gaji_${cleanName}_${cleanPeriod}_${year}.pdf`;
  doc.save(filename);
}

// Generate Rekapitulasi Gaji Karyawan PDF
export async function downloadRekapGajiPDF(
  slips: SlipGaji[],
  periodeFilter: string,
  settings: SalarySettings
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 14;
  let startY = 14;

  // Title & Header (Matching Logo Corporate Blue)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(26, 75, 145);
  doc.text(settings.companyName || 'CV MULIA TEKHNIK ABADI', 148.5, startY, { align: 'center' });

  startY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Jln. Letda Nasir No. 58 Desa Cikeas Udik - Kec. Gunung Putri - Kab. Bogor Kode Pos 16966',
    148.5,
    startY,
    { align: 'center' }
  );

  startY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REKAPITULASI GAJI KARYAWAN', 148.5, startY, { align: 'center' });

  startY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode: ${periodeFilter}`, 148.5, startY, { align: 'center' });

  startY += 8;

  // Table header
  const cols = [
    { title: 'No', width: 12 },
    { title: 'Slip', width: 18 },
    { title: 'Nama Karyawan', width: 52 },
    { title: 'Jabatan', width: 34 },
    { title: 'Periode', width: 26 },
    { title: 'Gaji Pokok', width: 32 },
    { title: 'Pendapatan', width: 32 },
    { title: 'Potongan', width: 32 },
    { title: 'Gaji Bersih', width: 32 },
  ];

  const totalTableWidth = cols.reduce((sum, c) => sum + c.width, 0);

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

  // Rows
  let totalPokok = 0;
  let totalPendapatan = 0;
  let totalPotongan = 0;
  let totalBersih = 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  slips.forEach((s, idx) => {
    const rowH = 7;
    doc.rect(marginX, startY, totalTableWidth, rowH);

    let cx = marginX;
    doc.text(String(idx + 1), cx + cols[0].width / 2, startY + 4.8, { align: 'center' });
    cx += cols[0].width;

    doc.text(s.nomorSlip || '-', cx + cols[1].width / 2, startY + 4.8, { align: 'center' });
    cx += cols[1].width;

    doc.text((s.nama || '').toUpperCase(), cx + 3, startY + 4.8);
    cx += cols[2].width;

    doc.text(s.jabatan || '-', cx + 3, startY + 4.8);
    cx += cols[3].width;

    doc.text(s.periodeBulan || '-', cx + cols[4].width / 2, startY + 4.8, { align: 'center' });
    cx += cols[4].width;

    doc.text(formatRupiahAlways(s.gajiPokok), cx + cols[5].width - 3, startY + 4.8, { align: 'right' });
    cx += cols[5].width;

    doc.text(formatRupiahAlways(s.totalPendapatan), cx + cols[6].width - 3, startY + 4.8, { align: 'right' });
    cx += cols[6].width;

    doc.text(formatRupiahAlways(s.totalPotongan), cx + cols[7].width - 3, startY + 4.8, { align: 'right' });
    cx += cols[7].width;

    doc.text(formatRupiahAlways(s.gajiBersih), cx + cols[8].width - 3, startY + 4.8, { align: 'right' });

    totalPokok += s.gajiPokok || 0;
    totalPendapatan += s.totalPendapatan || 0;
    totalPotongan += s.totalPotongan || 0;
    totalBersih += s.gajiBersih || 0;

    startY += rowH;
  });

  // Total Keseluruhan Row
  const footH = 8;
  doc.rect(marginX, startY, totalTableWidth, footH);
  doc.setFont('helvetica', 'bold');
  const span1 = cols[0].width + cols[1].width + cols[2].width + cols[3].width + cols[4].width;
  doc.text('TOTAL KESELURUHAN', marginX + span1 / 2, startY + 5.5, { align: 'center' });

  let cx = marginX + span1;
  doc.text(formatRupiahAlways(totalPokok), cx + cols[5].width - 3, startY + 5.5, { align: 'right' });
  cx += cols[5].width;
  doc.text(formatRupiahAlways(totalPendapatan), cx + cols[6].width - 3, startY + 5.5, { align: 'right' });
  cx += cols[6].width;
  doc.text(formatRupiahAlways(totalPotongan), cx + cols[7].width - 3, startY + 5.5, { align: 'right' });
  cx += cols[7].width;
  doc.text(formatRupiahAlways(totalBersih), cx + cols[8].width - 3, startY + 5.5, { align: 'right' });

  const safePeriod = periodeFilter.replace(/\s+/g, '_');
  doc.save(`REKAPITULASI_GAJI_MTA_${safePeriod}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
