import React, { useState } from 'react';
import { Download, WifiOff, ShieldCheck, HelpCircle, Coffee, Copy, Check, Heart, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const Header: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const gopayNumber = '08179015181';
  const gopayName = 'jamhur';

  const handleCopyGopay = async () => {
    try {
      await navigator.clipboard.writeText(gopayNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = gopayNumber;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b223d] text-white shadow-md border-b border-blue-900/60">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-700 to-sky-500 p-0.5 flex items-center justify-center shadow-inner">
            <span className="font-extrabold text-sm tracking-wider text-white">MTA</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base tracking-wide leading-tight text-white">SP MTA</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-900/80 text-sky-300 border border-sky-400/30">
                PWA Android
              </span>
            </div>
            <p className="text-[11px] text-sky-200/90 leading-none">CV. MULIA TEKHNIK ABADI</p>
          </div>
        </div>

        {/* Status Indicators, Bagi Kopi & PWA Install Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* FITUR BAGI KOPI (Pojok Kanan Atas) */}
          <button
            type="button"
            onClick={() => setShowCoffeeModal(true)}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 hover:from-amber-400 hover:to-orange-300 active:scale-95 text-slate-950 font-extrabold text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm transition border border-amber-300/40"
            title="Traktir Kopi untuk Pengembang"
          >
            <Coffee className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden xs:inline">Bagi Kopi</span>
          </button>

          {!isOnline && (
            <div className="flex items-center gap-1 bg-amber-500/90 text-slate-900 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
              <WifiOff className="w-3 h-3 text-slate-900" />
              <span>Offline</span>
            </div>
          )}

          {/* Android / Chromium Install Prompt */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
              title="Pasang aplikasi ke layar utama HP"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* iOS Fallback Guide */}
          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1 bg-blue-800/80 hover:bg-blue-700 text-sky-200 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-blue-600/50"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Install iOS</span>
            </button>
          )}

          {isInstalled && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Terpasang</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL BAGI KOPI (GoPay Jamhur) */}
      {showCoffeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0b223d]">Bagi Kopi Pengembang</h3>
                  <p className="text-[11px] text-slate-500">Traktir secangkir kopi!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoffeeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3.5 text-xs text-center">
              <p className="text-slate-600 leading-relaxed text-[12px]">
                Dukung terus pemeliharaan dan pengembangan aplikasi <strong>SP MTA</strong> dengan mentraktir secangkir kopi via GoPay:
              </p>

              {/* GoPay Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-blue-200 shadow-inner flex flex-col items-center space-y-2">
                <div className="flex items-center gap-1.5 bg-[#00AED6] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                  <span>GoPay</span>
                </div>

                <div className="text-xs text-slate-500">
                  Atas Nama: <strong className="text-slate-800 uppercase">{gopayName}</strong>
                </div>

                <div className="text-xl font-extrabold text-blue-950 tracking-wider font-mono py-1">
                  {gopayNumber}
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyGopay}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#00AED6] hover:bg-[#009bbd] text-white'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Nomor Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Nomor GoPay</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span>Terima kasih banyak atas dukungan Anda!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCoffeeModal(false)}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

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
