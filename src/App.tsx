import React, { useState, useEffect, useCallback } from 'react';
import type { CompanySettings, Customer, LetterData } from './types/index.ts';
import {
  getCompanySettings,
  saveCompanySettings,
  getAllLetters,
  saveLetter,
  deleteLetter,
  getAllCustomers,
  saveCustomer,
  saveBatchCustomers,
  deleteCustomer,
  getDraftLetter,
  saveDraftLetter,
  clearDraftLetter,
  DEFAULT_SETTINGS,
} from './services/db.ts';
import { downloadLetterPDF } from './services/pdfGenerator.ts';
import { Header } from './components/Header.tsx';
import { BottomNav, type NavTab } from './components/BottomNav.tsx';
import { FormTambahSurat } from './components/FormTambahSurat.tsx';
import { RekapSurat } from './components/RekapSurat.tsx';
import { DataPelanggan } from './components/DataPelanggan.tsx';
import { Pengaturan } from './components/Pengaturan.tsx';
import { PDFPreviewModal } from './components/PDFPreviewModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('tambah');
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeLetterForEdit, setActiveLetterForEdit] = useState<LetterData | null>(null);
  const [previewModalLetter, setPreviewModalLetter] = useState<LetterData | null>(null);
  const [shareModalLetter, setShareModalLetter] = useState<LetterData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load Initial Data from IndexedDB
  const loadAllData = useCallback(async () => {
    try {
      const [loadedSettings, loadedLetters, loadedCustomers] = await Promise.all([
        getCompanySettings(),
        getAllLetters(),
        getAllCustomers(),
      ]);
      setSettings(loadedSettings);
      setLetters(loadedLetters);
      setCustomers(loadedCustomers);

      // Check draft if not editing
      const draft = await getDraftLetter();
      if (draft && !activeLetterForEdit) {
        setActiveLetterForEdit(draft);
      }
    } catch (err) {
      console.error('Error loading data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeLetterForEdit]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Save Letter Handler
  const handleSaveLetter = async (letter: LetterData) => {
    try {
      await saveLetter(letter);
      await clearDraftLetter();

      // Auto-increment sequence number if this was a new letter using current sequence
      const numMatch = (letter.letterNumber || '').match(/\d+/);
      if (numMatch) {
        const usedSeq = parseInt(numMatch[0]);
        if (usedSeq >= (settings.nextSequenceNumber ?? 16)) {
          const updatedSettings = {
            ...settings,
            nextSequenceNumber: usedSeq + 1,
          };
          await saveCompanySettings(updatedSettings);
          setSettings(updatedSettings);
        }
      }

      await loadAllData();
      setActiveLetterForEdit(letter);
      showToast(`Surat penawaran ${letter.letterNumber} berhasil disimpan ke perangkat!`);
    } catch (err: any) {
      showToast('Gagal menyimpan surat: ' + (err.message || ''));
    }
  };

  // Download PDF Handler
  const handleDownloadPDF = async (letter: LetterData) => {
    try {
      await downloadLetterPDF(letter, settings);
      showToast('File PDF A4 resmi berhasil diunduh!');
    } catch (err: any) {
      showToast('Gagal mengunduh PDF: ' + (err.message || ''));
    }
  };

  // REQUIREMENT 3: Open Share Modal for choosing WhatsApp or Email with PDF attached
  const handleSharePDF = (letter: LetterData) => {
    setShareModalLetter(letter);
  };

  // Preview Modal Handler
  const handlePreviewPDF = (letter: LetterData) => {
    setPreviewModalLetter(letter);
  };

  // Delete Letter
  const handleDeleteLetter = async (id: string) => {
    await deleteLetter(id);
    await loadAllData();
    if (activeLetterForEdit?.id === id) {
      setActiveLetterForEdit(null);
    }
  };

  // Edit Letter Trigger from Rekap
  const handleEditLetterFromRekap = (letter: LetterData) => {
    setActiveLetterForEdit(letter);
    setActiveTab('tambah');
  };

  // Customer handlers
  const handleSaveCustomer = async (cust: Customer) => {
    await saveCustomer(cust);
    await loadAllData();
  };

  const handleBatchImportCustomers = async (newList: Customer[]) => {
    const count = await saveBatchCustomers(newList);
    await loadAllData();
    return count;
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    await loadAllData();
  };

  // Settings handlers
  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await saveCompanySettings(newSettings);
    setSettings(newSettings);
  };

  // Reset to brand new letter
  const handleResetToNewLetter = () => {
    clearDraftLetter();
    setActiveLetterForEdit(null);
    showToast('Formulir surat baru disiapkan');
  };

  // REQUIREMENT 2: When leaving 'tambah' tab, ensure current draft is saved as Draft
  const handleTabChange = async (nextTab: NavTab) => {
    if (activeTab === 'tambah' && nextTab !== 'tambah') {
      const draft = await getDraftLetter();
      if (draft && (draft.subject.trim() || draft.companyName.trim() || draft.items.some(i => i.description.trim()))) {
        const draftLetter = {
          ...draft,
          status: 'Draft' as const,
          updatedAt: new Date().toISOString(),
        };
        await saveLetter(draftLetter);
        await loadAllData();
      }
    }
    setActiveTab(nextTab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 p-1 flex items-center justify-center animate-pulse shadow-lg">
          <span className="font-extrabold text-base tracking-wider text-white">MTA</span>
        </div>
        <p className="mt-3 font-semibold text-xs text-slate-600">Memuat SP MTA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 1. STICKY TOP HEADER */}
      <Header />

      {/* 2. MAIN ACTIVE VIEW CONTENT */}
      <main className="flex-1 w-full">
        {activeTab === 'tambah' && (
          <FormTambahSurat
            initialLetter={activeLetterForEdit}
            settings={settings}
            customers={customers}
            onSave={handleSaveLetter}
            onDownloadPDF={handleDownloadPDF}
            onSharePDF={handleSharePDF}
            onPreviewPDF={handlePreviewPDF}
            onToast={showToast}
            onResetToNew={handleResetToNewLetter}
          />
        )}

        {activeTab === 'rekap' && (
          <RekapSurat
            letters={letters}
            settings={settings}
            onEditLetter={handleEditLetterFromRekap}
            onPreviewLetter={handlePreviewPDF}
            onDownloadLetter={handleDownloadPDF}
            onShareLetter={handleSharePDF}
            onDeleteLetter={handleDeleteLetter}
            onToast={showToast}
          />
        )}

        {activeTab === 'pelanggan' && (
          <DataPelanggan
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onBatchImport={handleBatchImportCustomers}
            onDeleteCustomer={handleDeleteCustomer}
            onToast={showToast}
          />
        )}

        {activeTab === 'pengaturan' && (
          <Pengaturan
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onRefreshAllData={loadAllData}
            onToast={showToast}
          />
        )}
      </main>

      {/* 3. STICKY BOTTOM NAVIGATION BAR */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* 4. MODAL PREVIEW DOKUMEN */}
      {previewModalLetter && (
        <PDFPreviewModal
          isOpen={Boolean(previewModalLetter)}
          onClose={() => setPreviewModalLetter(null)}
          letter={previewModalLetter}
          settings={settings}
          onToast={showToast}
          onShareClick={(l) => {
            setPreviewModalLetter(null);
            setShareModalLetter(l);
          }}
        />
      )}

      {/* 5. MODAL PILIHAN BAGIKAN (WA / EMAIL DENGAN PDF TERLAMPIR) */}
      {shareModalLetter && (
        <ShareModal
          isOpen={Boolean(shareModalLetter)}
          onClose={() => setShareModalLetter(null)}
          letter={shareModalLetter}
          settings={settings}
          onToast={showToast}
        />
      )}

      {/* 6. TOAST NOTIFICATION BADGE */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-slate-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 leading-snug">{toast}</span>
        </div>
      )}
    </div>
  );
}
