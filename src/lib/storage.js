const VIDEOS_KEY = 'vsynth_videos';
const ANTHROPIC_KEY = 'vsynth_anthropic_key';
const APIFY_KEY = 'vsynth_apify_key';

export function loadVideos() {
  try {
    return JSON.parse(localStorage.getItem(VIDEOS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveVideos(videos) {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

export function addVideo(video) {
  const videos = loadVideos();
  videos.unshift(video);
  saveVideos(videos);
  return videos;
}

export function deleteVideo(id) {
  const videos = loadVideos().filter((v) => v.id !== id);
  saveVideos(videos);
  return videos;
}

export function clearVideos() {
  localStorage.removeItem(VIDEOS_KEY);
}

export function hasUrl(url) {
  return loadVideos().some((v) => v.url === url);
}

export function loadKeys() {
  return {
    anthropic: localStorage.getItem(ANTHROPIC_KEY) || '',
    apify: localStorage.getItem(APIFY_KEY) || '',
  };
}

export function saveKeys({ anthropic, apify }) {
  if (anthropic !== undefined) localStorage.setItem(ANTHROPIC_KEY, anthropic);
  if (apify !== undefined) localStorage.setItem(APIFY_KEY, apify);
}
