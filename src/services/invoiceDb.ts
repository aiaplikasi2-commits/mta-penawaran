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

const PENDING_INVOICES_KEY = 'MTA_PENDING_INVOICES';

function readPendingInvoices(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(PENDING_INVOICES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writePendingInvoices(set: Set<string>): void {
  try {
    if (typeof window === 'undefined') return;
    if (set.size === 0) localStorage.removeItem(PENDING_INVOICES_KEY);
    else localStorage.setItem(PENDING_INVOICES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export async function getAllInvoices(): Promise<InvoiceData[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'invoices'));
    const idbDb = await getInvoiceDb();

    const pendingIds = readPendingInvoices();
    const localBefore = await idbDb.getAll('invoices');
    const cloudList = snap.empty ? [] : snap.docs.map((d) => d.data() as InvoiceData);
    const cloudIds = new Set(cloudList.map((inv) => inv.id));

    const pendingExtras: InvoiceData[] = [];
    for (const loc of localBefore) {
      if (pendingIds.has(loc.id) && !cloudIds.has(loc.id)) {
        pendingExtras.push(loc);
      } else if (pendingIds.has(loc.id) && cloudIds.has(loc.id)) {
        pendingIds.delete(loc.id);
      }
    }
    writePendingInvoices(pendingIds);

    if (pendingExtras.length > 0) {
      import('./cloudSync.ts')
        .then(({ saveInvoiceOnline }) => {
          pendingExtras.forEach((item) => {
            saveInvoiceOnline(item)
              .then(() => {
                const s = readPendingInvoices();
                s.delete(item.id);
                writePendingInvoices(s);
              })
              .catch(() => {});
          });
        })
        .catch(() => {});
    }

    const merged = [...cloudList, ...pendingExtras].sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );

    const tx = idbDb.transaction('invoices', 'readwrite');
    await tx.store.clear();
    for (const inv of merged) {
      await tx.store.put(inv);
    }
    await tx.done;

    if (typeof window !== 'undefined') {
      localStorage.setItem('MTA_INVOICE_INIT', 'true');
    }
    return merged;
  } catch (e) {
    console.warn('Fallback to local Invoice cache:', e);
  }

  const db = await getInvoiceDb();
  const list = await db.getAll('invoices');

  // Only inject seed invoice on the absolute first launch if never initialized
  if ((!list || list.length === 0) && typeof window !== 'undefined' && !localStorage.getItem('MTA_INVOICE_INIT')) {
    localStorage.setItem('MTA_INVOICE_INIT', 'true');
    await db.put('invoices', SEED_INVOICE);
    return [SEED_INVOICE];
  }

  return (list || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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

  const pending = readPendingInvoices();
  pending.add(toSave.id);
  writePendingInvoices(pending);

  try {
    const { saveInvoiceOnline } = await import('./cloudSync.ts');
    await saveInvoiceOnline(toSave);
    const updatedPending = readPendingInvoices();
    updatedPending.delete(toSave.id);
    writePendingInvoices(updatedPending);
  } catch (err) {
    console.warn('Online sync queued for Invoice:', err);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const pending = readPendingInvoices();
  pending.delete(id);
  writePendingInvoices(pending);

  const db = await getInvoiceDb();
  await db.delete('invoices', id);

  try {
    const { deleteInvoiceOnline } = await import('./cloudSync.ts');
    await deleteInvoiceOnline(id);
  } catch (err) {
    console.warn('Online delete queued for Invoice:', err);
  }
}

// Generate new unique invoice number
export function generateNomorInvoiceBaru(seqOrExisting: number | InvoiceData[] = 1): string {
  const romawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const now = new Date();
  const bulanRomawi = romawi[now.getMonth()] || 'XI';
  const tahun = now.getFullYear();

  if (Array.isArray(seqOrExisting)) {
    const existingSet = new Set(
      seqOrExisting.map((inv) => (inv.invoiceNumber || '').trim().toLowerCase())
    );
    let seq = 1;
    while (seq <= 9999) {
      const candidate = `INV/${String(seq).padStart(3, '0')}/${bulanRomawi}/${tahun}`;
      if (!existingSet.has(candidate.toLowerCase())) {
        return candidate;
      }
      seq++;
    }
    return `INV/${String(Date.now()).slice(-3)}/${bulanRomawi}/${tahun}`;
  }

  const padded = String(seqOrExisting).padStart(3, '0');
  return `INV/${padded}/${bulanRomawi}/${tahun}`;
}
