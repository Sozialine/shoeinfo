export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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

    // Ganti URL di bawah ini dengan alamat file api_db.php di cPanel kamu
    const cpanelApiUrl = "https://sizelegacy.com/api_db.php"; 

    try {
        // --- 1. CEK KE DATABASE MYSQL CPANEL TERLEBIH DAHULU ---
        const dbCheckRes = await fetch(cpanelApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "search", query: query.trim() })
        });
        const dbData = await dbCheckRes.json();

        if (dbData.success && dbData.found) {
            return res.status(200).json({
                success: true,
                found: true,
                source: 'cpanel_database',
                product: dbData.product
            });
        }

        // --- 2. JIKA TIDAK ADA, PANGGIL AI KENARI (DEEPSEEK) ---
        const kenariApiKey = process.env.KENARI_API_KEY;
        const kenariUrl = "https://kenari.id/v1/chat/completions";

        const systemPrompt = "Kamu adalah sistem database dan product knowledge sneakers yang akurat. Berikan informasi murni dalam format JSON valid (tanpa markdown backtick ```) yang berisi: name, colorway, shoe_type, category, advantages (array), materials (array), functions (array), technologies (array), sku. Jika tidak ditemukan, set found: false.";

        const aiResponse = await fetch(kenariUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${kenariApiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-v4-flash",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Cari informasi sepatu: " + query }
                ],
                temperature: 0.2
            })
        });

        const responseText = await aiResponse.text();
        if (!aiResponse.ok) {
            return res.status(500).json({ success: false, error: `Kenari Server Error: ${responseText}` });
        }

        let aiResult = JSON.parse(responseText);
        let messageContent = aiResult.choices?.[0]?.message?.content;
        messageContent = messageContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const productData = JSON.parse(messageContent);

        if (productData.found === false) {
            return res.status(200).json({ success: true, found: false });
        }

        // --- 3. SIMPAN OTOMATIS HASIL AI KE DATABASE MYSQL CPANEL ---
        await fetch(cpanelApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save", product: productData })
        });

        return res.status(200).json({
            success: true,
            found: true,
            source: 'ai_saved_to_cpanel',
            product: productData
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Server Error: " + error.message });
    }
}