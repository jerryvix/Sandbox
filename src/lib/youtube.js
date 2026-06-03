import { YoutubeTranscript } from 'youtube-transcript';
import { extractYouTubeId, youtubeThumbnail } from './platform.js';

export async function ingestYouTube(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Could not parse YouTube video ID from URL.');

  let transcriptText = '';
  let transcriptError = null;
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    transcriptText = segments.map((s) => s.text).join(' ');
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
      throw new Error('No transcript found. Video may have captions disabled.');
    }
    transcriptText = `[No transcript available]\nTitle: ${title}\n${description}`;
  }

  return {
    rawContent: transcriptText,
    thumbnailUrl: youtubeThumbnail(videoId),
    fallback: !!transcriptError,
  };
}
