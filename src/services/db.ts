import { openDB, type IDBPDatabase } from 'idb';
import type { CompanySettings, Customer, LetterData, BackupData } from '../types/index.ts';

const DB_NAME = 'SP_MTA_DATABASE';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'CV. MULIA TEKHNIK ABADI',
  address: 'Jln. Letda Nasir No. 58 Desa Cikeas Udik\nKecamatan Gunung Putri Kab. Bogor Kode Pos 16966',
  email: 'cvmuliatekhnikabadi@gmail.com',
  phone: '0812 - 1085 - 2489 / 0878 - 4062 - 0432',
  signatoryName: 'Muhamad Ridho',
  logoImage: '/default-logo.png',
  kopImage: '/default-kop.png',
  signatureImage: '/default-ttd-stempel.png',
  stampImage: '',
  numberFormat: '{seq}/10/MTA/{year}',
  nextSequenceNumber: 16,
  city: 'Bogor',
  defaultPpnPercent: 11,
  tarifLemburPerJam: 12000,
  bankName: 'Mandiri',
  bankAccountName: 'CV. MULIA TEKHNIK ABADI',
  bankAccountNumber: '167-00-0529426-8',
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
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDoc(doc(db, 'settings', 'company_settings'));
    if (snap.exists()) {
      const data = snap.data() as CompanySettings;
      const combined = { ...DEFAULT_SETTINGS, ...data };
      // Cache locally
      const idbDb = await getDb();
      await idbDb.put('settings', combined, 'company_settings');
      return combined;
    }
  } catch (e) {
    console.warn('Fallback to local settings cache:', e);
  }

  const idbDb = await getDb();
  const saved = await idbDb.get('settings', 'company_settings');
  if (!saved) {
    await idbDb.put('settings', DEFAULT_SETTINGS, 'company_settings');
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  const idbDb = await getDb();
  await idbDb.put('settings', settings, 'company_settings');

  // Push to cloud
  try {
    const { saveSettingsOnline } = await import('./cloudSync.ts');
    await saveSettingsOnline(settings);
  } catch (err) {
    console.warn('Online sync queued for settings:', err);
  }
}

// Letters methods
export async function getAllLetters(): Promise<LetterData[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'letters'));
    if (!snap.empty) {
      const cloudList = snap.docs.map((d) => d.data() as LetterData);
      cloudList.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      // Update local cache
      const idbDb = await getDb();
      for (const l of cloudList) {
        await idbDb.put('letters', l);
      }
      return cloudList;
    }
  } catch (e) {
    console.warn('Fallback to local letters cache:', e);
  }

  const idbDb = await getDb();
  const letters = await idbDb.getAll('letters');
  return (letters || []).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function getLetterById(id: string): Promise<LetterData | undefined> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDoc(doc(db, 'letters', id));
    if (snap.exists()) {
      return snap.data() as LetterData;
    }
  } catch {}
  const idbDb = await getDb();
  return idbDb.get('letters', id);
}

export async function saveLetter(letter: LetterData): Promise<void> {
  const toSave: LetterData = {
    ...letter,
    updatedAt: new Date().toISOString(),
    createdAt: letter.createdAt || new Date().toISOString(),
  };

  const idbDb = await getDb();
  await idbDb.put('letters', toSave);

  // Push to Firestore Cloud Database
  try {
    const { saveLetterOnline } = await import('./cloudSync.ts');
    await saveLetterOnline(toSave);
  } catch (err) {
    console.warn('Online sync queued for letter:', err);
  }
}

export async function deleteLetter(id: string): Promise<void> {
  const idbDb = await getDb();
  await idbDb.delete('letters', id);

  // Push delete to Firestore Cloud Database
  try {
    const { deleteLetterOnline } = await import('./cloudSync.ts');
    await deleteLetterOnline(id);
  } catch (err) {
    console.warn('Online delete queued for letter:', err);
  }
}

// Customer methods
export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'customers'));
    if (!snap.empty) {
      const cloudList = snap.docs.map((d) => d.data() as Customer);
      cloudList.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
      const idbDb = await getDb();
      for (const c of cloudList) {
        await idbDb.put('customers', c);
      }
      return cloudList;
    }
  } catch (e) {
    console.warn('Fallback to local customers cache:', e);
  }

  const idbDb = await getDb();
  const customers = await idbDb.getAll('customers');
  return (customers || []).sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const idbDb = await getDb();
  await idbDb.put('customers', customer);

  // Push to Firestore Cloud Database
  try {
    const { saveCustomerOnline } = await import('./cloudSync.ts');
    await saveCustomerOnline(customer);
  } catch (err) {
    console.warn('Online sync queued for customer:', err);
  }
}

export async function saveBatchCustomers(newCustomers: Customer[]): Promise<number> {
  const idbDb = await getDb();
  const existing = await getAllCustomers();
  const existingNames = new Set(existing.map((c) => c.companyName.trim().toLowerCase()));

  let insertedCount = 0;
  const tx = idbDb.transaction('customers', 'readwrite');
  for (const c of newCustomers) {
    const key = (c.companyName || '').trim().toLowerCase();
    if (key && !existingNames.has(key)) {
      await tx.store.put(c);
      existingNames.add(key);
      insertedCount++;
      // Sync each new customer to cloud
      try {
        const { saveCustomerOnline } = await import('./cloudSync.ts');
        saveCustomerOnline(c).catch(() => {});
      } catch {}
    }
  }
  await tx.done;
  return insertedCount;
}

export async function deleteCustomer(id: string): Promise<void> {
  const idbDb = await getDb();
  await idbDb.delete('customers', id);

  try {
    const { deleteCustomerOnline } = await import('./cloudSync.ts');
    await deleteCustomerOnline(id);
  } catch (err) {
    console.warn('Online delete queued for customer:', err);
  }
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

  // Ensure logo, KOP and signature images are embedded as Base64 in backup
  const embeddedLogo = await urlToBase64(settings.logoImage || '/default-logo.png');
  const embeddedKop = await urlToBase64(settings.kopImage);
  const embeddedSignature = await urlToBase64(settings.signatureImage);
  const embeddedStamp = await urlToBase64(settings.stampImage);

  const backupData: BackupData = {
    version: 1,
    appName: 'SURAT PENAWARAN & GAJI MTA',
    exportedAt: new Date().toISOString(),
    settings: {
      ...settings,
      logoImage: embeddedLogo,
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
