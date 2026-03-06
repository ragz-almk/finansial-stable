// api/gemini.js

export default async function handler(req, res) {
  // Pastikan ini adalah permintaan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan. Gunakan POST.' });
  }

  // Mengambil API Key secara rahasia dari Environment Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key belum diatur di Vercel.' });
  }

  // Mengambil teks prompt dari script.js kita
  const { prompt } = req.body;

  try {
    // Memanggil API Google Gemini dari sisi server (Sangat Aman)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error("Gagal terhubung ke Google AI");
    }

    const data = await response.json();
    
    // Kembalikan hasilnya ke frontend
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
