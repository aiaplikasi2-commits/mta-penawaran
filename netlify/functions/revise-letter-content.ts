import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const body = JSON.parse(event.body || '{}');
  const {
    currentOpening = '',
    currentClosing = '',
    instruction = '',
    perihal = '',
    recipientName = '',
    companyName = '',
    items = [],
  } = body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY belum disetel');
    }

    if (!instruction || !instruction.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Instruksi revisi tidak boleh kosong.' }),
      };
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        opening: parsed.opening || currentOpening,
        closing: parsed.closing || currentClosing,
      }),
    };
  } catch (error: any) {
    // Intelligent graceful fallback
    const lowerInst = String(instruction || '').toLowerCase();
    let revisedOpening = currentOpening || 'Bersama ini kami mengajukan surat penawaran harga, berikut rincian daftar harga yang kami tawarkan :';
    let revisedClosing = currentClosing || 'Demikian surat penawaran harga ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.';

    if (lowerInst.includes('singkat') || lowerInst.includes('ringkas') || lowerInst.includes('padat')) {
      revisedOpening = `Bersama ini kami sampaikan penawaran harga untuk ${perihal || 'pekerjaan terkait'} sebagai berikut :`;
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
      revisedOpening = `Dengan hormat, sehubungan dengan kebutuhan ${perihal || 'pekerjaan terkait'}, bersama ini kami CV. MULIA TEKHNIK ABADI bermaksud mengajukan penawaran harga resmi sebagaimana rincian berikut :`;
      revisedClosing = `Demikian surat penawaran harga ini kami sampaikan dengan harapan dapat terjalin kerja sama yang baik. Atas perhatian dan kepercayaan Bapak / Ibu, kami ucapkan terima kasih.`;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        opening: revisedOpening,
        closing: revisedClosing,
      }),
    };
  }
};
