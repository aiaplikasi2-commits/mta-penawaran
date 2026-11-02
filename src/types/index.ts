export interface CompanySettings {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  signatoryName: string;
  kopImage: string; // Base64 or URL
  signatureImage: string; // Base64 or URL
  stampImage: string; // Base64 or URL
  numberFormat: string; // e.g. "{seq}/10/MTA/{year}"
  nextSequenceNumber?: number; // Starting/next sequence number e.g. 16
  city: string; // default "Bogor"
  defaultPpnPercent: number;
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
