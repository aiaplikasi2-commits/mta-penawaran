import { jsPDF } from 'jspdf';
import type { BastData } from '../types/bast.ts';
import type { CompanySettings } from '../types/index.ts';

// Helper to format date into Indonesian: "2 November 2026"
const BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatBastDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${BULAN_INDO[d.getMonth()]} ${d.getFullYear()}`;
}

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

export async function generateBastPDF(
  bast: BastData,
  settings: CompanySettings
): Promise<jsPDF> {
  // A4 portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginLeft = 18;
  const marginRight = 18;
  const contentWidth = pageWidth - marginLeft - marginRight; // 174mm
  let currentY = 10;

  // 1. KOP SURAT RESMI MTA (Header A4)
  if (settings.kopImage) {
    try {
      const kopData = await loadImageData(settings.kopImage);
      if (kopData) {
        const targetWidth = contentWidth;
        const aspectRatio = kopData.width / kopData.height;
        const targetHeight = Math.min(32, targetWidth / aspectRatio);

        doc.addImage(kopData.dataUrl, 'PNG', marginLeft, currentY, targetWidth, targetHeight);
        currentY += targetHeight + 2;
      }
    } catch {
      // Fallback text if image fails
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(26, 75, 145);
      doc.text(settings.companyName || 'CV. MULIA TEKHNIK ABADI', pageWidth / 2, currentY + 6, {
        align: 'center',
      });
      currentY += 12;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 75, 145);
    doc.text(settings.companyName || 'CV. MULIA TEKHNIK ABADI', pageWidth / 2, currentY + 6, {
      align: 'center',
    });
    currentY += 10;
  }

  // Only draw default double line if NO KOP image is uploaded (uploaded KOP already includes company line)
  if (!settings.kopImage) {
    doc.setDrawColor(20, 50, 90);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);
    currentY += 1.2;
    doc.setLineWidth(0.25);
    doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);
    currentY += 6;
  } else {
    currentY += 4;
  }

  // 2. JUDUL DOKUMEN BAST (Underlined & Centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  const titleText = 'BERITA ACARA SERAH TERIMA';
  doc.text(titleText, pageWidth / 2, currentY, { align: 'center' });

  // Draw underline under title
  const titleWidth = doc.getTextWidth(titleText);
  doc.setLineWidth(0.3);
  doc.line((pageWidth - titleWidth) / 2, currentY + 0.8, (pageWidth + titleWidth) / 2, currentY + 0.8);
  currentY += 5;

  // Nomor BAST
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Nomor : ${bast.nomorBast}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // 3. PARAGRAF PEMBUKA (HARI & TANGGAL TERBILANG)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const hariKata = bast.hariTerbilang || 'Senin tanggal Dua Bulan November Tahun Dua Ribu Dua Puluh Enam';
  const openingText = `Pada hari ini ${hariKata}, kami yang bertanda tangan di bawah ini :`;
  const splitOpening = doc.splitTextToSize(openingText, contentWidth);
  doc.text(splitOpening, marginLeft, currentY);
  currentY += splitOpening.length * 4.5 + 2;

  // 4. PIHAK PERTAMA (Hanya tampilkan bidang yang diisi)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Yang disebut Pihak Pertama,', marginLeft, currentY);
  currentY += 4.5;

  const colonOffset = 28;
  const valueOffset = 31;
  const colValWidth = contentWidth - valueOffset;

  interface PihakRow {
    label: string;
    value: string;
    isBold?: boolean;
    isAddress?: boolean;
  }

  const pihak1Rows: PihakRow[] = [];
  if (bast.pihakPertamaNama && bast.pihakPertamaNama.trim()) {
    pihak1Rows.push({ label: 'Nama', value: bast.pihakPertamaNama.trim() });
  }
  if (bast.pihakPertamaJabatan && bast.pihakPertamaJabatan.trim()) {
    pihak1Rows.push({ label: 'Jabatan', value: bast.pihakPertamaJabatan.trim() });
  }
  if (bast.pihakPertamaPerusahaan && bast.pihakPertamaPerusahaan.trim()) {
    pihak1Rows.push({
      label: 'Perusahaan',
      value: bast.pihakPertamaPerusahaan.trim().toUpperCase(),
      isBold: true,
    });
  }
  if (bast.pihakPertamaAlamat && bast.pihakPertamaAlamat.trim()) {
    pihak1Rows.push({
      label: 'Alamat',
      value: bast.pihakPertamaAlamat.trim().replace(/\n/g, ', '),
      isAddress: true,
    });
  }

  if (pihak1Rows.length === 0) {
    currentY += 1;
  } else {
    for (const r of pihak1Rows) {
      doc.setFont('helvetica', 'normal');
      doc.text(r.label, marginLeft, currentY);
      doc.text(':', marginLeft + colonOffset, currentY);

      if (r.isBold) {
        doc.setFont('helvetica', 'bold');
      }

      if (r.isAddress) {
        const splitAlamat1 = doc.splitTextToSize(r.value, colValWidth);
        doc.text(splitAlamat1, marginLeft + valueOffset, currentY);
        currentY += splitAlamat1.length * 4.2 + 1;
      } else {
        doc.text(r.value, marginLeft + valueOffset, currentY);
        currentY += 4.5;
      }
      doc.setFont('helvetica', 'normal');
    }
    currentY += 1.5;
  }

  // 5. PIHAK KEDUA
  doc.text('Selanjutnya disebut Pihak Kedua,', marginLeft, currentY);
  currentY += 4.5;

  // Nama Pihak Kedua
  doc.text('Nama', marginLeft, currentY);
  doc.text(':', marginLeft + colonOffset, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text((bast.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO').toUpperCase(), marginLeft + valueOffset, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 4.5;

  // Alamat Pihak Kedua
  doc.text('Alamat', marginLeft, currentY);
  doc.text(':', marginLeft + colonOffset, currentY);
  const pihak2Alamat = bast.pihakKeduaAlamat || settings.address || 'Jln. Letda Nasir No. 58 Bogor, 16966 Kel. Cikeas Udik Kec. Gunung Putri Bogor';
  const splitAlamat2 = doc.splitTextToSize(pihak2Alamat.replace(/\n/g, ', '), colValWidth);
  doc.text(splitAlamat2, marginLeft + valueOffset, currentY);
  currentY += splitAlamat2.length * 4.2 + 3;

  // 6. KETERANGAN PO SELESAI
  const poText = `Dengan ini menerangkan bahwa pekerjaan dengan nomor PO ${bast.nomorPo || '-'} telah selesai dikerjakan dengan rincian sebagai berikut :`;
  const splitPo = doc.splitTextToSize(poText, contentWidth);
  doc.text(splitPo, marginLeft, currentY);
  currentY += splitPo.length * 4.2 + 2.5;

  // 7. TABEL RINCIAN PEKERJAAN
  const colWNo = 14;
  const colWKeterangan = 34;
  const colWDesc = contentWidth - colWNo - colWKeterangan;

  // Header Table
  const tableHeaderH = 7;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, currentY, contentWidth, tableHeaderH);
  doc.line(marginLeft + colWNo, currentY, marginLeft + colWNo, currentY + tableHeaderH);
  doc.line(marginLeft + colWNo + colWDesc, currentY, marginLeft + colWNo + colWDesc, currentY + tableHeaderH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('No', marginLeft + colWNo / 2, currentY + 4.8, { align: 'center' });
  doc.text('Nama Barang / Jasa', marginLeft + colWNo + colWDesc / 2, currentY + 4.8, { align: 'center' });
  doc.text('Keterangan', marginLeft + colWNo + colWDesc + colWKeterangan / 2, currentY + 4.8, { align: 'center' });
  currentY += tableHeaderH;

  // Rows Table
  const items = bast.items && bast.items.length > 0 ? bast.items : [{ id: '1', name: '-', keterangan: 'Sesuai' }];
  items.forEach((item, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitName = doc.splitTextToSize(item.name || '-', colWDesc - 6);
    const rowH = Math.max(7, splitName.length * 4.5 + 2.5);

    doc.rect(marginLeft, currentY, contentWidth, rowH);
    doc.line(marginLeft + colWNo, currentY, marginLeft + colWNo, currentY + rowH);
    doc.line(marginLeft + colWNo + colWDesc, currentY, marginLeft + colWNo + colWDesc, currentY + rowH);

    // No
    doc.text(String(idx + 1), marginLeft + colWNo / 2, currentY + 4.8, { align: 'center' });

    // Nama Barang / Jasa
    doc.text(splitName, marginLeft + colWNo + 3, currentY + 4.5);

    // Keterangan (Italic, matching reference)
    doc.setFont('helvetica', 'italic');
    doc.text(item.keterangan || 'Sesuai', marginLeft + colWNo + colWDesc + colWKeterangan / 2, currentY + 4.8, {
      align: 'center',
    });
    doc.setFont('helvetica', 'normal');

    currentY += rowH;
  });

  currentY += 4.5;

  // 8. PARAGRAF PELAKSANAAN & SERAH TERIMA
  const tglMulaiStr = formatBastDate(bast.tanggalMulai || bast.tanggalBast);
  const tglSelesaiStr = formatBastDate(bast.tanggalSelesai || bast.tanggalBast);
  const executionText = `Telah selesai dikerjakan oleh Pihak Kedua yang dimulai pada tanggal ${tglMulaiStr} dan selesai pada tanggal ${tglSelesaiStr} dan selanjutnya diserahkan kepada Pihak Pertama dalam kondisi baik dan berfungsi.`;
  const splitExec = doc.splitTextToSize(executionText, contentWidth);
  doc.text(splitExec, marginLeft, currentY);
  currentY += splitExec.length * 4.2 + 3;

  // 9. PARAGRAF PENUTUP
  const closingText = 'Demikian Berita Acara Serah Terima ini dibuat untuk dapat digunakan sebagaimana mestinya.';
  doc.text(closingText, marginLeft, currentY);
  currentY += 6;

  // 10. TANDA TANGAN (KIRI: Pihak Pertama | KANAN: Pihak Kedua - Berjauhan & Rapi)
  const kotaStr = bast.kota || settings.city || 'Bogor';
  const tglBastStr = formatBastDate(bast.tanggalBast);
  const leftX = marginLeft + 2;
  const rightX = marginLeft + contentWidth - 52;

  // Tanggal & Judul Pihak
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${kotaStr}, ${tglBastStr}`, leftX, currentY);
  currentY += 4.5;

  doc.text('Pihak Pertama', leftX, currentY);
  doc.text('Pihak Kedua', rightX, currentY);
  currentY += 3;

  // Gambar Tanda Tangan & Stempel Pihak Kedua
  try {
    const ttdImg = await loadImageData(settings.signatureImage || '/default-ttd-stempel.png');
    if (ttdImg) {
      doc.addImage(ttdImg.dataUrl, 'PNG', rightX - 2, currentY, 36, 17);
    }
  } catch {
    // ignore
  }

  currentY += 19;

  // Nama Penandatangan Pihak Pertama
  const p1Nama = (bast.pihakPertamaNama || '').trim();
  const p1Jabatan = (bast.pihakPertamaJabatan || '').trim();
  const p1Perusahaan = (bast.pihakPertamaPerusahaan || '').trim();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);

  if (p1Nama) {
    doc.text(p1Nama.toUpperCase(), leftX, currentY);
  } else if (p1Perusahaan) {
    doc.text(p1Perusahaan.toUpperCase(), leftX, currentY);
  } else {
    doc.text('( .................................... )', leftX, currentY);
  }

  doc.text((bast.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO').toUpperCase(), rightX, currentY);
  currentY += 4.2;

  // Keterangan / Perusahaan / Jabatan Pihak Pertama di bawah tanda tangan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  if (p1Nama) {
    const subParts = [p1Jabatan, p1Perusahaan].filter(Boolean);
    if (subParts.length > 0) {
      doc.text(subParts.join(' - ').toUpperCase(), leftX, currentY);
    }
  } else if (p1Jabatan && p1Perusahaan) {
    doc.text(p1Jabatan.toUpperCase(), leftX, currentY);
  }

  return doc;
}

export async function downloadBastPDF(
  bast: BastData,
  settings: CompanySettings
): Promise<void> {
  const doc = await generateBastPDF(bast, settings);
  const cleanNomor = (bast.nomorBast || 'BAST').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanPt = (bast.pihakPertamaPerusahaan || 'KLIEN').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanNomor}_${cleanPt}.pdf`;
  doc.save(filename);
}

// Rekap BAST PDF - Efisien: HANYA No, Nomor BAST, Nomor PO, Tanggal & Nama PT
export async function downloadRekapBastPDF(
  basts: BastData[],
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
    settings.address || 'Jln. Letda Nasir No. 58 Desa Cikeas Udik - Kec. Gunung Putri - Kab. Bogor Kode Pos 16966',
    105,
    startY,
    { align: 'center' }
  );

  startY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('REKAPITULASI DOKUMEN BAST', 105, startY, { align: 'center' });

  startY += 7;

  // 5 Kolom Sesuai Permintaan: No, Nomor BAST, Nomor PO, Tanggal, Nama PT
  const cols = [
    { title: 'No', width: 12 },
    { title: 'Nomor BAST', width: 45 },
    { title: 'Nomor PO', width: 35 },
    { title: 'Tanggal', width: 30 },
    { title: 'Nama PT (Perusahaan Klien)', width: 58 },
  ];

  const totalTableWidth = cols.reduce((sum, c) => sum + c.width, 0); // 180mm
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

  basts.forEach((b, idx) => {
    const rowH = 7;
    doc.rect(marginX, startY, totalTableWidth, rowH);

    let cx = marginX;
    // 1. No
    doc.text(String(idx + 1), cx + cols[0].width / 2, startY + 4.8, { align: 'center' });
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[0].width;

    // 2. Nomor BAST
    doc.setFont('helvetica', 'bold');
    doc.text(b.nomorBast || '-', cx + 3, startY + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[1].width;

    // 3. Nomor PO
    doc.text(b.nomorPo || '-', cx + cols[2].width / 2, startY + 4.8, { align: 'center' });
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[2].width;

    // 4. Tanggal
    doc.text(formatBastDate(b.tanggalBast), cx + cols[3].width / 2, startY + 4.8, { align: 'center' });
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[3].width;

    // 5. Nama PT
    doc.setFont('helvetica', 'bold');
    doc.text((b.pihakPertamaPerusahaan || '-').toUpperCase(), cx + 3, startY + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.line(cx, startY, cx, startY + rowH);
    cx += cols[4].width;

    doc.line(cx, startY, cx, startY + rowH);

    startY += rowH;

    // Add page if needed
    if (startY > 275) {
      doc.addPage();
      startY = 15;
    }
  });

  doc.save(`REKAP_BAST_MTA_${new Date().toISOString().slice(0, 10)}.pdf`);
}
