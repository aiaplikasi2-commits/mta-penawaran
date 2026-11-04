export interface BastItem {
  id: string;
  name: string;
  keterangan: string; // e.g. "Sesuai", "Baik", or custom
}

export interface BastData {
  id: string;
  nomorBast: string; // e.g. "BAST/001/XI/2026"
  nomorPo: string; // e.g. "KEPO123"
  tanggalBast: string; // YYYY-MM-DD e.g. "2026-11-02"
  hariTerbilang?: string; // e.g. "Senin tanggal Dua Bulan November Tahun Dua Ribu Dua Puluh Enam"

  // Pihak Pertama (Klien) - Isian opsional (tidak wajib)
  pihakPertamaNama?: string; // e.g. "Siska"
  pihakPertamaJabatan?: string; // e.g. "Purchasing Manager"
  pihakPertamaPerusahaan?: string; // e.g. "PT. KANSAI PAINT INDONESIA"
  pihakPertamaAlamat?: string; // e.g. "Blok DD-7 & DD-8 Kawasan Industri MM2100 Cikarang Barat, Kab. Bekasi, 17847"

  // Pihak Kedua (Pelaksana / MTA)
  pihakKeduaNama: string; // e.g. "MUHAMAD RIDHO"
  pihakKeduaAlamat: string; // e.g. "Jln. Letda Nasir No. 58 Bogor, 16966 Kel. Cikeas Udik Kec. Gunung Putri Bogor"

  // Rincian Pekerjaan
  items: BastItem[];

  // Pelaksanaan
  tanggalMulai: string; // YYYY-MM-DD e.g. "2026-11-02"
  tanggalSelesai: string; // YYYY-MM-DD e.g. "2026-11-02"
  kota: string; // e.g. "Bogor"

  status: 'Draft' | 'Selesai';
  letterIdRef?: string; // Optional reference to a Surat Penawaran
  createdAt: string;
  updatedAt: string;
}
