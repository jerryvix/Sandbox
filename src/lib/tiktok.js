import { sleep } from './platform.js';

export async function ingestTikTok(url, apifyKey, onStatus) {
  if (!apifyKey) throw new Error('TikTok requires an Apify API key. Add one in Settings.');

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/runs?token=${encodeURIComponent(apifyKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postURLs: [url],
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        maxRequestRetries: 2,
      }),
    },
  );

  if (!runRes.ok) throw new Error('TikTok scrape failed. Try again or check your Apify key.');
  const runData = await runRes.json();
  const runId = runData?.data?.id;
  if (!runId) throw new Error('TikTok scrape failed: invalid response from Apify.');

  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    onStatus?.(`Scraping via Apify... (${(i + 1) * 3}s)`);
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(apifyKey)}`,
    );
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();
    const status = statusData?.data?.status;

    if (status === 'SUCCEEDED') {
      const datasetId = statusData.data.defaultDatasetId;
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(apifyKey)}`,
      );
      const items = await itemsRes.json();
      const item = items?.[0];
      if (!item) throw new Error('TikTok scrape returned no data.');

      const meta = {
        caption: item.text || '',
        transcript: item.subtitlesText || '',
        authorUsername: item.authorMeta?.name || '',
        playCount: item.playCount,
        likeCount: item.diggCount,
        shareCount: item.shareCount,
        hashtags: (item.hashtags || []).map((h) => h.name).filter(Boolean),
        coverUrl: item.covers?.default || item.videoMeta?.coverUrl || '',
        createTime: item.createTime,
      };

      const raw = [
        `Author: @${meta.authorUsername}`,
        meta.caption && `Caption: ${meta.caption}`,
        meta.transcript && `Transcript: ${meta.transcript}`,
        meta.hashtags.length && `Hashtags: ${meta.hashtags.map((h) => '#' + h).join(' ')}`,
        meta.playCount && `Plays: ${meta.playCount} | Likes: ${meta.likeCount} | Shares: ${meta.shareCount}`,
      ]
        .filter(Boolean)
        .join('\n');

      return { rawContent: raw, thumbnailUrl: meta.coverUrl, meta };
    }

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`TikTok scrape ${status.toLowerCase()}. Try again later.`);
    }
  }
  throw new Error('TikTok scrape timed out after 90s.');
}
