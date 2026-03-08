// api/parse.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan. Gunakan POST.' });
  }

  // Mengambil API Key kedua dari Vercel
  const apiKey = process.env.GEMINI_API_KEY_AUTO;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key Auto belum diatur di Vercel.' });
  }

  const { text, imageBase64, mimeType } = req.body;

  // Instruksi ketat agar AI mengembalikan format array JSON yang sesuai dengan database kita
  const promptText = `
    Tugasmu adalah mengekstrak data transaksi keuangan dari teks atau gambar nota/mutasi yang diberikan.
    Kembalikan HANYA sebuah array JSON yang valid (tanpa teks awalan/akhiran, tanpa markdown).
    
    Format setiap objek dalam array harus persis seperti ini:
    {
      "date": "YYYY-MM-DD" (Gunakan bulan dan tahun saat ini jika tidak ada),
      "type": "in", "out", atau "transfer" (Gunakan 'transfer' jika itu adalah pemindahan uang antar dompet sendiri, misal dari BCA ke Dana),
      "amount": angka bulat (contoh: 50000),
      "note": "Keterangan singkat",
      "method": "Cash", "BCA", atau "Dana" (Dompet asal),
      "category": "Pilih SATU dari: Makanan & Minuman, Transportasi, Tagihan, Kesehatan, Internet, Kebutuhan Rumah, Pendidikan, Perawatan Kendaraan, Belanja, Hiburan, Game, Hadiah, Langganan, Liburan, Reksa Dana, Obligasi, Saham, Gaji, Lainnya. (JIKA type adalah 'transfer', isi dengan 'Transfer Internal')",
      "transferTo": "Cash", "BCA", atau "Dana" (Dompet tujuan. WAJIB DIISI HANYA JIKA type adalah 'transfer', jika bukan transfer kosongkan saja)
    }

    Pesan/Teks dari user: ${text || "Ekstrak semua transaksi dari gambar yang dilampirkan."}
  `;

  // Menyiapkan payload untuk Google API (Mendukung teks dan gambar sekaligus)
  let parts = [{ text: promptText }];
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: imageBase64
      }
    });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // Fitur rahasia: Memaksa Gemini merespons HANYA dengan JSON murni
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Gagal menghubungi AI");
    }

    const data = await response.json();
    const replyText = data.candidates[0].content.parts[0].text;
    
    // Ubah teks JSON dari AI menjadi objek JavaScript yang nyata
    const parsedTransactions = JSON.parse(replyText);
    
    return res.status(200).json(parsedTransactions);
    
  } catch (error) {
    console.error("Parse Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
