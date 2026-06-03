import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AddVideos from './components/AddVideos.jsx';
import Database from './components/Database.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import ExportModal from './components/ExportModal.jsx';
import {
  addCollection,
  addVideo,
  clearVideos,
  deleteCollection,
  deleteVideo,
  hasUrl,
  loadCollections,
  loadKeys,
  loadVideos,
  setVideoCollections,
  updateVideo,
} from './lib/storage.js';
import { detectPlatform } from './lib/platform.js';
import { ingestYouTube } from './lib/youtube.js';
import { ingestTikTok } from './lib/tiktok.js';
import { ingestInstagram } from './lib/instagram.js';
import { analyzeContent } from './lib/anthropic.js';

export default function App() {
  const [videos, setVideos] = useState(() => loadVideos());
  const [collections, setCollections] = useState(() => loadCollections());
  const [keys, setKeys] = useState(() => loadKeys());
  const [tab, setTab] = useState('add');
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ platform: 'all', contentType: 'all', sentiment: 'all' });
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [reanalyzingIds, setReanalyzingIds] = useState(() => new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        const ingest = platform === 'tiktok' ? ingestTikTok : ingestInstagram;
        const r = await ingest(url, keys.apify, (s) => updateQueueItem(id, { status: s }));
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
        collectionIds: [],
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
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearAll = () => {
    if (!confirm('Delete all videos from your database? This cannot be undone.')) return;
    clearVideos();
    setVideos([]);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (ids) => setSelectedIds(new Set(ids));
  const clearSelection = () => setSelectedIds(new Set());

  const handleNewCollection = (name) => {
    setCollections(addCollection(name));
  };

  const handleDeleteCollection = (id) => {
    const { collections: nextC, videos: nextV } = deleteCollection(id);
    setCollections(nextC);
    setVideos(nextV);
    if (activeCollectionId === id) setActiveCollectionId(null);
  };

  const handleSetVideoCollections = (videoId, collectionIds) => {
    setVideos(setVideoCollections(videoId, collectionIds));
  };

  const handleReanalyze = async (id) => {
    const v = videos.find((x) => x.id === id);
    if (!v) return;
    if (!keys.anthropic) {
      alert('AI analysis failed. Check your Anthropic API key in Settings.');
      return;
    }
    setReanalyzingIds((prev) => new Set(prev).add(id));
    try {
      const analysis = await analyzeContent(v.rawContent, v.platform, keys.anthropic);
      const updated = { ...v, analysis: { ...analysis, platform: v.platform } };
      setVideos(updateVideo(updated));
    } catch (err) {
      alert(err.message || 'Re-analysis failed.');
    } finally {
      setReanalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const stats = useMemo(() => {
    const byCollection = {};
    collections.forEach((c) => (byCollection[c.id] = 0));
    videos.forEach((v) => {
      (v.collectionIds || []).forEach((cid) => {
        if (byCollection[cid] !== undefined) byCollection[cid] += 1;
      });
    });
    return {
      total: videos.length,
      youtube: videos.filter((v) => v.platform === 'youtube').length,
      tiktok: videos.filter((v) => v.platform === 'tiktok').length,
      instagram: videos.filter((v) => v.platform === 'instagram').length,
      byCollection,
    };
  }, [videos, collections]);

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (filters.platform !== 'all' && v.platform !== filters.platform) return false;
      const a = v.analysis || {};
      if (filters.contentType !== 'all' && a.contentType !== filters.contentType) return false;
      if (filters.sentiment !== 'all' && a.sentiment !== filters.sentiment) return false;
      if (activeCollectionId && !(v.collectionIds || []).includes(activeCollectionId)) return false;
      if (!q) return true;
      const e = a.entities || {};
      const haystack = [
        a.title,
        a.mainTopic,
        a.summary,
        v.notes,
        ...(a.tags || []),
        ...(a.keyPoints || []),
        ...(e.people || []),
        ...(e.places || []),
        ...(e.brands || []),
        ...(e.products || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [videos, filters, search, activeCollectionId]);

  const exportVideos =
    selectedIds.size > 0
      ? videos.filter((v) => selectedIds.has(v.id))
      : filteredVideos.length
        ? filteredVideos
        : videos;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 transform transition-transform md:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          stats={stats}
          filters={filters}
          setFilters={setFilters}
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={(id) => {
            setActiveCollectionId(id);
            setTab('db');
            setSidebarOpen(false);
          }}
          onNewCollection={handleNewCollection}
          onDeleteCollection={handleDeleteCollection}
          onOpenSettings={() => setShowSettings(true)}
          onOpenExport={() => {
            setShowExport(true);
            setSidebarOpen(false);
          }}
          onClearAll={handleClearAll}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full">
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 md:px-8 pt-3">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"
              aria-label="Open menu"
            >
              ☰
            </button>
            <span className="font-semibold">
              <span className="text-indigo-400">▷</span> Video Synthesizer
            </span>
          </div>
          <div className="flex gap-1 border-b border-slate-800 -mb-px">
            <TabButton active={tab === 'add'} onClick={() => setTab('add')}>
              Add Videos
            </TabButton>
            <TabButton active={tab === 'db'} onClick={() => setTab('db')}>
              Database ({videos.length})
            </TabButton>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {tab === 'add' ? (
            <AddVideos queue={queue} onSubmit={handleSubmit} />
          ) : (
            <Database
              videos={filteredVideos}
              search={search}
              onSearch={setSearch}
              onDelete={handleDelete}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              collections={collections}
              activeCollectionId={activeCollectionId}
              onSelectCollection={setActiveCollectionId}
              onSetVideoCollections={handleSetVideoCollections}
              onReanalyze={handleReanalyze}
              reanalyzingIds={reanalyzingIds}
            />
          )}
        </div>
      </main>

      <button
        onClick={() => setShowExport(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-30 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-lg shadow-indigo-600/30"
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
          videos={exportVideos}
          collections={collections}
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
      className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-indigo-500 text-white'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
