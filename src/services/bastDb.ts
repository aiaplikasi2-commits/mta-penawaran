import { openDB, type IDBPDatabase } from 'idb';
import type { BastData } from '../types/bast.ts';
import type { CompanySettings } from '../types/index.ts';
import { getCompanySettings } from './db.ts';

const DB_NAME = 'SP_MTA_BAST_DATABASE';
const DB_VERSION = 1;

// Seed BAST matching Screenshot 1 (PT. KANSAI PAINT INDONESIA)
export const INITIAL_BAST: BastData[] = [
  {
    id: 'bast-01',
    nomorBast: 'BAST/001/XI/2026',
    nomorPo: 'KEPO123',
    tanggalBast: '2026-11-02',
    hariTerbilang: 'Senin tanggal Dua Bulan November Tahun Dua Ribu Dua Puluh Enam',
    pihakPertamaNama: 'Siska',
    pihakPertamaPerusahaan: 'PT. KANSAI PAINT INDONESIA',
    pihakPertamaAlamat:
      'Blok DD-7 & DD-8 Kawasan Industri MM2100 Cikarang Barat, Kab. Bekasi, 17847',
    pihakKeduaNama: 'MUHAMAD RIDHO',
    pihakKeduaAlamat:
      'Jln. Letda Nasir No. 58 Bogor, 16966 Kel. Cikeas Udik Kec. Gunung Putri Bogor',
    items: [
      {
        id: 'item-1',
        name: 'Rewinding Motor Fan Outdoor AC Floor Standing 10 PK Fuji Elektrik',
        keterangan: 'Sesuai',
      },
      {
        id: 'item-2',
        name: 'Kapasitor Fan Outdoor 10uf mc',
        keterangan: 'Sesuai',
      },
      {
        id: 'item-3',
        name: 'Bearing Koyo Japan',
        keterangan: 'Sesuai',
      },
    ],
    tanggalMulai: '2026-11-02',
    tanggalSelesai: '2026-11-02',
    kota: 'Bogor',
    status: 'Selesai',
    createdAt: '2026-11-02T08:00:00.000Z',
    updatedAt: '2026-11-02T08:00:00.000Z',
  },
];

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getBastDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('basts')) {
          const store = db.createObjectStore('basts', { keyPath: 'id' });
          store.createIndex('nomorBast', 'nomorBast', { unique: false });
          store.createIndex('pihakPertamaPerusahaan', 'pihakPertamaPerusahaan', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function seedBastDatabaseIfNeeded(): Promise<void> {
  const db = await getBastDb();
  const existing = await db.getAll('basts');
  if (!existing || existing.length === 0) {
    const tx = db.transaction('basts', 'readwrite');
    for (const b of INITIAL_BAST) {
      await tx.store.put(b);
    }
    await tx.done;
  }
}

export async function getAllBasts(): Promise<BastData[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDocs(collection(db, 'basts'));
    if (!snap.empty) {
      const cloudList = snap.docs.map((d) => d.data() as BastData);
      cloudList.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const idbDb = await getBastDb();
      for (const b of cloudList) {
        await idbDb.put('basts', b);
      }
      return cloudList;
    }
  } catch (e) {
    console.warn('Fallback to local BAST cache:', e);
  }

  await seedBastDatabaseIfNeeded();
  const db = await getBastDb();
  const list = await db.getAll('basts');
  return (list || []).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function getBastById(id: string): Promise<BastData | undefined> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.ts');
    const snap = await getDoc(doc(db, 'basts', id));
    if (snap.exists()) {
      return snap.data() as BastData;
    }
  } catch {}
  const db = await getBastDb();
  return db.get('basts', id);
}

export async function saveBast(bast: BastData): Promise<void> {
  const toSave: BastData = {
    ...bast,
    updatedAt: new Date().toISOString(),
    createdAt: bast.createdAt || new Date().toISOString(),
  };

  const idbDb = await getBastDb();
  await idbDb.put('basts', toSave);

  // Sync to Firestore Cloud Database
  try {
    const { saveBastOnline } = await import('./cloudSync.ts');
    await saveBastOnline(toSave);
  } catch (err) {
    console.warn('Online sync queued for BAST:', err);
  }
}

export async function deleteBast(id: string): Promise<void> {
  const idbDb = await getBastDb();
  await idbDb.delete('basts', id);

  try {
    const { deleteBastOnline } = await import('./cloudSync.ts');
    await deleteBastOnline(id);
  } catch (err) {
    console.warn('Online delete queued for BAST:', err);
  }
}

// Convert numbers 1-31 to words in Indonesian
export function angkaKeKata(n: number): string {
  const satuan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];
  if (n < 12) return satuan[n];
  if (n < 20) return `${satuan[n - 10]} Belas`;
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const sisa = n % 10;
    return `${satuan[puluhan]} Puluh${sisa > 0 ? ' ' + satuan[sisa] : ''}`;
  }
  if (n === 100) return 'Seratus';
  return String(n);
}

export function tahunKeKata(year: number): string {
  // e.g. 2026 -> Dua Ribu Dua Puluh Enam
  if (year >= 2000 && year < 3000) {
    const sisa = year - 2000;
    if (sisa === 0) return 'Dua Ribu';
    return `Dua Ribu ${angkaKeKata(sisa)}`;
  }
  return String(year);
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function generateHariTerbilang(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const hari = NAMA_HARI[d.getDay()];
  const tanggalKata = angkaKeKata(d.getDate());
  const bulan = NAMA_BULAN[d.getMonth()];
  const tahunKata = tahunKeKata(d.getFullYear());

  return `${hari} tanggal ${tanggalKata} Bulan ${bulan} Tahun ${tahunKata}`;
}

export function getRomawiBulan(monthIndex: number): string {
  const romawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romawi[monthIndex] || 'XI';
}

export function generateNomorBastBaru(existingBasts: BastData[] = []): string {
  const now = new Date();
  const romawi = getRomawiBulan(now.getMonth());
  const year = now.getFullYear();

  const existingSet = new Set(
    existingBasts.map((b) => (b.nomorBast || '').trim().toLowerCase())
  );

  let seq = 1;
  while (seq <= 9999) {
    const seqStr = String(seq).padStart(3, '0');
    const candidate = `BAST/${seqStr}/${romawi}/${year}`;
    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
    seq++;
  }

  return `BAST/${String(Date.now()).slice(-3)}/${romawi}/${year}`;
}
