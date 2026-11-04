import React, { useState, useEffect } from 'react';
import type { InvoiceData } from '../../types/invoice.ts';
import type { CompanySettings, Customer, LetterData } from '../../types/index.ts';
import {
  getAllInvoices,
  saveInvoice,
  deleteInvoice,
  generateNomorInvoiceBaru,
} from '../../services/invoiceDb.ts';
import { DaftarInvoice } from './DaftarInvoice.tsx';
import { FormInvoice } from './FormInvoice.tsx';
import { InvoicePreviewModal } from './InvoicePreviewModal.tsx';
import { formatInvoiceDate } from '../../services/invoicePdfGenerator.ts';
import { formatNumberIndo } from '../../services/pdfGenerator.ts';

interface InvoiceModuleProps {
  settings: CompanySettings;
  customers: Customer[];
  letters: LetterData[];
  onToast: (msg: string) => void;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  settings,
  customers,
  letters,
  onToast,
}) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [activeView, setActiveView] = useState<'daftar' | 'form'>('daftar');
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const list = await getAllInvoices();
      setInvoices(list);
    } catch (e) {
      console.error('Error loading Invoice data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingInvoice(null);
    setActiveView('form');
  };

  const handleEdit = (inv: InvoiceData) => {
    setEditingInvoice(inv);
    setActiveView('form');
  };

  const handleDuplicate = async (inv: InvoiceData) => {
    const nextSeq = invoices.length + 1;
    const duplicated: InvoiceData = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNumber: generateNomorInvoiceBaru(nextSeq),
      invoiceDate: new Date().toISOString().slice(0, 10),
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveInvoice(duplicated);
    await loadData();
    onToast(`Duplikasi #${duplicated.invoiceNumber} berhasil`);
  };

  const handleSaveInvoice = async (inv: InvoiceData) => {
    await saveInvoice(inv);
    await loadData();
    setActiveView('daftar');
    setEditingInvoice(null);
    onToast(`Invoice ${inv.invoiceNumber} disimpan`);
  };

  const handleDeleteInvoice = async (id: string) => {
    await deleteInvoice(id);
    await loadData();
    if (editingInvoice?.id === id) {
      setEditingInvoice(null);
      setActiveView('daftar');
    }
  };

  const handleShare = (inv: InvoiceData) => {
    const text = `*INVOICE - CV. MULIA TEKHNIK ABADI*
No: *${inv.invoiceNumber}*
Tanggal: *${formatInvoiceDate(inv.invoiceDate)}*
PO: *${inv.nomorPo || '-'}*

Kepada Yth:
*${inv.companyName}*
Total Tagihan: *Rp ${formatNumberIndo(inv.total)}*
("${inv.terbilang}")

Pembayaran Transfer:
${inv.bankName || settings.bankName || 'Mandiri'} - ${inv.bankAccountNumber || settings.bankAccountNumber || '167-00-0529426-8'}
A/N ${inv.bankAccountName || settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI'}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-2" />
        <p className="text-xs font-semibold">Memuat data Invoice...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {activeView === 'daftar' && (
        <DaftarInvoice
          invoices={invoices}
          settings={settings}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onViewPdf={(i) => setPreviewInvoice(i)}
          onShare={handleShare}
          onDelete={handleDeleteInvoice}
          onToast={onToast}
        />
      )}

      {activeView === 'form' && (
        <FormInvoice
          initialInvoice={editingInvoice}
          settings={settings}
          customers={customers}
          letters={letters}
          onSave={handleSaveInvoice}
          onPreview={(i) => setPreviewInvoice(i)}
          onBack={() => {
            setEditingInvoice(null);
            setActiveView('daftar');
          }}
          onToast={onToast}
        />
      )}

      {previewInvoice && (
        <InvoicePreviewModal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          invoice={previewInvoice}
          settings={settings}
          onDelete={handleDeleteInvoice}
          onToast={onToast}
        />
      )}
    </div>
  );
};
