import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Cloud,
  ChevronDown,
  Download,
  Upload,
  X,
} from 'lucide-react';
import {
  subscribeSyncState,
  getSyncState,
  type SyncState,
  exportEntireDatabase,
  restoreEntireDatabase,
} from '../services/cloudSync.ts';

interface SyncStatusBarProps {
  onToast: (msg: string) => void;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ onToast }) => {
  const [syncState, setSyncState] = useState<SyncState>(getSyncState().state);
  const [statusMsg, setStatusMsg] = useState<string>(getSyncState().message);
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncState((state, msg) => {
      setSyncState(state);
      if (msg) setStatusMsg(msg);
    });
    return unsub;
  }, []);

  // Visual configuration for each status
  const config = {
    ONLINE: {
      label: 'ONLINE',
      desc: 'Terhubung ke server',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
      icon: Wifi,
      spin: false,
    },
    OFFLINE: {
      label: 'OFFLINE',
      desc: 'Tidak ada koneksi internet',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400',
      icon: WifiOff,
      spin: false,
    },
    MENYINKRONKAN: {
      label: 'MENYINKRONKAN',
      desc: 'Sedang sinkronisasi data',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      dotClass: 'bg-sky-400',
      icon: RefreshCw,
      spin: true,
    },
    TERSINKRON: {
      label: 'TERSINKRON',
      desc: 'Tersimpan di server',
      badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      dotClass: 'bg-teal-400',
      icon: CheckCircle,
      spin: false,
    },
    'GAGAL SINKRON': {
      label: 'GAGAL SINKRON',
      desc: 'Ada perubahan tertunda',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dotClass: 'bg-rose-400',
      icon: AlertTriangle,
      spin: false,
    },
  }[syncState] || {
    label: 'ONLINE',
    desc: 'Terhubung ke server',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    icon: Wifi,
    spin: false,
  };

  const IconComp = config.icon;

  const handleDownloadCloudBackup = async () => {
    try {
      setIsExporting(true);
      const backup = await exportEntireDatabase();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `BACKUP_MTA_DATABASE_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('Cadangan database cloud berhasil diunduh!');
    } catch (err: any) {
      onToast('Gagal mengunduh backup: ' + (err.message || ''));
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreCloudBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsImporting(true);
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.settings && !parsed.letters) {
          throw new Error('Format file backup tidak valid.');
        }
        await restoreEntireDatabase(parsed);
        onToast('Data berhasil dipulihkan ke Cloud Database!');
        setShowModal(false);
      } catch (err: any) {
        onToast('Gagal memulihkan data: ' + (err.message || 'Format tidak sesuai'));
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-semibold tracking-wide transition shadow-xs active:scale-95 ${config.badgeClass}`}
        title={`Status Sinkronisasi: ${config.label} - ${statusMsg || config.desc}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} animate-pulse`} />
        <IconComp className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
        <span className="font-bold">{config.label}</span>
        <ChevronDown className="w-2.5 h-2.5 opacity-60 hidden sm:inline" />
      </button>

      {/* MODAL CLOUD SYNC & BACKUP DETAILS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-2xl p-4 sm:p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Database Online & Sinkronisasi</h3>
                <p className="text-[11px] text-slate-400">CV. Mulia Tekhnik Abadi</p>
              </div>
            </div>

            {/* Current Sync Card */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Status Server:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${config.badgeClass}`}
                >
                  <IconComp className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
                  {config.label}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {statusMsg || config.desc}
              </div>
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Multi-Perangkat Aktif</span>
                <span className="text-emerald-400 font-semibold">Tersambung Real-time</span>
              </div>
            </div>

            {/* Backup & Recovery Actions */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-300">Cadangan & Pemulihan Cloud:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadCloudBackup}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Mengunduh...' : 'Cadangkan Data'}</span>
                </button>

                <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Memulihkan...' : 'Pulihkan Data'}</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleRestoreCloudBackup}
                    disabled={isImporting}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                Data tersimpan otomatis di server online dan sinkron di semua HP secara real-time. Anda juga dapat mengunduh berkas cadangan offline kapan saja.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
