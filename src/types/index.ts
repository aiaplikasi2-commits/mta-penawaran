export interface CompanySettings {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  signatoryName: string;
  logoImage: string; // Pure logo image (used in Slip Gaji top-left & header)
  kopImage: string; // Full letterhead KOP image (used in Surat Penawaran A4)
  signatureImage: string; // Official Signature & Stamp image
  stampImage: string; // Optional separate stamp
  numberFormat: string; // e.g. "{seq}/10/MTA/{year}"
  nextSequenceNumber?: number; // Starting/next sequence number e.g. 16
  city: string; // default "Bogor"
  defaultPpnPercent: number;
  tarifLemburPerJam?: number; // default 12000 (Rp/jam untuk lemburan slip gaji)
  bankName?: string; // default "Mandiri"
  bankAccountName?: string; // default "CV. MULIA TEKHNIK ABADI"
  bankAccountNumber?: string; // default "167-00-0529426-8"
}

export interface Customer {
  id: string;
  companyName: string;
  recipientName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface OfferItem {
  id: string;
  description: string;
  qty: number;
  satuan: string;
  price: number;
  total: number;
}

export interface TradeInItem {
  name: string;
  description: string;
  qty: number;
  unitValue: number;
  totalValue: number;
}

export interface LetterData {
  id: string;
  letterNumber: string;
  letterDate: string; // YYYY-MM-DD
  attachment: string; // default "-"
  subject: string;
  recipientName: string;
  companyName: string;
  address: string;
  city: string;
  openingParagraph: string;
  closingParagraph: string;
  items: OfferItem[];
  tradeInActive: boolean;
  tradeIn: TradeInItem;
  discountActive: boolean;
  discountType: 'nominal' | 'percent';
  discountValue: number; // nominal or %
  ppnActive: boolean;
  ppnPercent: number;
  status: 'Draft' | 'Terkirim' | 'Diterima' | 'Ditolak';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  settings: CompanySettings;
  letters: LetterData[];
  customers: Customer[];
}
