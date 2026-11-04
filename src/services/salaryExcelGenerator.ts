import * as XLSX from 'xlsx';
import type { SlipGaji } from '../types/salary.ts';

export function exportRekapGajiToExcel(
  slips: SlipGaji[],
  periodeFilter: string = 'Semua Periode'
): void {
  const rows = slips.map((s, idx) => ({
    No: idx + 1,
    'Nomor Slip': s.nomorSlip,
    'Nama Karyawan': s.nama,
    Jabatan: s.jabatan,
    NIK: s.nik || '-',
    Periode: `${s.periodeBulan} ${s.tahun}`,
    'Tanggal Slip': s.tanggal,
    'Gaji Pokok': s.gajiPokok,
    'Uang Makan': s.uangMakan,
    Transport: s.transport,
    THR: s.thr,
    Bonus: s.bonus,
    Lemburan: s.lemburan,
    'Jam Lembur': s.jamLembur,
    'Hari Masuk': s.masukKerja,
    'Total Pendapatan': s.totalPendapatan,
    Pinjaman: s.pinjaman,
    'BPJS Ketenagakerjaan': s.bpjsKetenagakerjaan,
    PPh21: s.pph21,
    'Lain-lain': s.lainLain,
    'Potongan Uang Makan': s.potonganUangMakan,
    'Total Potongan': s.totalPotongan,
    'Gaji Bersih': s.gajiBersih,
  }));

  // Totals row
  const totalPokok = slips.reduce((sum, s) => sum + (s.gajiPokok || 0), 0);
  const totalPendapatan = slips.reduce((sum, s) => sum + (s.totalPendapatan || 0), 0);
  const totalPotongan = slips.reduce((sum, s) => sum + (s.totalPotongan || 0), 0);
  const totalBersih = slips.reduce((sum, s) => sum + (s.gajiBersih || 0), 0);

  rows.push({
    No: 0,
    'Nomor Slip': '',
    'Nama Karyawan': 'TOTAL KESELURUHAN',
    Jabatan: '',
    NIK: '',
    Periode: '',
    'Tanggal Slip': '',
    'Gaji Pokok': totalPokok,
    'Uang Makan': 0,
    Transport: 0,
    THR: 0,
    Bonus: 0,
    Lemburan: 0,
    'Jam Lembur': 0,
    'Hari Masuk': 0,
    'Total Pendapatan': totalPendapatan,
    Pinjaman: 0,
    'BPJS Ketenagakerjaan': 0,
    PPh21: 0,
    'Lain-lain': 0,
    'Potongan Uang Makan': 0,
    'Total Potongan': totalPotongan,
    'Gaji Bersih': totalBersih,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Gaji MTA');

  const safePeriod = periodeFilter.replace(/\s+/g, '_');
  const filename = `REKAPITULASI_GAJI_MTA_${safePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
