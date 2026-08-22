// api/obfuscate.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Kode Lua tidak boleh kosong' });
  }

  // Ambil API Key dari environment variable (aman)
  const API_KEY = process.env.LUAOBFUSCATOR_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key tidak dikonfigurasi' });
  }

  try {
    // Step 1: Kirim script
    const step1Res = await fetch('https://luaobfuscator.com/api/obfuscator/newscript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: code,
    });

    if (!step1Res.ok) {
      const errText = await step1Res.text();
      return res.status(step1Res.status).json({ error: `Step 1 gagal: ${errText}` });
    }

    const step1Data = await step1Res.json();
    const sessionId = step1Data.sessionId;

    if (!sessionId) {
      return res.status(500).json({ error: 'Tidak mendapat sessionId dari API' });
    }

    // Step 2: Obfuscate dengan konfigurasi
    const config = {
      MinifiyAll: false,
      ChopChain: false,
      Virtualize: false,
      Virtualize2: false,
      CustomPlugins: {
        EncryptStrings: [100],
        ControlFlowFlattenV1AllBlocks: [75, 75, 33],
        MutateAllLiterals: [20],
      },
    };

    const step2Res = await fetch('https://luaobfuscator.com/api/obfuscator/obfuscate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'sessionId': sessionId,
      },
      body: JSON.stringify(config),
    });

    if (!step2Res.ok) {
      const errText = await step2Res.text();
      return res.status(step2Res.status).json({ error: `Step 2 gagal: ${errText}` });
    }

    const step2Data = await step2Res.json();
    const obfuscatedCode = step2Data.code;

    if (!obfuscatedCode) {
      return res.status(500).json({ error: 'Tidak mendapat kode hasil obfuskasi' });
    }

    return res.status(200).json({ success: true, code: obfuscatedCode });
  } catch (err) {
    console.error('Obfuscate error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
