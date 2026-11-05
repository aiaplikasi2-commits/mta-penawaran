export interface PoItem {
  id: string;
  itemNo: number;
  itemCode?: string;
  itemName: string;
  itemSpec?: string;
  qty: number;
  satuan: string; // PCS, UNIT, BOX, LOT, KG, SET, dll
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderData {
  id: string;
  nomorPo: string; // Unique PO number
  tanggalPo: string; // YYYY-MM-DD
  buyerCompany: string; // Perusahaan Klien / Buyer
  buyerAddress?: string;
  buyerPhone?: string;
  picName?: string;
  vendorCompany?: string; // e.g. CV. MULIA TEKHNIK ABADI

  // Items
  items: PoItem[];

  // Financial summary
  subtotal: number;
  discount: number;
  discountPercent?: number;
  ppnPercent?: number;
  ppnValue?: number;
  grandTotal: number;
  currency: string; // e.g. IDR

  // Additional metadata
  deliveryDate?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
  hasSignature?: boolean;
  hasStamp?: boolean;

  // File attachments
  fileName?: string;
  fileType?: string; // image/jpeg, image/png, application/pdf
  fileDataUrl?: string; // Base64 or thumbnail

  // AI confidence notes
  confidenceScore?: 'high' | 'medium' | 'low';
  unclearFields?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface PoChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
