// api/download.js
export default async function handler(req, res) {
  // Hanya method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL TikTok wajib diisi' });
  }

  // Validasi URL
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('tiktok.com')) {
      return res.status(400).json({ error: 'URL tidak valid' });
    }
  } catch {
    return res.status(400).json({ error: 'Format URL salah' });
  }

  try {
    // Gunakan provider TikWM (stabil)
    const providerUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const response = await fetch(providerUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Provider sedang tidak tersedia' });
    }

    const data = await response.json();
    if (data.code !== 0 || !data.data) {
      return res.status(404).json({ error: data.msg || 'Video tidak ditemukan' });
    }

    const d = data.data;
    return res.status(200).json({
      title: d.title || 'TikTok Video',
      cover: d.cover || null,
      play: d.play || null,       // no watermark
      wmplay: d.wmplay || null,   // with watermark
      music: d.music || null,     // audio MP3
      author: d.author ? {
        nickname: d.author.nickname,
        unique_id: d.author.unique_id,
      } : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal memproses link TikTok' });
  }
}
