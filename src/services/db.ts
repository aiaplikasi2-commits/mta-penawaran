import { openDB, type IDBPDatabase } from 'idb';
import type { CompanySettings, Customer, LetterData, BackupData } from '../types/index.ts';

const DB_NAME = 'SP_MTA_DATABASE';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'CV. MULIA TEKHNIK ABADI',
  address: 'Jln. Letda Nasir No. 58 Desa Ciketing Udik\nKecamatan Gunung Putri Kab. Bogor Kode Pos 16966',
  email: 'cvmuliatekhnikabadi@gmail.com',
  phone: '0812 - 1085 - 2489 / 0878 - 4062 - 0432',
  signatoryName: 'Muhamad Ridho',
  kopImage: '/default-kop.png',
  signatureImage: '/default-ttd-stempel.png',
  stampImage: '',
  numberFormat: '{seq}/10/MTA/{year}',
  nextSequenceNumber: 16,
  city: 'Bogor',
  defaultPpnPercent: 11,
};

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('letters')) {
          const letterStore = db.createObjectStore('letters', { keyPath: 'id' });
          letterStore.createIndex('letterNumber', 'letterNumber', { unique: false });
          letterStore.createIndex('createdAt', 'createdAt', { unique: false });
          letterStore.createIndex('companyName', 'companyName', { unique: false });
        }
        if (!db.objectStoreNames.contains('customers')) {
          const custStore = db.createObjectStore('customers', { keyPath: 'id' });
          custStore.createIndex('companyName', 'companyName', { unique: false });
        }
        if (!db.objectStoreNames.contains('draft')) {
          db.createObjectStore('draft');
        }
      },
    });
  }
  return dbPromise;
}

// Settings methods
export async function getCompanySettings(): Promise<CompanySettings> {
  const db = await getDb();
  const saved = await db.get('settings', 'company_settings');
  if (!saved) {
    await db.put('settings', DEFAULT_SETTINGS, 'company_settings');
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', settings, 'company_settings');
}

// Letters methods
export async function getAllLetters(): Promise<LetterData[]> {
  const db = await getDb();
  const letters = await db.getAll('letters');
  return (letters || []).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function getLetterById(id: string): Promise<LetterData | undefined> {
  const db = await getDb();
  return db.get('letters', id);
}

export async function saveLetter(letter: LetterData): Promise<void> {
  const db = await getDb();
  const toSave: LetterData = {
    ...letter,
    updatedAt: new Date().toISOString(),
    createdAt: letter.createdAt || new Date().toISOString(),
  };
  await db.put('letters', toSave);
}

export async function deleteLetter(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('letters', id);
}

// Customer methods
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const customers = await db.getAll('customers');
  return (customers || []).sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const db = await getDb();
  await db.put('customers', customer);
}

export async function saveBatchCustomers(newCustomers: Customer[]): Promise<number> {
  const db = await getDb();
  const existing = await getAllCustomers();
  const existingNames = new Set(existing.map((c) => c.companyName.trim().toLowerCase()));

  let insertedCount = 0;
  const tx = db.transaction('customers', 'readwrite');
  for (const c of newCustomers) {
    const key = (c.companyName || '').trim().toLowerCase();
    if (key && !existingNames.has(key)) {
      await tx.store.put(c);
      existingNames.add(key);
      insertedCount++;
    }
  }
  await tx.done;
  return insertedCount;
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('customers', id);
}

// Draft methods
export async function getDraftLetter(): Promise<LetterData | null> {
  const db = await getDb();
  return (await db.get('draft', 'current_draft')) || null;
}

export async function saveDraftLetter(draft: LetterData): Promise<void> {
  const db = await getDb();
  await db.put('draft', draft, 'current_draft');
}

export async function clearDraftLetter(): Promise<void> {
  const db = await getDb();
  await db.delete('draft', 'current_draft');
}

// Helper to convert an image URL (like /default-kop.png) to Base64 for complete JSON backup
async function urlToBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

// Backup & Restore
export async function exportBackupJSON(): Promise<BackupData> {
  const settings = await getCompanySettings();
  const letters = await getAllLetters();
  const customers = await getAllCustomers();

  // Ensure KOP and signature images are embedded as Base64 in backup
  const embeddedKop = await urlToBase64(settings.kopImage);
  const embeddedSignature = await urlToBase64(settings.signatureImage);
  const embeddedStamp = await urlToBase64(settings.stampImage);

  const backupData: BackupData = {
    version: 1,
    appName: 'SURAT PENAWARAN MTA',
    exportedAt: new Date().toISOString(),
    settings: {
      ...settings,
      kopImage: embeddedKop,
      signatureImage: embeddedSignature,
      stampImage: embeddedStamp,
    },
    letters,
    customers,
  };

  return backupData;
}

export async function restoreBackupJSON(data: any): Promise<{
  success: boolean;
  lettersCount: number;
  customersCount: number;
  message?: string;
}> {
  // Validate structure
  if (!data || typeof data !== 'object') {
    throw new Error('Format file bukan JSON yang valid');
  }
  if (!data.appName || (!data.letters && !data.customers && !data.settings)) {
    throw new Error('File JSON tidak memiliki struktur data Surat Penawaran MTA yang valid');
  }

  const db = await getDb();

  // Restore settings if provided
  if (data.settings && typeof data.settings === 'object') {
    await db.put('settings', { ...DEFAULT_SETTINGS, ...data.settings }, 'company_settings');
  }

  // Restore letters
  let lettersCount = 0;
  if (Array.isArray(data.letters)) {
    const tx = db.transaction('letters', 'readwrite');
    for (const letter of data.letters) {
      if (letter.id && letter.letterNumber) {
        await tx.store.put(letter);
        lettersCount++;
      }
    }
    await tx.done;
  }

  // Restore customers
  let customersCount = 0;
  if (Array.isArray(data.customers)) {
    const tx = db.transaction('customers', 'readwrite');
    for (const cust of data.customers) {
      if (cust.id && cust.companyName) {
        await tx.store.put(cust);
        customersCount++;
      }
    }
    await tx.done;
  }

  return {
    success: true,
    lettersCount,
    customersCount,
  };
}
