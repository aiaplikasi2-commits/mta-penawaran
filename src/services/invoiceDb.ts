import { openDB, type IDBPDatabase } from 'idb';
import type { InvoiceData } from '../types/invoice.ts';

const DB_NAME = 'SP_MTA_INVOICE_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

// Indonesian Numbers to Words (Terbilang)
export function angkaKeTerbilang(nilai: number): string {
  const bilangan = Math.floor(Math.abs(nilai));
  if (bilangan === 0) return 'Nol Rupiah';

  const kata = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function konversi(n: number): string {
    if (n < 12) {
      return kata[n];
    } else if (n < 20) {
      return konversi(n - 10) + ' Belas';
    } else if (n < 100) {
      return konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + konversi(n - 100);
    } else if (n < 1000) {
      return konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + konversi(n - 1000);
    } else if (n < 1000000) {
      return konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    } else if (n < 1000000000) {
      return konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    } else if (n < 1000000000000) {
      return konversi(Math.floor(n / 1000000000)) + ' Milyar ' + konversi(n % 1000000000);
    } else {
      return konversi(Math.floor(n / 1000000000000)) + ' Triliun ' + konversi(n % 1000000000000);
    }
  }

  const hasil = konversi(bilangan).replace(/\s+/g, ' ').trim();
  return `${hasil} Rupiah`;
}

// Initial seed invoice matching user's image reference
export const SEED_INVOICE: InvoiceData = {
  id: 'inv-seed-001',
  invoiceNumber: 'W4TSTGFS',
  invoiceDate: '2026-11-03',
  nomorPo: 'fsfsdfsfvsf',
  companyName: 'FSDSFSDF',
  recipientName: 'SFSFSF',
  address: 'SFSFSFS',
  items: [
    {
      id: 'inv-item-1',
      description: 'SFSFSFSF',
      qty: 1,
      satuan: 'unit',
      price: 5555555,
      total: 5555555,
    },
  ],
  tradeInActive: true,
  tradeInName: 'Trade In Barang Bekas',
  tradeInValue: 5555,
  discountActive: false,
  discountValue: 0,
  ppnActive: false,
  ppnPercent: 11,
  subtotal: 5555555,
  total: 5550000,
  terbilang: 'Lima Juta Lima Ratus Lima Puluh Ribu Rupiah',
  bankName: 'Mandiri',
  bankAccountName: 'CV. MULIA TEKHNIK ABADI',
  bankAccountNumber: '167-00-0529426-8',
  signatoryName: 'MUHAMAD RIDHO',
  status: 'Belum Lunas',
  createdAt: '2026-11-03T00:00:00.000Z',
  updatedAt: '2026-11-03T00:00:00.000Z',
};

export function getInvoiceDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('invoices')) {
          const store = db.createObjectStore('invoices', { keyPath: 'id' });
          store.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
          store.createIndex('invoiceDate', 'invoiceDate', { unique: false });
          store.createIndex('companyName', 'companyName', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllInvoices(): Promise<InvoiceData[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'invoices'));
    if (!snap.empty) {
      const cloudList = snap.docs.map((d) => d.data() as InvoiceData);
      cloudList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      const idbDb = await getInvoiceDb();
      for (const inv of cloudList) {
        await idbDb.put('invoices', inv);
      }
      return cloudList;
    }
  } catch (e) {
    console.warn('Fallback to local Invoice cache:', e);
  }

  const db = await getInvoiceDb();
  const list = await db.getAll('invoices');
  if (!list || list.length === 0) {
    await db.put('invoices', SEED_INVOICE);
    return [SEED_INVOICE];
  }
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getInvoiceById(id: string): Promise<InvoiceData | undefined> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDoc(doc(db, 'invoices', id));
    if (snap.exists()) {
      return snap.data() as InvoiceData;
    }
  } catch {}
  const db = await getInvoiceDb();
  return db.get('invoices', id);
}

export async function saveInvoice(invoice: InvoiceData): Promise<void> {
  const toSave: InvoiceData = {
    ...invoice,
    updatedAt: new Date().toISOString(),
    createdAt: invoice.createdAt || new Date().toISOString(),
  };

  const db = await getInvoiceDb();
  await db.put('invoices', toSave);

  try {
    const { saveInvoiceOnline } = await import('./cloudSync.ts');
    await saveInvoiceOnline(toSave);
  } catch (err) {
    console.warn('Online sync queued for Invoice:', err);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getInvoiceDb();
  await db.delete('invoices', id);

  try {
    const { deleteInvoiceOnline } = await import('./cloudSync.ts');
    await deleteInvoiceOnline(id);
  } catch (err) {
    console.warn('Online delete queued for Invoice:', err);
  }
}

// Generate new invoice number
export function generateNomorInvoiceBaru(seq: number = 1): string {
  const romawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const now = new Date();
  const bulanRomawi = romawi[now.getMonth()] || 'XI';
  const tahun = now.getFullYear();
  const padded = String(seq).padStart(3, '0');
  return `INV/${padded}/${bulanRomawi}/${tahun}`;
}
