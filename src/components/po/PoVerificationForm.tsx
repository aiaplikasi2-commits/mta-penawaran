import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Building,
  Calendar,
  FileText,
  DollarSign,
  Truck,
  CheckSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import type { PurchaseOrderData, PoItem } from '../../types/po.ts';
import { PoItemsTable } from './PoItemsTable.tsx';
import { checkDuplicatePo } from '../../services/poDb.ts';

interface PoVerificationFormProps {
  initialData: PurchaseOrderData;
  onSave: (data: PurchaseOrderData) => Promise<void>;
  onReExtract: () => void;
  onCancel: () => void;
}

export const PoVerificationForm: React.FC<PoVerificationFormProps> = ({
  initialData,
  onSave,
  onReExtract,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PurchaseOrderData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [ppnPreset, setPpnPreset] = useState<string>(
    initialData.ppnPercent === 11 ? '11' : initialData.ppnPercent === 12 ? '12' : initialData.ppnPercent === 0 ? '0' : 'custom'
  );

  // Sync when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Check duplicate PO number
  useEffect(() => {
    let active = true;
    if (formData.nomorPo && formData.nomorPo.trim()) {
      checkDuplicatePo(formData.nomorPo, formData.id).then((dup) => {
        if (active) setIsDuplicate(dup);
      });
    } else {
      setIsDuplicate(false);
    }
    return () => {
      active = false;
    };
  }, [formData.nomorPo, formData.id]);

  const handleChange = (field: keyof PurchaseOrderData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // If discount or ppn changed, recalculate grandTotal
      if (
        field === 'subtotal' ||
        field === 'discount' ||
        field === 'ppnPercent' ||
        field === 'ppnValue'
      ) {
        const sub = field === 'subtotal' ? parseFloat(value) || 0 : next.subtotal || 0;
        const disc = field === 'discount' ? parseFloat(value) || 0 : next.discount || 0;
        const baseAfterDisc = Math.max(0, sub - disc);
        const ppnVal =
          field === 'ppnValue'
            ? parseFloat(value) || 0
            : (baseAfterDisc * (next.ppnPercent || 0)) / 100;
        next.ppnValue = Math.round(ppnVal);
        next.grandTotal = Math.round(baseAfterDisc + next.ppnValue);
      }

      return next;
    });
  };

  const handleItemsChange = (newItems: PoItem[]) => {
    const calculatedSubtotal = newItems.reduce(
      (sum, item) => sum + (item.totalPrice || (item.qty || 0) * (item.unitPrice || 0)),
      0
    );

    const disc = formData.discount || 0;
    const baseAfterDisc = Math.max(0, calculatedSubtotal - disc);
    const ppnRate = formData.ppnPercent || 0;
    const ppnVal = Math.round((baseAfterDisc * ppnRate) / 100);
    const grand = Math.round(baseAfterDisc + ppnVal);

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      subtotal: calculatedSubtotal,
      ppnValue: ppnVal,
      grandTotal: grand,
    }));
  };

  const handlePpnPresetChange = (preset: string) => {
    setPpnPreset(preset);
    let rate = 0;
    if (preset === '11') rate = 11;
    else if (preset === '12') rate = 12;
    else if (preset === '0') rate = 0;
    else rate = formData.ppnPercent || 0;

    const sub = formData.subtotal || 0;
    const disc = formData.discount || 0;
    const base = Math.max(0, sub - disc);
    const val = Math.round((base * rate) / 100);

    setFormData((prev) => ({
      ...prev,
      ppnPercent: rate,
      ppnValue: val,
      grandTotal: Math.round(base + val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorPo.trim()) {
      alert('Nomor PO wajib diisi!');
      return;
    }
    if (!formData.buyerCompany.trim()) {
      alert('Nama Perusahaan Penerbit PO (Buyer) wajib diisi!');
      return;
    }

    if (isDuplicate) {
      const confirmSave = confirm(
        `PERINGATAN: Nomor PO "${formData.nomorPo}" sudah pernah tersimpan dalam database. Apakah Anda yakin ingin tetap menyimpan atau memperbarui data ini?`
      );
      if (!confirmSave) return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert(`Gagal menyimpan PO: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: formData.currency || 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Confidence / Unclear Fields Alert */}
      {formData.confidenceScore && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            formData.confidenceScore === 'high'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : formData.confidenceScore === 'medium'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs md:text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <span>Hasil Pembacaan Dokumen AI:</span>
              <span className="uppercase px-2 py-0.5 rounded text-[11px] font-bold bg-white/70">
                Akurasi {formData.confidenceScore}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-90">
              Silakan periksa kembali data di bawah ini sebelum menyimpan ke Cloud Database.
            </p>
            {formData.unclearFields && formData.unclearFields.length > 0 && (
              <div className="mt-2 text-xs font-medium text-rose-700 bg-white/80 p-2 rounded-lg border border-rose-200">
                ⚠️ Bidang yang perlu perhatian khusus:{' '}
                <span className="font-semibold">{formData.unclearFields.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate PO Warning Banner */}
      {isDuplicate && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border-2 border-amber-500 text-amber-900 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs md:text-sm">
            <h4 className="font-bold text-amber-900">Perhatian: Nomor PO Terdeteksi Ganda!</h4>
            <p className="mt-0.5 text-xs text-amber-800">
              Nomor PO <strong>&quot;{formData.nomorPo}&quot;</strong> sudah ada di database. Pastikan tidak terjadi duplikasi pesanan.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Informasi Utama */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-slate-800">
          <Building className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-sm md:text-base">1. Informasi Utama Purchase Order</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs md:text-sm">
          {/* Nomor PO */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Nomor PO <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nomorPo}
              onChange={(e) => handleChange('nomorPo', e.target.value)}
              placeholder="Contoh: PO/2026/XI/001"
              className={`w-full px-3 py-2 border rounded-xl font-mono font-medium focus:ring-2 focus:ring-blue-500 ${
                isDuplicate ? 'border-amber-500 bg-amber-50/30' : 'border-gray-200'
              }`}
            />
          </div>

          {/* Tanggal PO */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Tanggal PO <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.tanggalPo}
              onChange={(e) => handleChange('tanggalPo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nama Perusahaan Pemesan */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Perusahaan Penerbit (Buyer) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.buyerCompany}
              onChange={(e) => handleChange('buyerCompany', e.target.value)}
              placeholder="PT. / CV. Nama Perusahaan"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* PIC / Attention */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">PIC / Attention</label>
            <input
              type="text"
              value={formData.picName || ''}
              onChange={(e) => handleChange('picName', e.target.value)}
              placeholder="Nama PIC penerbit"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Telepon */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">No. Telepon / Fax</label>
            <input
              type="text"
              value={formData.buyerPhone || ''}
              onChange={(e) => handleChange('buyerPhone', e.target.value)}
              placeholder="Nomor kontak"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Vendor */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Supplier / Vendor Tujuan</label>
            <input
              type="text"
              value={formData.vendorCompany || 'CV. MULIA TEKHNIK ABADI'}
              onChange={(e) => handleChange('vendorCompany', e.target.value)}
              placeholder="Nama Vendor"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Alamat Buyer */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block font-medium text-gray-700 mb-1">Alamat Perusahaan Buyer</label>
            <textarea
              rows={2}
              value={formData.buyerAddress || ''}
              onChange={(e) => handleChange('buyerAddress', e.target.value)}
              placeholder="Alamat lengkap penerbit PO..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Tabel Barang & Jasa */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <PoItemsTable
          items={formData.items || []}
          onChange={handleItemsChange}
          currency={formData.currency}
        />
      </div>

      {/* Section 3: Ringkasan Nilai Finansial */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-slate-800">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm md:text-base">2. Ringkasan Finansial PO</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs md:text-sm">
          {/* Subtotal */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Subtotal Nilai PO</label>
            <input
              type="number"
              min="0"
              value={formData.subtotal || 0}
              onChange={(e) => handleChange('subtotal', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">{formatCurrency(formData.subtotal || 0)}</p>
          </div>

          {/* Diskon */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Potongan / Diskon (Rp)</label>
            <input
              type="number"
              min="0"
              value={formData.discount || 0}
              onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">{formatCurrency(formData.discount || 0)}</p>
          </div>

          {/* PPN % */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">PPN (%)</label>
            <div className="flex gap-2">
              <select
                value={ppnPreset}
                onChange={(e) => handlePpnPresetChange(e.target.value)}
                className="w-28 px-2 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-medium"
              >
                <option value="0">0% (Bebas)</option>
                <option value="11">11%</option>
                <option value="12">12%</option>
                <option value="custom">Manual</option>
              </select>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.ppnPercent ?? 0}
                onChange={(e) => {
                  setPpnPreset('custom');
                  handleChange('ppnPercent', parseFloat(e.target.value) || 0);
                }}
                disabled={ppnPreset !== 'custom'}
                className="flex-1 px-2 py-2 border border-gray-200 rounded-xl text-center disabled:bg-gray-100 font-semibold"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Nilai: {formatCurrency(formData.ppnValue || 0)}
            </p>
          </div>

          {/* Grand Total */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-blue-900">Grand Total PO</span>
            <span className="text-lg md:text-xl font-bold text-blue-700 mt-1">
              {formatCurrency(formData.grandTotal || 0)}
            </span>
            <span className="text-[10px] text-blue-600 mt-0.5">
              {formData.currency || 'IDR'} (Termasuk Pajak & Potongan)
            </span>
          </div>
        </div>
      </div>

      {/* Section 4: Ketentuan & Detail Pengiriman */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-slate-800">
          <Truck className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm md:text-base">3. Syarat Pembayaran & Pengiriman</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs md:text-sm">
          {/* Tanggal Kirim */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Tanggal / Batas Pengiriman
            </label>
            <input
              type="text"
              value={formData.deliveryDate || ''}
              onChange={(e) => handleChange('deliveryDate', e.target.value)}
              placeholder="Contoh: 14 Hari Kerja / YYYY-MM-DD"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Syarat Pembayaran */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Syarat Pembayaran (Terms of Payment)
            </label>
            <input
              type="text"
              value={formData.paymentTerms || ''}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              placeholder="Contoh: Net 30 Hari / COD / DP 50%"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Tanda Tangan & Cap */}
          <div className="flex items-center gap-4 pt-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasSignature ?? false}
                onChange={(e) => handleChange('hasSignature', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">Tanda Tangan Terdeteksi</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasStamp ?? false}
                onChange={(e) => handleChange('hasStamp', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">Cap Basah Terdeteksi</span>
            </label>
          </div>

          {/* Alamat Pengiriman */}
          <div className="md:col-span-2">
            <label className="block font-medium text-gray-700 mb-1">
              Alamat Pengiriman / Site Pekerjaan
            </label>
            <textarea
              rows={2}
              value={formData.deliveryAddress || ''}
              onChange={(e) => handleChange('deliveryAddress', e.target.value)}
              placeholder="Lokasi pengiriman barang atau instalasi..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Catatan / Keterangan PO */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block font-medium text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Instruksi khusus dari buyer..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs md:text-sm font-semibold transition active:scale-95 shadow-xs"
          >
            Batal / Upload Dokumen Lain
          </button>
          <button
            type="button"
            onClick={onReExtract}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs md:text-sm font-semibold transition active:scale-95 shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Baca Ulang dengan AI</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <span>Menyimpan ke Cloud...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan PO ke Database Cloud</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
