export const handler = async () => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      configured: hasKey,
      model: 'gemini-3.8-flash',
      message: hasKey ? 'Layanan AI Gemini siap digunakan' : 'API Key Gemini belum disetel pada server',
    }),
  };
};
