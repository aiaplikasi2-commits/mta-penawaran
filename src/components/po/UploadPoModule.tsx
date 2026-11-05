import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  FileText,
  Sparkles,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  History,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import type { PurchaseOrderData, PoItem } from '../../types/po.ts';
import { PoVerificationForm } from './PoVerificationForm.tsx';
import { PoAiChat } from './PoAiChat.tsx';
import { PoHistoryList } from './PoHistoryList.tsx';
import {
  getAllPurchaseOrders,
  savePurchaseOrder,
  deletePurchaseOrder,
} from '../../services/poDb.ts';
import { subscribePurchaseOrders } from '../../services/cloudSync.ts';

interface UploadPoModuleProps {
  onNavigateToInvoice?: (po: PurchaseOrderData) => void;
  onNavigateToBast?: (po: PurchaseOrderData) => void;
}

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  type: string;
  base64: string;
}

export const UploadPoModule: React.FC<UploadPoModuleProps> = ({
  onNavigateToInvoice,
  onNavigateToBast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<PurchaseOrderData | null>(null);
  const [savedPos, setSavedPos] = useState<PurchaseOrderData[]>([]);
  const [showAiChat, setShowAiChat] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time Firestore POs
  useEffect(() => {
    // Initial fetch from local IDB
    getAllPurchaseOrders().then((list) => {
      if (list && list.length > 0) {
        setSavedPos(list);
      }
    });

    // Subscribe to Firestore updates
    const unsubscribe = subscribePurchaseOrders((list) => {
      setSavedPos(list);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const compressAndConvertFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesChosen = async (files: FileList | File[]) => {
    setExtractError(null);
    const newFiles: SelectedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
        alert(`File "${f.name}" bukan format yang didukung. Harap pilih gambar (JPG/PNG) atau PDF.`);
        continue;
      }

      try {
        const base64 = await compressAndConvertFile(f);
        newFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          file: f,
          previewUrl: f.type.startsWith('image/') ? base64 : '',
          name: f.name,
          type: f.type.startsWith('image/') ? 'image/jpeg' : f.type,
          base64,
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleManualEntry = () => {
    const blankPo: PurchaseOrderData = {
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nomorPo: '',
      tanggalPo: new Date().toISOString().split('T')[0],
      buyerCompany: '',
      buyerAddress: '',
      buyerPhone: '',
      picName: '',
      vendorCompany: 'CV. MULIA TEKHNIK ABADI',
      items: [
        {
          id: `item-${Date.now()}-1`,
          itemNo: 1,
          itemCode: '',
          itemName: '',
          itemSpec: '',
          qty: 1,
          satuan: 'UNIT',
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
      subtotal: 0,
      discount: 0,
      discountPercent: 0,
      ppnPercent: 0,
      ppnValue: 0,
      grandTotal: 0,
      currency: 'IDR',
      fileName: selectedFiles[0]?.name,
      fileType: selectedFiles[0]?.type,
      fileDataUrl: selectedFiles[0]?.base64,
      confidenceScore: 'high',
      unclearFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExtractedData(blankPo);
    setExtractError(null);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleStartExtraction = async () => {
    if (selectedFiles.length === 0) {
      alert('Pilih setidaknya 1 berkas gambar atau PDF dokumen PO terlebih dahulu.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setSaveSuccessMsg(null);

    try {
      // Send files to backend Gemini OCR endpoint with both base64 and base64Data
      const payloadFiles = selectedFiles.map((sf) => ({
        base64: sf.base64,
        base64Data: sf.base64,
        mimeType: sf.type.startsWith('image/') ? 'image/jpeg' : sf.type,
      }));

      const res = await fetch('/api/po/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payloadFiles }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server OCR mengembalikan kode error ${res.status}`);
      }

      const resData = await res.json();
      if (!resData.data) {
        throw new Error('Hasil ekstraksi data PO kosong');
      }

      const raw = resData.data;

      // Construct a full PurchaseOrderData object
      const poObj: PurchaseOrderData = {
        id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nomorPo: raw.nomorPo || '',
        tanggalPo: raw.tanggalPo || new Date().toISOString().split('T')[0],
        buyerCompany: raw.buyerCompany || '',
        buyerAddress: raw.buyerAddress || '',
        buyerPhone: raw.buyerPhone || '',
        picName: raw.picName || '',
        vendorCompany: raw.vendorCompany || 'CV. MULIA TEKHNIK ABADI',

        items: Array.isArray(raw.items)
          ? raw.items.map((it: any, idx: number) => ({
              id: `item-${Date.now()}-${idx}`,
              itemNo: it.itemNo || idx + 1,
              itemCode: it.itemCode || '',
              itemName: it.itemName || '',
              itemSpec: it.itemSpec || '',
              qty: Number(it.qty) || 1,
              satuan: (it.satuan || 'UNIT').toUpperCase(),
              unitPrice: Number(it.unitPrice) || 0,
              totalPrice: Number(it.totalPrice) || (Number(it.qty) || 1) * (Number(it.unitPrice) || 0),
            }))
          : [],

        subtotal: Number(raw.subtotal) || 0,
        discount: Number(raw.discount) || 0,
        discountPercent: Number(raw.discountPercent) || 0,
        ppnPercent: Number(raw.ppnPercent) || 0,
        ppnValue: Number(raw.ppnValue) || 0,
        grandTotal: Number(raw.grandTotal) || 0,
        currency: raw.currency || 'IDR',

        deliveryDate: raw.deliveryDate || '',
        paymentTerms: raw.paymentTerms || '',
        deliveryAddress: raw.deliveryAddress || '',
        notes: raw.notes || '',
        hasSignature: Boolean(raw.hasSignature),
        hasStamp: Boolean(raw.hasStamp),

        // Attach first file thumbnail/dataUrl
        fileName: selectedFiles[0]?.name,
        fileType: selectedFiles[0]?.type,
        fileDataUrl: selectedFiles[0]?.base64,

        confidenceScore: raw.confidenceScore || 'medium',
        unclearFields: raw.unclearFields || [],

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Recalculate subtotal/grandTotal if items present and grandTotal was 0
      if (poObj.items.length > 0 && poObj.grandTotal === 0) {
        const itemSum = poObj.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
        poObj.subtotal = poObj.subtotal || itemSum;
        poObj.grandTotal = Math.max(0, poObj.subtotal - poObj.discount + (poObj.ppnValue || 0));
      }

      // Check if server included an AI notice banner
      if (raw.aiNotice) {
        setExtractError(raw.aiNotice);
      }

      setExtractedData(poObj);
    } catch (err: any) {
      console.warn('Extraction notice:', err?.message || err);
      // Gracefully prepare the verification form with the uploaded files attached
      const fallbackPo: PurchaseOrderData = {
        id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nomorPo: '',
        tanggalPo: new Date().toISOString().split('T')[0],
        buyerCompany: '',
        buyerAddress: '',
        buyerPhone: '',
        picName: '',
        vendorCompany: 'CV. MULIA TEKHNIK ABADI',
        items: [
          {
            id: `item-${Date.now()}-1`,
            itemNo: 1,
            itemCode: '',
            itemName: 'Item sesuai dokumen lampiran',
            itemSpec: '',
            qty: 1,
            satuan: 'UNIT',
            unitPrice: 0,
            totalPrice: 0,
          },
        ],
        subtotal: 0,
        discount: 0,
        discountPercent: 0,
        ppnPercent: 0,
        ppnValue: 0,
        grandTotal: 0,
        currency: 'IDR',
        fileName: selectedFiles[0]?.name,
        fileType: selectedFiles[0]?.type,
        fileDataUrl: selectedFiles[0]?.base64,
        confidenceScore: 'low',
        unclearFields: ['nomorPo', 'buyerCompany', 'items', 'grandTotal'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setExtractedData(fallbackPo);
      setExtractError(
        err?.message ||
          'Layanan AI sementara sedang dalam antrean padat. Formulir telah disiapkan dengan lampiran dokumen untuk Anda lengkapi secara manual.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSavePo = async (dataToSave: PurchaseOrderData) => {
    await savePurchaseOrder(dataToSave);
    setSaveSuccessMsg(`Purchase Order "${dataToSave.nomorPo}" berhasil disimpan ke Cloud Database!`);
    setExtractedData(null);
    setSelectedFiles([]);
    setActiveTab('history');
  };

  const handleDeletePo = async (id: string, poNum: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus PO "${poNum}" secara permanen dari server database?`)) {
      setSavedPos((prev) => prev.filter((p) => p.id !== id));
      try {
        await deletePurchaseOrder(id);
      } catch (err: any) {
        alert(`Gagal menghapus: ${err.message}`);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-800 rounded-3xl p-5 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-blue-950 font-bold text-xs rounded-full shadow-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Document Understanding & OCR</span>
          </div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
            Upload & Ekstraksi Purchase Order (PO)
          </h1>
          <p className="mt-2 text-xs md:text-sm text-blue-100 leading-relaxed">
            Pindai dokumen PO dari klien secara otomatis menggunakan kecerdasan buatan. Sistem membaca nomor PO, tabel rincian barang, total biaya, syarat pembayaran, dan langsung tersinkron ke Cloud Database online.
          </p>
        </div>

        {/* Decorative Background Icon */}
        <div className="absolute right-4 bottom-2 text-white/10 hidden md:block pointer-events-none">
          <FileText className="w-48 h-48" />
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs md:text-sm font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setSaveSuccessMsg(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload & Ekstraksi Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat PO Tersimpan</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-200 text-slate-800 font-bold ml-1">
            {savedPos.length}
          </span>
        </button>
      </div>

      {/* TAB 1: UPLOAD & VERIFIKASI */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {!extractedData ? (
            /* Upload & Capture Card */
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-base md:text-lg font-bold text-gray-900">
                  Unggah Dokumen Purchase Order
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: JPG, JPEG, PNG, dan PDF (dapat memilih beberapa halaman sekaligus atau ambil foto langsung).
                </p>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesChosen(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesChosen(e.target.files);
                  e.target.value = '';
                }}
              />

              {/* Dropzone & Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File picker dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center transition mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-800">
                    Pilih File dari Perangkat
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1">
                    Klik untuk memilih gambar atau dokumen PDF
                  </span>
                </div>

                {/* Camera Capture */}
                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-800">
                    Foto Langsung Menggunakan Kamera
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1">
                    Buka kamera HP atau webcam untuk memotret fisik PO
                  </span>
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Berkas Terpilih ({selectedFiles.length}):</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Hapus Semua
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedFiles.map((sf) => (
                      <div
                        key={sf.id}
                        className="relative bg-slate-50 border border-gray-200 rounded-xl p-2.5 flex flex-col items-center group overflow-hidden"
                      >
                        {sf.previewUrl ? (
                          <img
                            src={sf.previewUrl}
                            alt={sf.name}
                            className="w-full h-24 object-cover rounded-lg mb-2 shadow-2xs"
                          />
                        ) : (
                          <div className="w-full h-24 bg-red-50 text-red-600 rounded-lg flex flex-col items-center justify-center mb-2">
                            <FileText className="w-8 h-8" />
                            <span className="text-[10px] font-bold mt-1 uppercase">PDF</span>
                          </div>
                        )}
                        <p className="text-[11px] font-medium text-gray-800 truncate w-full text-center">
                          {sf.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(sf.id)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition opacity-80 group-hover:opacity-100"
                          title="Hapus berkas"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Extract Button & Manual Fallback */}
                  <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleManualEntry}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs md:text-sm font-semibold transition active:scale-95 border border-slate-200"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-500" />
                      <span>Input / Edit Manual</span>
                    </button>

                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleStartExtraction}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menganalisis Dokumen PO dengan AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          <span>Mulai Ekstraksi AI & OCR</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Extraction Error with Instant Manual Form Action */}
              {extractError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 text-xs md:text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Gagal Mengekstrak Dokumen</h4>
                      <p className="mt-0.5 text-xs text-red-800">{extractError}</p>
                      <p className="mt-1 text-[11px] text-gray-600">
                        Anda dapat mencoba lagi atau langsung mengisi formulir PO secara manual dari berkas yang diunggah.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualEntry}
                    className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Lanjutkan Isi Form Manual
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Verification & AI Chat Workspace */
            <div className="space-y-6">
              {/* Top Banner Verification Mode */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-gray-900">
                      Verifikasi Data Hasil Ekstraksi AI
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Periksa dan sesuaikan data sebelum menyimpan ke Database Cloud
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAiChat(!showAiChat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      showAiChat
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{showAiChat ? 'Sembunyikan AI Chat' : 'Buka AI Chat'}</span>
                  </button>
                </div>
              </div>

              {/* Layout: Verification Form + AI Chat */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Cols: Verification Form */}
                <div className={showAiChat ? 'lg:col-span-2' : 'lg:col-span-3'}>
                  <PoVerificationForm
                    initialData={extractedData}
                    onSave={handleSavePo}
                    onReExtract={handleStartExtraction}
                    onCancel={() => {
                      if (confirm('Batalkan hasil ekstraksi ini dan kembali ke pemilihan berkas?')) {
                        setExtractedData(null);
                      }
                    }}
                  />
                </div>

                {/* Right 1 Col: AI Chat (Sticky) */}
                {showAiChat && (
                  <div className="lg:col-span-1 lg:sticky lg:top-4">
                    <PoAiChat poData={extractedData} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT PO */}
      {activeTab === 'history' && (
        <PoHistoryList
          purchaseOrders={savedPos}
          onSelectPo={(po) => {
            setExtractedData(po);
            setActiveTab('upload');
          }}
          onDeletePo={handleDeletePo}
          onNavigateToInvoice={onNavigateToInvoice}
          onNavigateToBast={onNavigateToBast}
        />
      )}
    </div>
  );
};
