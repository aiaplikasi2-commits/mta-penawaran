import { openDB, type IDBPDatabase } from 'idb';
import type { Karyawan, SlipGaji, SalarySettings } from '../types/salary.ts';

const DB_NAME = 'SP_MTA_SALARY_DATABASE';
const DB_VERSION = 1;

export const DEFAULT_SALARY_SETTINGS: SalarySettings = {
  companyName: 'CV MULIA TEKHNIK ABADI',
  address: 'Jln. Letda Nasir No. 58 Desa Cikeas Udik\nKec. Gunung Putri - Kab. Bogor Kode Pos 16966',
  city: 'Bogor',
  postalCode: '16966',
  phone: '0812 - 1085 - 2489 / 0878 - 4062 - 0432',
  signatoryName: 'Muhamad Ridho',
  signatureImage: '/default-ttd-stempel.png',
  stampImage: '',
  tarifLemburPerJam: 12000,
};

// Seed Employees matching Screenshot 2
export const INITIAL_KARYAWAN: Karyawan[] = [
  {
    id: 'emp-1',
    nama: 'SALWA',
    jabatan: 'Kasir',
    nik: '-',
    nomorSlipDefault: '012',
    gajiPokok: 1500000,
    uangMakanHarian: 20000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    nama: 'AHMAD FAIKI',
    jabatan: 'Helper',
    nik: '-',
    nomorSlipDefault: '010',
    gajiPokok: 2400000,
    uangMakanHarian: 20000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    nama: 'ISKANDAR',
    jabatan: 'Teknisi',
    nik: '-',
    nomorSlipDefault: '07',
    gajiPokok: 2250000,
    uangMakanHarian: 20000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-4',
    nama: 'MAULIDRA HAFIZ',
    jabatan: 'Helper',
    nik: '-',
    nomorSlipDefault: '08',
    gajiPokok: 2400000,
    uangMakanHarian: 20000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-5',
    nama: 'MUHAMAD AKHIR ZAMAN',
    jabatan: 'Teknisi',
    nik: '-',
    nomorSlipDefault: '05',
    gajiPokok: 2900000,
    uangMakanHarian: 20000,
    createdAt: new Date().toISOString(),
  },
];

// Seed Slips matching Screenshot 1 & 3
export const INITIAL_SLIPS: SlipGaji[] = [
  {
    id: 'slip-1',
    nomorSlip: '08',
    tanggal: '2026-11-01',
    periodeBulan: 'Oktober',
    tahun: 2026,
    karyawanId: 'emp-4',
    nama: 'MAULIDRA HAFIZ',
    jabatan: 'HELPER',
    nik: '-',
    gajiPokok: 2400000,
    uangMakan: 480000,
    transport: 0,
    thr: 0,
    bonus: 150000,
    lemburan: 24000,
    jamLembur: 2,
    masukKerja: 0,
    pinjaman: 700000,
    bpjsKetenagakerjaan: 0,
    pph21: 0,
    lainLain: 0,
    potonganUangMakan: 480000,
    totalPendapatan: 3054000,
    totalPotongan: 1180000,
    gajiBersih: 1874000,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'slip-2',
    nomorSlip: '012',
    tanggal: '2026-11-01',
    periodeBulan: 'Oktober',
    tahun: 2026,
    karyawanId: 'emp-1',
    nama: 'SALWA',
    jabatan: 'Kasir',
    nik: '-',
    gajiPokok: 1500000,
    uangMakan: 200000,
    transport: 0,
    thr: 0,
    bonus: 0,
    lemburan: 0,
    jamLembur: 0,
    masukKerja: 0,
    pinjaman: 540000,
    bpjsKetenagakerjaan: 0,
    pph21: 0,
    lainLain: 0,
    potonganUangMakan: 0,
    totalPendapatan: 1700000,
    totalPotongan: 540000,
    gajiBersih: 1160000,
    createdAt: '2026-11-01T10:30:00.000Z',
    updatedAt: '2026-11-01T10:30:00.000Z',
  },
];

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getSalaryDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      async upgrade(db) {
        if (!db.objectStoreNames.contains('karyawan')) {
          const empStore = db.createObjectStore('karyawan', { keyPath: 'id' });
          empStore.createIndex('nama', 'nama', { unique: false });
        }
        if (!db.objectStoreNames.contains('slips')) {
          const slipStore = db.createObjectStore('slips', { keyPath: 'id' });
          slipStore.createIndex('nomorSlip', 'nomorSlip', { unique: false });
          slipStore.createIndex('periodeBulan', 'periodeBulan', { unique: false });
          slipStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('salary_settings')) {
          db.createObjectStore('salary_settings');
        }
      },
    });
  }
  return dbPromise;
}

// Ensure initial seed data exists
export async function seedSalaryDatabaseIfNeeded(): Promise<void> {
  const db = await getSalaryDb();
  const existingEmployees = await db.getAll('karyawan');
  if (!existingEmployees || existingEmployees.length === 0) {
    const tx = db.transaction('karyawan', 'readwrite');
    for (const emp of INITIAL_KARYAWAN) {
      await tx.store.put(emp);
    }
    await tx.done;
  }

  const existingSlips = await db.getAll('slips');
  if (!existingSlips || existingSlips.length === 0) {
    const tx = db.transaction('slips', 'readwrite');
    for (const slip of INITIAL_SLIPS) {
      await tx.store.put(slip);
    }
    await tx.done;
  }

  const existingSettings = await db.get('salary_settings', 'config');
  if (!existingSettings) {
    await db.put('salary_settings', DEFAULT_SALARY_SETTINGS, 'config');
  }
}

// Karyawan CRUD
export async function getAllKaryawan(): Promise<Karyawan[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'karyawan'));
    if (!snap.empty) {
      const cloudList = snap.docs.map((d) => d.data() as Karyawan);
      cloudList.sort((a, b) => a.nama.localeCompare(b.nama));
      const idbDb = await getSalaryDb();
      for (const k of cloudList) {
        await idbDb.put('karyawan', k);
      }
      return cloudList;
    }
  } catch (e) {
    console.warn('Fallback to local karyawan cache:', e);
  }

  await seedSalaryDatabaseIfNeeded();
  const db = await getSalaryDb();
  const list = await db.getAll('karyawan');
  return list.sort((a, b) => a.nama.localeCompare(b.nama));
}

export async function saveKaryawan(karyawan: Karyawan): Promise<void> {
  const db = await getSalaryDb();
  await db.put('karyawan', karyawan);

  try {
    const { saveKaryawanOnline } = await import('./cloudSync.ts');
    await saveKaryawanOnline(karyawan);
  } catch (err) {
    console.warn('Online sync queued for karyawan:', err);
  }
}

export async function deleteKaryawan(id: string): Promise<void> {
  const db = await getSalaryDb();
  await db.delete('karyawan', id);

  try {
    const { deleteKaryawanOnline } = await import('./cloudSync.ts');
    await deleteKaryawanOnline(id);
  } catch (err) {
    console.warn('Online delete queued for karyawan:', err);
  }
}

// Slip Gaji CRUD
export async function getAllSlips(): Promise<SlipGaji[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'slips'));
    if (!snap.empty) {
      const cloudList = snap.docs.map((d) => d.data() as SlipGaji);
      cloudList.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const idbDb = await getSalaryDb();
      for (const s of cloudList) {
        await idbDb.put('slips', s);
      }
      return cloudList;
    }
  } catch (e) {
    console.warn('Fallback to local slips cache:', e);
  }

  await seedSalaryDatabaseIfNeeded();
  const db = await getSalaryDb();
  const slips = await db.getAll('slips');
  return (slips || []).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function getSlipById(id: string): Promise<SlipGaji | undefined> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDoc(doc(db, 'slips', id));
    if (snap.exists()) {
      return snap.data() as SlipGaji;
    }
  } catch {}
  const db = await getSalaryDb();
  return db.get('slips', id);
}

export async function saveSlip(slip: SlipGaji): Promise<void> {
  const toSave: SlipGaji = {
    ...slip,
    updatedAt: new Date().toISOString(),
    createdAt: slip.createdAt || new Date().toISOString(),
  };

  const db = await getSalaryDb();
  await db.put('slips', toSave);

  try {
    const { saveSlipOnline } = await import('./cloudSync.ts');
    await saveSlipOnline(toSave);
  } catch (err) {
    console.warn('Online sync queued for slip:', err);
  }
}

export async function deleteSlip(id: string): Promise<void> {
  const db = await getSalaryDb();
  await db.delete('slips', id);

  try {
    const { deleteSlipOnline } = await import('./cloudSync.ts');
    await deleteSlipOnline(id);
  } catch (err) {
    console.warn('Online delete queued for slip:', err);
  }
}

import { getCompanySettings, saveCompanySettings, DEFAULT_SETTINGS } from './db.ts';

// Settings: Unified single source of truth across both Penawaran and Gaji
export async function getSalarySettings(): Promise<SalarySettings> {
  const comp = await getCompanySettings();
  return {
    companyName: comp.companyName || 'CV MULIA TEKHNIK ABADI',
    address: comp.address || 'Jln. Letda Nasir No. 58 Desa Cikeas Udik\nKec. Gunung Putri - Kab. Bogor Kode Pos 16966',
    city: comp.city || 'Bogor',
    phone: comp.phone || '0812 - 1085 - 2489 / 0878 - 4062 - 0432',
    signatoryName: comp.signatoryName || 'Muhamad Ridho',
    logoImage: comp.logoImage || '/default-logo.png',
    kopImage: comp.kopImage || '/default-kop.png',
    signatureImage: comp.signatureImage || '/default-ttd-stempel.png',
    stampImage: comp.stampImage || '',
    tarifLemburPerJam: comp.tarifLemburPerJam ?? 12000,
  };
}

export async function saveSalarySettings(settings: SalarySettings): Promise<void> {
  const current = await getCompanySettings();
  const updated = {
    ...current,
    companyName: settings.companyName,
    address: settings.address,
    city: settings.city,
    phone: settings.phone,
    signatoryName: settings.signatoryName,
    logoImage: settings.logoImage ?? current.logoImage,
    kopImage: settings.kopImage ?? current.kopImage,
    signatureImage: settings.signatureImage ?? current.signatureImage,
    stampImage: settings.stampImage ?? current.stampImage,
    tarifLemburPerJam: settings.tarifLemburPerJam ?? 12000,
  };
  await saveCompanySettings(updated);
}
