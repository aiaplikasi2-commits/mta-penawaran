import React, { useState } from 'react';
import {
  Bell,
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
  Coffee,
  CheckCircle2,
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
  onSelectModule: (mode: 'penawaran' | 'bast' | 'invoice' | 'gaji') => void;
  onOpenPengaturan: () => void;
  onOpenClientData: () => void;
  onOpenPoTracker: () => void;
  onOpenCoffee: () => void;
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
  onOpenCoffee,
  onOpenSidebar,
  onToast,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

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

        {/* Right side: Sync Status + Notification Bell */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SyncStatusBar onToast={onToast || (() => {})} />

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-1.5 text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition relative"
              title="Aktivitas"
            >
              <Bell className="w-5 h-5 text-blue-900" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                3
              </span>
            </button>

          {/* Quick Notification Popup */}
          {notificationOpen && (
            <div className="absolute right-0 top-10 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-900">Ringkasan Sistem</span>
                <button
                  type="button"
                  onClick={() => setNotificationOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-950 font-medium">
                  <strong>{letters.length}</strong> Surat Penawaran tersimpan
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-950 font-medium">
                  <strong>{basts.length}</strong> Dokumen BAST terdaftar
                </div>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-950 font-medium">
                  <strong>{invoices.length}</strong> Invoice diterbitkan
                </div>
              </div>
            </div>
          )}
          </div>
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

      {/* 4. THE 6 MAIN NAVIGATION CARDS (2 COLUMNS X 3 ROWS GRID) */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* CARD 1: SURAT PENAWARAN */}
          <button
            type="button"
            onClick={() => onSelectModule('penawaran')}
            className="group relative bg-white hover:bg-blue-50/40 active:scale-[0.98] transition-all duration-150 rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-left h-[115px] sm:h-[125px] overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <img
                src="/icon-penawaran.png"
                alt="Surat Penawaran"
                className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                  Surat Penawaran
                </h2>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Buat dan kelola penawaran proyek
                </p>
              </div>
            </div>

            <div className="self-end mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* CARD 2: INVOICE */}
          <button
            type="button"
            onClick={() => onSelectModule('invoice')}
            className="group relative bg-white hover:bg-blue-50/40 active:scale-[0.98] transition-all duration-150 rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-left h-[115px] sm:h-[125px] overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <img
                src="/icon-invoice.png"
                alt="Invoice"
                className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                  Invoice
                </h2>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Kelola faktur, tagihan dan pembayaran
                </p>
              </div>
            </div>

            <div className="self-end mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* CARD 3: BAST */}
          <button
            type="button"
            onClick={() => onSelectModule('bast')}
            className="group relative bg-white hover:bg-emerald-50/40 active:scale-[0.98] transition-all duration-150 rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-left h-[115px] sm:h-[125px] overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <img
                src="/icon-bast.png"
                alt="BAST"
                className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                  BAST
                </h2>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Berita acara serah terima
                </p>
              </div>
            </div>

            <div className="self-end mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* CARD 4: SLIP GAJI */}
          <button
            type="button"
            onClick={() => onSelectModule('gaji')}
            className="group relative bg-white hover:bg-sky-50/40 active:scale-[0.98] transition-all duration-150 rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-left h-[115px] sm:h-[125px] overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <img
                src="/icon-gaji.png"
                alt="Slip Gaji"
                className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                  Slip Gaji
                </h2>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Unduh dan lihat detail gaji bulanan
                </p>
              </div>
            </div>

            <div className="self-end mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* CARD 5: NOMOR PO */}
          <button
            type="button"
            onClick={onOpenPoTracker}
            className="group relative bg-white hover:bg-amber-50/40 active:scale-[0.98] transition-all duration-150 rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-left h-[115px] sm:h-[125px] overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <img
                src="/icon-po.png"
                alt="Nomor PO"
                className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                  Nomor PO
                </h2>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Kelola nomor pesanan
                </p>
              </div>
            </div>

            <div className="self-end mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* CARD 6: PENGATURAN */}
          <button
            type="button"
            onClick={onOpenPengaturan}
            className="group relative bg-white hover:bg-slate-100/60 active:scale-[0.98] transition-all duration-150 rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between text-left h-[115px] sm:h-[125px] overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <img
                src="/icon-pengaturan.png"
                alt="Pengaturan"
                className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                  Pengaturan
                </h2>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Atur aplikasi sesuai kebutuhan
                </p>
              </div>
            </div>

            <div className="self-end mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>
        </div>
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
              </div>
            </div>

            {/* Traktir Kopi Button */}
            <div className="pt-2 border-t border-blue-900">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenCoffee();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                <Coffee className="w-4 h-4" />
                <span>Bagi Kopi Pengembang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
