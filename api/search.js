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

    const apiKey = "kn-282679d524cd1d05d9094acfd5b707a660d4d1f224401f26"; // Ganti dengan key Kenari kamu (kn-...)
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
                model: "deepseek-v4-flash", // Menggunakan ID model yang tepat dari katalog Kenari
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Cari informasi sepatu: " + query }
                ],
                temperature: 0.2
            })
        });

        const responseText = await response.text();

        if (!response.ok) {
            return res.status(500).json({ 
                success: false, 
                error: `Kenari Server Error [${response.status}]: ${responseText}` 
            });
        }

        let result = JSON.parse(responseText);
        const messageContent = result.choices?.[0]?.message?.content;
        const content = JSON.parse(messageContent);

        return res.status(200).json({
            success: true,
            found: true,
            product: content
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Catch Error: " + error.message });
    }
}