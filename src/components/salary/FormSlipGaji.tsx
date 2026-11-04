import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Calculator,
  RotateCcw,
  Eye,
  Save,
  Clock,
  CalendarDays,
  Coins,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { SlipGaji, Karyawan, SalarySettings } from '../../types/salary.ts';
import { formatRupiahAlways } from '../../services/salaryPdfGenerator.ts';

interface FormSlipGajiProps {
  karyawanList: Karyawan[];
  settings: SalarySettings;
  selectedKaryawanForSlip?: Karyawan | null;
  onSaveSlip: (slip: SlipGaji) => Promise<void>;
  onPreviewSlip: (slip: SlipGaji) => void;
  onToast: (msg: string) => void;
  onViewSavedSlips: () => void;
  savedSlipsCount: number;
}

const BULAN_OPTIONS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const FormSlipGaji: React.FC<FormSlipGajiProps> = ({
  karyawanList,
  settings,
  selectedKaryawanForSlip,
  onSaveSlip,
  onPreviewSlip,
  onToast,
  onViewSavedSlips,
  savedSlipsCount,
}) => {
  // Current month default
  const now = new Date();
  const currentMonthName = BULAN_OPTIONS[now.getMonth()];
  const todayFormatted = now.toISOString().slice(0, 10);

  // Form State
  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('');
  const [nama, setNama] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('');
  const [nik, setNik] = useState<string>('-');
  const [nomorSlip, setNomorSlip] = useState<string>('01');
  const [tanggal, setTanggal] = useState<string>(todayFormatted);
  const [periodeBulan, setPeriodeBulan] = useState<string>(currentMonthName);
  const [tahun, setTahun] = useState<number>(now.getFullYear());

  // Pendapatan State
  const [gajiPokok, setGajiPokok] = useState<number>(0);
  const [uangMakan, setUangMakan] = useState<number>(0);
  const [transport, setTransport] = useState<number>(0);
  const [thr, setThr] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [lemburan, setLemburan] = useState<number>(0);
  const [jamLembur, setJamLembur] = useState<number>(0);
  const [masukKerja, setMasukKerja] = useState<number>(0);

  // Pemotongan State
  const [pinjaman, setPinjaman] = useState<number>(0);
  const [bpjsKetenagakerjaan, setBpjsKetenagakerjaan] = useState<number>(0);
  const [pph21, setPph21] = useState<number>(0);
  const [lainLain, setLainLain] = useState<number>(0);
  const [potonganUangMakan, setPotonganUangMakan] = useState<number>(0);

  const [isSaving, setIsSaving] = useState(false);

  // If a pre-selected employee was passed from DataKaryawan
  useEffect(() => {
    if (selectedKaryawanForSlip) {
      applyKaryawan(selectedKaryawanForSlip);
    }
  }, [selectedKaryawanForSlip]);

  const applyKaryawan = (emp: Karyawan) => {
    setSelectedKaryawanId(emp.id);
    setNama(emp.nama);
    setJabatan(emp.jabatan);
    setNik(emp.nik || '-');
    setNomorSlip(emp.nomorSlipDefault || '01');
    setGajiPokok(emp.gajiPokok || 0);
  };

  const handleKaryawanDropdownChange = (empId: string) => {
    setSelectedKaryawanId(empId);
    const found = karyawanList.find((k) => k.id === empId);
    if (found) {
      applyKaryawan(found);
      onToast(`Data karyawan ${found.nama} diterapkan`);
    }
  };

  // Auto-calculate lemburan if jamLembur changed and lemburan wasn't manually overridden
  const handleJamLemburChange = (hours: number) => {
    setJamLembur(hours);
    const rate = settings.tarifLemburPerJam || 12000;
    setLemburan(hours * rate);
  };

  // Calculations
  const totalPendapatan = useMemo(() => {
    return (
      (gajiPokok || 0) +
      (uangMakan || 0) +
      (transport || 0) +
      (thr || 0) +
      (bonus || 0) +
      (lemburan || 0)
    );
  }, [gajiPokok, uangMakan, transport, thr, bonus, lemburan]);

  const totalPotongan = useMemo(() => {
    return (
      (pinjaman || 0) +
      (bpjsKetenagakerjaan || 0) +
      (pph21 || 0) +
      (lainLain || 0) +
      (potonganUangMakan || 0)
    );
  }, [pinjaman, bpjsKetenagakerjaan, pph21, lainLain, potonganUangMakan]);

  const gajiBersih = useMemo(() => {
    return totalPendapatan - totalPotongan;
  }, [totalPendapatan, totalPotongan]);

  // Build current slip object
  const currentSlipObject: SlipGaji = {
    id: `slip-${Date.now()}`,
    nomorSlip: nomorSlip || '01',
    tanggal,
    periodeBulan,
    tahun,
    karyawanId: selectedKaryawanId || undefined,
    nama: nama || 'Karyawan',
    jabatan: jabatan || 'Staff',
    nik: nik || '-',
    gajiPokok,
    uangMakan,
    transport,
    thr,
    bonus,
    lemburan,
    jamLembur,
    masukKerja,
    pinjaman,
    bpjsKetenagakerjaan,
    pph21,
    lainLain,
    potonganUangMakan,
    totalPendapatan,
    totalPotongan,
    gajiBersih,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleReset = () => {
    if (confirm('Kosongkan semua data isian slip gaji ini?')) {
      setSelectedKaryawanId('');
      setNama('');
      setJabatan('');
      setNik('-');
      setNomorSlip('01');
      setGajiPokok(0);
      setUangMakan(0);
      setTransport(0);
      setThr(0);
      setBonus(0);
      setLemburan(0);
      setJamLembur(0);
      setMasukKerja(0);
      setPinjaman(0);
      setBpjsKetenagakerjaan(0);
      setPph21(0);
      setLainLain(0);
      setPotonganUangMakan(0);
      onToast('Formulir dikosongkan');
    }
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      onToast('Harap isi Nama Karyawan!');
      return;
    }
    if (!nomorSlip.trim()) {
      onToast('Harap isi Nomor Slip Gaji!');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveSlip(currentSlipObject);
    } catch (e: any) {
      onToast('Gagal menyimpan slip: ' + (e.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pb-12 space-y-4">
      {/* SUB-TABS: Buat Slip Baru & Rekap Slip */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Buat Slip Baru</span>
        </button>

        <button
          type="button"
          onClick={onViewSavedSlips}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition"
        >
          <span>Daftar Slip ({savedSlipsCount})</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* CARD 1: IDENTITAS SLIP GAJI */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Identitas Slip Gaji</h2>
              <p className="text-[11px] text-slate-500">Pilih karyawan atau ketik langsung</p>
            </div>
          </div>

          {/* Quick Select Karyawan */}
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <span className="text-slate-600 font-medium whitespace-nowrap">Pilih Karyawan:</span>
            <select
              value={selectedKaryawanId}
              onChange={(e) => handleKaryawanDropdownChange(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Pilih Karyawan --</option>
              {karyawanList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nama} ({emp.jabatan})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Karyawan</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Misal: Jamhur"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Misal: Teknisi / Admin"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">NIK</label>
            <input
              type="text"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="Misal: 3201... atau -"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Slip Gaji</label>
            <input
              type="text"
              value={nomorSlip}
              onChange={(e) => setNomorSlip(e.target.value)}
              placeholder="Misal: 1, 2, atau 001/MTA"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Slip</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Gaji (Bulan)</label>
            <select
              value={periodeBulan}
              onChange={(e) => setPeriodeBulan(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {BULAN_OPTIONS.map((bln) => (
                <option key={bln} value={bln}>
                  {bln}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CARD 2 & 3: DUA KOLOM (PENDAPATAN & PEMOTONGAN) - Matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KOLOM KIRI: PENDAPATAN */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-100 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-sm text-slate-900 tracking-wide uppercase">PENDAPATAN</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Pemasukan
              </span>
            </div>
            <p className="text-[11px] text-slate-400 italic">Tidak ada yang wajib diisi (opsional)</p>

            {/* Inputs */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">
                  Gaji Pokok <span className="text-[10px] font-normal text-slate-400">(Otomatis dari Data Karyawan)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={gajiPokok || ''}
                    onChange={(e) => setGajiPokok(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Uang Makan</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={uangMakan || ''}
                    onChange={(e) => setUangMakan(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Transport</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={transport || ''}
                    onChange={(e) => setTransport(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">THR</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={thr || ''}
                    onChange={(e) => setThr(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Bonus</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={bonus || ''}
                    onChange={(e) => setBonus(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Lemburan</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={lemburan || ''}
                    onChange={(e) => setLemburan(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Jam Lembur & Masuk Kerja side by side */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Jam Lembur</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={jamLembur || ''}
                      onChange={(e) => handleJamLemburChange(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-xs">Jam</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Masuk Kerja</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={masukKerja || ''}
                      onChange={(e) => setMasukKerja(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-xs">Hari</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Tarif: {formatRupiahAlways(settings.tarifLemburPerJam || 12000)} / jam
              </p>
            </div>
          </div>

          {/* Subtotal Pendapatan Green Box */}
          <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between font-bold text-xs">
            <span className="text-emerald-900 uppercase">TOTAL PENDAPATAN :</span>
            <span className="text-emerald-700 font-mono text-sm">
              {formatRupiahAlways(totalPendapatan)}
            </span>
          </div>
        </div>

        {/* KOLOM KANAN: PEMOTONGAN */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-rose-100 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 className="font-bold text-sm text-slate-900 tracking-wide uppercase">PEMOTONGAN</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                Potongan
              </span>
            </div>
            <p className="text-[11px] text-slate-400 italic">Tidak ada yang wajib diisi (opsional)</p>

            {/* Inputs */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Pinjaman</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={pinjaman || ''}
                    onChange={(e) => setPinjaman(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">BPJS Ketenagakerjaan</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={bpjsKetenagakerjaan || ''}
                    onChange={(e) => setBpjsKetenagakerjaan(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">PPh21</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={pph21 || ''}
                    onChange={(e) => setPph21(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Lain - lain</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={lainLain || ''}
                    onChange={(e) => setLainLain(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Uang Makan (Potongan)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={potonganUangMakan || ''}
                    onChange={(e) => setPotonganUangMakan(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subtotal Potongan Red Box */}
          <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl flex items-center justify-between font-bold text-xs">
            <span className="text-rose-900 uppercase">TOTAL POTONGAN :</span>
            <span className="text-rose-700 font-mono text-sm">
              {formatRupiahAlways(totalPotongan)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: GAJI BERSIH (TAKE HOME PAY) - Dark Navy Card matching Screenshot 4 */}
      <div className="bg-[#0b223d] rounded-2xl p-4 sm:p-5 text-white shadow-lg flex items-center justify-between border border-blue-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800/80 border border-blue-600/50 flex items-center justify-center text-sky-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-sky-200">
              GAJI BERSIH (TAKE HOME PAY)
            </h4>
            <p className="text-[11px] text-slate-300">
              Total Pendapatan ({formatRupiahAlways(totalPendapatan)}) - Total Potongan ({formatRupiahAlways(totalPotongan)})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatRupiahAlways(gajiBersih)}
          </span>
        </div>
      </div>

      {/* BOTTOM ACTIONS BAR - Matching Screenshot 4 */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Kosongkan Form</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreviewSlip(currentSlipObject)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-300 shadow-xs transition active:scale-95"
          >
            <Eye className="w-4 h-4 text-sky-700" />
            <span>Preview Slip</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Slip Gaji'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
