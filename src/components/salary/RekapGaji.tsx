import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import type { SlipGaji, SalarySettings } from '../../types/salary.ts';
import { formatRupiahAlways, downloadRekapGajiPDF } from '../../services/salaryPdfGenerator.ts';
import { exportRekapGajiToExcel } from '../../services/salaryExcelGenerator.ts';

interface RekapGajiProps {
  slips: SlipGaji[];
  settings: SalarySettings;
  onViewSlip: (slip: SlipGaji) => void;
  onDeleteSlip: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export const RekapGaji: React.FC<RekapGajiProps> = ({
  slips,
  settings,
  onViewSlip,
  onDeleteSlip,
  onToast,
}) => {
  const [selectedPeriode, setSelectedPeriode] = useState<string>('Semua Periode');

  // Available periods from slips
  const periods = useMemo(() => {
    const set = new Set<string>();
    slips.forEach((s) => {
      if (s.periodeBulan) {
        set.add(`${s.periodeBulan} ${s.tahun || 2026}`);
      }
    });
    return Array.from(set);
  }, [slips]);

  // Filtered slips
  const filteredSlips = useMemo(() => {
    if (selectedPeriode === 'Semua Periode') return slips;
    return slips.filter((s) => `${s.periodeBulan} ${s.tahun || 2026}` === selectedPeriode);
  }, [slips, selectedPeriode]);

  // Statistics
  const totalPokok = useMemo(
    () => filteredSlips.reduce((sum, s) => sum + (s.gajiPokok || 0), 0),
    [filteredSlips]
  );
  const totalPendapatan = useMemo(
    () => filteredSlips.reduce((sum, s) => sum + (s.totalPendapatan || 0), 0),
    [filteredSlips]
  );
  const totalPotongan = useMemo(
    () => filteredSlips.reduce((sum, s) => sum + (s.totalPotongan || 0), 0),
    [filteredSlips]
  );
  const totalBersih = useMemo(
    () => filteredSlips.reduce((sum, s) => sum + (s.gajiBersih || 0), 0),
    [filteredSlips]
  );

  const handleDownloadExcel = () => {
    if (filteredSlips.length === 0) {
      onToast('Tidak ada data slip gaji untuk diekspor!');
      return;
    }
    exportRekapGajiToExcel(filteredSlips, selectedPeriode);
    onToast('File Excel Rekapitulasi Gaji berhasil diunduh!');
  };

  const handleDownloadPDF = async () => {
    if (filteredSlips.length === 0) {
      onToast('Tidak ada data slip gaji untuk dicetak ke PDF!');
      return;
    }
    await downloadRekapGajiPDF(filteredSlips, selectedPeriode, settings);
    onToast('Dokumen PDF Rekapitulasi Gaji berhasil diunduh!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-4">
      {/* HEADER SECTION - Matching Screenshot 3 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title with MTA logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center">
            <img
              src={settings.logoImage || '/default-logo.png'}
              alt="MTA"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
              REKAPITULASI GAJI KARYAWAN
            </h2>
            <p className="text-xs text-slate-500">CV MULIA TEKHNIK ABADI</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Periode Dropdown */}
          <div className="relative">
            <select
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl pl-8 pr-8 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="Semua Periode">Semua Periode ({slips.length})</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  Periode {p}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Download Excel */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Cetak */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS - Matching Screenshot 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-medium text-slate-500">Total Slip Tercatat</p>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {filteredSlips.length} Slip
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-medium text-slate-500">Total Gaji Pokok</p>
          <p className="text-sm sm:text-base font-black font-mono text-slate-900 mt-1">
            {formatRupiahAlways(totalPokok)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
          <p className="text-[11px] font-medium text-slate-500">Total Potongan</p>
          <p className="text-sm sm:text-base font-black font-mono text-rose-600 mt-1">
            {formatRupiahAlways(totalPotongan)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-200 bg-emerald-50/20">
          <p className="text-[11px] font-bold text-emerald-800">Total Gaji Bersih</p>
          <p className="text-sm sm:text-base font-black font-mono text-emerald-700 mt-1">
            {formatRupiahAlways(totalBersih)}
          </p>
        </div>
      </div>

      {/* FORMAL DOCUMENT TABLE - Matching Screenshot 3 */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        {/* Document Header Text */}
        <div className="text-center space-y-0.5 border-b border-slate-200 pb-3">
          <h3 className="font-extrabold text-sm sm:text-base text-[#1a4b91] uppercase">
            {settings.companyName || 'CV MULIA TEKHNIK ABADI'}
          </h3>
          <p className="text-[11px] text-slate-600">
            Jln. Letda Nasir No. 58 Desa Cikeas Udik - Kec. Gunung Putri - Kab. Bogor Kode Pos 16966
          </p>
          <h4 className="font-black text-xs sm:text-sm text-black pt-1">
            REKAPITULASI GAJI KARYAWAN
          </h4>
          <p className="text-[11px] text-slate-500">
            Periode: <strong className="text-black">{selectedPeriode}</strong>
          </p>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-slate-100/70 font-black text-black">
                <th className="p-2 border-r border-black text-center w-10">No</th>
                <th className="p-2 border-r border-black text-center w-14">Slip</th>
                <th className="p-2 border-r border-black">Nama Karyawan</th>
                <th className="p-2 border-r border-black">Jabatan</th>
                <th className="p-2 border-r border-black text-center">Periode</th>
                <th className="p-2 border-r border-black text-right">Gaji Pokok</th>
                <th className="p-2 border-r border-black text-right">Pendapatan</th>
                <th className="p-2 border-r border-black text-right">Potongan</th>
                <th className="p-2 border-r border-black text-right">Gaji Bersih</th>
                <th className="p-2 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 italic">
                    Belum ada data slip gaji pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip, index) => (
                  <tr
                    key={slip.id}
                    className="border-b border-black hover:bg-slate-50 transition text-[11px]"
                  >
                    <td className="p-2 border-r border-black text-center font-bold">
                      {index + 1}
                    </td>
                    <td className="p-2 border-r border-black text-center font-mono font-bold">
                      {slip.nomorSlip}
                    </td>
                    <td className="p-2 border-r border-black font-extrabold uppercase">
                      {slip.nama}
                    </td>
                    <td className="p-2 border-r border-black text-slate-700">
                      {slip.jabatan}
                    </td>
                    <td className="p-2 border-r border-black text-center">
                      {slip.periodeBulan}
                    </td>
                    <td className="p-2 border-r border-black font-mono text-right">
                      {formatRupiahAlways(slip.gajiPokok)}
                    </td>
                    <td className="p-2 border-r border-black font-mono text-right text-emerald-800 font-semibold">
                      {formatRupiahAlways(slip.totalPendapatan)}
                    </td>
                    <td className="p-2 border-r border-black font-mono text-right text-rose-600 font-semibold">
                      {formatRupiahAlways(slip.totalPotongan)}
                    </td>
                    <td className="p-2 border-r border-black font-mono text-right font-bold text-black">
                      {formatRupiahAlways(slip.gajiBersih)}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewSlip(slip)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Lihat & Cetak Slip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus slip #${slip.nomorSlip} untuk ${slip.nama}?`)) {
                              onDeleteSlip(slip.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Hapus Slip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* TOTAL KESELURUHAN ROW - Matching Screenshot 3 */}
              {filteredSlips.length > 0 && (
                <tr className="bg-slate-200/80 font-black text-black text-xs">
                  <td colSpan={5} className="p-2.5 border-r border-black text-center uppercase tracking-wide">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="p-2.5 border-r border-black font-mono text-right">
                    {formatRupiahAlways(totalPokok)}
                  </td>
                  <td className="p-2.5 border-r border-black font-mono text-right text-emerald-900">
                    {formatRupiahAlways(totalPendapatan)}
                  </td>
                  <td className="p-2.5 border-r border-black font-mono text-right text-rose-700">
                    {formatRupiahAlways(totalPotongan)}
                  </td>
                  <td className="p-2.5 border-r border-black font-mono text-right text-black font-black">
                    {formatRupiahAlways(totalBersih)}
                  </td>
                  <td className="p-2.5"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
