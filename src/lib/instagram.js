import { sleep } from './platform.js';

export async function ingestInstagram(url, apifyKey, onStatus) {
  if (!apifyKey) throw new Error('Instagram requires an Apify API key. Add one in Settings.');

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-reel-scraper/runs?token=${encodeURIComponent(apifyKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [url],
        resultsType: 'posts',
        resultsLimit: 1,
      }),
    },
  );

  if (!runRes.ok) throw new Error('Instagram scrape failed. Try again or check your Apify key.');
  const runData = await runRes.json();
  const runId = runData?.data?.id;
  if (!runId) throw new Error('Instagram scrape failed: invalid response from Apify.');

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
      if (!item) throw new Error('Instagram scrape returned no data.');

      const meta = {
        caption: item.caption || '',
        thumbnailUrl: item.displayUrl || '',
        ownerUsername: item.ownerUsername || '',
        likesCount: item.likesCount,
        videoUrl: item.videoUrl || '',
      };

      const raw = [
        `Author: @${meta.ownerUsername}`,
        meta.caption && `Caption: ${meta.caption}`,
        meta.likesCount != null && `Likes: ${meta.likesCount}`,
        meta.videoUrl && `Video URL: ${meta.videoUrl}`,
      ]
        .filter(Boolean)
        .join('\n');

      return { rawContent: raw, thumbnailUrl: meta.thumbnailUrl, meta };
    }

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Instagram scrape ${status.toLowerCase()}. Try again later.`);
    }
  }
  throw new Error('Instagram scrape timed out after 90s.');
}
