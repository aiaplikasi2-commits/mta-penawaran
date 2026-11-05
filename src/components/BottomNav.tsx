import React from 'react';
import { Home, ArrowLeft, Menu, Compass } from 'lucide-react';

interface BottomNavProps {
  onGoHome: () => void;
  onBack?: () => void;
  onOpenSidebar?: () => void;
  currentModeLabel?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onGoHome,
  onBack,
  onOpenSidebar,
  currentModeLabel = 'Menu',
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3 pt-1">
      <div className="max-w-md mx-auto pointer-events-auto bg-[#0b223d]/95 backdrop-blur-md border border-blue-700/60 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] rounded-2xl px-3 py-1.5 flex items-center justify-between text-white transition-all duration-200">
        
        {/* 1. TOMBOL KEMBALI (BACK) */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex flex-col items-center justify-center min-w-[64px] py-1 px-2.5 rounded-xl text-sky-200 hover:text-white active:bg-blue-800/60 active:scale-95 transition"
            title="Kembali ke halaman sebelumnya"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Kembali</span>
          </button>
        ) : (
          <div className="min-w-[64px]" />
        )}

        {/* 2. TOMBOL UTAMA: KEMBALI KE BERANDA (HOME) */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white shadow-lg shadow-blue-900/50 active:scale-95 transition-all border border-sky-400/30 group"
          title="Kembali ke Beranda Utama"
        >
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Home className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <span className="text-xs font-black tracking-wide uppercase">Beranda</span>
        </button>

        {/* 3. TOMBOL MENU SIDEBAR */}
        {onOpenSidebar ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex flex-col items-center justify-center min-w-[64px] py-1 px-2.5 rounded-xl text-sky-200 hover:text-white active:bg-blue-800/60 active:scale-95 transition"
            title="Buka Menu Aplikasi"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold tracking-tight mt-0.5">Menu</span>
          </button>
        ) : (
          <div className="min-w-[64px]" />
        )}
      </div>
    </div>
  );
};
