import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import type { InvoiceData, InvoiceItem } from '../../types/invoice.ts';
import type { CompanySettings, Customer, LetterData } from '../../types/index.ts';
import { angkaKeTerbilang, generateNomorInvoiceBaru } from '../../services/invoiceDb.ts';
import { formatNumberIndo } from '../../services/pdfGenerator.ts';

interface FormInvoiceProps {
  initialInvoice?: InvoiceData | null;
  settings: CompanySettings;
  customers: Customer[];
  letters: LetterData[];
  onSave: (invoice: InvoiceData) => Promise<void>;
  onPreview: (invoice: InvoiceData) => void;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export const FormInvoice: React.FC<FormInvoiceProps> = ({
  initialInvoice,
  settings,
  customers,
  letters,
  onSave,
  onPreview,
  onBack,
  onToast,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form States
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || generateNomorInvoiceBaru()
  );
  const [invoiceDate, setInvoiceDate] = useState(initialInvoice?.invoiceDate || todayStr);
  const [nomorPo, setNomorPo] = useState(initialInvoice?.nomorPo || '');

  // Kepada (Klien)
  const [companyName, setCompanyName] = useState(initialInvoice?.companyName || '');
  const [recipientName, setRecipientName] = useState(initialInvoice?.recipientName || '');
  const [address, setAddress] = useState(initialInvoice?.address || '');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            id: `item-${Date.now()}-1`,
            description: '',
            qty: 1,
            satuan: 'unit',
            price: 0,
            total: 0,
          },
        ]
  );

  // Trade-In
  const [tradeInActive, setTradeInActive] = useState<boolean>(
    initialInvoice?.tradeInActive ?? false
  );
  const [tradeInName, setTradeInName] = useState<string>(
    initialInvoice?.tradeInName || 'Trade In Barang Bekas'
  );
  const [tradeInValue, setTradeInValue] = useState<number>(
    initialInvoice?.tradeInValue || 0
  );

  // Bank Info
  const [bankName, setBankName] = useState<string>(
    initialInvoice?.bankName || settings.bankName || 'Mandiri'
  );
  const [bankAccountName, setBankAccountName] = useState<string>(
    initialInvoice?.bankAccountName || settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState<string>(
    initialInvoice?.bankAccountNumber || settings.bankAccountNumber || '167-00-0529426-8'
  );

  const [status, setStatus] = useState<'Belum Lunas' | 'Lunas' | 'Draft'>(
    initialInvoice?.status || 'Belum Lunas'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const effectiveTradeIn = tradeInActive ? Number(tradeInValue) || 0 : 0;
  const total = Math.max(0, subtotal - effectiveTradeIn);
  const terbilang = angkaKeTerbilang(total);

  // Item Handlers
  const handleItemChange = (
    id: string,
    field: 'description' | 'qty' | 'satuan' | 'price',
    val: any
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'qty' || field === 'price') {
          const q = Number(field === 'qty' ? val : updated.qty) || 0;
          const p = Number(field === 'price' ? val : updated.price) || 0;
          updated.total = q * p;
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: '',
        qty: 1,
        satuan: 'unit',
        price: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      onToast('Minimal 1 item');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Import from Customer Database
  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if (!custId) return;
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setCompanyName(cust.companyName);
      setRecipientName(cust.recipientName);
      setAddress(cust.address);
      onToast(`Data ${cust.companyName} disalin`);
    }
    e.target.value = '';
  };

  // Import from Surat Penawaran
  const handleImportFromLetter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const letterId = e.target.value;
    if (!letterId) return;
    const letter = letters.find((l) => l.id === letterId);
    if (letter) {
      setCompanyName(letter.companyName);
      setRecipientName(letter.recipientName);
      setAddress(letter.address);
      if (letter.subject && !nomorPo) {
        setNomorPo(letter.subject);
      }
      if (letter.items && letter.items.length > 0) {
        setItems(
          letter.items.map((it, idx) => ({
            id: `inv-imp-${Date.now()}-${idx}`,
            description: it.description,
            qty: it.qty,
            satuan: it.satuan || 'unit',
            price: it.price,
            total: it.total,
          }))
        );
      }
      if (letter.tradeInActive && letter.tradeIn) {
        setTradeInActive(true);
        setTradeInName(letter.tradeIn.name || 'Trade In Barang Bekas');
        setTradeInValue(letter.tradeIn.totalValue || 0);
      }
      onToast(`Data dari ${letter.letterNumber} disalin`);
    }
    e.target.value = '';
  };

  // Build Invoice Data Object
  const getCurrentInvoiceObject = (): InvoiceData => {
    return {
      id: initialInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      nomorPo: nomorPo.trim(),
      companyName: companyName.trim(),
      recipientName: recipientName.trim(),
      address: address.trim(),
      items: items.filter((it) => it.description.trim().length > 0),
      tradeInActive,
      tradeInName: tradeInName.trim(),
      tradeInValue: effectiveTradeIn,
      discountActive: false,
      discountValue: 0,
      ppnActive: false,
      ppnPercent: 11,
      subtotal,
      total,
      terbilang,
      bankName: bankName.trim(),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      signatoryName: settings.signatoryName || 'MUHAMAD RIDHO',
      status,
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      onToast('Nomor invoice wajib diisi');
      return;
    }
    if (!companyName.trim()) {
      onToast('Nama PT klien wajib diisi');
      return;
    }
    if (items.length === 0 || !items.some((it) => it.description.trim())) {
      onToast('Masukkan minimal 1 item uraian pekerjaan');
      return;
    }

    try {
      setIsSaving(true);
      const toSave = getCurrentInvoiceObject();
      await onSave(toSave);
      onToast(`Invoice ${toSave.invoiceNumber} disimpan`);
    } catch {
      onToast('Gagal menyimpan invoice');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-3.5 pb-28 space-y-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 shadow-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-[#0b223d]">
            {initialInvoice ? `Edit: ${initialInvoice.invoiceNumber}` : 'Buat Invoice Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onPreview(getCurrentInvoiceObject())}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg active:scale-95"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Preview</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        {/* Fast Import Bar */}
        <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <h4 className="font-bold text-xs">Impor Cepat</h4>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {letters.length > 0 && (
              <select
                onChange={handleImportFromLetter}
                className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled className="text-slate-900">
                  Dari Surat Penawaran...
                </option>
                {letters.map((l) => (
                  <option key={l.id} value={l.id} className="text-slate-900">
                    {l.letterNumber} — {l.companyName}
                  </option>
                ))}
              </select>
            )}

            {customers.length > 0 && (
              <select
                onChange={handleSelectCustomer}
                className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled className="text-slate-900">
                  Dari Pelanggan...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.companyName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* SECTION 1: IDENTITAS INVOICE */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-2.5">
          <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-3 rounded-full bg-blue-600"></span>
            Identitas Invoice
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Invoice <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="W4TSTGFS"
                className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50/30 font-bold text-blue-950 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor PO (Referensi Pesanan)
              </label>
              <input
                type="text"
                value={nomorPo}
                onChange={(e) => setNomorPo(e.target.value)}
                placeholder="fsfsdfsfvsf"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-bold"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: KEPADA (KLIEN) */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-2.5">
          <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-3 rounded-full bg-blue-600"></span>
            Kepada (Klien)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Perusahaan Klien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="FSDSFSDF"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kontak / PIC
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="SFSFSF"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Klien
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="SFSFSFS"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TABEL BARANG / JASA */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded-full bg-blue-600"></span>
              Rincian Pekerjaan
            </h3>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-lg border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-500 text-xs">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-rose-500 hover:bg-rose-100 rounded-md"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Uraian Pekerjaan / Keterangan
                    </label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="SFSFSFSF"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-center"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Satuan
                    </label>
                    <input
                      type="text"
                      value={item.satuan}
                      onChange={(e) => handleItemChange(item.id, 'satuan', e.target.value)}
                      placeholder="unit"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-center"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-right"
                    />
                  </div>
                </div>

                <div className="text-right text-xs font-bold text-slate-700 pt-1">
                  Jumlah: <span className="text-blue-900 font-mono">Rp {formatNumberIndo(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: TRADE-IN, TOTAL & TERBILANG */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tradeInToggle"
              checked={tradeInActive}
              onChange={(e) => setTradeInActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="tradeInToggle" className="font-bold text-slate-800 text-xs cursor-pointer select-none">
              Trade In Barang Bekas (Potongan)
            </label>
          </div>

          {tradeInActive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 bg-rose-50/50 rounded-xl border border-rose-200">
              <div>
                <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                  Nama Trade In
                </label>
                <input
                  type="text"
                  value={tradeInName}
                  onChange={(e) => setTradeInName(e.target.value)}
                  placeholder="Trade In Barang Bekas"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                  Nilai Potongan (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={tradeInValue}
                  onChange={(e) => setTradeInValue(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white font-mono text-right font-bold text-rose-700"
                />
              </div>
            </div>
          )}

          {/* TOTAL BANNER (MATCHING SAMPLE) */}
          <div className="bg-slate-900 text-white rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono font-bold">Rp {formatNumberIndo(subtotal)}</span>
            </div>
            {tradeInActive && effectiveTradeIn > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-300">
                <span>- {tradeInName}</span>
                <span className="font-mono font-bold">-Rp {formatNumberIndo(effectiveTradeIn)}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider font-extrabold text-sky-400">TOTAL TAGIHAN</span>
              <span className="text-lg font-black font-mono text-white">Rp {formatNumberIndo(total)}</span>
            </div>
            <div className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
              Terbilang: "{terbilang}"
            </div>
          </div>
        </div>

        {/* SECTION 5: REKENING TRANSFER & STATUS */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-2.5">
          <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-3 rounded-full bg-blue-600"></span>
            Pembayaran Transfer &amp; Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Bank
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Mandiri"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Atas Nama
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="CV. MULIA TEKHNIK ABADI"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Rekening
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="167-00-0529426-8"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
              >
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="Lunas">Lunas</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPreview(getCurrentInvoiceObject())}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1 px-5 py-2 bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-sky-400" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
