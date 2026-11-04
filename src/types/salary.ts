export interface Karyawan {
  id: string;
  nama: string;
  jabatan: string; // Helper, Teknisi, Kasir, Admin, dll
  nik: string; // e.g. "3201..." atau "-"
  nomorSlipDefault: string; // e.g. "08", "010", "012"
  gajiPokok: number; // e.g. 2400000
  uangMakanHarian?: number;
  telepon?: string;
  createdAt: string;
}

export interface SlipGaji {
  id: string;
  nomorSlip: string; // e.g. "08", "012"
  tanggal: string; // YYYY-MM-DD or DD/MM/YYYY e.g. "2026-11-01"
  periodeBulan: string; // e.g. "Oktober", "November", dll
  tahun: number; // e.g. 2026

  // Karyawan
  karyawanId?: string;
  nama: string;
  jabatan: string;
  nik: string;

  // Pendapatan
  gajiPokok: number;
  uangMakan: number;
  transport: number;
  thr: number;
  bonus: number;
  lemburan: number;
  jamLembur: number;
  masukKerja: number; // hari

  // Pemotongan
  pinjaman: number; // kasbon
  bpjsKetenagakerjaan: number;
  pph21: number;
  lainLain: number;
  potonganUangMakan: number; // Uang Makan (Potongan)

  // Totals
  totalPendapatan: number;
  totalPotongan: number;
  gajiBersih: number;

  createdAt: string;
  updatedAt: string;
}

export interface SalarySettings {
  companyName: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  signatoryName: string;
  logoImage?: string; // Pure logo image (used in Slip Gaji header)
  kopImage?: string;
  signatureImage: string;
  stampImage: string;
  tarifLemburPerJam: number; // default 12000
}
