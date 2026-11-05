import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Eye,
  RotateCcw,
  Building,
  UserCheck,
  Calendar,
  ArrowLeft,
  Sparkles,
  Download,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import type { BastData, BastItem } from '../../types/bast.ts';
import type { CompanySettings, Customer, LetterData } from '../../types/index.ts';
import { generateHariTerbilang, generateNomorBastBaru } from '../../services/bastDb.ts';
import { getAllPurchaseOrders } from '../../services/poDb.ts';

interface FormBastProps {
  initialBast?: BastData | null;
  existingBasts?: BastData[];
  settings: CompanySettings;
  customers: Customer[];
  letters: LetterData[];
  onSave: (bast: BastData) => Promise<void>;
  onPreview: (bast: BastData) => void;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export const FormBast: React.FC<FormBastProps> = ({
  initialBast,
  existingBasts = [],
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
  const [nomorBast, setNomorBast] = useState(
    initialBast?.nomorBast || generateNomorBastBaru(existingBasts)
  );
  const [nomorPo, setNomorPo] = useState(initialBast?.nomorPo || '');
  const [tanggalBast, setTanggalBast] = useState(initialBast?.tanggalBast || todayStr);
  const [hariTerbilang, setHariTerbilang] = useState(
    initialBast?.hariTerbilang || generateHariTerbilang(todayStr)
  );

  // Pihak Pertama (Klien) - Semua Opsional (tidak wajib)
  const [pihakPertamaNama, setPihakPertamaNama] = useState(initialBast?.pihakPertamaNama || '');
  const [pihakPertamaJabatan, setPihakPertamaJabatan] = useState(
    initialBast?.pihakPertamaJabatan || ''
  );
  const [pihakPertamaPerusahaan, setPihakPertamaPerusahaan] = useState(
    initialBast?.pihakPertamaPerusahaan || ''
  );
  const [pihakPertamaAlamat, setPihakPertamaAlamat] = useState(
    initialBast?.pihakPertamaAlamat || ''
  );

  // Pihak Kedua (MTA)
  const [pihakKeduaNama, setPihakKeduaNama] = useState(
    initialBast?.pihakKeduaNama || settings.signatoryName || 'MUHAMAD RIDHO'
  );
  const [pihakKeduaAlamat, setPihakKeduaAlamat] = useState(
    initialBast?.pihakKeduaAlamat ||
      settings.address ||
      'Jln. Letda Nasir No. 58 Bogor, 16966 Kel. Cikeas Udik Kec. Gunung Putri Bogor'
  );

  // Items
  const [items, setItems] = useState<BastItem[]>(
    initialBast?.items && initialBast.items.length > 0
      ? initialBast.items
      : [
          {
            id: `item-${Date.now()}-1`,
            name: '',
            keterangan: 'Sesuai',
          },
        ]
  );

  // Periode Pelaksanaan & Kota
  const [tanggalMulai, setTanggalMulai] = useState(initialBast?.tanggalMulai || todayStr);
  const [tanggalSelesai, setTanggalSelesai] = useState(initialBast?.tanggalSelesai || todayStr);
  const [kota, setKota] = useState(initialBast?.kota || settings.city || 'Bogor');
  const [status, setStatus] = useState<'Draft' | 'Selesai'>(initialBast?.status || 'Selesai');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPos, setSavedPos] = useState<any[]>([]);

  useEffect(() => {
    getAllPurchaseOrders().then((list) => {
      if (list && list.length > 0) {
        setSavedPos(list);
      }
    });
  }, []);

  // Automatically update hariTerbilang when tanggalBast changes
  const handleDateChange = (val: string) => {
    setTanggalBast(val);
    setHariTerbilang(generateHariTerbilang(val));
  };

  // Import from Customer Database
  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if (!custId) return;
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setPihakPertamaPerusahaan(cust.companyName);
      setPihakPertamaNama(cust.recipientName);
      setPihakPertamaAlamat(cust.address);
      onToast(`Data ${cust.companyName} berhasil diterapkan`);
    }
    e.target.value = '';
  };

  // Import from existing Surat Penawaran
  const handleImportFromLetter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const letterId = e.target.value;
    if (!letterId) return;
    const letter = letters.find((l) => l.id === letterId);
    if (letter) {
      setPihakPertamaPerusahaan(letter.companyName);
      setPihakPertamaNama(letter.recipientName);
      setPihakPertamaAlamat(letter.address);
      if (letter.subject && !nomorPo) {
        setNomorPo(letter.subject);
      }
      if (letter.items && letter.items.length > 0) {
        setItems(
          letter.items.map((it, idx) => ({
            id: `imported-${Date.now()}-${idx}`,
            name: it.description,
            keterangan: 'Sesuai',
          }))
        );
      }
      onToast(`Berhasil mengimpor data dari Surat Penawaran ${letter.letterNumber}!`);
    }
    e.target.value = '';
  };

  // Item Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        name: '',
        keterangan: 'Sesuai',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      onToast('Minimal harus ada 1 item barang atau pekerjaan!');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: 'name' | 'keterangan', val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // Daftar PO gabungan dari Surat Penawaran & Dokumen BAST yang sudah ada
  const availablePoList = useMemo(() => {
    const map = new Map<
      string,
      { po: string; clientName?: string; contactName?: string; address?: string }
    >();

    // 1. Dari Surat Penawaran (subject sering berisi No PO atau judul proyek)
    letters.forEach((l) => {
      const subj = (l.subject || '').trim();
      if (subj) {
        if (!map.has(subj)) {
          map.set(subj, {
            po: subj,
            clientName: l.companyName,
            contactName: l.recipientName,
            address: l.address,
          });
        }
      }
    });

    // 2. Dari BAST yang tersimpan
    existingBasts.forEach((b) => {
      const po = (b.nomorPo || '').trim();
      if (po && !map.has(po)) {
        map.set(po, {
          po,
          clientName: b.pihakPertamaPerusahaan,
          contactName: b.pihakPertamaNama,
          address: b.pihakPertamaAlamat,
        });
      }
    });

    // 3. Dari Upload PO / Cloud Database PO
    savedPos.forEach((p) => {
      const po = (p.nomorPo || '').trim();
      if (po && !map.has(po)) {
        map.set(po, {
          po,
          clientName: p.buyerCompany,
          contactName: p.picName,
          address: p.buyerAddress,
        });
      }
    });

    return Array.from(map.values());
  }, [letters, existingBasts, savedPos]);

  // Cek apakah nomor BAST ganda / duplikat dengan BAST lain
  const isDuplicateBastNumber = useMemo(() => {
    if (!nomorBast.trim()) return false;
    return existingBasts.some(
      (b) =>
        b.id !== initialBast?.id &&
        b.nomorBast.trim().toLowerCase() === nomorBast.trim().toLowerCase()
    );
  }, [nomorBast, existingBasts, initialBast?.id]);

  // Build current BAST object
  const getCurrentBastObject = (): BastData => {
    return {
      id: initialBast?.id || `bast-${Date.now()}`,
      nomorBast: nomorBast.trim(),
      nomorPo: nomorPo.trim(),
      tanggalBast,
      hariTerbilang: hariTerbilang.trim(),
      pihakPertamaNama: pihakPertamaNama.trim(),
      pihakPertamaJabatan: pihakPertamaJabatan.trim(),
      pihakPertamaPerusahaan: pihakPertamaPerusahaan.trim(),
      pihakPertamaAlamat: pihakPertamaAlamat.trim(),
      pihakKeduaNama: pihakKeduaNama.trim(),
      pihakKeduaAlamat: pihakKeduaAlamat.trim(),
      items: items.filter((it) => it.name.trim().length > 0),
      tanggalMulai,
      tanggalSelesai,
      kota: kota.trim(),
      status,
      createdAt: initialBast?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorBast.trim()) {
      onToast('Nomor BAST tidak boleh kosong');
      return;
    }
    if (isDuplicateBastNumber) {
      onToast(`Nomor BAST "${nomorBast}" sudah ada! Nomor BAST tidak boleh ganda.`);
      return;
    }
    if (items.length === 0 || !items.some((it) => it.name.trim())) {
      onToast('Masukkan minimal 1 nama barang / jasa');
      return;
    }

    try {
      setIsSaving(true);
      const toSave = getCurrentBastObject();
      await onSave(toSave);
      onToast(`Dokumen ${toSave.nomorBast} berhasil disimpan!`);
    } catch {
      onToast('Gagal menyimpan dokumen BAST');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-[#0b223d]">
            {initialBast ? `Edit BAST: ${initialBast.nomorBast}` : 'Buat BAST Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onPreview(getCurrentBastObject())}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span>Preview PDF</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* FAST IMPOR DATA BAR */}
        <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <h4 className="font-bold text-xs">Impor Cepat</h4>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Import from Surat Penawaran */}
            {letters.length > 0 && (
              <select
                onChange={handleImportFromLetter}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled className="text-slate-900">
                  Impor dari Surat Penawaran...
                </option>
                {letters.map((l) => (
                  <option key={l.id} value={l.id} className="text-slate-900">
                    {l.letterNumber} — {l.companyName}
                  </option>
                ))}
              </select>
            )}

            {/* Import from Customer database */}
            {customers.length > 0 && (
              <select
                onChange={handleSelectCustomer}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled className="text-slate-900">
                  Pilih dari Pelanggan...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.companyName} ({c.recipientName})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* SECTION A: IDENTITAS BAST */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-3.5 rounded-full bg-blue-600"></span>
            A. Identitas BAST
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Nomor BAST <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNomorBast(generateNomorBastBaru(existingBasts))}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                  title="Generate nomor BAST unik baru"
                >
                  Generate Baru
                </button>
              </div>
              <input
                type="text"
                required
                value={nomorBast}
                onChange={(e) => setNomorBast(e.target.value)}
                placeholder="BAST/001/XI/2026"
                className={`w-full px-3 py-2 rounded-xl border font-bold font-mono transition ${
                  isDuplicateBastNumber
                    ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-400'
                    : 'border-blue-300 bg-blue-50/30 text-blue-950 focus:ring-blue-400'
                }`}
              />
              {isDuplicateBastNumber && (
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-red-600 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Nomor BAST sudah digunakan! Harap ganti agar tidak ganda.</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Nomor PO <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Dropdown &amp; Manual</span>
              </div>
              
              <div className="space-y-1.5">
                {/* Dropdown Pilihan PO Tersedia */}
                {availablePoList.length > 0 && (
                  <select
                    value={availablePoList.some((p) => p.po === nomorPo) ? nomorPo : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setNomorPo(val);
                        // Autofill data pihak pertama bila belum terisi
                        const found = availablePoList.find((p) => p.po === val);
                        if (found) {
                          if (found.clientName && !pihakPertamaPerusahaan) {
                            setPihakPertamaPerusahaan(found.clientName);
                          }
                          if (found.contactName && !pihakPertamaNama) {
                            setPihakPertamaNama(found.contactName);
                          }
                          if (found.address && !pihakPertamaAlamat) {
                            setPihakPertamaAlamat(found.address);
                          }
                        }
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-slate-800 font-semibold text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">▼ Pilih dari Dropdown PO ({availablePoList.length} tersedia)</option>
                    {availablePoList.map((item, idx) => (
                      <option key={idx} value={item.po}>
                        {item.po} {item.clientName ? `— ${item.clientName}` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {/* Input Manual Nomor PO */}
                <input
                  type="text"
                  list="po-datalist-options"
                  required
                  value={nomorPo}
                  onChange={(e) => setNomorPo(e.target.value)}
                  placeholder="Ketik nomor PO manual atau pilih..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-bold text-slate-900 focus:bg-white"
                />
                <datalist id="po-datalist-options">
                  {availablePoList.map((item, idx) => (
                    <option key={idx} value={item.po}>
                      {item.clientName ? `${item.po} (${item.clientName})` : item.po}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal BAST <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggalBast}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Hari &amp; Tanggal Terbilang</span>
                <button
                  type="button"
                  onClick={() => setHariTerbilang(generateHariTerbilang(tanggalBast))}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Perbarui</span>
                </button>
              </label>
              <input
                type="text"
                required
                value={hariTerbilang}
                onChange={(e) => setHariTerbilang(e.target.value)}
                placeholder="Senin tanggal Dua Bulan November Tahun Dua Ribu Dua Puluh Enam"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 font-serif"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: PIHAK PERTAMA (TIDAK WAJIB & TAMBAH JABATAN) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-3.5 rounded-full bg-blue-600"></span>
              B. Pihak Pertama (Klien)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              Opsional (tidak wajib)
            </span>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Isian di bawah bersifat opsional. Bidang yang tidak diisi otomatis tidak akan ditampilkan pada cetak BAST / PDF.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pejabat
              </label>
              <input
                type="text"
                value={pihakPertamaNama}
                onChange={(e) => setPihakPertamaNama(e.target.value)}
                placeholder="Contoh: Siska"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jabatan
              </label>
              <input
                type="text"
                value={pihakPertamaJabatan}
                onChange={(e) => setPihakPertamaJabatan(e.target.value)}
                placeholder="Contoh: Purchasing Staff / Supervisor"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Perusahaan
              </label>
              <input
                type="text"
                value={pihakPertamaPerusahaan}
                onChange={(e) => setPihakPertamaPerusahaan(e.target.value)}
                placeholder="PT. KANSAI PAINT INDONESIA"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-bold uppercase"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Klien
              </label>
              <textarea
                rows={2}
                value={pihakPertamaAlamat}
                onChange={(e) => setPihakPertamaAlamat(e.target.value)}
                placeholder="Alamat lengkap perusahaan klien..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: PIHAK KEDUA */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-3.5 rounded-full bg-blue-600"></span>
            C. Pihak Kedua (MTA)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pelaksana
              </label>
              <input
                type="text"
                value={pihakKeduaNama}
                onChange={(e) => setPihakKeduaNama(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-bold uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Pelaksana
              </label>
              <textarea
                rows={2}
                value={pihakKeduaAlamat}
                onChange={(e) => setPihakKeduaAlamat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION D: RINCIAN PEKERJAAN */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-3.5 rounded-full bg-blue-600"></span>
              D. Rincian Pekerjaan
            </h3>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
              >
                <span className="w-6 text-center font-bold text-slate-500 shrink-0">
                  {index + 1}
                </span>

                <input
                  type="text"
                  required
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                  placeholder="Nama Barang atau Deskripsi Pekerjaan Selesai"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                />

                <input
                  type="text"
                  value={item.keterangan}
                  onChange={(e) => handleItemChange(item.id, 'keterangan', e.target.value)}
                  placeholder="Keterangan (Sesuai)"
                  className="w-28 sm:w-36 px-2.5 py-2 rounded-lg border border-slate-300 bg-white italic text-center shrink-0"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                  title="Hapus Baris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION E: TANGGAL PELAKSANAAN, KOTA & STATUS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-[#0b223d] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-3.5 rounded-full bg-blue-600"></span>
            E. Periode &amp; Pengesahan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                required
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kota
              </label>
              <input
                type="text"
                required
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                placeholder="Bogor"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
              >
                <option value="Selesai">Selesai</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreview(getCurrentBastObject())}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#0b223d] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-sky-400" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan BAST'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
