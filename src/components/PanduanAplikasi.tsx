import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  Banknote,
  Package,
  Settings,
  Smartphone,
  RefreshCw,
  Compass,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { AppMode } from './Header.tsx';

interface PanduanAplikasiProps {
  onNavigate?: (mode: AppMode, tab?: string) => void;
  onOpenPoTracker?: () => void;
}

interface GuideStep {
  title: string;
  desc: string;
}

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  accentBg: string;
  steps: GuideStep[];
  tips?: string[];
  actionLabel?: string;
  onAction?: () => void;
}

export const PanduanAplikasi: React.FC<PanduanAplikasiProps> = ({
  onNavigate,
  onOpenPoTracker,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['alur-kerja', 'invoice']);

  const sections: GuideSection[] = useMemo(
    () => [
      {
        id: 'alur-kerja',
        title: 'Alur Kerja Utama & Navigasi HP',
        subtitle: 'Urutan kerja dari awal sampai penagihan serta cara navigasi satu tangan',
        badge: 'Mulai Di Sini',
        icon: <Compass className="w-5 h-5 text-blue-600" />,
        accentBg: 'bg-blue-50 border-blue-200',
        steps: [
          {
            title: '1. Lengkapi Menu Pengaturan Terlebih Dahulu',
            desc: 'Isi Nama Toko/Perusahaan, Alamat, Penandatangan, upload Logo, KOP Surat, Stempel/TTD, serta isi Nama Bank, Atas Nama, dan Nomor Rekening agar otomatis masuk ke semua dokumen.',
          },
          {
            title: '2. Gunakan Menu Utama di Beranda atau Tombol Menu (☰)',
            desc: 'Dari Beranda tersedia 6 menu utama: Surat Penawaran, Invoice, BAST, Slip Gaji, Upload PO (AI), dan Pengaturan. Saat berada di dalam menu, gunakan bilah bawah (Kembali, Beranda, Menu) untuk berpindah halaman dengan cepat.',
          },
          {
            title: '3. Tombol + Mengambang di Area Ibu Jari',
            desc: 'Pada halaman daftar Surat Penawaran, BAST, Invoice, serta Rekap/Karyawan Slip Gaji, tombol + Buat ... tersedia di pojok kanan bawah (tepat di atas bilah navigasi bawah) agar mudah ditekan dengan ibu jari saat memakai HP.',
          },
          {
            title: '4. Alur Dokumen Berurutan',
            desc: 'Buat Surat Penawaran (atau unggah PO lewat Upload PO AI) -> Ubah menjadi Invoice dengan 1 klik -> Buat BAST setelah pekerjaan selesai -> Pantau seluruh dokumen lewat Pelacak / Cari Nomor PO.',
          },
        ],
        tips: [
          'Jika mengetik formulir Surat Penawaran, Invoice, atau BAST lalu berpindah halaman, data otomatis tersimpan sebagai Draft sehingga tidak hilang.',
        ],
      },
      {
        id: 'penawaran',
        title: '1. Surat Penawaran & Data Client',
        subtitle: 'Membuat penawaran harga, prioritas nama tujuan, PDF, dan kirim ke Invoice',
        icon: <FileText className="w-5 h-5 text-sky-600" />,
        accentBg: 'bg-sky-50 border-sky-200',
        steps: [
          {
            title: 'Membuat Surat Penawaran Baru',
            desc: 'Buka menu Surat Penawaran -> tekan tombol + Buat Surat di kanan bawah (atau tab + Buat Surat di atas). Nomor surat otomatis dibuat mengikuti format & nomor urut dari Pengaturan.',
          },
          {
            title: 'Aturan Tampilan Nama Perusahaan & Nama Orang',
            desc: 'Jika kolom Nama Perusahaan (PT) diisi, sistem mengutamakan Nama Perusahaan tampil di kartu rekap & filter pelanggan. Jika Nama Perusahaan dikosongkan, sistem otomatis menampilkan Nama Penerima / Orang.',
          },
          {
            title: 'Impor Cepat dari Data Client',
            desc: 'Simpan data pelanggan tetap di tab Data Client agar saat membuat penawaran cukup pilih nama klien dan alamat terisi otomatis.',
          },
          {
            title: 'Rincian Item, Trade-In, Diskon & PPN',
            desc: 'Tambahkan beberapa baris uraian pekerjaan/barang, aktifkan potongan Trade-In Barang Bekas, Diskon (persen atau nominal), dan PPN sesuai kebutuhan.',
          },
          {
            title: 'Aksi pada Rekap Surat',
            desc: 'Pada daftar Rekap Surat, Anda dapat memfilter berdasarkan Bulan, Tahun, dan Pelanggan, lalu menekan Preview, Edit, Ke Invoice (konversi langsung ke Invoice), PDF, Bagikan (WhatsApp/Email), atau Hapus.',
          },
        ],
        actionLabel: 'Buka Surat Penawaran',
        onAction: onNavigate ? () => onNavigate('penawaran', 'rekap') : undefined,
      },
      {
        id: 'upload-po',
        title: '2. Upload PO (AI OCR) & Pelacak Nomor PO',
        subtitle: 'Scan foto/file PO otomatis pakai AI dan lacak riwayat per nomor PO',
        badge: 'AI OCR',
        icon: <Package className="w-5 h-5 text-amber-600" />,
        accentBg: 'bg-amber-50 border-amber-200',
        steps: [
          {
            title: 'Unggah atau Foto Dokumen PO',
            desc: 'Buka menu Upload PO, pilih file gambar/PDF PO atau ambil foto langsung lewat kamera. AI akan membaca Nomor PO, Perusahaan Pembeli, PIC, Alamat, serta rincian item dan harga.',
          },
          {
            title: 'Verifikasi & Simpan ke Riwayat PO',
            desc: 'Periksa hasil pembacaan pada formulir verifikasi (Anda juga dapat bertanya/mengoreksi melalui panel Chat AI PO), lalu tekan Simpan agar PO masuk ke riwayat dan Cloud.',
          },
          {
            title: 'Tarik Data PO ke Invoice & BAST',
            desc: 'Setelah PO tersimpan, data item dan perusahaan bisa langsung ditarik ke formulir Invoice maupun BAST tanpa perlu mengetik ulang.',
          },
          {
            title: 'Pelacak / Cari Nomor PO',
            desc: 'Buka menu samping (ikon ☰) -> pilih Pelacak / Cari Nomor PO untuk menelusuri seluruh dokumen (Surat Penawaran, BAST, dan Invoice) berdasarkan nomor PO.',
          },
        ],
        actionLabel: 'Buka Upload PO (AI)',
        onAction: onNavigate ? () => onNavigate('upload-po') : undefined,
      },
      {
        id: 'invoice',
        title: '3. Invoice Tagihan',
        subtitle: 'Cara buat Invoice cepat dan rekening bank otomatis dari Pengaturan',
        icon: <FileSpreadsheet className="w-5 h-5 text-indigo-600" />,
        accentBg: 'bg-indigo-50 border-indigo-200',
        steps: [
          {
            title: 'Membuat Invoice Baru',
            desc: 'Tekan tombol + Buat Invoice di kanan bawah (area ibu jari) atau + Buat di bagian atas daftar. Gunakan tombol Ambil dari PO atau Ambil dari Penawaran jika datanya sudah tersedia.',
          },
          {
            title: 'Impor Cepat di Dalam Formulir',
            desc: 'Pada bagian atas formulir Invoice tersedia dropdown Impor Cepat (Dari Upload PO, Dari Surat Penawaran, Dari Pelanggan). Mengetik atau memilih di kolom Nomor PO juga otomatis mengisi data PO tersimpan.',
          },
          {
            title: 'Nama Bank, Atas Nama & No. Rekening Otomatis',
            desc: 'Di formulir pembuatan/edit Invoice, input Nama Bank, Atas Nama, dan Nomor Rekening tidak ditampilkan agar formulir lebih ringkas. Ketiganya otomatis diambil dari menu Pengaturan dan tetap muncul lengkap saat Preview, Download PDF, maupun Bagikan ke WhatsApp.',
          },
          {
            title: 'Status Pembayaran, Filter & Rekap PDF',
            desc: 'Pilih status Belum Lunas, Lunas, atau Draft. Saring daftar melalui tab Semua, Bulan Ini, Lunas, atau Belum Lunas, dan unduh Rekap PDF kapan saja.',
          },
        ],
        tips: [
          'Jika ingin mengubah rekening bank pada Invoice, cukup ubah di menu Pengaturan lalu simpan — seluruh Invoice baru & hasil cetak akan mengikuti data tersebut.',
        ],
        actionLabel: 'Buka Menu Invoice',
        onAction: onNavigate ? () => onNavigate('invoice') : undefined,
      },
      {
        id: 'bast',
        title: '4. BAST (Berita Acara Serah Terima)',
        subtitle: 'Membuat berita acara serah terima pekerjaan dari PO atau Penawaran',
        icon: <FileCheck2 className="w-5 h-5 text-emerald-600" />,
        accentBg: 'bg-emerald-50 border-emerald-200',
        steps: [
          {
            title: 'Membuat BAST Baru',
            desc: 'Tekan tombol + Buat BAST di pojok kanan bawah atau tombol Buat BAST di bagian atas daftar.',
          },
          {
            title: 'Tarik Data Pihak Pertama & Pekerjaan',
            desc: 'Gunakan Impor Cepat dari Upload PO, Surat Penawaran, atau Data Pelanggan untuk mengisi data Pihak Pertama (Klien), Nomor PO, dan daftar barang/jasa secara otomatis.',
          },
          {
            title: 'Pihak Kedua, Periode & Keterangan',
            desc: 'Data Pihak Kedua (perusahaan Anda) otomatis terisi dari Pengaturan. Lengkapi tanggal mulai/selesai pelaksanaan, kota, keterangan item (misal: Sesuai), dan status Draft atau Selesai.',
          },
          {
            title: 'Cetak, Duplikat & Bagikan',
            desc: 'Setiap kartu BAST menyediakan tombol VIEW PDF, Edit, Duplikat, Download PDF, Bagikan (WhatsApp), dan Hapus. Anda juga bisa mengunduh Download Rekap PDF.',
          },
        ],
        actionLabel: 'Buka Menu BAST',
        onAction: onNavigate ? () => onNavigate('bast') : undefined,
      },
      {
        id: 'slip-gaji',
        title: '5. Slip Gaji & Data Karyawan',
        subtitle: 'Kelola data karyawan, hitung lembur otomatis, rekap PDF dan Excel',
        icon: <Banknote className="w-5 h-5 text-green-600" />,
        accentBg: 'bg-green-50 border-green-200',
        steps: [
          {
            title: 'Kelola Data Karyawan',
            desc: 'Buka tab Karyawan -> tekan Tambah Karyawan untuk menyimpan Nama, Jabatan, NIK, Nomor Slip Default, Gaji Pokok, dan No. WhatsApp. Tekan tombol Buat Slip pada kartu karyawan untuk langsung mengisi slip gajinya.',
          },
          {
            title: 'Membuat Slip Gaji',
            desc: 'Di tab Buat Slip (atau tekan tombol + Buat Slip di kanan bawah saat berada di tab Rekap/Karyawan), pilih karyawan, periode bulan & tahun, jumlah jam lembur (dikalikan otomatis dengan Tarif Lembur/Jam di Pengaturan), tunjangan, bonus, serta potongan.',
          },
          {
            title: 'Simpan, Preview & Ekspor Rekap Gaji',
            desc: 'Setelah disimpan, slip gaji langsung tampil untuk dicetak atau dikirim. Buka tab Rekap untuk melihat total gaji bersih per periode dan ekspor ke Excel, PDF, atau Cetak.',
          },
        ],
        actionLabel: 'Buka Slip Gaji',
        onAction: onNavigate ? () => onNavigate('gaji') : undefined,
      },
      {
        id: 'pengaturan',
        title: '6. Pengaturan, Logo/KOP/Stempel & Backup',
        subtitle: 'Pusat pengaturan identitas perusahaan, rekening bank, dan cadangan data',
        icon: <Settings className="w-5 h-5 text-slate-700" />,
        accentBg: 'bg-slate-100 border-slate-300',
        steps: [
          {
            title: 'Logo, KOP & Stempel',
            desc: '1. Logo dipakai pada header aplikasi, Invoice, dan Slip Gaji. 2. KOP Surat khusus dipakai pada header dokumen Surat Penawaran A4. 3. Stempel / TTD dipakai pada area tanda tangan dokumen resmi.',
          },
          {
            title: 'Nama Toko / Perusahaan & Penomoran',
            desc: 'Atur Nama Toko/Perusahaan, Alamat, Email, No. Telepon, Kota, Nama Penandatangan, Format Nomor Surat, Nomor Urut Berikutnya, PPN Default (%), dan Tarif Lembur/Jam.',
          },
          {
            title: 'Rekening Bank Perusahaan',
            desc: 'Isi Nama Bank, Atas Nama, dan Nomor Rekening. Data ini otomatis dipakai oleh seluruh dokumen Invoice saat pratinjau, cetak PDF, maupun kirim WhatsApp.',
          },
          {
            title: 'Backup & Restore Data',
            desc: 'Gunakan fitur Backup Data untuk mengunduh seluruh database menjadi file cadangan, dan Restore Data untuk memulihkan data jika berganti HP atau browser.',
          },
        ],
        actionLabel: 'Buka Pengaturan',
        onAction: onNavigate ? () => onNavigate('penawaran', 'pengaturan') : undefined,
      },
      {
        id: 'sync-pwa',
        title: '7. Sinkronisasi Cloud, Offline & Update Aplikasi',
        subtitle: 'Cara kerja sinkronisasi perangkat, pasang ke layar utama, dan update versi',
        icon: <RefreshCw className="w-5 h-5 text-cyan-600" />,
        accentBg: 'bg-cyan-50 border-cyan-200',
        steps: [
          {
            title: 'Sinkronisasi Otomatis & Mode Offline',
            desc: 'Semua data tersimpan aman di penyimpanan perangkat sehingga tetap bisa dibuka walau sinyal lemah/offline. Saat terhubung internet, data tersinkron otomatis ke Cloud antar perangkat.',
          },
          {
            title: 'Pasang di Layar Utama HP (PWA)',
            desc: 'Di Android Chrome: tekan tombol Install di header atau pilih "Tambahkan ke Layar Utama" di menu browser. Di iPhone Safari: tekan ikon Share -> "Add to Home Screen".',
          },
          {
            title: 'Memperbarui Aplikasi ke Versi Terbaru',
            desc: 'Ketika versi baru tersedia, muncul jendela notifikasi "Update Aplikasi Tersedia". Tekan tombol Install Update agar aplikasi langsung memuat versi terbaru tanpa menghapus data yang sudah tersimpan.',
          },
        ],
        tips: [
          'Jika baru saja membuka aplikasi dari layar utama HP dan ada pembaruan, tunggu beberapa detik hingga jendela konfirmasi update muncul lalu tekan Install Update.',
        ],
      },
    ],
    [onNavigate]
  );

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.subtitle.toLowerCase().includes(q) ||
        sec.steps.some(
          (st) =>
            st.title.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q)
        ) ||
        (sec.tips && sec.tips.some((t) => t.toLowerCase().includes(q)))
    );
  }, [sections, searchTerm]);

  const toggleSection = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allExpanded =
    filteredSections.length > 0 &&
    filteredSections.every((sec) => openIds.includes(sec.id));

  const handleToggleAll = () => {
    if (allExpanded) {
      setOpenIds([]);
    } else {
      setOpenIds(filteredSections.map((s) => s.id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pb-32 space-y-3.5 text-slate-800">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-[#0b223d] via-blue-900 to-sky-800 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-800/50 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                Panduan Penggunaan Aplikasi
              </h2>
              <p className="text-xs text-sky-200 mt-0.5 leading-snug">
                Penjelasan lengkap seluruh fitur Adm MTA sesuai kondisi aplikasi saat ini
              </p>
            </div>
          </div>

          {onOpenPoTracker && (
            <button
              type="button"
              onClick={onOpenPoTracker}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold transition shrink-0"
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>Cek Nomor PO</span>
            </button>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 text-sky-200 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari panduan (misal: invoice, bank, bast, po, slip gaji, update)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder:text-sky-200/75 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/15"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-sky-200 hover:text-white p-0.5"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-sky-100">
            <Smartphone className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>Tekan judul bagian di bawah untuk membuka atau menutup detail</span>
          </div>
          <button
            type="button"
            onClick={handleToggleAll}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-bold text-white shrink-0 transition"
          >
            {allExpanded ? 'Tutup Semua' : 'Buka Semua'}
          </button>
        </div>
      </div>

      {/* GUIDE ACCORDION CARDS */}
      {filteredSections.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs space-y-2">
          <BookOpen className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            Topik panduan tidak ditemukan
          </p>
          <p className="text-xs text-slate-500">
            Coba kata kunci lain atau hapus pencarian untuk melihat semua panduan.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSections.map((section) => {
            const isOpen = Boolean(searchTerm.trim()) || openIds.includes(section.id);
            return (
              <div
                key={section.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${section.accentBg}`}
                    >
                      {section.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-[#0b223d] leading-snug">
                          {section.title}
                        </h3>
                        {section.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-100 space-y-2.5 bg-slate-50/40">
                    <div className="space-y-2 pt-2">
                      {section.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1"
                        >
                          <h4 className="font-bold text-xs text-slate-900 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                            <span>{step.title}</span>
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed pl-5">
                            {step.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    {section.tips && section.tips.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                        <p className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide">
                          Catatan Penting
                        </p>
                        {section.tips.map((tip, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-amber-900/90 leading-relaxed"
                          >
                            • {tip}
                          </p>
                        ))}
                      </div>
                    )}

                    {section.actionLabel && section.onAction && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={section.onAction}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white text-xs font-bold shadow-xs transition"
                        >
                          <span>{section.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
