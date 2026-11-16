import React, { useState } from 'react';
import {
  Download,
  Menu,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { SyncStatusBar } from './SyncStatusBar.tsx';

export type AppMode = 'dashboard' | 'penawaran' | 'bast' | 'invoice' | 'gaji' | 'upload-po';

interface HeaderProps {
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenSidebar?: () => void;
  onToast?: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ appMode, onModeChange, onOpenSidebar, onToast }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0b223d] text-white shadow-md border-b border-blue-900/60 w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left Side: Sidebar Hamburger + Back to Beranda + Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-1.5 text-slate-200 hover:text-white hover:bg-blue-800/80 rounded-lg transition"
              title="Menu Sidebar"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onModeChange('dashboard')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-800/90 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold transition shadow-xs border border-blue-600/50"
            title="Kembali ke Beranda"
          >
            <span>← Beranda</span>
          </button>

          <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-900 border border-blue-500/40 p-0.5 flex items-center justify-center shadow-xs shrink-0">
            <img src="/favicon.png" alt="Adm MTA" className="w-full h-full object-cover rounded-md" />
          </div>

          <div>
            <h1 className="font-bold text-xs sm:text-sm tracking-wide leading-tight text-white whitespace-nowrap">
              {appMode === 'bast'
                ? 'BAST'
                : appMode === 'invoice'
                ? 'INVOICE'
                : appMode === 'gaji'
                ? 'SLIP GAJI'
                : appMode === 'upload-po'
                ? 'UPLOAD PO (AI)'
                : 'SURAT PENAWARAN'}
            </h1>
            <p className="text-[9px] text-sky-200/90 leading-none">
              CV. MULIA TEKHNIK ABADI
            </p>
          </div>
        </div>

        {/* Right Controls: Sync Status Bar & Install */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SyncStatusBar onToast={onToast || (() => {})} />

          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg active:scale-95"
              title="Install"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}
        </div>
      </div>



      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900">Pasang ke Layar Utama iPhone / iPad</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>1. Tekan tombol <strong>Bagikan (Share)</strong> pada bilah bawah browser Safari.</p>
              <p>2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</p>
              <p>3. Tekan <strong>Tambah (Add)</strong> di pojok kanan atas.</p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#0b223d] py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-900 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
