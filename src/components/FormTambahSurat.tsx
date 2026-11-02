import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  UserCheck,
  Save,
  Download,
  Share2,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Percent,
  Coins,
  RefreshCw,
  Edit3,
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import type { CompanySettings, Customer, LetterData, OfferItem } from '../types/index.ts';
import { formatNumberIndo } from '../services/pdfGenerator.ts';
import { LetterPreview } from './LetterPreview.tsx';
import { saveDraftLetter, saveLetter } from '../services/db.ts';

interface FormTambahSuratProps {
  initialLetter?: LetterData | null;
  settings: CompanySettings;
  customers: Customer[];
  onSave: (letter: LetterData) => Promise<void>;
  onDownloadPDF: (letter: LetterData) => Promise<void>;
  onSharePDF: (letter: LetterData) => void;
  onPreviewPDF: (letter: LetterData) => void;
  onToast: (msg: string) => void;
  onResetToNew?: () => void;
}

export const FormTambahSurat: React.FC<FormTambahSuratProps> = ({
  initialLetter,
  settings,
  customers,
  onSave,
  onDownloadPDF,
  onSharePDF,
  onPreviewPDF,
  onToast,
  onResetToNew,
}) => {
  // Current active view tab: 'form' or 'preview'
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'preview'>('form');

  // Customer picker modal
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // AI Generation States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);

  // Auto-saved draft indicator
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string>('');

  // Helper to generate default date & letter number
  const todayStr = new Date().toISOString().split('T')[0];

  const createInitialState = (): LetterData => {
    if (initialLetter) return { ...initialLetter };
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const seqNum = settings.nextSequenceNumber ?? 16;
    const formattedSeq = String(seqNum).padStart(3, '0');
    const defaultNumber = settings.numberFormat
      ? settings.numberFormat
          .replace('{seq}', formattedSeq)
          .replace('{month}', currentMonth)
          .replace('{year}', String(currentYear))
      : `${formattedSeq}/${currentMonth}/MTA/${currentYear}`;

    return {
      id: `letter_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      letterNumber: defaultNumber,
      letterDate: todayStr,
      attachment: '-',
      subject: '',
      recipientName: '',
      companyName: '',
      address: '',
      city: 'Di Tempat',
      openingParagraph:
        'Bersama ini kami mengajukan surat penawaran harga, berikut ini daftar harga yang kami tawarkan :',
      closingParagraph:
        'Demikian Penawaran harga ini kami sampaikan, bilamana ada informasi yang perlu diketahui mengenai penawaran ini lebih lanjut, maka bapak / ibu dapat menghubungi kami lebih lanjut.\n\nAtas perhatiannya kami ucapkan terima kasih.',
      items: [
        {
          id: `item_${Date.now()}_1`,
          description: '',
          qty: 1,
          satuan: 'unit',
          price: 0,
          total: 0,
        },
      ],
      tradeInActive: false,
      tradeIn: {
        name: '',
        description: '',
        qty: 1,
        unitValue: 0,
        totalValue: 0,
      },
      discountActive: false,
      discountType: 'nominal',
      discountValue: 0,
      ppnActive: false,
      ppnPercent: settings.defaultPpnPercent || 11,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const [formData, setFormData] = useState<LetterData>(createInitialState);
  const formDataRef = useRef<LetterData>(formData);
  formDataRef.current = formData;

  // Sync if initialLetter prop updates
  useEffect(() => {
    if (initialLetter) {
      setFormData({ ...initialLetter });
    }
  }, [initialLetter]);

  // REQUIREMENT 2: AUTO-SAVE AS DRAFT ON ACCIDENTAL BACK OR EXIT
  // 1. Debounced background auto-save to IndexedDB as Draft
  useEffect(() => {
    const hasContent =
      formData.subject.trim() ||
      formData.companyName.trim() ||
      formData.items.some((it) => it.description.trim());

    if (hasContent) {
      const timer = setTimeout(async () => {
        try {
          const draftToSave = {
            ...formData,
            status: 'Draft' as const,
            updatedAt: new Date().toISOString(),
          };
          await saveDraftLetter(draftToSave);
          await saveLetter(draftToSave); // Ensure it also shows in Rekap Surat as Draft
          const now = new Date();
          setLastAutoSavedTime(
            `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
              now.getSeconds()
            ).padStart(2, '0')}`
          );
        } catch (e) {
          console.warn('Auto save error', e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  // 2. Intercept Android BACK button, browser back, window unload, and visibility change
  useEffect(() => {
    const saveCurrentAsDraft = async () => {
      const cur = formDataRef.current;
      const hasContent =
        cur.subject.trim() ||
        cur.companyName.trim() ||
        cur.items.some((it) => it.description.trim());

      if (hasContent) {
        const draftLetter = {
          ...cur,
          status: 'Draft' as const,
          updatedAt: new Date().toISOString(),
        };
        await saveDraftLetter(draftLetter);
        await saveLetter(draftLetter);
      }
    };

    const handleBeforeUnload = () => {
      saveCurrentAsDraft();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentAsDraft();
      }
    };

    // Push state to intercept Android hardware back button
    window.history.pushState({ formDrafting: true }, '');

    const handlePopState = async () => {
      await saveCurrentAsDraft();
      onToast('Surat tersimpan otomatis sebagai Draft di Rekap Surat');
      window.history.pushState({ formDrafting: true }, '');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      saveCurrentAsDraft();
    };
  }, [onToast]);

  // Calculations
  const subtotal = formData.items.reduce(
    (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  );

  const tradeInNominal =
    formData.tradeInActive && formData.tradeIn
      ? (Number(formData.tradeIn.qty) || 1) * (Number(formData.tradeIn.unitValue) || 0)
      : 0;

  const afterTradeIn = Math.max(0, subtotal - tradeInNominal);

  let discountNominal = 0;
  if (formData.discountActive) {
    if (formData.discountType === 'percent') {
      discountNominal = (afterTradeIn * (Number(formData.discountValue) || 0)) / 100;
    } else {
      discountNominal = Number(formData.discountValue) || 0;
    }
  }

  const dpp = Math.max(0, afterTradeIn - discountNominal);

  const ppnNominal = formData.ppnActive
    ? (dpp * (Number(formData.ppnPercent) || 11)) / 100
    : 0;

  const grandTotal = dpp + ppnNominal;

  // Handlers for Items
  const handleItemChange = (index: number, field: keyof OfferItem, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const target = { ...updated[index], [field]: value };
      if (field === 'qty' || field === 'price') {
        const q = field === 'qty' ? Number(value) || 0 : Number(target.qty) || 0;
        const p = field === 'price' ? Number(value) || 0 : Number(target.price) || 0;
        target.total = q * p;
      }
      updated[index] = target;
      return { ...prev, items: updated };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          description: '',
          qty: 1,
          satuan: 'unit',
          price: 0,
          total: 0,
        },
      ],
    }));
  };

  const handleDeleteItem = (index: number) => {
    if (formData.items.length <= 1) {
      onToast('Tabel penawaran minimal memiliki 1 baris');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= formData.items.length) return;
    setFormData((prev) => {
      const copy = [...prev.items];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, items: copy };
    });
  };

  // REQUIREMENT 1: AI NARRATIVE GENERATOR
  const requestAIGeneration = async () => {
    if (!formData.subject.trim()) {
      onToast('Harap isi Perihal terlebih dahulu sebelum menggunakan AI');
      return;
    }

    const defaultOp =
      'Bersama ini kami mengajukan surat penawaran harga, berikut ini daftar harga yang kami tawarkan :';
    const isCustomized =
      formData.openingParagraph && formData.openingParagraph.trim() !== defaultOp.trim();

    if (isCustomized) {
      setShowConfirmOverwrite(true);
      return;
    }

    executeAIGeneration();
  };

  const executeAIGeneration = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const res = await fetch('/api/generate-letter-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perihal: formData.subject,
          recipientName: formData.recipientName,
          companyName: formData.companyName,
          items: formData.items,
          tradeInActive: formData.tradeInActive,
          tradeInItem: formData.tradeIn.name,
          tradeInValue: tradeInNominal,
          discountActive: formData.discountActive,
          discountValue: discountNominal,
          ppnActive: formData.ppnActive,
          ppnPercent: formData.ppnPercent,
          total: grandTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyusun isi surat dengan AI');
      }

      setFormData((prev) => ({
        ...prev,
        openingParagraph: data.opening,
        closingParagraph: data.closing,
      }));

      onToast('Isi surat berhasil disusun oleh AI sesuai konteks pekerjaan!');
    } catch (err: any) {
      console.warn('AI error:', err);
      setAiError(
        err.message ||
          'Layanan AI belum dapat dihubungi. Anda tetap dapat mengisi atau mengedit narasi secara manual.'
      );
    } finally {
      setIsGeneratingAI(false);
      setShowConfirmOverwrite(false);
    }
  };

  // Save Document
  const handleSaveDocument = async () => {
    if (!formData.subject.trim()) {
      onToast('Perihal surat wajib diisi');
      return;
    }
    if (!formData.companyName.trim() && !formData.recipientName.trim()) {
      onToast('Tujuan surat (Nama Pelanggan/Perusahaan) wajib diisi');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="pb-36 pt-2 max-w-4xl mx-auto px-3 sm:px-4">
      {/* View Switcher Bar & Auto-save Status */}
      <div className="sticky top-15 z-30 bg-slate-100/95 backdrop-blur-xs py-2 flex items-center justify-between border-b border-slate-200 mb-4 gap-2 flex-wrap">
        <div className="flex bg-slate-200/90 p-1 rounded-xl shadow-inner w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('form')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'form'
                ? 'bg-white text-[#0b223d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Formulir Surat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'preview'
                ? 'bg-white text-[#0b223d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Langsung</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {lastAutoSavedTime && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Draft tersimpan {lastAutoSavedTime}</span>
            </div>
          )}

          {onResetToNew && (
            <button
              type="button"
              onClick={onResetToNew}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs"
              title="Mulai Surat Baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Surat Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB: LIVE PREVIEW */}
      {activeSubTab === 'preview' && (
        <div className="bg-slate-200/50 p-2 sm:p-4 rounded-2xl border border-slate-300 shadow-inner">
          <LetterPreview letter={formData} settings={settings} />
        </div>
      )}

      {/* SUB-TAB: EDIT FORM */}
      {activeSubTab === 'form' && (
        <div className="space-y-4">
          {/* SECTION A: IDENTITAS SURAT */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
            <h2 className="text-sm font-bold text-[#0b223d] uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600"></span>
              A. Identitas Surat
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.letterNumber}
                  onChange={(e) => setFormData({ ...formData, letterNumber: e.target.value })}
                  placeholder="016/10/MTA/2026"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.letterDate}
                  onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lampiran
                </label>
                <input
                  type="text"
                  value={formData.attachment}
                  onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
                  placeholder="-"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Dokumen
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-medium"
                >
                  <option value="Draft">Draft</option>
                  <option value="Terkirim">Terkirim</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Perihal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Contoh: Penawaran Harga Pekerjaan Instalasi dan Pengadaan AC"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION B: TUJUAN SURAT */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-4 rounded-full bg-blue-600"></span>
                B. Tujuan Surat (Kepada Yth.)
              </h2>
              <button
                type="button"
                onClick={() => setShowCustomerPicker(true)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pilih Pelanggan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penerima (Person In Charge)
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="Contoh: Ibu Lina"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Organisasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Contoh: PT. Takasago International Indonesia"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Perusahaan
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Kawasan Industri MM2100, Cikarang Barat..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Kota / Lokasi Tujuan
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Di Tempat / Bekasi / Bogor"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: TABEL PENAWARAN DINAMIS */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-blue-600"></span>
                  C. Tabel Penawaran Barang / Jasa
                </h2>
                <p className="text-[11px] text-slate-500">
                  Kolom: NO, DESKRIPSI, QTY, SATUAN, HARGA, TOTAL
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const itemTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/50 transition-all shadow-xs border-l-4 border-l-blue-600 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#0b223d] text-white text-xs font-extrabold flex items-center justify-center shadow-2xs">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Item #{index + 1} {item.description ? `• ${item.description}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, 'up')}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-20 rounded-lg hover:bg-slate-100 transition"
                          title="Pindah ke Atas"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === formData.items.length - 1}
                          onClick={() => handleMoveItem(index, 'down')}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-20 rounded-lg hover:bg-slate-100 transition"
                          title="Pindah ke Bawah"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg ml-1 transition"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Deskripsi Barang / Jasa <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Misal: AC FTKE 50 2pk inverter / Jasa instalasi pipa..."
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 text-center font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Satuan
                          </label>
                          <input
                            type="text"
                            value={item.satuan}
                            onChange={(e) => handleItemChange(index, 'satuan', e.target.value)}
                            placeholder="unit / meter / lot"
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 text-center font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Harga Satuan (Rp)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 text-slate-800 text-right font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 px-1 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500">Subtotal Item:</span>
                        <span className="text-xs font-extrabold text-blue-950">
                          Rp {formatNumberIndo(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baris Penawaran Baru</span>
            </button>
          </div>

          {/* SECTION D: FITUR TAMBAHAN (TRADE IN, DISKON, PPN) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
            <h2 className="text-sm font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600"></span>
              D. Fitur Tambahan (Opsional)
            </h2>

            {/* 1. TRADE IN */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">1. Trade In (Tukar Tambah)</div>
                  <div className="text-[11px] text-slate-500">Nilai trade in mengurangi subtotal penawaran</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tradeInActive}
                    onChange={(e) => setFormData({ ...formData, tradeInActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.tradeInActive && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nama Barang Trade In
                    </label>
                    <input
                      type="text"
                      value={formData.tradeIn.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tradeIn: { ...formData.tradeIn, name: e.target.value },
                        })
                      }
                      placeholder="AC Bekas 2 PK..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tradeIn.qty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tradeIn: { ...formData.tradeIn, qty: Number(e.target.value) || 1 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nilai Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.tradeIn.unitValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tradeIn: { ...formData.tradeIn, unitValue: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right"
                    />
                  </div>
                  <div className="sm:col-span-3 text-right text-[11px] font-bold text-red-600">
                    Total Potongan Trade In: -Rp {formatNumberIndo(tradeInNominal)}
                  </div>
                </div>
              )}
            </div>

            {/* 2. DISKON */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">2. Diskon Penawaran</div>
                  <div className="text-[11px] text-slate-500">Potongan harga dalam Rupiah atau persentase</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.discountActive}
                    onChange={(e) => setFormData({ ...formData, discountActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.discountActive && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tipe Diskon
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, discountType: 'nominal' })}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                          formData.discountType === 'nominal'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Rupiah (Rp)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, discountType: 'percent' })}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                          formData.discountType === 'percent'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Persen (%)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nilai Diskon ({formData.discountType === 'percent' ? '%' : 'Rp'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 text-right text-[11px] font-bold text-blue-900">
                    Nominal Diskon Diterapkan: Rp {formatNumberIndo(discountNominal)}
                  </div>
                </div>
              )}
            </div>

            {/* 3. PPN */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">3. Pajak Pertambahan Nilai (PPN)</div>
                  <div className="text-[11px] text-slate-500">Tarif fleksibel dihitung dari Dasar Pengenaan Pajak (DPP)</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ppnActive}
                    onChange={(e) => setFormData({ ...formData, ppnActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.ppnActive && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tarif PPN (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.ppnPercent}
                        onChange={(e) => setFormData({ ...formData, ppnPercent: Number(e.target.value) || 0 })}
                        className="w-24 px-3 py-2 rounded-lg border border-slate-300 bg-white text-center font-bold"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, ppnPercent: 11 })}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            formData.ppnPercent === 11 ? 'bg-blue-900 text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          11%
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, ppnPercent: 12 })}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            formData.ppnPercent === 12 ? 'bg-blue-900 text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          12%
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col justify-center">
                    <span className="text-[11px] text-slate-500">Nominal PPN ({formData.ppnPercent}%):</span>
                    <span className="text-sm font-bold text-slate-900">
                      Rp {formatNumberIndo(ppnNominal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION E: RINGKASAN PERHITUNGAN */}
          <div className="bg-[#0b223d] text-white rounded-2xl p-4 sm:p-5 shadow-lg space-y-2.5 text-xs">
            <h3 className="font-bold text-sm tracking-wide text-sky-200 uppercase border-b border-blue-900 pb-2">
              E. Ringkasan Perhitungan
            </h3>

            <div className="flex justify-between items-center text-slate-300">
              <span>Subtotal Penawaran:</span>
              <span className="font-bold text-white">Rp {formatNumberIndo(subtotal)}</span>
            </div>

            {formData.tradeInActive && (
              <div className="flex justify-between items-center text-amber-300">
                <span>Nilai Trade In:</span>
                <span className="font-bold">-Rp {formatNumberIndo(tradeInNominal)}</span>
              </div>
            )}

            {formData.discountActive && (
              <div className="flex justify-between items-center text-sky-300">
                <span>Diskon:</span>
                <span className="font-bold">-Rp {formatNumberIndo(discountNominal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-300 border-t border-blue-900/60 pt-1.5">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-semibold text-white">Rp {formatNumberIndo(dpp)}</span>
            </div>

            {formData.ppnActive && (
              <div className="flex justify-between items-center text-emerald-300">
                <span>PPN ({formData.ppnPercent}%):</span>
                <span className="font-bold">+Rp {formatNumberIndo(ppnNominal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-extrabold text-white bg-blue-950/80 p-3 rounded-xl border border-sky-400/30">
              <span className="text-amber-300 uppercase">TOTAL AKHIR:</span>
              <span className="text-lg text-emerald-300">Rp {formatNumberIndo(grandTotal)}</span>
            </div>
          </div>

          {/* REQUIREMENT 1: TOMBOL GENERATE ISI SURAT DENGAN AI (TEPAT DI BAWAH RINGKASAN PERHITUNGAN) */}
          <div className="bg-gradient-to-br from-indigo-950 via-[#0b223d] to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
                  <h3 className="text-sm font-bold tracking-wide">
                    F. Fitur AI Pembuat Isi Surat
                  </h3>
                </div>
                <p className="text-[11px] text-sky-200 mt-0.5">
                  Menyusun pembuka & penutup surat formal profesional sesuai transaksi di atas
                </p>
              </div>

              {/* GENERATE / PERBARUI ISI SURAT DENGAN AI BUTTON */}
              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={requestAIGeneration}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-extrabold px-5 py-3 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Menyusun Narasi dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>GENERATE / PERBARUI ISI SURAT DENGAN AI</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Overwrite Confirmation Warning */}
            {showConfirmOverwrite && (
              <div className="mb-3 p-3.5 rounded-xl bg-blue-950/90 border border-amber-400/60 text-xs space-y-2">
                <p className="text-amber-200 font-semibold leading-relaxed">
                  Isi pembuka surat sudah pernah Anda sesuaikan secara manual. Apakah Anda yakin ingin memperbaruinya secara otomatis dengan narasi AI baru?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={executeAIGeneration}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs"
                  >
                    Ya, Perbarui dengan AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmOverwrite(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Editable Paragraph Textareas */}
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sky-200 font-semibold">
                    Paragraf Pembuka Surat (Bisa Diedit Manual):
                  </label>
                  <span className="text-[10px] text-sky-300/80">Hasil AI dapat diubah langsung</span>
                </div>
                <textarea
                  rows={2}
                  value={formData.openingParagraph}
                  onChange={(e) => setFormData({ ...formData, openingParagraph: e.target.value })}
                  placeholder="Bersama ini kami mengajukan surat penawaran harga..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-sky-300/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sky-200 font-semibold">
                    Paragraf Penutup Surat (Bisa Diedit Manual):
                  </label>
                  <span className="text-[10px] text-sky-300/80">Hasil AI dapat diubah langsung</span>
                </div>
                <textarea
                  rows={3}
                  value={formData.closingParagraph}
                  onChange={(e) => setFormData({ ...formData, closingParagraph: e.target.value })}
                  placeholder="Demikian Penawaran harga ini kami sampaikan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-sky-300/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PICKER MODAL */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-[#0b223d]">Pilih Data Pelanggan</h3>
              <button
                type="button"
                onClick={() => setShowCustomerPicker(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Cari nama perusahaan atau kontak..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {customers
                .filter(
                  (c) =>
                    c.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.recipientName.toLowerCase().includes(customerSearch.toLowerCase())
                )
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        companyName: c.companyName,
                        recipientName: c.recipientName,
                        address: c.address,
                        city: c.city || prev.city,
                      }));
                      setShowCustomerPicker(false);
                      onToast(`Pelanggan "${c.companyName}" terpilih`);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition text-xs"
                  >
                    <div className="font-bold text-slate-800">{c.companyName}</div>
                    <div className="text-slate-600">{c.recipientName || '-'}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.address}</div>
                  </div>
                ))}

              {customers.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Belum ada pelanggan tersimpan. Tambahkan di menu Data Pelanggan.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCustomerPicker(false)}
              className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM ACTION BAR
          1. SIMPAN SURAT
          2. DOWNLOAD PDF
          3. BAGIKAN PDF (Opens WhatsApp / Email Share Modal)
          4. PREVIEW PDF
      */}
      <div className="fixed bottom-15 left-0 right-0 z-30 bg-[#0b223d]/95 backdrop-blur-md border-t border-blue-900/80 px-3 py-2 shadow-[0_-8px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-2">
          {/* 1. SIMPAN SURAT */}
          <button
            type="button"
            onClick={handleSaveDocument}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2.5 px-1 rounded-xl shadow transition active:scale-95 text-center"
            title="Simpan data surat ke IndexedDB perangkat"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span className="text-[10px] sm:text-xs tracking-tight leading-none">Simpan</span>
          </button>

          {/* 2. DOWNLOAD PDF */}
          <button
            type="button"
            onClick={() => onDownloadPDF(formData)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold py-2.5 px-1 rounded-xl border border-slate-600 shadow transition active:scale-95 text-center"
            title="Cetak & Unduh file PDF A4 resmi"
          >
            <Download className="w-4 h-4 shrink-0 text-sky-400" />
            <span className="text-[10px] sm:text-xs tracking-tight leading-none">Download</span>
          </button>

          {/* 3. BAGIKAN PDF */}
          <button
            type="button"
            onClick={() => onSharePDF(formData)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold py-2.5 px-1 rounded-xl shadow transition active:scale-95 text-center"
            title="Pilih mau bagikan ke WhatsApp atau Email dengan file PDF terlampir"
          >
            <Share2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span className="text-[10px] sm:text-xs tracking-tight leading-none">Bagikan</span>
          </button>

          {/* 4. PREVIEW PDF */}
          <button
            type="button"
            onClick={() => onPreviewPDF(formData)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold py-2.5 px-1 rounded-xl shadow transition active:scale-95 text-center"
            title="Tampilkan dokumen sebelum dicetak atau dibagikan"
          >
            <Eye className="w-4 h-4 shrink-0 text-slate-950" />
            <span className="text-[10px] sm:text-xs tracking-tight leading-none">Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
