import { openDB, type IDBPDatabase } from 'idb';
import type { PurchaseOrderData } from '../types/po.ts';
import {
  savePurchaseOrderOnline,
  deletePurchaseOrderOnline,
} from './cloudSync.ts';

const DB_NAME = 'ADM_MTA_PO_DATABASE';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getPoDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('purchase_orders')) {
          const store = db.createObjectStore('purchase_orders', { keyPath: 'id' });
          store.createIndex('nomorPo', 'nomorPo', { unique: false });
          store.createIndex('buyerCompany', 'buyerCompany', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Get all purchase orders from local store
 */
export async function getAllPurchaseOrders(): Promise<PurchaseOrderData[]> {
  try {
    const db = await getPoDb();
    const list = await db.getAll('purchase_orders');
    return list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  } catch (err) {
    console.error('Failed to get purchase orders from local DB:', err);
    return [];
  }
}

/**
 * Get single PO by id
 */
export async function getPurchaseOrderById(id: string): Promise<PurchaseOrderData | undefined> {
  try {
    const db = await getPoDb();
    return await db.get('purchase_orders', id);
  } catch (err) {
    console.error('Failed to get purchase order by id:', err);
    return undefined;
  }
}

/**
 * Check if a PO number is duplicate
 */
export async function checkDuplicatePo(nomorPo: string, excludeId?: string): Promise<boolean> {
  const trimmed = nomorPo.trim().toLowerCase();
  if (!trimmed) return false;
  try {
    const all = await getAllPurchaseOrders();
    return all.some(
      (po) =>
        po.id !== excludeId &&
        po.nomorPo.trim().toLowerCase() === trimmed
    );
  } catch {
    return false;
  }
}

/**
 * Save purchase order (local cache + online cloud database)
 */
export async function savePurchaseOrder(po: PurchaseOrderData): Promise<void> {
  // Update local DB
  try {
    const db = await getPoDb();
    await db.put('purchase_orders', po);
  } catch (err) {
    console.warn('Failed to save PO to local IDB, continuing with cloud save:', err);
  }

  // Sync to Cloud Firestore
  try {
    await savePurchaseOrderOnline(po);
  } catch (err) {
    console.error('Failed to sync PO to cloud:', err);
  }
}

/**
 * Delete purchase order (local cache + online cloud database)
 */
export async function deletePurchaseOrder(id: string): Promise<void> {
  try {
    const db = await getPoDb();
    await db.delete('purchase_orders', id);
  } catch (err) {
    console.warn('Failed to delete PO from local IDB:', err);
  }

  try {
    await deletePurchaseOrderOnline(id);
  } catch (err) {
    console.error('Failed to delete PO from cloud:', err);
  }
}

/**
 * Get quick list of PO numbers and company names for dropdowns in Invoice & BAST
 */
export async function getAllPoLookup(): Promise<Array<{ nomorPo: string; buyerCompany: string; id: string }>> {
  const all = await getAllPurchaseOrders();
  const set = new Set<string>();
  const results: Array<{ nomorPo: string; buyerCompany: string; id: string }> = [];

  for (const item of all) {
    const num = (item.nomorPo || '').trim();
    if (num && !set.has(num.toLowerCase())) {
      set.add(num.toLowerCase());
      results.push({
        id: item.id,
        nomorPo: num,
        buyerCompany: item.buyerCompany || '',
      });
    }
  }

  return results;
}
