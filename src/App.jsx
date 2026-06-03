import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AddVideos from './components/AddVideos.jsx';
import Database from './components/Database.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import ExportModal from './components/ExportModal.jsx';
import { addVideo, clearVideos, deleteVideo, hasUrl, loadKeys, loadVideos } from './lib/storage.js';
import { detectPlatform } from './lib/platform.js';
import { ingestYouTube } from './lib/youtube.js';
import { ingestTikTok } from './lib/tiktok.js';
import { analyzeContent } from './lib/anthropic.js';

export default function App() {
  const [videos, setVideos] = useState(() => loadVideos());
  const [keys, setKeys] = useState(() => loadKeys());
  const [tab, setTab] = useState('add');
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ platform: 'all', contentType: 'all', sentiment: 'all' });
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!keys.anthropic) setShowSettings(true);
  }, []); // eslint-disable-line

  const updateQueueItem = (id, patch) => {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const processUrl = async (url) => {
    const id = crypto.randomUUID();
    const platform = detectPlatform(url);

    setQueue((q) => [{ id, url, state: 'pending', status: 'Queued...' }, ...q]);

    if (platform === 'unsupported') {
      updateQueueItem(id, { state: 'error', status: 'Unsupported platform.' });
      return;
    }

    if (hasUrl(url)) {
      updateQueueItem(id, { state: 'error', status: 'This video is already in your database.' });
      return;
    }

    try {
      let raw, thumbnailUrl;
      if (platform === 'youtube') {
        updateQueueItem(id, { status: 'Fetching transcript...' });
        const r = await ingestYouTube(url);
        raw = r.rawContent;
        thumbnailUrl = r.thumbnailUrl;
      } else {
        if (!keys.apify) {
          updateQueueItem(id, { state: 'error', status: 'Requires Apify API key. Add one in Settings.' });
          return;
        }
        updateQueueItem(id, { status: 'Scraping via Apify...' });
        const r = await ingestTikTok(url, keys.apify, (s) => updateQueueItem(id, { status: s }));
        raw = r.rawContent;
        thumbnailUrl = r.thumbnailUrl;
      }

      updateQueueItem(id, { status: 'Analyzing with AI...' });
      const analysis = await analyzeContent(raw, platform, keys.anthropic);

      const video = {
        id,
        url,
        platform,
        addedAt: new Date().toISOString(),
        rawContent: raw,
        analysis: { ...analysis, platform },
        thumbnailUrl: thumbnailUrl || '',
      };
      const next = addVideo(video);
      setVideos(next);
      updateQueueItem(id, { state: 'done', status: 'Saved' });
    } catch (err) {
      updateQueueItem(id, { state: 'error', status: err.message || 'Failed' });
    }
  };

  const handleSubmit = (urls) => {
    setTab('add');
    urls.forEach((url) => processUrl(url));
  };

  const handleDelete = (id) => {
    setVideos(deleteVideo(id));
  };

  const handleClearAll = () => {
    if (!confirm('Delete all videos from your database? This cannot be undone.')) return;
    clearVideos();
    setVideos([]);
  };

  const stats = useMemo(
    () => ({
      total: videos.length,
      youtube: videos.filter((v) => v.platform === 'youtube').length,
      tiktok: videos.filter((v) => v.platform === 'tiktok').length,
    }),
    [videos],
  );

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (filters.platform !== 'all' && v.platform !== filters.platform) return false;
      const a = v.analysis || {};
      if (filters.contentType !== 'all' && a.contentType !== filters.contentType) return false;
      if (filters.sentiment !== 'all' && a.sentiment !== filters.sentiment) return false;
      if (!q) return true;
      const haystack = [
        a.title,
        a.mainTopic,
        a.summary,
        ...(a.tags || []),
        ...(a.keyPoints || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [videos, filters, search]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar
        stats={stats}
        filters={filters}
        setFilters={setFilters}
        onOpenSettings={() => setShowSettings(true)}
        onOpenExport={() => setShowExport(true)}
        onClearAll={handleClearAll}
      />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex gap-1 mb-6 border-b border-slate-800">
          <TabButton active={tab === 'add'} onClick={() => setTab('add')}>
            Add Videos
          </TabButton>
          <TabButton active={tab === 'db'} onClick={() => setTab('db')}>
            Database ({videos.length})
          </TabButton>
        </div>

        {tab === 'add' ? (
          <AddVideos queue={queue} onSubmit={handleSubmit} />
        ) : (
          <Database
            videos={filteredVideos}
            search={search}
            onSearch={setSearch}
            onDelete={handleDelete}
          />
        )}
      </main>

      <button
        onClick={() => setShowExport(true)}
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-lg shadow-indigo-600/30"
        title="Export for LLM"
      >
        Export →
      </button>

      {showSettings && (
        <SettingsModal
          initial={keys}
          onClose={() => setShowSettings(false)}
          onSaved={setKeys}
        />
      )}

      {showExport && (
        <ExportModal
          videos={filteredVideos.length ? filteredVideos : videos}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-indigo-500 text-white'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
