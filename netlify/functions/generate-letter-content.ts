import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Layanan AI belum dikonfigurasi pada server (GEMINI_API_KEY belum disetel).',
        }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const {
      perihal = '',
      recipientName = '',
      companyName = '',
      items = [],
    } = body;

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.text || '{}',
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message || 'Gagal menyusun narasi surat' }),
    };
  }
};
