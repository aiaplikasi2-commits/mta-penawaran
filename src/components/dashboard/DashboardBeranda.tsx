import React, { useState } from 'react';
import {
  ChevronRight,
  Menu,
  X,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Banknote,
  Settings,
  Users,
  Package,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import type { CompanySettings, LetterData, Customer } from '../../types/index.ts';
import type { BastData } from '../../types/bast.ts';
import type { InvoiceData } from '../../types/invoice.ts';
import { SyncStatusBar } from '../SyncStatusBar.tsx';

interface DashboardBerandaProps {
  settings: CompanySettings;
  letters: LetterData[];
  basts: BastData[];
  invoices: InvoiceData[];
  customers: Customer[];
  onSelectModule: (mode: 'penawaran' | 'bast' | 'invoice' | 'gaji' | 'upload-po') => void;
  onOpenPengaturan: () => void;
  onOpenClientData: () => void;
  onOpenPoTracker: () => void;
  onOpenPanduan?: () => void;
  onOpenSidebar?: () => void;
  onToast?: (msg: string) => void;
}

export const DashboardBeranda: React.FC<DashboardBerandaProps> = ({
  settings,
  letters,
  basts,
  invoices,
  customers,
  onSelectModule,
  onOpenPengaturan,
  onOpenClientData,
  onOpenPoTracker,
  onOpenPanduan,
  onOpenSidebar,
  onToast,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Unique POs count
  const allPos = new Set<string>();
  letters.forEach((l) => { if (l.subject) allPos.add(l.subject); });
  basts.forEach((b) => { if (b.nomorPo) allPos.add(b.nomorPo); });
  invoices.forEach((i) => { if (i.nomorPo) allPos.add(i.nomorPo); });

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-50 min-h-screen pb-10 text-slate-800 antialiased shadow-sm relative overflow-x-hidden font-sans">
      {/* 1. TOP HEADER - EXACT MATCH TO SCREENSHOT */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/80 shadow-2xs">
        {/* Hamburger Menu on Left */}
        <button
          type="button"
          onClick={() => (onOpenSidebar ? onOpenSidebar() : setDrawerOpen(true))}
          className="p-1.5 text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition"
          title="Menu Navigasi"
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Center Logo & Title */}
        <div className="flex items-center gap-2">
          {/* Logo Icon (House with Snowflake) */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 p-1 flex items-center justify-center shadow-xs shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <line x1="12" y1="9" x2="12" y2="17" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="9" y1="10" x2="15" y2="16" />
              <line x1="9" y1="16" x2="15" y2="10" />
            </svg>
          </div>

          <div className="text-left">
            <h1 className="font-black text-sm tracking-tight text-[#0b223d] leading-none uppercase">
              {settings.companyName || 'CV MULIA TEKHNIK ABADI'}
            </h1>
            <p className="text-[10px] text-sky-700 font-semibold tracking-tight italic mt-0.5 leading-none">
              Solusi Teknikal Untuk Kenyamanan Anda
            </p>
          </div>
        </div>

        {/* Right side: Sync Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SyncStatusBar onToast={onToast || (() => {})} />
        </div>
      </header>

      {/* 2. HERO BANNER - HVAC TECHNICIAN (MATCHING SCREENSHOT) */}
      <div className="px-3 pt-3">
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-gradient-to-r from-sky-100 via-blue-50 to-white">
          <img
            src="/hvac-hero-banner.png"
            alt="CV Mulia Tekhnik Abadi - HVAC Service"
            className="w-full h-auto object-cover max-h-[190px] sm:max-h-[220px]"
          />
        </div>
      </div>

      {/* 4. MENU UTAMA (2 COLUMNS X 3 ROWS + PANDUAN) */}
      <div className="mx-3 mt-3 p-2.5 sm:p-3 rounded-[26px] bg-gradient-to-b from-[#e8f4ff] via-[#dff0ff] to-[#d6ebff] border border-sky-200/80 shadow-inner">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* CARD 1: SURAT PENAWARAN */}
          <button
            type="button"
            onClick={() => onSelectModule('penawaran')}
            className="group relative bg-gradient-to-br from-white via-[#fcfdff] to-[#eff7ff] hover:to-[#e5f2ff] active:scale-[0.98] transition-all duration-150 rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between text-left min-h-[124px] sm:min-h-[136px] overflow-hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute -bottom-3 -left-3 w-14 h-14 text-sky-300/35"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
            </svg>

            <div className="relative z-10 flex items-start gap-2 sm:gap-2.5">
              <img
                src="/menu-icon-penawaran.png"
                alt="Surat Penawaran"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="font-extrabold text-[13px] sm:text-[14px] text-[#0f172a] leading-tight tracking-tight">
                  Surat Penawaran
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.35] mt-1 font-medium">
                  Buat dan kirim surat penawaran resmi dengan mudah.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end mt-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>

          {/* CARD 2: INVOICE */}
          <button
            type="button"
            onClick={() => onSelectModule('invoice')}
            className="group relative bg-gradient-to-br from-white via-[#fcfdff] to-[#eff7ff] hover:to-[#e5f2ff] active:scale-[0.98] transition-all duration-150 rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between text-left min-h-[124px] sm:min-h-[136px] overflow-hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute -bottom-3 -left-3 w-14 h-14 text-sky-300/35"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
            </svg>

            <div className="relative z-10 flex items-start gap-2 sm:gap-2.5">
              <img
                src="/menu-icon-invoice.png"
                alt="Invoice"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="font-extrabold text-[13px] sm:text-[14px] text-[#0f172a] leading-tight tracking-tight">
                  Invoice
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.35] mt-1 font-medium">
                  Kelola tagihan dan lacak pembayaran client.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end mt-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>

          {/* CARD 3: BAST */}
          <button
            type="button"
            onClick={() => onSelectModule('bast')}
            className="group relative bg-gradient-to-br from-white via-[#fcfdff] to-[#eff7ff] hover:to-[#e5f2ff] active:scale-[0.98] transition-all duration-150 rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between text-left min-h-[124px] sm:min-h-[136px] overflow-hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute -bottom-3 -left-3 w-14 h-14 text-sky-300/35"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
            </svg>

            <div className="relative z-10 flex items-start gap-2 sm:gap-2.5">
              <img
                src="/menu-icon-bast.png"
                alt="BAST"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="font-extrabold text-[13px] sm:text-[14px] text-[#0f172a] leading-tight tracking-tight">
                  BAST
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.35] mt-1 font-medium">
                  Berita Acara Serah Terima pekerjaan.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end mt-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>

          {/* CARD 4: SLIP GAJI */}
          <button
            type="button"
            onClick={() => onSelectModule('gaji')}
            className="group relative bg-gradient-to-br from-white via-[#fcfdff] to-[#eff7ff] hover:to-[#e5f2ff] active:scale-[0.98] transition-all duration-150 rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between text-left min-h-[124px] sm:min-h-[136px] overflow-hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute -bottom-3 -left-3 w-14 h-14 text-sky-300/35"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
            </svg>

            <div className="relative z-10 flex items-start gap-2 sm:gap-2.5">
              <img
                src="/menu-icon-gaji.png"
                alt="Slip Gaji"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="font-extrabold text-[13px] sm:text-[14px] text-[#0f172a] leading-tight tracking-tight">
                  Slip Gaji
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.35] mt-1 font-medium">
                  Akses dan cetak rincian gaji bulanan karyawan.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end mt-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>

          {/* CARD 5: NOMOR PO / UPLOAD PO */}
          <button
            type="button"
            onClick={() => onSelectModule('upload-po')}
            className="group relative bg-gradient-to-br from-white via-[#fcfdff] to-[#eff7ff] hover:to-[#e5f2ff] active:scale-[0.98] transition-all duration-150 rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between text-left min-h-[124px] sm:min-h-[136px] overflow-hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute -bottom-3 -left-3 w-14 h-14 text-sky-300/35"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
            </svg>

            <div className="relative z-10 flex items-start gap-2 sm:gap-2.5">
              <img
                src="/menu-icon-po.png"
                alt="Upload PO"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-extrabold text-[13px] sm:text-[14px] text-[#0f172a] leading-tight tracking-tight">
                    Upload PO
                  </h2>
                  <span className="px-1.5 py-0.5 text-[9px] leading-none bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#7c3aed] text-white font-black rounded-md shadow-xs tracking-wide">
                    AI
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.35] mt-1 font-medium">
                  Unggah dan proses Purchase Order otomatis.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end mt-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>

          {/* CARD 6: PENGATURAN */}
          <button
            type="button"
            onClick={onOpenPengaturan}
            className="group relative bg-gradient-to-br from-white via-[#fcfdff] to-[#eff7ff] hover:to-[#e5f2ff] active:scale-[0.98] transition-all duration-150 rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between text-left min-h-[124px] sm:min-h-[136px] overflow-hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute -bottom-3 -left-3 w-14 h-14 text-sky-300/35"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              <path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
            </svg>

            <div className="relative z-10 flex items-start gap-2 sm:gap-2.5">
              <img
                src="/menu-icon-pengaturan.png"
                alt="Pengaturan"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="font-extrabold text-[13px] sm:text-[14px] text-[#0f172a] leading-tight tracking-tight">
                  Pengaturan
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.35] mt-1 font-medium">
                  Konfigurasi akun, integrasi, dan keamanan.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end mt-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>
        </div>

        {/* 4B. PANDUAN PENGGUNAAN APLIKASI */}
        {onOpenPanduan && (
          <div className="mt-2.5 sm:mt-3">
            <button
              type="button"
              onClick={onOpenPanduan}
              className="w-full bg-gradient-to-r from-white via-[#fcfdff] to-[#f0f7ff] hover:to-[#e5f2ff] active:scale-[0.99] transition-all rounded-[20px] p-2.5 sm:p-3.5 border border-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.16),0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between gap-2.5 sm:gap-3 text-left group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <img
                  src="/menu-icon-panduan.png"
                  alt="Panduan Penggunaan Aplikasi"
                  className="w-14 h-11 sm:w-16 sm:h-12 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
                />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-[13px] sm:text-sm text-[#0f172a] leading-tight tracking-tight">
                    Panduan Penggunaan Aplikasi
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug font-medium">
                    Penjelasan lengkap cara pakai semua menu & fitur terbaru
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#66c7ff] to-[#3495f7] group-hover:from-[#4bb5ff] group-hover:to-[#257de8] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(52,149,247,0.35)] shrink-0 transition">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 5. DECORATIVE FOOTER BANNER (MATCHING SCREENSHOT) */}
      <div className="px-3 pt-3.5">
        <div className="rounded-3xl overflow-hidden shadow-xs border border-blue-900/40">
          <img
            src="/hvac-footer-banner.png"
            alt="Dari Kami Untuk Kenyamanan Anda"
            className="w-full h-auto object-cover max-h-[85px]"
          />
        </div>
      </div>

      {/* SIDE DRAWER MENU (Triggered by Hamburger Button) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-[#0b223d] text-white h-full p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-blue-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs">
                    MTA
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">CV MULIA TEKHNIK ABADI</h3>
                    <p className="text-[10px] text-sky-300">Menu Utama</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="space-y-1.5 py-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onSelectModule('penawaran');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Surat Penawaran</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onSelectModule('invoice');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Invoice Tagihan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onSelectModule('bast');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>BAST (Serah Terima)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onSelectModule('gaji');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <Banknote className="w-4 h-4 text-green-400" />
                  <span>Slip Gaji Karyawan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onSelectModule('upload-po');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-sky-300" />
                    <span>Upload PO (AI OCR)</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] bg-yellow-400 text-blue-950 font-bold rounded">
                    BARU
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenClientData();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Data Pelanggan (Client)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenPoTracker();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <Package className="w-4 h-4 text-orange-400" />
                  <span>Pelacak Nomor PO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenPengaturan();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                  <span>Pengaturan Perusahaan</span>
                </button>

                {onOpenPanduan && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenPanduan();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-300" />
                    <span>Panduan Aplikasi</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
