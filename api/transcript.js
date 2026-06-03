import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  const videoId = (req.query?.videoId || '').toString().trim();
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId query parameter.' });
  }
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid videoId.' });
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const text = segments.map((s) => s.text).join(' ');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({ videoId, text, segmentCount: segments.length });
  } catch (err) {
    const message = err?.message || 'Failed to fetch transcript.';
    const status = /disabled|unavailable|not found|no transcript/i.test(message) ? 404 : 500;
    return res.status(status).json({ error: message });
  }
}
