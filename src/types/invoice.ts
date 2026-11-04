export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  satuan: string;
  price: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  nomorPo: string; // Sesuai dengan Nomor PO ...
  companyName: string; // Kepada: Nama Perusahaan Klien
  recipientName: string; // Kepada: Nama Kontak / PIC
  address: string; // Kepada: Alamat Klien
  items: InvoiceItem[];
  tradeInActive: boolean;
  tradeInName?: string;
  tradeInValue?: number;
  discountActive: boolean;
  discountValue?: number;
  ppnActive: boolean;
  ppnPercent?: number;
  subtotal: number;
  total: number;
  terbilang: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  signatoryName: string;
  status: 'Lunas' | 'Belum Lunas' | 'Draft';
  createdAt: string;
  updatedAt: string;
}
