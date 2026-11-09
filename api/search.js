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

    // 1. Masukkan API Key Kenari kamu di sini (berawalan kn-...)
    const apiKey = "kn-282679d524cd1d05d9094acfd5b707a660d4d1f224401f26"; 
    
    // 2. Gunakan endpoint resmi dari Kenari.id
    const url = "https://kenari.id/v1/chat/completions";

    const systemPrompt = "Kamu adalah sistem database dan product knowledge sneakers yang akurat. Berikan informasi dalam format JSON valid yang berisi: name, colorway, shoe_type, category, advantages (array), materials (array), functions (array), technologies (array). Jika tidak ditemukan, set found: false.";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                // 3. Nama model DeepSeek yang didukung di Kenari.id
                model: "deepseek/deepseek-chat", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Cari informasi sepatu: " + query }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(500).json({ success: false, error: `Kenari API Error (${response.status}): ${errorText}` });
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