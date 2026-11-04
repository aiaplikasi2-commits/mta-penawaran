import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Users,
  Settings,
} from 'lucide-react';
import type { Karyawan, SlipGaji, SalarySettings } from '../../types/salary.ts';
import type { CompanySettings } from '../../types/index.ts';
import {
  getAllKaryawan,
  saveKaryawan,
  deleteKaryawan,
  getAllSlips,
  saveSlip,
  deleteSlip,
  getSalarySettings,
  saveSalarySettings,
  DEFAULT_SALARY_SETTINGS,
} from '../../services/salaryDb.ts';
import {
  getCompanySettings,
  saveCompanySettings,
  DEFAULT_SETTINGS,
} from '../../services/db.ts';
import { subscribeKaryawan, subscribeSlips } from '../../services/cloudSync.ts';
import { FormSlipGaji } from './FormSlipGaji.tsx';
import { RekapGaji } from './RekapGaji.tsx';
import { DataKaryawan } from './DataKaryawan.tsx';
import { SlipGajiModal } from './SlipGajiModal.tsx';
import { Pengaturan } from '../Pengaturan.tsx';

export type SalaryTab = 'buat-slip' | 'rekap-gaji' | 'karyawan' | 'pengaturan';

interface SalaryModuleProps {
  settings?: CompanySettings;
  onSaveSettings?: (settings: CompanySettings) => Promise<void>;
  onToast: (msg: string) => void;
}

export const SalaryModule: React.FC<SalaryModuleProps> = ({
  settings: propCompanySettings,
  onSaveSettings: propOnSaveSettings,
  onToast,
}) => {
  const [activeSalaryTab, setActiveSalaryTab] = useState<SalaryTab>('buat-slip');
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [slips, setSlips] = useState<SlipGaji[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    propCompanySettings || DEFAULT_SETTINGS
  );
  const [previewSlip, setPreviewSlip] = useState<SlipGaji | null>(null);
  const [selectedKaryawanForSlip, setSelectedKaryawanForSlip] = useState<Karyawan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [loadedKaryawan, loadedSlips, loadedCompany] = await Promise.all([
        getAllKaryawan(),
        getAllSlips(),
        getCompanySettings(),
      ]);
      setKaryawanList(loadedKaryawan);
      setSlips(loadedSlips);
      setCompanySettings(loadedCompany);
    } catch (e) {
      console.error('Error loading salary data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time live listeners across all devices
    let isMounted = true;
    const unsubKaryawan = subscribeKaryawan((list) => {
      if (isMounted) setKaryawanList(list);
    });
    const unsubSlips = subscribeSlips((list) => {
      if (isMounted) setSlips(list);
    });

    return () => {
      isMounted = false;
      unsubKaryawan();
      unsubSlips();
    };
  }, []);

  useEffect(() => {
    if (propCompanySettings) {
      setCompanySettings(propCompanySettings);
    }
  }, [propCompanySettings]);

  // Derived SalarySettings for components needing it
  const salarySettings: SalarySettings = {
    companyName: companySettings.companyName || 'CV MULIA TEKHNIK ABADI',
    address: companySettings.address || 'Jln. Letda Nasir No. 58 Desa Cikeas Udik\nKec. Gunung Putri - Kab. Bogor Kode Pos 16966',
    city: companySettings.city || 'Bogor',
    phone: companySettings.phone || '0812 - 1085 - 2489 / 0878 - 4062 - 0432',
    signatoryName: companySettings.signatoryName || 'Muhamad Ridho',
    logoImage: companySettings.logoImage || '/default-logo.png',
    kopImage: companySettings.kopImage || '/default-kop.png',
    signatureImage: companySettings.signatureImage || '/default-ttd-stempel.png',
    stampImage: companySettings.stampImage || '',
    tarifLemburPerJam: companySettings.tarifLemburPerJam ?? 12000,
  };

  // Handlers for Karyawan
  const handleSaveKaryawan = async (emp: Karyawan) => {
    await saveKaryawan(emp);
    await loadData();
  };

  const handleDeleteKaryawan = async (id: string) => {
    await deleteKaryawan(id);
    await loadData();
  };

  const handleCreateSlipForKaryawan = (emp: Karyawan) => {
    setSelectedKaryawanForSlip(emp);
    setActiveSalaryTab('buat-slip');
    onToast(`Menyiapkan slip gaji untuk ${emp.nama}`);
  };

  // Handlers for Slips
  const handleSaveSlip = async (slip: SlipGaji) => {
    await saveSlip(slip);
    await loadData();
    onToast(`Slip gaji #${slip.nomorSlip} (${slip.nama}) berhasil disimpan!`);
    // Open preview directly
    setPreviewSlip(slip);
  };

  const handleDeleteSlip = async (id: string) => {
    await deleteSlip(id);
    await loadData();
    onToast('Slip gaji berhasil dihapus');
  };

  // Unified Settings handler
  const handleSaveCompanySettings = async (newSettings: CompanySettings) => {
    if (propOnSaveSettings) {
      await propOnSaveSettings(newSettings);
    } else {
      await saveCompanySettings(newSettings);
    }
    setCompanySettings(newSettings);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-2" />
        <p className="text-xs font-semibold">Memuat data Slip Gaji...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* SECONDARY SUBNAV BAR (Matching Screenshots 2, 3, 4) */}
      <div className="bg-[#0b223d]/90 backdrop-blur-md border-b border-blue-900/50 sticky top-13 z-30 px-2 sm:px-4 py-1.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-1.5 scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tab 1: Slip Gaji */}
            <button
              type="button"
              onClick={() => setActiveSalaryTab('buat-slip')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeSalaryTab === 'buat-slip'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Buat Slip</span>
            </button>

            {/* Tab 2: Rekap Gaji */}
            <button
              type="button"
              onClick={() => setActiveSalaryTab('rekap-gaji')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeSalaryTab === 'rekap-gaji'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Rekap</span>
            </button>

            {/* Tab 3: Data Karyawan */}
            <button
              type="button"
              onClick={() => setActiveSalaryTab('karyawan')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeSalaryTab === 'karyawan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Karyawan</span>
            </button>

            {/* Tab 4: Pengaturan (Unified Single Source of Truth) */}
            <button
              type="button"
              onClick={() => setActiveSalaryTab('pengaturan')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeSalaryTab === 'pengaturan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE VIEW CONTENT */}
      <div className="pt-2">
        {activeSalaryTab === 'buat-slip' && (
          <FormSlipGaji
            karyawanList={karyawanList}
            settings={salarySettings}
            selectedKaryawanForSlip={selectedKaryawanForSlip}
            onSaveSlip={handleSaveSlip}
            onPreviewSlip={(s) => setPreviewSlip(s)}
            onToast={onToast}
            onViewSavedSlips={() => setActiveSalaryTab('rekap-gaji')}
            savedSlipsCount={slips.length}
          />
        )}

        {activeSalaryTab === 'rekap-gaji' && (
          <RekapGaji
            slips={slips}
            settings={salarySettings}
            onViewSlip={(s) => setPreviewSlip(s)}
            onDeleteSlip={handleDeleteSlip}
            onToast={onToast}
          />
        )}

        {activeSalaryTab === 'karyawan' && (
          <DataKaryawan
            karyawanList={karyawanList}
            onSaveKaryawan={handleSaveKaryawan}
            onDeleteKaryawan={handleDeleteKaryawan}
            onCreateSlipForKaryawan={handleCreateSlipForKaryawan}
            onToast={onToast}
          />
        )}

        {activeSalaryTab === 'pengaturan' && (
          <Pengaturan
            settings={companySettings}
            onSaveSettings={handleSaveCompanySettings}
            onRefreshAllData={loadData}
            onToast={onToast}
          />
        )}
      </div>

      {/* MODAL PREVIEW & CETAK SLIP GAJI - EXACT MATCH TO SCREENSHOT 1 */}
      {previewSlip && (
        <SlipGajiModal
          isOpen={Boolean(previewSlip)}
          onClose={() => setPreviewSlip(null)}
          slip={previewSlip}
          settings={salarySettings}
          onDelete={handleDeleteSlip}
          onToast={onToast}
        />
      )}
    </div>
  );
};
