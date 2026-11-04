import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  FileText,
  X,
  Save,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { Karyawan } from '../../types/salary.ts';
import { formatRupiahAlways } from '../../services/salaryPdfGenerator.ts';

interface DataKaryawanProps {
  karyawanList: Karyawan[];
  onSaveKaryawan: (karyawan: Karyawan) => Promise<void>;
  onDeleteKaryawan: (id: string) => Promise<void>;
  onCreateSlipForKaryawan: (karyawan: Karyawan) => void;
  onToast: (msg: string) => void;
}

export const DataKaryawan: React.FC<DataKaryawanProps> = ({
  karyawanList,
  onSaveKaryawan,
  onDeleteKaryawan,
  onCreateSlipForKaryawan,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKaryawan, setEditingKaryawan] = useState<Karyawan | null>(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formNik, setFormNik] = useState('-');
  const [formNomorSlip, setFormNomorSlip] = useState('');
  const [formGajiPokok, setFormGajiPokok] = useState<number>(2000000);
  const [formTelepon, setFormTelepon] = useState('');

  // Filter list
  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return karyawanList;
    return karyawanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(q) ||
        k.jabatan.toLowerCase().includes(q) ||
        (k.nik && k.nik.toLowerCase().includes(q)) ||
        (k.nomorSlipDefault && k.nomorSlipDefault.includes(q))
    );
  }, [karyawanList, searchTerm]);

  const handleOpenAdd = () => {
    setEditingKaryawan(null);
    setFormNama('');
    setFormJabatan('Helper');
    setFormNik('-');
    // Auto next slip number suggestion
    const nextNum = String(karyawanList.length + 1).padStart(2, '0');
    setFormNomorSlip(nextNum);
    setFormGajiPokok(2400000);
    setFormTelepon('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Karyawan) => {
    setEditingKaryawan(emp);
    setFormNama(emp.nama);
    setFormJabatan(emp.jabatan);
    setFormNik(emp.nik || '-');
    setFormNomorSlip(emp.nomorSlipDefault || '');
    setFormGajiPokok(emp.gajiPokok || 0);
    setFormTelepon(emp.telepon || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      onToast('Harap masukkan nama karyawan!');
      return;
    }

    const toSave: Karyawan = {
      id: editingKaryawan ? editingKaryawan.id : `emp-${Date.now()}`,
      nama: formNama.trim().toUpperCase(),
      jabatan: formJabatan.trim(),
      nik: formNik.trim() || '-',
      nomorSlipDefault: formNomorSlip.trim() || '01',
      gajiPokok: formGajiPokok || 0,
      telepon: formTelepon.trim(),
      createdAt: editingKaryawan ? editingKaryawan.createdAt : new Date().toISOString(),
    };

    try {
      await onSaveKaryawan(toSave);
      setIsModalOpen(false);
      onToast(
        editingKaryawan
          ? `Data ${toSave.nama} berhasil diperbarui!`
          : `Karyawan ${toSave.nama} berhasil ditambahkan!`
      );
    } catch (err: any) {
      onToast('Gagal menyimpan: ' + (err.message || ''));
    }
  };

  const handleDelete = async (emp: Karyawan) => {
    if (confirm(`Hapus data karyawan ${emp.nama}?`)) {
      await onDeleteKaryawan(emp.id);
      onToast(`Karyawan ${emp.nama} dihapus`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-4">
      {/* SEARCH BAR & TAMBAH BUTTON - Matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari karyawan berdasarkan nama, NIK, jabatan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        {/* Tambah Karyawan Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* CARDS GRID - Matching Screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredList.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-xs text-slate-600">Tidak ada karyawan yang cocok.</p>
            <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci lain atau tambah karyawan baru.</p>
          </div>
        ) : (
          filteredList.map((emp) => {
            const initial = emp.nama ? emp.nama.charAt(0).toUpperCase() : 'K';
            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
              >
                {/* Top: Avatar, Name, Role & Action Icons */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-blue-600 font-extrabold text-base flex items-center justify-center border border-sky-100 shadow-2xs">
                      {initial}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 tracking-wide uppercase leading-tight">
                        {emp.nama}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600">
                        {emp.jabatan}
                      </p>
                    </div>
                  </div>

                  {/* Edit & Delete Icons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Karyawan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(emp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Karyawan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meta details */}
                <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>NIK: <strong className="text-slate-800">{emp.nik || '-'}</strong></span>
                    <span>Nomor Slip: <strong className="font-mono text-slate-800">{emp.nomorSlipDefault || '-'}</strong></span>
                  </div>
                  <div>
                    <span>Gaji Pokok: </span>
                    <strong className="font-mono text-slate-900 text-xs">
                      {formatRupiahAlways(emp.gajiPokok)}
                    </strong>
                  </div>
                </div>

                {/* Bottom Action: Buat Slip */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onCreateSlipForKaryawan(emp)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs border border-sky-200 transition-all active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Buat Slip</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL TAMBAH / EDIT KARYAWAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingKaryawan ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Karyawan *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Misal: MAULIDRA HAFIZ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Helper, Teknisi, Kasir"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Slip Default
                  </label>
                  <input
                    type="text"
                    value={formNomorSlip}
                    onChange={(e) => setFormNomorSlip(e.target.value)}
                    placeholder="08, 010"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK</label>
                  <input
                    type="text"
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    placeholder="Misal: -"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gaji Pokok (Rp)
                  </label>
                  <input
                    type="number"
                    value={formGajiPokok || ''}
                    onChange={(e) => setFormGajiPokok(Number(e.target.value) || 0)}
                    placeholder="2400000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  value={formTelepon}
                  onChange={(e) => setFormTelepon(e.target.value)}
                  placeholder="Misal: 08123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
