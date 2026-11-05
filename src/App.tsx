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
import { Header, type AppMode } from './components/Header.tsx';
import { SidebarDrawer } from './components/SidebarDrawer.tsx';
import { FormTambahSurat } from './components/FormTambahSurat.tsx';
import { RekapSurat } from './components/RekapSurat.tsx';
import { DataPelanggan } from './components/DataPelanggan.tsx';
import { Pengaturan } from './components/Pengaturan.tsx';
import { PDFPreviewModal } from './components/PDFPreviewModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { SalaryModule } from './components/salary/SalaryModule.tsx';
import { BastModule } from './components/bast/BastModule.tsx';
import { InvoiceModule } from './components/invoice/InvoiceModule.tsx';
import { DashboardBeranda } from './components/dashboard/DashboardBeranda.tsx';
import { PoTrackerModal } from './components/dashboard/PoTrackerModal.tsx';
import { UploadPoModule } from './components/po/UploadPoModule.tsx';
import type { BastData } from './types/bast.ts';
import type { InvoiceData } from './types/invoice.ts';
import { getAllBasts } from './services/bastDb.ts';
import { getAllInvoices } from './services/invoiceDb.ts';
import {
  initializeAndMigrateToCloud,
  subscribeSettings,
  subscribeLetters,
  subscribeCustomers,
  subscribeBasts,
  subscribeInvoices,
} from './services/cloudSync.ts';
import { BottomNav } from './components/BottomNav.tsx';
import { CheckCircle2 } from 'lucide-react';

export type NavTab = 'tambah' | 'rekap' | 'pelanggan' | 'pengaturan';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    return (localStorage.getItem('MTA_APP_MODE') as AppMode) || 'dashboard';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('rekap');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [basts, setBasts] = useState<BastData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeLetterForEdit, setActiveLetterForEdit] = useState<LetterData | null>(null);
  const [previewModalLetter, setPreviewModalLetter] = useState<LetterData | null>(null);
  const [shareModalLetter, setShareModalLetter] = useState<LetterData | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Switch mode handler with history push for native Android Back support
  const handleModeChange = useCallback((mode: AppMode, nextTab?: NavTab) => {
    if (mode !== appMode) {
      window.history.pushState({ mode, tab: nextTab || activeTab }, '', window.location.pathname);
    }
    setAppMode(mode);
    if (nextTab) setActiveTab(nextTab);
    localStorage.setItem('MTA_APP_MODE', mode);
  }, [appMode, activeTab]);

  // Thumb-accessible Back handler for Android
  const handleBackNavigation = useCallback(() => {
    if (previewModalLetter) {
      setPreviewModalLetter(null);
      return;
    }
    if (shareModalLetter) {
      setShareModalLetter(null);
      return;
    }
    if (isPoModalOpen) {
      setIsPoModalOpen(false);
      return;
    }
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
      return;
    }

    if (appMode === 'penawaran') {
      if (activeTab !== 'rekap') {
        setActiveTab('rekap');
        return;
      }
    }
    // Return to dashboard
    handleModeChange('dashboard');
  }, [
    previewModalLetter,
    shareModalLetter,
    isPoModalOpen,
    isSidebarOpen,
    appMode,
    activeTab,
    handleModeChange,
  ]);

  // Support native Android hardware/gesture back navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.mode) {
        setAppMode(e.state.mode);
        if (e.state.tab) setActiveTab(e.state.tab);
      } else {
        setAppMode('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      const [loadedSettings, loadedLetters, loadedCustomers, loadedBasts, loadedInvoices] = await Promise.all([
        getCompanySettings(),
        getAllLetters(),
        getAllCustomers(),
        getAllBasts(),
        getAllInvoices(),
      ]);
      setSettings(loadedSettings);
      setLetters(loadedLetters);
      setCustomers(loadedCustomers);
      setBasts(loadedBasts);
      setInvoices(loadedInvoices);

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
    let isMounted = true;

    // 1. Initial Cloud Sync Check & Seeding
    initializeAndMigrateToCloud().catch((err) => {
      console.warn('Cloud database migration notice:', err);
    });

    // 2. Load Local / Initial Data
    loadAllData();

    // 3. Multi-device Real-time Listeners (Single Source of Truth)
    const unsubSettings = subscribeSettings((newSettings) => {
      if (isMounted) setSettings(newSettings);
    });

    const unsubLetters = subscribeLetters((newList) => {
      if (isMounted) setLetters(newList);
    });

    const unsubCustomers = subscribeCustomers((newList) => {
      if (isMounted) setCustomers(newList);
    });

    const unsubBasts = subscribeBasts((newList) => {
      if (isMounted) setBasts(newList);
    });

    const unsubInvoices = subscribeInvoices((newList) => {
      if (isMounted) setInvoices(newList);
    });

    return () => {
      isMounted = false;
      unsubSettings();
      unsubLetters();
      unsubCustomers();
      unsubBasts();
      unsubInvoices();
    };
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

  // Share Modal for choosing WhatsApp or Email with PDF attached
  const handleSharePDF = (letter: LetterData) => {
    setShareModalLetter(letter);
  };

  // Preview Modal Handler
  const handlePreviewPDF = (letter: LetterData) => {
    setPreviewModalLetter(letter);
  };

  // Delete Letter
  const handleDeleteLetter = async (id: string) => {
    setLetters((prev) => prev.filter((l) => l.id !== id));
    if (activeLetterForEdit?.id === id) {
      setActiveLetterForEdit(null);
    }
    if (previewModalLetter?.id === id) {
      setPreviewModalLetter(null);
    }
    try {
      await deleteLetter(id);
      showToast('Surat penawaran berhasil dihapus permanen');
    } catch (err) {
      console.error('Delete letter error:', err);
      showToast('Gagal menghapus surat');
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
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCustomer(id);
      showToast('Data client berhasil dihapus');
    } catch (err) {
      console.error('Delete customer error:', err);
      showToast('Gagal menghapus client');
    }
  };

  // Settings handlers
  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await saveCompanySettings(newSettings);
    setSettings(newSettings);
  };

  // Reset to brand new letter
  const handleResetToNewLetter = async () => {
    await clearDraftLetter();
    setActiveLetterForEdit(null);
    setActiveTab('tambah');
    showToast('Formulir surat baru disiapkan');
  };

  // When leaving 'tambah' tab, ensure current draft is saved as Draft
  const handleTabChange = async (nextTab: NavTab) => {
    if (activeTab === 'tambah' && nextTab !== 'tambah') {
      const draft = await getDraftLetter();
      if (
        draft &&
        (draft.subject.trim() ||
          draft.companyName.trim() ||
          draft.items.some((i) => i.description.trim()))
      ) {
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
        <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 bg-blue-900 shadow-xl border border-blue-500/30 flex items-center justify-center animate-pulse">
          <img src="/pwa-192x192.png" alt="Adm MTA" className="w-full h-full object-cover rounded-xl" />
        </div>
        <p className="mt-3 font-bold text-xs text-slate-700 tracking-wide">Memuat Adm MTA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 1. STICKY TOP HEADER (WHEN NOT IN DASHBOARD) */}
      {appMode !== 'dashboard' && (
        <Header
          appMode={appMode}
          onModeChange={handleModeChange}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onToast={showToast}
        />
      )}

      {/* 2. MAIN ACTIVE VIEW CONTENT */}
      <main className={`flex-1 w-full ${appMode !== 'dashboard' ? 'pb-24 sm:pb-28' : ''}`}>
        {/* MODE: DASHBOARD / BERANDA UTAMA (MOCKUP HVAC MTA) */}
        {appMode === 'dashboard' ? (
          <DashboardBeranda
            settings={settings}
            letters={letters}
            basts={basts}
            invoices={invoices}
            customers={customers}
            onToast={showToast}
            onSelectModule={(mode) => {
              handleModeChange(mode);
              if (mode === 'penawaran') setActiveTab('rekap');
            }}
            onOpenPengaturan={() => {
              handleModeChange('penawaran');
              setActiveTab('pengaturan');
            }}
            onOpenClientData={() => {
              handleModeChange('penawaran');
              setActiveTab('pelanggan');
            }}
            onOpenPoTracker={() => {
              setIsPoModalOpen(true);
            }}
            onOpenCoffee={() => {
              const gopay = '08179015181';
              navigator.clipboard?.writeText(gopay);
              showToast('Nomor GoPay 08179015181 disalin!');
            }}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        ) : appMode === 'bast' ? (
          /* MODE: BAST MTA (BERITA ACARA SERAH TERIMA) */
          <BastModule
            settings={settings}
            customers={customers}
            letters={letters}
            onToast={showToast}
          />
        ) : appMode === 'invoice' ? (
          /* MODE: INVOICE MTA */
          <InvoiceModule
            settings={settings}
            customers={customers}
            letters={letters}
            onToast={showToast}
          />
        ) : appMode === 'gaji' ? (
          /* MODE: SLIP GAJI MTA */
          <SalaryModule
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onToast={showToast}
          />
        ) : appMode === 'upload-po' ? (
          /* MODE: UPLOAD PO DENGAN AI OCR & DOKUMEN */
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4">
            <UploadPoModule
              onNavigateToInvoice={(po) => {
                handleModeChange('invoice');
                showToast(`Membuka form Invoice untuk PO ${po.nomorPo}`);
              }}
              onNavigateToBast={(po) => {
                handleModeChange('bast');
                showToast(`Membuka form BAST untuk PO ${po.nomorPo}`);
              }}
            />
          </div>
        ) : (
          /* MODE: SURAT PENAWARAN HARGA (SP MTA) */
          <div className="w-full">
            {/* SUBNAV UNTUK SURAT PENAWARAN */}
            <div className="bg-[#0b223d]/90 backdrop-blur-md border-b border-blue-900/50 sticky top-12 sm:top-13 z-30 px-2 sm:px-4 py-1.5">
              <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-1.5 scrollbar-none">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('tambah')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      activeTab === 'tambah'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
                    }`}
                  >
                    <span>+ Buat Surat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('rekap')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      activeTab === 'rekap'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
                    }`}
                  >
                    <span>Rekap Surat ({letters.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('pelanggan')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      activeTab === 'pelanggan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
                    }`}
                  >
                    <span>Data Client ({customers.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('pengaturan')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      activeTab === 'pengaturan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-sky-200 hover:text-white hover:bg-blue-900/50'
                    }`}
                  >
                    <span>Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>

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
          </div>
        )}
      </main>

      {/* 2B. ANDROID MOBILE THUMB NAVIGATION BAR */}
      {appMode !== 'dashboard' && (
        <BottomNav
          onGoHome={() => handleModeChange('dashboard')}
          onBack={handleBackNavigation}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      )}

      {/* 3. SIDEBAR DRAWER (GLOBAL) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        settings={settings}
        onNavigate={(mode, tab) => {
          handleModeChange(mode);
          if (tab) handleTabChange(tab as NavTab);
        }}
        onOpenPoTracker={() => setIsPoModalOpen(true)}
        onOpenCoffee={() => {
          const gopay = '08179015181';
          navigator.clipboard?.writeText(gopay);
          showToast('Nomor GoPay 08179015181 disalin!');
        }}
      />

      {/* 3B. PO TRACKER MODAL */}
      {isPoModalOpen && (
        <PoTrackerModal
          isOpen={isPoModalOpen}
          onClose={() => setIsPoModalOpen(false)}
          letters={letters}
          basts={basts}
          invoices={invoices}
          onOpenLetter={(letter) => {
            setIsPoModalOpen(false);
            handleEditLetterFromRekap(letter);
          }}
          onOpenBast={() => {
            setIsPoModalOpen(false);
            handleModeChange('bast');
          }}
          onOpenInvoice={() => {
            setIsPoModalOpen(false);
            handleModeChange('invoice');
          }}
        />
      )}

      {/* 4. MODAL PREVIEW DOKUMEN SURAT PENAWARAN */}
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
