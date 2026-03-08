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

  // Menerima pesan baru, riwayat chat, dan konteks sistem dari frontend
  const { prompt, history = [], systemContext = "" } = req.body;

  try {
    // 1. Format riwayat chat sesuai standar Gemini API
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // 2. Tambahkan pesan terbaru dari user ke urutan paling bawah
    formattedHistory.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    // 3. Susun payload untuk dikirim ke Google
    const requestBody = {
      // system_instruction adalah cara resmi memberitahu AI peran/personanya
      system_instruction: {
        parts: [{ text: systemContext }]
      },
      contents: formattedHistory
    };

    // Memanggil API Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gagal terhubung ke Google AI");
    }

    const data = await response.json();
    
    // Kembalikan hasilnya ke frontend
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
