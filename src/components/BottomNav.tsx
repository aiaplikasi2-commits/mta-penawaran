import React from 'react';
import {
  Home,
  Users,
  Folder,
  BarChart2,
} from 'lucide-react';
import type { AppMode } from './Header.tsx';

export type NavTab = 'tambah' | 'rekap' | 'pelanggan' | 'pengaturan';

interface BottomNavProps {
  appMode: AppMode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onModeChange: (mode: AppMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  appMode,
  activeTab,
  onTabChange,
  onModeChange,
}) => {
  // Determine which bottom tab is active
  // 1. Beranda: appMode === 'dashboard'
  // 2. Data Client: (appMode === 'penawaran' && activeTab === 'pelanggan')
  // 3. Dokumen: (appMode === 'penawaran' && (activeTab === 'rekap' || activeTab === 'tambah' || activeTab === 'pengaturan')) || appMode === 'bast' || appMode === 'invoice'
  // 4. Laporan: appMode === 'gaji'
  const isBerandaActive = appMode === 'dashboard';
  const isClientActive = appMode === 'penawaran' && activeTab === 'pelanggan';
  const isDokumenActive =
    (appMode === 'penawaran' && activeTab !== 'pelanggan') ||
    appMode === 'bast' ||
    appMode === 'invoice';
  const isLaporanActive = appMode === 'gaji';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] w-full overflow-x-hidden">
      <div className="max-w-md mx-auto flex items-center justify-around h-15 px-2">
        {/* Tab 1: Beranda */}
        <button
          type="button"
          onClick={() => onModeChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative select-none ${
            isBerandaActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-0.5">
            <Home
              className={`w-5 h-5 transition-transform ${
                isBerandaActive ? 'stroke-[2.5] scale-110 text-blue-700' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] tracking-tight mt-0.5 leading-none ${
              isBerandaActive ? 'font-bold text-blue-700' : 'font-medium text-slate-600'
            }`}
          >
            Beranda
          </span>
          {isBerandaActive && (
            <span className="w-8 h-1 bg-blue-700 rounded-full mt-1 animate-in fade-in zoom-in-75 duration-200" />
          )}
        </button>

        {/* Tab 2: Data Client */}
        <button
          type="button"
          onClick={() => {
            onModeChange('penawaran');
            onTabChange('pelanggan');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative select-none ${
            isClientActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-0.5">
            <Users
              className={`w-5 h-5 transition-transform ${
                isClientActive ? 'stroke-[2.5] scale-110 text-blue-700' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] tracking-tight mt-0.5 leading-none ${
              isClientActive ? 'font-bold text-blue-700' : 'font-medium text-slate-600'
            }`}
          >
            Data Client
          </span>
          {isClientActive && (
            <span className="w-8 h-1 bg-blue-700 rounded-full mt-1 animate-in fade-in zoom-in-75 duration-200" />
          )}
        </button>

        {/* Tab 3: Dokumen */}
        <button
          type="button"
          onClick={() => {
            if (appMode === 'dashboard') {
              onModeChange('penawaran');
              onTabChange('rekap');
            } else if (appMode === 'penawaran') {
              // toggle between rekap and tambah if already in penawaran
              onTabChange(activeTab === 'tambah' ? 'rekap' : 'tambah');
            } else {
              // if in bast or invoice, keep module or switch to penawaran rekap
              onTabChange('rekap');
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative select-none ${
            isDokumenActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-0.5">
            <Folder
              className={`w-5 h-5 transition-transform ${
                isDokumenActive ? 'stroke-[2.5] scale-110 text-blue-700' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] tracking-tight mt-0.5 leading-none ${
              isDokumenActive ? 'font-bold text-blue-700' : 'font-medium text-slate-600'
            }`}
          >
            Dokumen
          </span>
          {isDokumenActive && (
            <span className="w-8 h-1 bg-blue-700 rounded-full mt-1 animate-in fade-in zoom-in-75 duration-200" />
          )}
        </button>

        {/* Tab 4: Laporan */}
        <button
          type="button"
          onClick={() => {
            onModeChange('gaji');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative select-none ${
            isLaporanActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-0.5">
            <BarChart2
              className={`w-5 h-5 transition-transform ${
                isLaporanActive ? 'stroke-[2.5] scale-110 text-blue-700' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] tracking-tight mt-0.5 leading-none ${
              isLaporanActive ? 'font-bold text-blue-700' : 'font-medium text-slate-600'
            }`}
          >
            Laporan
          </span>
          {isLaporanActive && (
            <span className="w-8 h-1 bg-blue-700 rounded-full mt-1 animate-in fade-in zoom-in-75 duration-200" />
          )}
        </button>
      </div>
    </nav>
  );
};
