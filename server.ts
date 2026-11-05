import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Health and AI status check endpoint
app.get('/api/ai-status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    configured: hasKey,
    model: 'gemini-3.8-flash',
    message: hasKey ? 'Layanan AI Gemini siap digunakan' : 'API Key Gemini belum disetel pada server',
  });
});

// AI letter narrative generator endpoint
app.post('/api/generate-letter-content', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Layanan AI belum dikonfigurasi pada server (GEMINI_API_KEY belum tersedia). Anda dapat mengisi atau mengedit isi surat secara manual.',
      });
    }

    const {
      perihal = '',
      recipientName = '',
      companyName = '',
      items = [],
      tradeInActive = false,
      tradeInItem = '',
      tradeInValue = 0,
      discountActive = false,
      discountValue = 0,
      ppnActive = false,
      ppnPercent = 11,
      total = 0,
    } = req.body;

    const itemsSummary = (items || [])
      .map((it: any, idx: number) => `${idx + 1}. ${it.description} (Qty: ${it.qty} ${it.satuan || 'unit'})`)
      .join('\n');

    const prompt = `Anda adalah asisten administrasi CV. MULIA TEKHNIK ABADI.
Tugas: Buat teks pembuka (Opening) dan teks penutup (Closing) resmi untuk Surat Penawaran Harga yang SINGKAT, PADAT, JELAS, CEPAT, dan FORMAL.

DATA:
- Perihal: ${perihal}
- Tujuan: ${recipientName ? recipientName + ' - ' : ''}${companyName || 'Pelanggan'}
- Barang/Jasa Utama: ${itemsSummary || '-'}

ATURAN WAJIB:
1. Bahasa Indonesia formal, sopan, SINGKAT PADAT JELAS (maksimal 1 kalimat pembuka, 1-2 kalimat penutup, to-the-point).
2. Pembuka menyebutkan perihal penawaran secara lugas. Contoh: "Bersama ini kami mengajukan surat penawaran harga untuk ${perihal || 'pekerjaan terkait'}, berikut daftar harga yang kami tawarkan :"
3. Penutup sopan dan singkat. Contoh: "Demikian surat penawaran harga ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih."
4. Format output HANYA JSON:
{
  "opening": "...",
  "closing": "..."
}`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const text = response.text || '{}';
    let parsed: { opening?: string; closing?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // In case json parsing fails, regex extract
      const opMatch = text.match(/"opening"\s*:\s*"([^"]+)"/);
      const clMatch = text.match(/"closing"\s*:\s*"([^"]+)"/);
      parsed = {
        opening: opMatch ? opMatch[1] : undefined,
        closing: clMatch ? clMatch[1] : undefined,
      };
    }

    if (!parsed.opening) {
      parsed.opening = `Bersama ini kami mengajukan surat penawaran harga untuk ${perihal || 'pekerjaan terkait'}, berikut ini rincian daftar harga yang kami tawarkan :`;
    }
    if (!parsed.closing) {
      parsed.closing = `Demikian Penawaran harga ini kami sampaikan, bilamana ada informasi yang perlu diketahui mengenai penawaran ini lebih lanjut, maka bapak / ibu dapat menghubungi kami lebih lanjut.\n\nAtas perhatiannya kami ucapkan terima kasih.`;
    }

    return res.json({
      success: true,
      opening: parsed.opening,
      closing: parsed.closing,
    });
  } catch (error: any) {
    console.error('AI generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal menyusun narasi surat dengan AI',
    });
  }
});

// AI letter revision endpoint (via chat or voice prompt)
app.post('/api/revise-letter-content', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Layanan AI belum dikonfigurasi pada server (GEMINI_API_KEY belum tersedia). Anda dapat mengedit teks surat secara manual.',
      });
    }

    const {
      currentOpening = '',
      currentClosing = '',
      instruction = '',
      perihal = '',
      recipientName = '',
      companyName = '',
      items = [],
    } = req.body;

    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ error: 'Instruksi revisi tidak boleh kosong.' });
    }

    const itemsSummary = (items || [])
      .map((it: any, idx: number) => `${idx + 1}. ${it.description} (Qty: ${it.qty} ${it.satuan || 'unit'})`)
      .join('\n');

    const prompt = `Anda adalah asisten administrasi CV. MULIA TEKHNIK ABADI.
Tugas: Revisi teks pembuka (Opening) dan teks penutup (Closing) resmi untuk Surat Penawaran Harga berdasarkan instruksi pengguna.

TEKS SAAT INI:
- Pembuka: "${currentOpening}"
- Penutup: "${currentClosing}"

DATA TRANSAKSI:
- Perihal: ${perihal || '-'}
- Tujuan: ${recipientName ? recipientName + ' - ' : ''}${companyName || 'Pelanggan'}
- Barang/Jasa: ${itemsSummary || '-'}

INSTRUKSI REVISI DARI PENGGUNA (Bisa dari ketikan chat atau suara voice):
"${instruction}"

ATURAN WAJIB:
1. Bahasa Indonesia formal, santun, lugas, SINGKAT PADAT JELAS.
2. Terapkan permintaan revisi secara presisi ke bagian pembuka dan/atau penutup.
3. Pertahankan identitas dan kesopanan bisnis CV. MULIA TEKHNIK ABADI.
4. Output HANYA JSON tanpa markdown:
{
  "opening": "teks pembuka hasil revisi",
  "closing": "teks penutup hasil revisi"
}`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const text = response.text || '{}';
    let parsed: { opening?: string; closing?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const opMatch = text.match(/"opening"\s*:\s*"([^"]+)"/);
      const clMatch = text.match(/"closing"\s*:\s*"([^"]+)"/);
      parsed = {
        opening: opMatch ? opMatch[1] : undefined,
        closing: clMatch ? clMatch[1] : undefined,
      };
    }

    return res.json({
      success: true,
      opening: parsed.opening || currentOpening,
      closing: parsed.closing || currentClosing,
    });
  } catch (error: any) {
    console.warn('AI revision API warning, applying intelligent fallback:', error?.message);

    const lowerInst = String(req.body.instruction || '').toLowerCase();
    let revisedOpening = req.body.currentOpening || 'Bersama ini kami mengajukan surat penawaran harga, berikut rincian daftar harga yang kami tawarkan :';
    let revisedClosing = req.body.currentClosing || 'Demikian surat penawaran harga ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.';

    if (lowerInst.includes('singkat') || lowerInst.includes('ringkas') || lowerInst.includes('padat')) {
      revisedOpening = `Bersama ini kami sampaikan penawaran harga untuk ${req.body.perihal || 'pekerjaan terkait'} sebagai berikut :`;
      revisedClosing = `Demikian penawaran harga ini kami sampaikan. Atas perhatian dan kerja samanya kami ucapkan terima kasih.`;
    }
    if (lowerInst.includes('14 hari') || lowerInst.includes('berlaku')) {
      if (!revisedClosing.includes('14 hari')) {
        revisedClosing += `\n\nPenawaran harga ini berlaku selama 14 (empat belas) hari kerja sejak tanggal diterbitkan.`;
      }
    }
    if (lowerInst.includes('garansi')) {
      if (!revisedClosing.includes('garansi')) {
        revisedClosing += `\n\nSeluruh unit dan pekerjaan penawaran ini dilengkapi jaminan garansi resmi CV. MULIA TEKHNIK ABADI.`;
      }
    }
    if (lowerInst.includes('survei')) {
      if (!revisedClosing.includes('survei')) {
        revisedClosing += `\n\nKonsultasi teknis dan survei lokasi awal bebas biaya (Gratis).`;
      }
    }
    if (lowerInst.includes('formal')) {
      revisedOpening = `Dengan hormat, sehubungan dengan kebutuhan ${req.body.perihal || 'pekerjaan terkait'}, bersama ini kami CV. MULIA TEKHNIK ABADI bermaksud mengajukan penawaran harga resmi sebagaimana rincian berikut :`;
      revisedClosing = `Demikian surat penawaran harga ini kami sampaikan dengan harapan dapat terjalin kerja sama yang baik. Atas perhatian dan kepercayaan Bapak / Ibu, kami ucapkan terima kasih.`;
    }

    return res.json({
      success: true,
      opening: revisedOpening,
      closing: revisedClosing,
    });
  }
});

// AI Purchase Order (PO) document OCR and extraction endpoint
app.post('/api/po/extract', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error:
          'Layanan AI belum dikonfigurasi pada server (GEMINI_API_KEY belum tersedia). Anda tetap dapat mengisi data PO secara manual.',
      });
    }

    const { files = [] } = req.body;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada berkas dokumen PO yang dikirim.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    const parts: any[] = [];
    for (const f of files) {
      const rawBase64 = f.base64 || f.base64Data || '';
      const cleanBase64 = String(rawBase64).replace(/^data:[^;]+;base64,/, '');
      if (cleanBase64) {
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: f.mimeType || 'image/jpeg',
          },
        });
      }
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: 'Berkas dokumen tidak terbaca atau format data kosong. Silakan unggah ulang gambar atau file PDF dokumen PO.' });
    }

    const instruction = `Anda adalah ahli OCR dan Analisis Dokumen Finansial / Procurement (Purchase Order) profesional.
Tugas Anda adalah membaca, mengenali, dan mengekstrak seluruh informasi dari dokumen Purchase Order (PO) yang diberikan secara presisi dan objektif.

ATURAN UTAMA:
1. JANGAN PERNAH MENGARANG DATA. Jika suatu informasi tidak tertulis atau tidak dapat dibaca di dokumen, kembalikan string kosong "" atau angka 0, dan catat nama field tersebut di array "unclearFields".
2. Format Tanggal PO gunakan YYYY-MM-DD jika tanggal ditemukan.
3. Rincian Barang / Jasa (items):
   - Ekstrak setiap baris barang/jasa dengan lengkap: No urut (itemNo), Kode barang (itemCode), Nama barang/jasa (itemName), Deskripsi/spesifikasi (itemSpec), Kuantitas (qty, angka), Satuan (satuan, misal: PCS, UNIT, BOX, LOT, SET, KG, dll), Harga Satuan (unitPrice, angka murni tanpa pemisah ribuan), dan Total Harga baris (totalPrice).
4. Nilai Finansial:
   - Ambil Subtotal, Diskon (nominal), Diskon (%) bila ada, PPN (%) dan nilai nominal PPN, Grand Total, serta Mata Uang (currency, default "IDR").
5. Informasi Tambahan:
   - Alamat pengiriman (deliveryAddress), tanggal pengiriman (deliveryDate), syarat pembayaran (paymentTerms / TOP), catatan khusus (notes).
   - Periksa apakah dokumen memiliki tanda tangan (hasSignature: boolean) dan stempel (hasStamp: boolean).
6. Berikan tingkat keyakinan pembacaan: "high", "medium", atau "low" pada "confidenceScore".

Output WAJIB berupa format JSON murni berikut tanpa pembungkus markdown:
{
  "nomorPo": "string",
  "tanggalPo": "string YYYY-MM-DD",
  "buyerCompany": "string nama perusahaan pembeli/pembuat PO",
  "buyerAddress": "string alamat pembeli",
  "buyerPhone": "string nomor telepon pembeli",
  "picName": "string PIC atau Attention",
  "vendorCompany": "string nama supplier / vendor",
  "items": [
    {
      "itemNo": 1,
      "itemCode": "string atau kosong",
      "itemName": "string nama barang/jasa",
      "itemSpec": "string spesifikasi barang",
      "qty": 1,
      "satuan": "UNIT",
      "unitPrice": 100000,
      "totalPrice": 100000
    }
  ],
  "subtotal": 100000,
  "discount": 0,
  "discountPercent": 0,
  "ppnPercent": 11,
  "ppnValue": 11000,
  "grandTotal": 111000,
  "currency": "IDR",
  "deliveryDate": "string",
  "paymentTerms": "string",
  "deliveryAddress": "string",
  "notes": "string",
  "hasSignature": true,
  "hasStamp": true,
  "confidenceScore": "high",
  "unclearFields": []
}`;

    // Pass instruction as a proper Part object
    parts.push({ text: instruction });

    let responseText = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: parts,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} extraction attempt failed, trying next candidate:`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    // Graceful fallback if external AI service is experiencing high demand spike
    if (!responseText) {
      console.warn('AI models temporarily busy, generating structured draft for manual verification:', lastError?.message);
      const fallbackResult = {
        nomorPo: '',
        tanggalPo: new Date().toISOString().split('T')[0],
        buyerCompany: '',
        buyerAddress: '',
        buyerPhone: '',
        picName: '',
        vendorCompany: 'CV. MULIA TEKHNIK ABADI',
        items: [
          {
            id: `item-${Date.now()}-1`,
            itemNo: 1,
            itemCode: '',
            itemName: 'Pekerjaan / Barang sesuai lampiran PO',
            itemSpec: '',
            qty: 1,
            satuan: 'UNIT',
            unitPrice: 0,
            totalPrice: 0,
          },
        ],
        subtotal: 0,
        discount: 0,
        discountPercent: 0,
        ppnPercent: 0,
        ppnValue: 0,
        grandTotal: 0,
        currency: 'IDR',
        deliveryDate: '',
        paymentTerms: '',
        deliveryAddress: '',
        notes: '',
        hasSignature: false,
        hasStamp: false,
        confidenceScore: 'low',
        unclearFields: ['nomorPo', 'buyerCompany', 'items', 'grandTotal'],
        aiNotice: 'Layanan AI sementara sedang dalam antrean padat (High Demand). Formulir telah disiapkan dengan lampiran dokumen untuk Anda verifikasi/isi secara manual.',
      };
      return res.json({ success: true, data: fallbackResult });
    }

    const text = responseText;
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        throw new Error('Format output JSON dari AI tidak dapat dibaca.');
      }
    }

    // Clean up items format to guarantee array with id
    const items = Array.isArray(data.items)
      ? data.items.map((it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          itemNo: Number(it.itemNo) || idx + 1,
          itemCode: String(it.itemCode || ''),
          itemName: String(it.itemName || it.description || `Item #${idx + 1}`),
          itemSpec: String(it.itemSpec || ''),
          qty: Number(it.qty) || 1,
          satuan: String(it.satuan || 'UNIT').toUpperCase(),
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.totalPrice) || (Number(it.qty) || 1) * (Number(it.unitPrice) || 0),
        }))
      : [];

    const result = {
      nomorPo: String(data.nomorPo || '').trim(),
      tanggalPo: String(data.tanggalPo || '').trim(),
      buyerCompany: String(data.buyerCompany || '').trim(),
      buyerAddress: String(data.buyerAddress || '').trim(),
      buyerPhone: String(data.buyerPhone || '').trim(),
      picName: String(data.picName || '').trim(),
      vendorCompany: String(data.vendorCompany || '').trim(),
      items,
      subtotal: Number(data.subtotal) || 0,
      discount: Number(data.discount) || 0,
      discountPercent: Number(data.discountPercent) || 0,
      ppnPercent: Number(data.ppnPercent) || 0,
      ppnValue: Number(data.ppnValue) || 0,
      grandTotal: Number(data.grandTotal) || 0,
      currency: String(data.currency || 'IDR').toUpperCase(),
      deliveryDate: String(data.deliveryDate || '').trim(),
      paymentTerms: String(data.paymentTerms || '').trim(),
      deliveryAddress: String(data.deliveryAddress || '').trim(),
      notes: String(data.notes || '').trim(),
      hasSignature: Boolean(data.hasSignature),
      hasStamp: Boolean(data.hasStamp),
      confidenceScore: data.confidenceScore || 'high',
      unclearFields: Array.isArray(data.unclearFields) ? data.unclearFields : [],
    };

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.warn('PO extraction handler notice:', error?.message || error);
    const msg = String(error?.message || '');
    const isRateLimit = error?.status === 429 || /rate limit|resource_exhausted|quota|429/i.test(msg);
    return res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? 'Batas panggilan AI (Rate Limit / Quota) sementara tercapai. Harap tunggu 30-60 detik atau gunakan opsi "Isi Form Manual".'
        : msg || 'Gagal mengekstrak data Purchase Order dengan AI.',
      isRateLimit,
    });
  }
});

// Interactive AI Chat (Text & Voice) about the active PO document
app.post('/api/po/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Layanan AI belum dikonfigurasi pada server (GEMINI_API_KEY belum tersedia).',
      });
    }

    const messageText = String(req.body.message || req.body.question || '').trim();
    const poData = req.body.poData || {};
    const rawHistory = req.body.history || req.body.chatHistory || [];

    if (!messageText) {
      return res.status(400).json({ error: 'Pesan pertanyaan tidak boleh kosong.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextPrompt = `Anda adalah Asisten Pembaca Dokumen PO (Purchase Order) untuk CV. MULIA TEKHNIK ABADI.
Anda sedang berinteraksi dengan staf administrasi yang sedang membuka dokumen Purchase Order berikut:

DATA PURCHASE ORDER YANG DIUNGGAH:
- Nomor PO: ${poData.nomorPo || '-'}
- Tanggal PO: ${poData.tanggalPo || '-'}
- Perusahaan Penerbit (Buyer): ${poData.buyerCompany || '-'}
- Alamat Pembeli: ${poData.buyerAddress || '-'}
- Telepon Pembeli: ${poData.buyerPhone || '-'}
- Nama PIC / Contact: ${poData.picName || '-'}
- Vendor / Supplier: ${poData.vendorCompany || '-'}
- Subtotal: Rp ${(Number(poData.subtotal) || 0).toLocaleString('id-ID')}
- Diskon: Rp ${(Number(poData.discount) || 0).toLocaleString('id-ID')} (${poData.discountPercent || 0}%)
- PPN: Rp ${(Number(poData.ppnValue) || 0).toLocaleString('id-ID')} (${poData.ppnPercent || 0}%)
- Grand Total: Rp ${(Number(poData.grandTotal) || 0).toLocaleString('id-ID')} ${poData.currency || 'IDR'}
- Ketentuan Pembayaran: ${poData.paymentTerms || '-'}
- Tanggal / Alamat Kirim: ${poData.deliveryDate || '-'} | ${poData.deliveryAddress || '-'}
- Catatan: ${poData.notes || '-'}
- Tanda Tangan: ${poData.hasSignature ? 'Ada' : 'Tidak terdeteksi'} | Stempel: ${poData.hasStamp ? 'Ada' : 'Tidak terdeteksi'}
- Daftar Barang/Jasa (${(poData.items || []).length} item):
${(poData.items || []).map((it: any, i: number) => `  ${i + 1}. [${it.itemCode || '-'}] ${it.itemName} - ${it.qty} ${it.satuan} @ Rp ${(Number(it.unitPrice) || 0).toLocaleString('id-ID')} = Rp ${(Number(it.totalPrice) || 0).toLocaleString('id-ID')}`).join('\n')}

ATURAN KOMUNIKASI:
1. Jawab dalam bahasa Indonesia yang ringkas, sopan, profesional, dan ramah.
2. Jawab HANYA berdasarkan fakta yang tertulis pada dokumen PO di atas. Jangan mengarang data! Jika informasi tidak ada di dokumen, katakan terus terang bahwa data tidak tertera di dokumen PO tersebut.
3. Buat teks jawaban yang bersih, to-the-point, dan enak didengar jika dibacakan via Text-to-Speech (suara).`;

    const chatHistoryText = (rawHistory || [])
      .slice(-6)
      .map((h: any) => `${h.role === 'user' ? 'User' : 'Asisten'}: ${h.text}`)
      .join('\n');

    const prompt = `${contextPrompt}\n\nRIWAYAT PERCAKAPAN SEBELUMNYA:\n${chatHistoryText}\n\nUser: ${messageText}\nAsisten:`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let replyText = '';

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response && response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Chat model ${model} attempt failed:`, err?.message || err);
      }
    }

    return res.json({
      success: true,
      reply: replyText || 'Maaf, sistem AI sedang dalam pemeliharaan sementara. Informasi dokumen dapat Anda baca langsung pada panel tinjauan di atas.',
    });
  } catch (error: any) {
    console.warn('PO chat error notice:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Gagal memproses percakapan AI.',
    });
  }
});

// Setup Vite dev middleware or static serving
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
