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

app.use(express.json({ limit: '10mb' }));

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
