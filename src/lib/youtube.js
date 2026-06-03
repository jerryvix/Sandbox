import { extractYouTubeId, youtubeThumbnail } from './platform.js';

async function fetchTranscript(videoId) {
  const res = await fetch(`/api/transcript?videoId=${encodeURIComponent(videoId)}`);
  if (!res.ok) {
    let message = 'No transcript found. Video may have captions disabled.';
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.text || '';
}

export async function ingestYouTube(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Could not parse YouTube video ID from URL.');

  let transcriptText = '';
  let transcriptError = null;
  try {
    transcriptText = await fetchTranscript(videoId);
  } catch (err) {
    transcriptError = err;
  }

  let title = '';
  let description = '';
  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (oembed.ok) {
      const meta = await oembed.json();
      title = meta.title || '';
      description = `By ${meta.author_name || 'unknown'}`;
    }
  } catch {
    // best-effort
  }

  if (!transcriptText) {
    if (!title && !description) {
      throw transcriptError || new Error('No transcript found. Video may have captions disabled.');
    }
    transcriptText = `[No transcript available]\nTitle: ${title}\n${description}`;
  }

  return {
    rawContent: transcriptText,
    thumbnailUrl: youtubeThumbnail(videoId),
    fallback: !!transcriptError,
  };
}
