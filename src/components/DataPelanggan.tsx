import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Upload,
  FileDown,
  Trash2,
  Edit2,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Customer } from '../types/index.ts';

interface DataPelangganProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onBatchImport: (customers: Customer[]) => Promise<number>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export const DataPelanggan: React.FC<DataPelangganProps> = ({
  customers,
  onSaveCustomer,
  onBatchImport,
  onDeleteCustomer,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Import Preview Modal
  const [importPreviewList, setImportPreviewList] = useState<Customer[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Delete Candidate
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setRecipientName('');
    setAddress('');
    setCity('');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCompanyName(c.companyName || '');
    setRecipientName(c.recipientName || '');
    setAddress(c.address || '');
    setCity(c.city || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      onToast('Nama Perusahaan wajib diisi');
      return;
    }

    const customerToSave: Customer = {
      id: editingCustomer?.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyName: companyName.trim(),
      recipientName: recipientName.trim(),
      address: address.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: email.trim(),
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
    };

    try {
      await onSaveCustomer(customerToSave);
      setIsModalOpen(false);
      onToast(editingCustomer ? 'Data pelanggan diperbarui' : 'Pelanggan berhasil ditambahkan');
    } catch {
      onToast('Gagal menyimpan pelanggan');
    }
  };

  // Download Templates
  const downloadCSVTemplate = () => {
    // Only column structure without fictitious customer data
    const headers = ['NAMA_PERUSAHAAN', 'NAMA_PENERIMA', 'ALAMAT', 'KOTA', 'NO_TELEPON', 'EMAIL'];
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'template_pelanggan_mta.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Template CSV berhasil diunduh');
  };

  const downloadExcelTemplate = () => {
    // Only column structure without fictitious customer data
    const wsData = [
      ['NAMA_PERUSAHAAN', 'NAMA_PENERIMA', 'ALAMAT', 'KOTA', 'NO_TELEPON', 'EMAIL']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Pelanggan');
    XLSX.writeFile(wb, 'template_pelanggan_mta.xlsx');
    onToast('Template Excel berhasil diunduh');
  };

  // File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (!data || data.length < 2) {
          setImportError('File kosong atau hanya memiliki header tanpa data');
          return;
        }

        const rawHeaders: string[] = (data[0] || []).map((h: any) =>
          String(h || '').trim().toUpperCase()
        );

        // Find column indexes
        const idxCompany = rawHeaders.findIndex(
          (h) => h.includes('PERUSAHAAN') || h.includes('COMPANY') || h.includes('NAMA')
        );
        const idxRecipient = rawHeaders.findIndex(
          (h) => h.includes('PENERIMA') || h.includes('RECIPIENT') || h.includes('KONTAK')
        );
        const idxAddress = rawHeaders.findIndex(
          (h) => h.includes('ALAMAT') || h.includes('ADDRESS')
        );
        const idxCity = rawHeaders.findIndex(
          (h) => h.includes('KOTA') || h.includes('CITY')
        );
        const idxPhone = rawHeaders.findIndex(
          (h) => h.includes('TELEPON') || h.includes('TELP') || h.includes('PHONE')
        );
        const idxEmail = rawHeaders.findIndex(
          (h) => h.includes('EMAIL')
        );

        if (idxCompany === -1) {
          setImportError(
            'Kolom NAMA_PERUSAHAAN tidak ditemukan. Pastikan menggunakan format template yang disediakan.'
          );
          return;
        }

        const parsedCustomers: Customer[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[idxCompany]) continue;
          const cName = String(row[idxCompany]).trim();
          if (!cName) continue;

          parsedCustomers.push({
            id: `cust_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            companyName: cName,
            recipientName: idxRecipient !== -1 && row[idxRecipient] ? String(row[idxRecipient]).trim() : '',
            address: idxAddress !== -1 && row[idxAddress] ? String(row[idxAddress]).trim() : '',
            city: idxCity !== -1 && row[idxCity] ? String(row[idxCity]).trim() : '',
            phone: idxPhone !== -1 && row[idxPhone] ? String(row[idxPhone]).trim() : '',
            email: idxEmail !== -1 && row[idxEmail] ? String(row[idxEmail]).trim() : '',
            createdAt: new Date().toISOString(),
          });
        }

        if (parsedCustomers.length === 0) {
          setImportError('Tidak ada baris data valid yang terbaca dari file');
          return;
        }

        setImportPreviewList(parsedCustomers);
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error(err);
        setImportError('Gagal membaca file: ' + (err.message || 'Format tidak dikenali'));
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    try {
      const inserted = await onBatchImport(importPreviewList);
      setIsImportModalOpen(false);
      setImportPreviewList([]);
      onToast(`Berhasil mengimpor ${inserted} pelanggan baru (duplikat diabaikan)`);
    } catch {
      onToast('Gagal memproses import data');
    }
  };

  // Filtered list
  const filteredCustomers = customers.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-24 pt-2 max-w-4xl mx-auto px-3 sm:px-4 space-y-4">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0b223d] flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Data Pelanggan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar rekanan & perusahaan tujuan penawaran CV. MULIA TEKHNIK ABADI
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </button>
          </div>
        </div>

        {/* Search & Template/Import bar */}
        <div className="mt-3.5 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari perusahaan, kontak person, kota, atau nomor telpon..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          {/* Import / Export Template Tools */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-300 cursor-pointer font-medium transition">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Import CSV / Excel</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={downloadCSVTemplate}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Template CSV</span>
              </button>

              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Excel</span>
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500">
              Total: {filteredCustomers.length} Pelanggan
            </span>
          </div>

          {importError && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{importError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Belum ada data pelanggan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Tidak ada pelanggan yang sesuai dengan pencarian Anda.'
                : 'Tambahkan pelanggan baru atau impor file Excel/CSV untuk mempercepat pembuatan surat.'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {cust.companyName}
                      </h3>
                      {cust.recipientName && (
                        <p className="text-[11px] text-slate-500">U.p: {cust.recipientName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cust)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Pelanggan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidateId(cust.id)}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  {cust.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {cust.address}
                        {cust.city ? `, ${cust.city}` : ''}
                      </span>
                    </div>
                  )}
                  {cust.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-[#0b223d]">
                {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-3 space-y-3 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="PT. Takasago International Indonesia"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penerima (PIC)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ibu Lina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Perusahaan
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Kawasan Industri MM2100..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kota
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bekasi / Bogor"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontak@perusahaan.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 font-bold text-white shadow-xs"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-[#0b223d]">
                Preview Import Data ({importPreviewList.length} Baris Terbaca)
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2">
              Periksa ringkasan kolom data yang akan diimpor. Data dengan nama perusahaan yang sama akan dihindari dari duplikasi.
            </p>

            <div className="flex-1 overflow-y-auto space-y-1.5 my-2 border border-slate-200 rounded-xl p-2 bg-slate-50/60 text-xs">
              {importPreviewList.map((c, i) => (
                <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800">{c.companyName}</div>
                  <div className="text-[11px] text-slate-500">
                    Penerima: {c.recipientName || '-'} | Kota: {c.city || '-'} | Telp: {c.phone || '-'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white shadow-xs"
              >
                Konfirmasi & Simpan ke Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-slate-800 space-y-3">
            <h3 className="font-bold text-base text-slate-900 text-center">
              Hapus Data Pelanggan?
            </h3>
            <p className="text-center text-xs text-slate-600">
              Pelanggan ini akan dihapus dari database lokal. Dokumen surat yang sudah pernah dibuat tidak akan terpengaruh.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteCandidateId) {
                    await onDeleteCustomer(deleteCandidateId);
                    setDeleteCandidateId(null);
                    onToast('Pelanggan berhasil dihapus');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
