import React from 'react';
import {
  X,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Banknote,
  Users,
  Settings,
  Package,
  Coffee,
  Home,
} from 'lucide-react';
import type { CompanySettings } from '../types/index.ts';
import type { AppMode } from './Header.tsx';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  onNavigate: (mode: AppMode, tab?: string) => void;
  onOpenPoTracker: () => void;
  onOpenCoffee: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onNavigate,
  onOpenPoTracker,
  onOpenCoffee,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-72 max-w-[80vw] bg-[#0b223d] text-white h-full p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-blue-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white">
                MTA
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs truncate">
                  {settings.companyName || 'CV MULIA TEKHNIK ABADI'}
                </h3>
                <p className="text-[10px] text-sky-300">Menu Utama</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-blue-900/40"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <div className="space-y-1.5 py-4 text-xs font-semibold">
            {/* Beranda */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('dashboard');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <Home className="w-4 h-4 text-sky-400" />
              <span>Beranda Dasbor</span>
            </button>

            {/* Surat Penawaran */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('penawaran', 'rekap');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Surat Penawaran</span>
            </button>

            {/* Invoice */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('invoice');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Invoice Tagihan</span>
            </button>

            {/* BAST */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('bast');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>BAST (Serah Terima)</span>
            </button>

            {/* Slip Gaji */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('gaji');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <Banknote className="w-4 h-4 text-green-400" />
              <span>Slip Gaji Karyawan</span>
            </button>

            {/* Data Client */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('penawaran', 'pelanggan');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Data Pelanggan (Client)</span>
            </button>

            {/* Nomor PO */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPoTracker();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <Package className="w-4 h-4 text-indigo-400" />
              <span>Cari Nomor PO</span>
            </button>

            {/* Pengaturan */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('penawaran', 'pengaturan');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-900/60 transition text-left text-sky-200 hover:text-white"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span>Pengaturan Perusahaan</span>
            </button>
          </div>
        </div>

        {/* Footer Traktir Kopi */}
        <div className="pt-3 border-t border-blue-900">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCoffee();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition"
          >
            <Coffee className="w-4 h-4 text-slate-950" />
            <span>Dukung Pengembang (Kopi)</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            CV Mulia Tekhnik Abadi v2.5
          </p>
        </div>
      </div>
    </div>
  );
};
