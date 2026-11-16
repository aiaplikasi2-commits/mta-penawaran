import React, { useState, useEffect } from 'react';
import type { InvoiceData, InvoiceItem } from '../../types/invoice.ts';
import type { CompanySettings, Customer, LetterData } from '../../types/index.ts';
import type { PurchaseOrderData } from '../../types/po.ts';
import {
  getAllInvoices,
  saveInvoice,
  deleteInvoice,
  generateNomorInvoiceBaru,
  angkaKeTerbilang,
} from '../../services/invoiceDb.ts';
import { getAllPurchaseOrders } from '../../services/poDb.ts';
import { subscribeInvoices, subscribePurchaseOrders } from '../../services/cloudSync.ts';
import { DaftarInvoice } from './DaftarInvoice.tsx';
import { FormInvoice } from './FormInvoice.tsx';
import { InvoicePreviewModal } from './InvoicePreviewModal.tsx';
import { formatInvoiceDate } from '../../services/invoicePdfGenerator.ts';
import { formatNumberIndo } from '../../services/pdfGenerator.ts';

interface InvoiceModuleProps {
  settings: CompanySettings;
  customers: Customer[];
  letters: LetterData[];
  initialEditingInvoice?: InvoiceData | null;
  onClearInitialInvoice?: () => void;
  onToast: (msg: string) => void;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  settings,
  customers,
  letters,
  initialEditingInvoice,
  onClearInitialInvoice,
  onToast,
}) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderData[]>([]);
  const [activeView, setActiveView] = useState<'daftar' | 'form'>('daftar');
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialEditingInvoice) {
      setEditingInvoice(initialEditingInvoice);
      setActiveView('form');
      onClearInitialInvoice?.();
    }
  }, [initialEditingInvoice, onClearInitialInvoice]);

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
    getAllPurchaseOrders().then((list) => {
      if (list && list.length > 0) setPurchaseOrders(list);
    });

    // Subscribe to cloud real-time updates and deletions
    let isMounted = true;
    const unsub = subscribeInvoices((newList) => {
      if (isMounted) {
        setInvoices(newList);
        setIsLoading(false);
      }
    });
    const unsubPos = subscribePurchaseOrders((newPos) => {
      if (isMounted) {
        setPurchaseOrders(newPos);
      }
    });

    return () => {
      isMounted = false;
      unsub();
      unsubPos();
    };
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
    // 1. Immediately remove from local UI state
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (editingInvoice?.id === id) {
      setEditingInvoice(null);
      setActiveView('daftar');
    }
    if (previewInvoice?.id === id) {
      setPreviewInvoice(null);
    }

    // 2. Permanently delete from IndexedDB and Firestore
    try {
      await deleteInvoice(id);
      onToast('Invoice berhasil dihapus permanen');
    } catch (err) {
      console.error('Delete invoice error:', err);
      onToast('Gagal menghapus Invoice');
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

  const handleSelectLetterForInvoice = (letter: LetterData) => {
    const nextSeq = invoices.length + 1;
    const invNumber = generateNomorInvoiceBaru(nextSeq);
    const today = new Date().toISOString().slice(0, 10);

    const mappedItems: InvoiceItem[] = (letter.items || []).map((it, idx) => ({
      id: `inv-item-${Date.now()}-${idx}`,
      description: it.description,
      qty: Number(it.qty) || 1,
      satuan: it.satuan || 'unit',
      price: Number(it.price) || 0,
      total: (Number(it.qty) || 1) * (Number(it.price) || 0),
    }));

    const subtotal = mappedItems.reduce((acc, it) => acc + (it.total || 0), 0);
    const tradeInVal =
      letter.tradeInActive && letter.tradeIn
        ? Number(letter.tradeIn.totalValue) ||
          (Number(letter.tradeIn.qty) || 1) * (Number(letter.tradeIn.unitValue) || 0)
        : 0;
    const total = Math.max(0, subtotal - tradeInVal);

    const converted: InvoiceData = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      invoiceDate: today,
      nomorPo: letter.subject || '',
      companyName: letter.companyName || '',
      recipientName: letter.recipientName || '',
      address: letter.address || '',
      items: mappedItems,
      tradeInActive: letter.tradeInActive || false,
      tradeInName: letter.tradeIn?.name || 'Trade In Barang Bekas',
      tradeInValue: tradeInVal,
      discountActive: false,
      discountValue: 0,
      ppnActive: false,
      ppnPercent: 11,
      subtotal,
      total,
      terbilang: angkaKeTerbilang(total),
      bankName: settings.bankName || 'Mandiri',
      bankAccountName: settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI',
      bankAccountNumber: settings.bankAccountNumber || '167-00-0529426-8',
      signatoryName: settings.signatoryName || 'MUHAMAD RIDHO',
      status: 'Belum Lunas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingInvoice(converted);
    setActiveView('form');
    onToast(`Data dari Surat Penawaran ${letter.letterNumber} berhasil dimuat!`);
  };

  const handleSelectPoForInvoice = (po: PurchaseOrderData) => {
    const nextSeq = invoices.length + 1;
    const invNumber = generateNomorInvoiceBaru(nextSeq);
    const today = new Date().toISOString().slice(0, 10);

    const mappedItems: InvoiceItem[] = (po.items || []).map((it, idx) => {
      const name = (it.itemName || '').trim();
      const spec = (it.itemSpec || '').trim();
      const description =
        spec && name && !name.toLowerCase().includes(spec.toLowerCase())
          ? `${name} ${spec}`
          : name || spec;
      const qty = Number(it.qty) || 1;
      const price = Number(it.unitPrice) || 0;
      return {
        id: `inv-po-${Date.now()}-${idx}`,
        description,
        qty,
        satuan: it.satuan || 'unit',
        price,
        total: Number(it.totalPrice) || Math.round(qty * price),
      };
    });

    const subtotal = mappedItems.reduce((acc, it) => acc + (it.total || 0), 0);
    const total = Math.max(0, subtotal);

    const converted: InvoiceData = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      invoiceDate: today,
      nomorPo: po.nomorPo || '',
      companyName: po.buyerCompany || '',
      recipientName: po.picName || '',
      address: po.buyerAddress || po.deliveryAddress || '',
      items:
        mappedItems.length > 0
          ? mappedItems
          : [
              {
                id: `inv-po-${Date.now()}-1`,
                description: '',
                qty: 1,
                satuan: 'unit',
                price: 0,
                total: 0,
              },
            ],
      tradeInActive: false,
      tradeInName: 'Trade In Barang Bekas',
      tradeInValue: 0,
      discountActive: false,
      discountValue: 0,
      ppnActive: false,
      ppnPercent: 11,
      subtotal,
      total,
      terbilang: angkaKeTerbilang(total),
      bankName: settings.bankName || 'Mandiri',
      bankAccountName: settings.bankAccountName || 'CV. MULIA TEKHNIK ABADI',
      bankAccountNumber: settings.bankAccountNumber || '167-00-0529426-8',
      signatoryName: settings.signatoryName || 'MUHAMAD RIDHO',
      status: 'Belum Lunas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingInvoice(converted);
    setActiveView('form');
    onToast(`Data dari PO ${po.nomorPo} berhasil ditarik ke Invoice!`);
  };

  return (
    <div className="w-full">
      {activeView === 'daftar' && (
        <DaftarInvoice
          invoices={invoices}
          settings={settings}
          letters={letters}
          purchaseOrders={purchaseOrders}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onViewPdf={(i) => setPreviewInvoice(i)}
          onShare={handleShare}
          onDelete={handleDeleteInvoice}
          onSelectLetter={handleSelectLetterForInvoice}
          onSelectPo={handleSelectPoForInvoice}
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
