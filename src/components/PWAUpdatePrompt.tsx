import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, ShieldCheck, X } from 'lucide-react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000; // Cek update tiap 1 menit
const MIN_MANUAL_CHECK_GAP_MS = 15 * 1000; // Batasi cek saat fokus/online minimal jeda 15 detik

export const PWAUpdatePrompt: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverHasUpdate, setServerHasUpdate] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const initialVersionRef = useRef<string | null>(null);
  const latestServerVersionRef = useRef<string | null>(null);
  const dismissedVersionRef = useRef<string | null>(null);
  const lastCheckAtRef = useRef<number>(0);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registrationRef.current = registration;
        // Jika sudah ada SW waiting saat pertama kali dimuat, tampilkan pop-up
        if (registration.waiting) {
          setNeedRefresh(true);
        }
      }
    },
    onRegisterError(error) {
      console.warn('PWA service worker registration error:', error);
    },
  });

  const checkForUpdate = useCallback(async (force = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const now = Date.now();
    if (!force && now - lastCheckAtRef.current < MIN_MANUAL_CHECK_GAP_MS) {
      return;
    }
    lastCheckAtRef.current = now;

    // 1. Cek pembaruan Service Worker (jika aktif)
    try {
      const reg =
        registrationRef.current ||
        ('serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined);
      if (reg) {
        registrationRef.current = reg;
        await reg.update();
        if (reg.waiting) {
          setNeedRefresh(true);
        }
      }
    } catch {
      // Abaikan error sementara saat cek SW
    }

    // 2. Cek versi server secara langsung (/api/app-version) agar deteksi juga bekerja di mode dev maupun saat SW belum terpicu
    try {
      const res = await fetch(`/api/app-version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { version?: string };
      if (!data?.version) return;

      if (!initialVersionRef.current) {
        initialVersionRef.current = data.version;
        latestServerVersionRef.current = data.version;
        return;
      }

      latestServerVersionRef.current = data.version;
      if (
        data.version !== initialVersionRef.current &&
        dismissedVersionRef.current !== data.version
      ) {
        setServerHasUpdate(true);
      }
    } catch {
      // Abaikan error jaringan sementara saat pengecekan latar belakang
    }
  }, [setNeedRefresh]);

  useEffect(() => {
    // Ambil versi awal segera saat aplikasi dibuka
    void checkForUpdate(true);

    const intervalId = window.setInterval(() => {
      void checkForUpdate(true);
    }, UPDATE_CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate(false);
      }
    };

    const handleFocusOrOnline = () => {
      void checkForUpdate(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, [checkForUpdate]);

  const showPrompt = needRefresh || serverHasUpdate;

  if (!showPrompt) {
    return null;
  }

  const handleInstallUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const forceCleanReload = async () => {
      try {
        // Bersihkan hanya HTTP asset cache milik workbox/PWA (tidak menyentuh IndexedDB / localStorage)
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.includes('workbox') || k.includes('precache') || k.includes('vite-pwa'))
              .map((k) => window.caches.delete(k))
          );
        }
      } catch {
        // Abaikan jika browser membatasi cache API
      }
      window.location.reload();
    };

    const fallbackReloadTimer = window.setTimeout(() => {
      void forceCleanReload();
    }, 2200);

    try {
      if (needRefresh) {
        await updateServiceWorker(true);
      }

      const reg =
        registrationRef.current ||
        ('serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined);

      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.clearTimeout(fallbackReloadTimer);
        await forceCleanReload();
      }
    } catch (err) {
      console.error('Gagal menginstall update:', err);
      window.clearTimeout(fallbackReloadTimer);
      await forceCleanReload();
    }
  };

  const handleDismiss = () => {
    if (isUpdating) return;
    setNeedRefresh(false);
    setServerHasUpdate(false);
    if (latestServerVersionRef.current) {
      dismissedVersionRef.current = latestServerVersionRef.current;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-update-title"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0b223d] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <RefreshCw className={`w-5 h-5 text-sky-300 ${isUpdating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 id="pwa-update-title" className="text-sm font-bold tracking-wide">
                Update Aplikasi Tersedia
              </h3>
              <p className="text-[11px] text-sky-200/90">Pembaruan Sistem Adm MTA</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={isUpdating}
            aria-label="Tutup notifikasi update"
            className="p-1.5 rounded-lg text-sky-200/80 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Versi terbaru aplikasi <span className="font-bold text-slate-900">Adm MTA</span> sudah siap dipasang. Silakan klik{' '}
            <span className="font-semibold text-blue-700">Install Update</span> untuk memuat pembaruan terbaru.
          </p>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-[11px] font-medium text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Data dokumen dan draft Anda yang tersimpan tetap aman.</span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleInstallUpdate}
              disabled={isUpdating}
              className="flex-[1.5] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-75"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menginstall Update...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Install Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
