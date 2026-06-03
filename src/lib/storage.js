const VIDEOS_KEY = 'vsynth_videos';
const COLLECTIONS_KEY = 'vsynth_collections';
const ANTHROPIC_KEY = 'vsynth_anthropic_key';
const APIFY_KEY = 'vsynth_apify_key';
const EXPORT_CONTEXT_KEY = 'vsynth_export_context';
const EXPORT_FORMAT_KEY = 'vsynth_export_format';

export function loadVideos() {
  try {
    const list = JSON.parse(localStorage.getItem(VIDEOS_KEY) || '[]');
    return list.map((v) => ({ collectionIds: [], starred: false, resourceLinks: [], ...v }));
  } catch {
    return [];
  }
}

export function saveVideos(videos) {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

export function addVideo(video) {
  const videos = loadVideos();
  videos.unshift({ collectionIds: [], starred: false, resourceLinks: [], ...video });
  saveVideos(videos);
  return videos;
}

export function updateVideo(updated) {
  const videos = loadVideos().map((v) => (v.id === updated.id ? { ...v, ...updated } : v));
  saveVideos(videos);
  return videos;
}

export function deleteVideo(id) {
  const videos = loadVideos().filter((v) => v.id !== id);
  saveVideos(videos);
  return videos;
}

export function deleteVideos(ids) {
  const set = new Set(ids);
  const videos = loadVideos().filter((v) => !set.has(v.id));
  saveVideos(videos);
  return videos;
}

export function clearVideos() {
  localStorage.removeItem(VIDEOS_KEY);
}

export function hasUrl(url) {
  return loadVideos().some((v) => v.url === url);
}

export function loadCollections() {
  try {
    return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCollections(collections) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export function addCollection(name) {
  const trimmed = name.trim();
  if (!trimmed) return loadCollections();
  const collections = loadCollections();
  if (collections.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return collections;
  }
  const next = [...collections, { id: crypto.randomUUID(), name: trimmed, createdAt: new Date().toISOString() }];
  saveCollections(next);
  return next;
}

export function deleteCollection(id) {
  const collections = loadCollections().filter((c) => c.id !== id);
  saveCollections(collections);
  const videos = loadVideos().map((v) => ({
    ...v,
    collectionIds: (v.collectionIds || []).filter((cid) => cid !== id),
  }));
  saveVideos(videos);
  return { collections, videos };
}

export function setVideoCollections(videoId, collectionIds) {
  const videos = loadVideos().map((v) =>
    v.id === videoId ? { ...v, collectionIds: [...collectionIds] } : v,
  );
  saveVideos(videos);
  return videos;
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

export function loadExportContext() {
  return localStorage.getItem(EXPORT_CONTEXT_KEY) || '';
}

export function saveExportContext(text) {
  localStorage.setItem(EXPORT_CONTEXT_KEY, text || '');
}

export function loadExportFormat() {
  return localStorage.getItem(EXPORT_FORMAT_KEY) || 'text';
}

export function saveExportFormat(format) {
  localStorage.setItem(EXPORT_FORMAT_KEY, format);
}
