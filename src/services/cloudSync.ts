import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  onSnapshotsInSync,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase.ts';
import type { CompanySettings, Customer, LetterData } from '../types/index.ts';
import type { BastData } from '../types/bast.ts';
import type { InvoiceData } from '../types/invoice.ts';
import type { Karyawan, SlipGaji } from '../types/salary.ts';
import { DEFAULT_SETTINGS, getCompanySettings, getAllLetters, getAllCustomers } from './db.ts';
import { INITIAL_BAST, getAllBasts } from './bastDb.ts';
import { SEED_INVOICE, getAllInvoices } from './invoiceDb.ts';
import { INITIAL_KARYAWAN, getAllKaryawan, getAllSlips } from './salaryDb.ts';

export type SyncState = 'ONLINE' | 'OFFLINE' | 'MENYINKRONKAN' | 'TERSINKRON' | 'GAGAL SINKRON';

// Listeners for sync state subscribers
type SyncListener = (state: SyncState, message?: string) => void;
const syncListeners: Set<SyncListener> = new Set();
let currentSyncState: SyncState = navigator.onLine ? 'ONLINE' : 'OFFLINE';
let syncStatusMessage = '';

export function getSyncState(): { state: SyncState; message: string } {
  return { state: currentSyncState, message: syncStatusMessage };
}

export function subscribeSyncState(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(currentSyncState, syncStatusMessage);
  return () => syncListeners.delete(listener);
}

export function notifySyncState(state: SyncState, message: string = '') {
  currentSyncState = state;
  syncStatusMessage = message;
  syncListeners.forEach((l) => l(state, message));
}

// Global network status tracking
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifySyncState('MENYINKRONKAN', 'Terhubung kembali ke server, menyinkronkan...');
    setTimeout(() => {
      notifySyncState('TERSINKRON', 'Terhubung & data tersinkron');
    }, 1500);
  });

  window.addEventListener('offline', () => {
    notifySyncState('OFFLINE', 'Tidak ada koneksi internet. Mode offline aktif.');
  });

  // Track Firestore internal snapshot sync
  try {
    onSnapshotsInSync(db, () => {
      if (navigator.onLine && currentSyncState !== 'GAGAL SINKRON') {
        notifySyncState('TERSINKRON', 'Seluruh data tersimpan di server cloud');
      }
    });
  } catch (e) {
    console.warn('onSnapshotsInSync listener warning:', e);
  }
}

// ----------------------------------------------------------------------
// 1. SETTINGS
// ----------------------------------------------------------------------
export function subscribeSettings(callback: (settings: CompanySettings) => void): Unsubscribe {
  const settingsDocRef = doc(db, 'settings', 'company_settings');
  return onSnapshot(
    settingsDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CompanySettings;
        callback({ ...DEFAULT_SETTINGS, ...data });
      } else {
        callback(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat pengaturan dari server');
      handleFirestoreError(error, OperationType.GET, 'settings/company_settings');
    }
  );
}

export async function saveSettingsOnline(settings: CompanySettings): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan pengaturan ke cloud database...');
  try {
    const docRef = doc(db, 'settings', 'company_settings');
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    notifySyncState('TERSINKRON', 'Pengaturan berhasil tersinkron ke semua perangkat');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan pengaturan');
    handleFirestoreError(error, OperationType.WRITE, 'settings/company_settings');
  }
}

// ----------------------------------------------------------------------
// 2. SURAT PENAWARAN (LETTERS)
// ----------------------------------------------------------------------
export function subscribeLetters(callback: (letters: LetterData[]) => void): Unsubscribe {
  const lettersRef = collection(db, 'letters');
  return onSnapshot(
    lettersRef,
    (snapshot) => {
      const list: LetterData[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as LetterData);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat surat penawaran');
      handleFirestoreError(error, OperationType.LIST, 'letters');
    }
  );
}

export async function saveLetterOnline(letter: LetterData): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan surat penawaran ke cloud...');
  try {
    const docRef = doc(db, 'letters', letter.id);
    const payload = {
      ...letter,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    notifySyncState('TERSINKRON', 'Surat penawaran tersimpan di cloud database');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan surat penawaran');
    handleFirestoreError(error, OperationType.WRITE, `letters/${letter.id}`);
  }
}

export async function deleteLetterOnline(id: string): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menghapus surat penawaran...');
  try {
    const docRef = doc(db, 'letters', id);
    await deleteDoc(docRef);
    notifySyncState('TERSINKRON', 'Surat penawaran berhasil dihapus di cloud');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menghapus surat penawaran');
    handleFirestoreError(error, OperationType.DELETE, `letters/${id}`);
  }
}

// ----------------------------------------------------------------------
// 3. DATA CLIENT / CUSTOMERS
// ----------------------------------------------------------------------
export function subscribeCustomers(callback: (customers: Customer[]) => void): Unsubscribe {
  const customersRef = collection(db, 'customers');
  return onSnapshot(
    customersRef,
    (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Customer);
      });
      list.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
      callback(list);
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat data pelanggan');
      handleFirestoreError(error, OperationType.LIST, 'customers');
    }
  );
}

export async function saveCustomerOnline(customer: Customer): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan data client ke cloud...');
  try {
    const docRef = doc(db, 'customers', customer.id);
    await setDoc(docRef, customer, { merge: true });
    notifySyncState('TERSINKRON', 'Data client tersinkron ke semua perangkat');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan data client');
    handleFirestoreError(error, OperationType.WRITE, `customers/${customer.id}`);
  }
}

export async function deleteCustomerOnline(id: string): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menghapus data client...');
  try {
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
    notifySyncState('TERSINKRON', 'Data client berhasil dihapus');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menghapus data client');
    handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
  }
}

// ----------------------------------------------------------------------
// 4. BAST (BERITA ACARA SERAH TERIMA)
// ----------------------------------------------------------------------
export function subscribeBasts(callback: (basts: BastData[]) => void): Unsubscribe {
  const bastsRef = collection(db, 'basts');
  return onSnapshot(
    bastsRef,
    (snapshot) => {
      const list: BastData[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as BastData);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat BAST');
      handleFirestoreError(error, OperationType.LIST, 'basts');
    }
  );
}

export async function saveBastOnline(bast: BastData): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan BAST ke cloud...');
  try {
    const docRef = doc(db, 'basts', bast.id);
    const payload = {
      ...bast,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    notifySyncState('TERSINKRON', 'BAST berhasil tersimpan di cloud database');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan BAST');
    handleFirestoreError(error, OperationType.WRITE, `basts/${bast.id}`);
  }
}

export async function deleteBastOnline(id: string): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menghapus BAST...');
  try {
    const docRef = doc(db, 'basts', id);
    await deleteDoc(docRef);
    notifySyncState('TERSINKRON', 'BAST berhasil dihapus');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menghapus BAST');
    handleFirestoreError(error, OperationType.DELETE, `basts/${id}`);
  }
}

// ----------------------------------------------------------------------
// 5. INVOICE
// ----------------------------------------------------------------------
export function subscribeInvoices(callback: (invoices: InvoiceData[]) => void): Unsubscribe {
  const invoicesRef = collection(db, 'invoices');
  return onSnapshot(
    invoicesRef,
    (snapshot) => {
      const list: InvoiceData[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as InvoiceData);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat data Invoice');
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    }
  );
}

export async function saveInvoiceOnline(invoice: InvoiceData): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan Invoice ke cloud...');
  try {
    const docRef = doc(db, 'invoices', invoice.id);
    const payload = {
      ...invoice,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    notifySyncState('TERSINKRON', 'Invoice tersimpan di cloud database');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan Invoice');
    handleFirestoreError(error, OperationType.WRITE, `invoices/${invoice.id}`);
  }
}

export async function deleteInvoiceOnline(id: string): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menghapus Invoice...');
  try {
    const docRef = doc(db, 'invoices', id);
    await deleteDoc(docRef);
    notifySyncState('TERSINKRON', 'Invoice berhasil dihapus');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menghapus Invoice');
    handleFirestoreError(error, OperationType.DELETE, `invoices/${id}`);
  }
}

// ----------------------------------------------------------------------
// 6. KARYAWAN & SLIP GAJI
// ----------------------------------------------------------------------
export function subscribeKaryawan(callback: (list: Karyawan[]) => void): Unsubscribe {
  const karyawanRef = collection(db, 'karyawan');
  return onSnapshot(
    karyawanRef,
    (snapshot) => {
      const list: Karyawan[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Karyawan);
      });
      list.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      callback(list);
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat data karyawan');
      handleFirestoreError(error, OperationType.LIST, 'karyawan');
    }
  );
}

export async function saveKaryawanOnline(karyawan: Karyawan): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan data karyawan ke cloud...');
  try {
    const docRef = doc(db, 'karyawan', karyawan.id);
    await setDoc(docRef, karyawan, { merge: true });
    notifySyncState('TERSINKRON', 'Data karyawan tersinkron');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan karyawan');
    handleFirestoreError(error, OperationType.WRITE, `karyawan/${karyawan.id}`);
  }
}

export async function deleteKaryawanOnline(id: string): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menghapus data karyawan...');
  try {
    const docRef = doc(db, 'karyawan', id);
    await deleteDoc(docRef);
    notifySyncState('TERSINKRON', 'Data karyawan dihapus');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menghapus karyawan');
    handleFirestoreError(error, OperationType.DELETE, `karyawan/${id}`);
  }
}

export function subscribeSlips(callback: (list: SlipGaji[]) => void): Unsubscribe {
  const slipsRef = collection(db, 'slips');
  return onSnapshot(
    slipsRef,
    (snapshot) => {
      const list: SlipGaji[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as SlipGaji);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      notifySyncState('GAGAL SINKRON', 'Gagal memuat slip gaji');
      handleFirestoreError(error, OperationType.LIST, 'slips');
    }
  );
}

export async function saveSlipOnline(slip: SlipGaji): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menyimpan slip gaji ke cloud...');
  try {
    const docRef = doc(db, 'slips', slip.id);
    const payload = {
      ...slip,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    notifySyncState('TERSINKRON', 'Slip gaji tersimpan di cloud database');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menyimpan slip gaji');
    handleFirestoreError(error, OperationType.WRITE, `slips/${slip.id}`);
  }
}

export async function deleteSlipOnline(id: string): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Menghapus slip gaji...');
  try {
    const docRef = doc(db, 'slips', id);
    await deleteDoc(docRef);
    notifySyncState('TERSINKRON', 'Slip gaji dihapus');
  } catch (error) {
    notifySyncState('GAGAL SINKRON', 'Gagal menghapus slip gaji');
    handleFirestoreError(error, OperationType.DELETE, `slips/${id}`);
  }
}

// ----------------------------------------------------------------------
// 7. SEAMLESS MIGRATION & SEEDING TO CLOUD
// ----------------------------------------------------------------------
export async function initializeAndMigrateToCloud(): Promise<void> {
  try {
    // 1. Check settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'company_settings'));
    if (!settingsSnap.exists()) {
      let localSettings = DEFAULT_SETTINGS;
      try {
        localSettings = await getCompanySettings();
      } catch {}
      await setDoc(doc(db, 'settings', 'company_settings'), localSettings, { merge: true });
    }

    // 2. Check letters
    const lettersSnap = await getDocs(collection(db, 'letters'));
    if (lettersSnap.empty) {
      try {
        const localLetters = await getAllLetters();
        for (const l of localLetters) {
          await setDoc(doc(db, 'letters', l.id), l, { merge: true });
        }
      } catch {}
    }

    // 3. Check customers
    const custSnap = await getDocs(collection(db, 'customers'));
    if (custSnap.empty) {
      try {
        const localCust = await getAllCustomers();
        for (const c of localCust) {
          await setDoc(doc(db, 'customers', c.id), c, { merge: true });
        }
      } catch {}
    }

    // 4. Check BAST
    const bastSnap = await getDocs(collection(db, 'basts'));
    if (bastSnap.empty) {
      try {
        let bastsToSeed = INITIAL_BAST;
        const localBasts = await getAllBasts();
        if (localBasts && localBasts.length > 0) {
          bastsToSeed = localBasts;
        }
        for (const b of bastsToSeed) {
          await setDoc(doc(db, 'basts', b.id), b, { merge: true });
        }
      } catch {}
    }

    // 5. Check Invoices
    const invSnap = await getDocs(collection(db, 'invoices'));
    if (invSnap.empty) {
      try {
        let invToSeed = [SEED_INVOICE];
        const localInv = await getAllInvoices();
        if (localInv && localInv.length > 0) {
          invToSeed = localInv;
        }
        for (const i of invToSeed) {
          await setDoc(doc(db, 'invoices', i.id), i, { merge: true });
        }
      } catch {}
    }

    // 6. Check Karyawan
    const karySnap = await getDocs(collection(db, 'karyawan'));
    if (karySnap.empty) {
      try {
        let karyToSeed = INITIAL_KARYAWAN;
        const localKary = await getAllKaryawan();
        if (localKary && localKary.length > 0) {
          karyToSeed = localKary;
        }
        for (const k of karyToSeed) {
          await setDoc(doc(db, 'karyawan', k.id), k, { merge: true });
        }
      } catch {}
    }

    // 7. Check Slips
    const slipsSnap = await getDocs(collection(db, 'slips'));
    if (slipsSnap.empty) {
      try {
        const localSlips = await getAllSlips();
        for (const s of localSlips) {
          await setDoc(doc(db, 'slips', s.id), s, { merge: true });
        }
      } catch {}
    }

    notifySyncState('TERSINKRON', 'Database online terhubung & siap digunakan');
  } catch (err) {
    console.warn('Initial cloud migration notice:', err);
    notifySyncState('ONLINE', 'Terhubung ke server online');
  }
}

// ----------------------------------------------------------------------
// 8. BACKUP & RESTORE UTILITY
// ----------------------------------------------------------------------
export interface FullCloudBackup {
  appName: string;
  version: string;
  exportedAt: string;
  settings: CompanySettings;
  letters: LetterData[];
  customers: Customer[];
  basts: BastData[];
  invoices: InvoiceData[];
  karyawan: Karyawan[];
  slips: SlipGaji[];
}

export async function exportEntireDatabase(): Promise<FullCloudBackup> {
  const [
    settingsSnap,
    lettersSnap,
    customersSnap,
    bastsSnap,
    invoicesSnap,
    karyawanSnap,
    slipsSnap,
  ] = await Promise.all([
    getDoc(doc(db, 'settings', 'company_settings')),
    getDocs(collection(db, 'letters')),
    getDocs(collection(db, 'customers')),
    getDocs(collection(db, 'basts')),
    getDocs(collection(db, 'invoices')),
    getDocs(collection(db, 'karyawan')),
    getDocs(collection(db, 'slips')),
  ]);

  const backup: FullCloudBackup = {
    appName: 'MTA Cloud Database',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    settings: (settingsSnap.data() as CompanySettings) || DEFAULT_SETTINGS,
    letters: lettersSnap.docs.map((d) => d.data() as LetterData),
    customers: customersSnap.docs.map((d) => d.data() as Customer),
    basts: bastsSnap.docs.map((d) => d.data() as BastData),
    invoices: invoicesSnap.docs.map((d) => d.data() as InvoiceData),
    karyawan: karyawanSnap.docs.map((d) => d.data() as Karyawan),
    slips: slipsSnap.docs.map((d) => d.data() as SlipGaji),
  };

  return backup;
}

export async function restoreEntireDatabase(backup: FullCloudBackup): Promise<void> {
  notifySyncState('MENYINKRONKAN', 'Memulihkan data ke database online...');
  try {
    if (backup.settings) {
      await saveSettingsOnline(backup.settings);
    }
    if (Array.isArray(backup.letters)) {
      for (const l of backup.letters) {
        await saveLetterOnline(l);
      }
    }
    if (Array.isArray(backup.customers)) {
      for (const c of backup.customers) {
        await saveCustomerOnline(c);
      }
    }
    if (Array.isArray(backup.basts)) {
      for (const b of backup.basts) {
        await saveBastOnline(b);
      }
    }
    if (Array.isArray(backup.invoices)) {
      for (const i of backup.invoices) {
        await saveInvoiceOnline(i);
      }
    }
    if (Array.isArray(backup.karyawan)) {
      for (const k of backup.karyawan) {
        await saveKaryawanOnline(k);
      }
    }
    if (Array.isArray(backup.slips)) {
      for (const s of backup.slips) {
        await saveSlipOnline(s);
      }
    }
    notifySyncState('TERSINKRON', 'Seluruh data berhasil dipulihkan dari backup');
  } catch (err) {
    notifySyncState('GAGAL SINKRON', 'Gagal memulihkan database dari backup');
    throw err;
  }
}
