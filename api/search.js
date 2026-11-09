export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { query } = req.body || {};

    if (!query || !query.trim()) {
        return res.status(400).json({ success: false, error: 'Query tidak boleh kosong' });
    }

    // Menggunakan API Key secara langsung agar bypass masalah Vercel Environment Variables
    const apiKey = "sk-7ffd722e1ae44299820ba5ba951877e3"; 
    const url = "https://api.deepseek.com/v1/chat/completions";

    const systemPrompt = "Kamu adalah sistem database dan product knowledge sneakers yang akurat. Berikan informasi dalam format JSON valid yang berisi: name, colorway, shoe_type, category, advantages (array), materials (array), functions (array), technologies (array). Jika tidak ditemukan, set found: false.";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Cari informasi sepatu: " + query }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            return res.status(500).json({ success: false, error: `Gagal terhubung ke DeepSeek API (HTTP Code: ${response.status})` });
        }

        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);

        return res.status(200).json({
            success: true,
            found: true,
            product: content
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || "Terjadi kesalahan pada server." });
    }
}