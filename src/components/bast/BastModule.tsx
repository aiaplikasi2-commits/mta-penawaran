import React, { useState, useEffect } from 'react';
import type { BastData } from '../../types/bast.ts';
import type { CompanySettings, Customer, LetterData } from '../../types/index.ts';
import {
  getAllBasts,
  saveBast,
  deleteBast,
  generateNomorBastBaru,
} from '../../services/bastDb.ts';
import { subscribeBasts } from '../../services/cloudSync.ts';
import { DaftarBast } from './DaftarBast.tsx';
import { FormBast } from './FormBast.tsx';
import { BastPreviewModal } from './BastPreviewModal.tsx';
import { downloadBastPDF, formatBastDate } from '../../services/bastPdfGenerator.ts';

interface BastModuleProps {
  settings: CompanySettings;
  customers: Customer[];
  letters: LetterData[];
  initialEditingBast?: BastData | null;
  onClearInitialBast?: () => void;
  onToast: (msg: string) => void;
}

export const BastModule: React.FC<BastModuleProps> = ({
  settings,
  customers,
  letters,
  initialEditingBast,
  onClearInitialBast,
  onToast,
}) => {
  const [basts, setBasts] = useState<BastData[]>([]);
  const [activeView, setActiveView] = useState<'daftar' | 'form'>('daftar');
  const [editingBast, setEditingBast] = useState<BastData | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [previewBast, setPreviewBast] = useState<BastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialEditingBast) {
      localStorage.removeItem('MTA_BAST_DRAFT');
      setEditingBast(initialEditingBast);
      setFormKey((k) => k + 1);
      setActiveView('form');
      onClearInitialBast?.();
    }
  }, [initialEditingBast, onClearInitialBast]);

  const loadData = async () => {
    try {
      const list = await getAllBasts();
      setBasts(list);
    } catch (e) {
      console.error('Error loading BAST data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to cloud real-time updates and deletions
    let isMounted = true;
    const unsub = subscribeBasts((newList) => {
      if (isMounted) {
        setBasts(newList);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const handleCreateNew = () => {
    localStorage.removeItem('MTA_BAST_DRAFT');
    setEditingBast(null);
    setFormKey((k) => k + 1);
    setActiveView('form');
  };

  const handleEdit = (bast: BastData) => {
    localStorage.removeItem('MTA_BAST_DRAFT');
    setEditingBast(bast);
    setFormKey((k) => k + 1);
    setActiveView('form');
  };

  const handleDuplicate = async (bast: BastData) => {
    const duplicated: BastData = {
      ...bast,
      id: `bast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nomorBast: generateNomorBastBaru(basts),
      tanggalBast: new Date().toISOString().slice(0, 10),
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveBast(duplicated);
    setBasts((prev) => [duplicated, ...prev.filter((b) => b.id !== duplicated.id)]);
    onToast(`Berhasil menduplikasi menjadi BAST #${duplicated.nomorBast}`);
  };

  const handleSaveBast = async (bast: BastData) => {
    await saveBast(bast);
    localStorage.removeItem('MTA_BAST_DRAFT');
    setBasts((prev) => [bast, ...prev.filter((b) => b.id !== bast.id)]);
    setActiveView('daftar');
    setEditingBast(null);
    onToast(`Dokumen ${bast.nomorBast} berhasil disimpan!`);
  };

  const handleDeleteBast = async (id: string) => {
    // 1. Immediately remove from local state
    setBasts((prev) => prev.filter((b) => b.id !== id));
    if (editingBast?.id === id) {
      setEditingBast(null);
      setActiveView('daftar');
    }
    if (previewBast?.id === id) {
      setPreviewBast(null);
    }

    // 2. Permanently delete from IndexedDB & Firestore
    try {
      await deleteBast(id);
      onToast('BAST berhasil dihapus permanen');
    } catch (err) {
      console.error('Delete BAST error:', err);
      onToast('Gagal menghapus BAST');
    }
  };

  const handleShare = (bast: BastData) => {
    const penerima = [bast.pihakPertamaNama, bast.pihakPertamaJabatan, bast.pihakPertamaPerusahaan]
      .filter(Boolean)
      .join(' - ');

    const text = `*BERITA ACARA SERAH TERIMA (BAST)*
*CV. MULIA TEKHNIK ABADI*
Nomor: *${bast.nomorBast}*
PO: *${bast.nomorPo || '-'}*

Kepada Yth:
*${penerima || 'Pihak Pertama'}*

Pekerjaan telah selesai dikerjakan dan diserahterimakan dalam kondisi baik dan berfungsi.
Tanggal: *${formatBastDate(bast.tanggalBast)}*

_Dokumen resmi CV. Mulia Tekhnik Abadi._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-2" />
        <p className="text-xs font-semibold">Memuat data Dokumen BAST...</p>
      </div>
    );
  }

  const handleInlineUpdateBast = async (updated: BastData) => {
    setPreviewBast(updated);
    setBasts((prev) => {
      const exists = prev.some((b) => b.id === updated.id);
      return exists ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev;
    });
    if (editingBast?.id === updated.id) {
      setEditingBast(updated);
    }
    try {
      await saveBast(updated);
    } catch (err) {
      console.warn('Inline BAST save warning:', err);
    }
  };

  return (
    <div className="w-full">
      {activeView === 'daftar' && (
        <DaftarBast
          basts={basts}
          settings={settings}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onViewPdf={(b) => setPreviewBast(b)}
          onShare={handleShare}
          onDelete={handleDeleteBast}
          onToast={onToast}
        />
      )}

      {activeView === 'form' && (
        <FormBast
          key={formKey}
          initialBast={editingBast}
          existingBasts={basts}
          settings={settings}
          customers={customers}
          letters={letters}
          onSave={handleSaveBast}
          onPreview={(b) => setPreviewBast(b)}
          onBack={() => {
            setEditingBast(null);
            setActiveView('daftar');
          }}
          onToast={onToast}
        />
      )}

      {previewBast && (
        <BastPreviewModal
          isOpen={Boolean(previewBast)}
          onClose={() => setPreviewBast(null)}
          bast={previewBast}
          settings={settings}
          onDelete={handleDeleteBast}
          onEdit={(b) => {
            setPreviewBast(null);
            handleEdit(b);
          }}
          onUpdateBast={handleInlineUpdateBast}
          onToast={onToast}
        />
      )}
    </div>
  );
};
