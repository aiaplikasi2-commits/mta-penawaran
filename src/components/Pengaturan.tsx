import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Building,
  Upload,
  Trash2,
  RotateCcw,
  Save,
  DownloadCloud,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Image as ImageIcon,
  Stamp,
  FileSignature,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { CompanySettings, BackupData } from '../types/index.ts';
import { exportBackupJSON, restoreBackupJSON, DEFAULT_SETTINGS } from '../services/db.ts';

interface PengaturanProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => Promise<void>;
  onRefreshAllData: () => Promise<void>;
  onToast: (msg: string) => void;
}

export const Pengaturan: React.FC<PengaturanProps> = ({
  settings,
  onSaveSettings,
  onRefreshAllData,
  onToast,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({
    ...DEFAULT_SETTINGS,
    ...settings,
    logoImage: settings.logoImage || '/default-logo.png',
    kopImage: settings.kopImage || '/default-kop.png',
    signatureImage: settings.signatureImage || '/default-ttd-stempel.png',
    tarifLemburPerJam: settings.tarifLemburPerJam ?? 12000,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when settings prop changes
  useEffect(() => {
    setFormData((prev) => ({
      ...DEFAULT_SETTINGS,
      ...settings,
      logoImage: settings.logoImage || prev.logoImage || '/default-logo.png',
      kopImage: settings.kopImage || prev.kopImage || '/default-kop.png',
      signatureImage: settings.signatureImage || prev.signatureImage || '/default-ttd-stempel.png',
      tarifLemburPerJam: settings.tarifLemburPerJam ?? prev.tarifLemburPerJam ?? 12000,
    }));
  }, [settings]);

  // Restore States
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreParsedData, setRestoreParsedData] = useState<any | null>(null);
  const [restoreStats, setRestoreStats] = useState<{
    exportedAt?: string;
    lettersCount: number;
    customersCount: number;
    companyName?: string;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // File Inputs Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const kopInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  // Generic Image Reader
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoImage' | 'kopImage' | 'signatureImage' | 'stampImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('File yang diunggah harus berupa gambar (PNG, JPG, JPEG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        [field]: base64,
      }));
      const fieldNames: Record<string, string> = {
        logoImage: 'Logo Perusahaan',
        kopImage: 'KOP Surat',
        signatureImage: 'Tanda Tangan & Stempel',
        stampImage: 'Stempel',
      };
      onToast(`Gambar ${fieldNames[field] || 'gambar'} berhasil diunggah`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      onToast('Pengaturan perusahaan berhasil disimpan sebagai sumber data tunggal!');
    } catch {
      onToast('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  // Backup Handler
  const handleBackup = async () => {
    try {
      const backup = await exportBackupJSON();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}`;
      a.href = url;
      a.download = `BACKUP_MTA_${dateTag}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('Backup JSON lengkap berhasil diunduh!');
    } catch (err: any) {
      console.error(err);
      onToast('Gagal mengekspor data backup: ' + (err.message || ''));
    }
  };

  // Restore File Selection
  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);

        if (!data || typeof data !== 'object') {
          throw new Error('File bukan merupakan format JSON valid');
        }

        const letters = Array.isArray(data.letters) ? data.letters : [];
        const customers = Array.isArray(data.customers) ? data.customers : [];

        setRestoreStats({
          exportedAt: data.exportedAt,
          lettersCount: letters.length,
          customersCount: customers.length,
          companyName: data.settings?.companyName || '-',
        });
        setRestoreParsedData(data);
        setRestoreModalOpen(true);
      } catch (err: any) {
        setRestoreError('File tidak valid: ' + (err.message || 'Format rusak'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restoreParsedData) return;
    try {
      const result = await restoreBackupJSON(restoreParsedData);
      setRestoreModalOpen(false);
      setRestoreParsedData(null);
      await onRefreshAllData();
      onToast(
        `Data berhasil dipulihkan: ${result.lettersCount} surat & ${result.customersCount} pelanggan!`
      );
    } catch (err: any) {
      onToast('Gagal memulihkan data: ' + err.message);
    }
  };

  return (
    <div className="pb-28 pt-2 max-w-4xl mx-auto px-3 sm:px-4 space-y-4">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#0b223d] flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Pengaturan Tunggal Perusahaan MTA</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Satu sumber data terintegrasi aplikasi Adm MTA (Penawaran, BAST, Invoice &amp; Slip Gaji)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 bg-[#0b223d] hover:bg-blue-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 1: UPLOAD GAMBAR RESMI (LOGO, KOP SURAT, STEMPEL/TTD) */}
        {/* ============================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600"></span>
              Gambar Resmi Perusahaan (Logo, KOP Surat, &amp; Stempel / TTD)
            </h3>
            <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200/60">
              3 Upload Terpisah
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* UPLOADER 1: LOGO PERUSAHAAN (KHUSUS SLIP GAJI & APP) */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>1. Upload Logo Perusahaan</span>
                  </div>
                  {formData.logoImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoImage: '' })}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  <strong className="text-blue-700">Khusus Slip Gaji:</strong> Hanya logo murni tanpa alamat / KOP surat.
                </p>

                {/* Preview Box */}
                <div className="mt-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/80 h-28 flex items-center justify-center">
                  {formData.logoImage ? (
                    <img
                      src={formData.logoImage}
                      alt="Logo Perusahaan"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-7 h-7 mx-auto mb-1 opacity-40" />
                      <span className="text-[10px]">Belum ada logo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold px-3 py-2 rounded-xl text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.logoImage ? 'Ganti Logo' : 'Upload Logo'}</span>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logoImage')}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoImage: '/default-logo.png' })}
                  className="w-full text-center text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 py-1.5 rounded-xl transition"
                >
                  Gunakan Logo Standar MTA
                </button>
              </div>
            </div>

            {/* UPLOADER 2: KOP SURAT (KHUSUS SURAT PENAWARAN A4) */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>2. Upload KOP Surat</span>
                  </div>
                  {formData.kopImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, kopImage: '' })}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus KOP"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  <strong className="text-sky-700">Khusus Surat Penawaran A4:</strong> Header KOP resmi dengan garis pembatas.
                </p>

                {/* Preview Box */}
                <div className="mt-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/80 h-28 flex items-center justify-center">
                  {formData.kopImage ? (
                    <img
                      src={formData.kopImage}
                      alt="KOP Surat"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileText className="w-7 h-7 mx-auto mb-1 opacity-40" />
                      <span className="text-[10px]">Belum ada KOP</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => kopInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold px-3 py-2 rounded-xl text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.kopImage ? 'Ganti KOP Surat' : 'Upload KOP Surat'}</span>
                </button>
                <input
                  ref={kopInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'kopImage')}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kopImage: '/default-kop.png' })}
                  className="w-full text-center text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 py-1.5 rounded-xl transition"
                >
                  Gunakan KOP Standar MTA
                </button>
              </div>
            </div>

            {/* UPLOADER 3: STEMPEL & TANDA TANGAN (SURAT PENAWARAN & SLIP GAJI) */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <FileSignature className="w-4 h-4 text-emerald-600" />
                    <span>3. Upload Stempel / TTD</span>
                  </div>
                  {formData.signatureImage && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureImage: '' })}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus TTD/Stempel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  <strong className="text-emerald-700">Tanda Tangan &amp; Stempel:</strong> Digunakan di Surat Penawaran &amp; Slip Gaji.
                </p>

                {/* Preview Box */}
                <div className="mt-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/80 h-28 flex items-center justify-center">
                  {formData.signatureImage ? (
                    <img
                      src={formData.signatureImage}
                      alt="TTD & Stempel"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileSignature className="w-7 h-7 mx-auto mb-1 opacity-40" />
                      <span className="text-[10px]">Belum ada TTD / Stempel</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => signInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold px-3 py-2 rounded-xl text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.signatureImage ? 'Ganti TTD / Stempel' : 'Upload Stempel / TTD'}</span>
                </button>
                <input
                  ref={signInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'signatureImage')}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, signatureImage: '/default-ttd-stempel.png' })
                  }
                  className="w-full text-center text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 py-1.5 rounded-xl transition"
                >
                  Gunakan TTD Standar MTA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 2: IDENTITAS PERUSAHAAN LENGKAP */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3.5 text-xs">
          <h3 className="text-sm font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-blue-600"></span>
            Identitas Resmi Perusahaan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Perusahaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Lengkap Perusahaan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Perusahaan <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Penanggung Jawab Tanda Tangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.signatoryName}
                onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold text-slate-900"
              />
            </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tarif Lembur Standar (Rp / Jam)</span>
                  <span className="text-blue-600 font-bold">Khusus Slip Gaji</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.tarifLemburPerJam ?? 12000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tarifLemburPerJam: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Rekening Pembayaran Transfer (Invoice) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Nama Bank</span>
                  <span className="text-blue-600 font-bold">Khusus Invoice</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName || 'Mandiri'}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Mandiri"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  value={formData.bankAccountName || 'CV. MULIA TEKHNIK ABADI'}
                  onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                  placeholder="CV. MULIA TEKHNIK ABADI"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber || '167-00-0529426-8'}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="167-00-0529426-8"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

        {/* ============================================================== */}
        {/* BAGIAN 3: PENGATURAN SURAT PENAWARAN & PAJAK */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-blue-600"></span>
            Pengaturan Format Surat &amp; Penomoran
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kota Penerbitan Surat
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bogor"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Urut Surat Awal
              </label>
              <input
                type="number"
                min="1"
                value={formData.nextSequenceNumber ?? 16}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nextSequenceNumber: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-blue-50/40 font-bold text-blue-900 text-center"
              />
              <span className="text-[10px] text-slate-500">Mulai awal nomor surat (misal: 16)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Format Penomoran Surat
              </label>
              <input
                type="text"
                value={formData.numberFormat}
                onChange={(e) => setFormData({ ...formData, numberFormat: e.target.value })}
                placeholder="{seq}/10/MTA/{year}"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50"
              />
              <span className="text-[10px] text-slate-400">Variabel: {'{seq}'}, {'{month}'}, {'{year}'}</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tarif PPN Default (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.defaultPpnPercent}
                onChange={(e) =>
                  setFormData({ ...formData, defaultPpnPercent: Number(e.target.value) || 11 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 text-center font-bold"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#0b223d] hover:bg-blue-900 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan Perusahaan</span>
          </button>
        </div>
      </form>

      {/* ============================================================== */}
      {/* BAGIAN 4: BACKUP DAN RESTORE DATA LENGKAP JSON */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-slate-900 to-[#0b223d] text-white rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 text-xs mt-6">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <DownloadCloud className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-sm text-white">Backup &amp; Restore Data Terintegrasi</h3>
            <p className="text-[11px] text-sky-200">
              Simpan cadangan seluruh identitas perusahaan, Logo, KOP, TTD/Stempel, Surat Penawaran, dan Pelanggan ke 1 file JSON
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export / Backup */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="font-bold text-sky-300 flex items-center gap-1.5">
                <DownloadCloud className="w-4 h-4" />
                <span>Backup Seluruh Data</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Mengunduh file JSON terintegrasi berisi seluruh data perusahaan, gambar Logo, KOP, TTD, riwayat surat, dan rekanan pelanggan.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackup}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl shadow transition text-center"
            >
              Unduh File Backup (.json)
            </button>
          </div>

          {/* Import / Restore */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4" />
                <span>Restore Data dari Backup</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Pulihkan data dari file backup JSON sebelumnya. Data divalidasi terlebih dahulu sebelum diterapkan secara aman.
              </p>
            </div>
            <button
              type="button"
              onClick={() => restoreFileRef.current?.click()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition text-center"
            >
              Pilih File Backup JSON...
            </button>
            <input
              ref={restoreFileRef}
              type="file"
              accept=".json"
              onChange={handleSelectRestoreFile}
              className="hidden"
            />
          </div>
        </div>

        {restoreError && (
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-200 border border-red-400/40 text-xs">
            {restoreError}
          </div>
        )}
      </div>

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreModalOpen && restoreStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl text-slate-800 space-y-3.5 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 text-center">
              Konfirmasi Pemulihan Data (Restore)
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Perusahaan:</span>
                <span className="font-bold text-slate-900">{restoreStats.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Surat:</span>
                <span className="font-bold text-blue-900">{restoreStats.lettersCount} dokumen</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Pelanggan:</span>
                <span className="font-bold text-emerald-900">{restoreStats.customersCount} rekanan</span>
              </div>
              {restoreStats.exportedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Backup:</span>
                  <span className="font-medium text-slate-600">
                    {new Date(restoreStats.exportedAt).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed text-center">
              Seluruh surat dan pelanggan dari file backup akan dipulihkan ke penyimpanan lokal IndexedDB perangkat.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRestoreModalOpen(false);
                  setRestoreParsedData(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 shadow-xs"
              >
                Pulihkan Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
