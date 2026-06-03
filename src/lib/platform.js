export function detectPlatform(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') return 'youtube';
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
    return 'unsupported';
  } catch {
    return 'unsupported';
  }
}

export function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

export function youtubeThumbnail(id) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
