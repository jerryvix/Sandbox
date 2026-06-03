import { useEffect, useRef, useState } from 'react';
import { buildCardExport, copyToClipboard } from '../lib/export.js';
import { highlight } from '../lib/highlight.jsx';

const SENTIMENT_COLOR = {
  positive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  negative: 'bg-red-500/15 text-red-300 border-red-500/30',
  neutral: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  mixed: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const CONFIDENCE_COLOR = {
  high: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-red-500/15 text-red-300 border-red-500/30',
};

function isDesktop() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(min-width: 768px)').matches;
}

export default function VideoCard({
  video,
  onDelete,
  selected,
  onToggleSelect,
  collections = [],
  onSetCollections,
  onReanalyze,
  reanalyzing,
  query = '',
}) {
  const [showSummary, setShowSummary] = useState(() => isDesktop());
  const [showPoints, setShowPoints] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collOpen, setCollOpen] = useState(false);
  const collRef = useRef(null);
  const a = video.analysis || {};
  const memberIds = new Set(video.collectionIds || []);

  useEffect(() => {
    if (!collOpen) return;
    const handler = (e) => {
      if (collRef.current && !collRef.current.contains(e.target)) setCollOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [collOpen]);

  const toggleCollection = (id) => {
    const next = new Set(memberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSetCollections?.(video.id, [...next]);
  };

  const copyCard = async () => {
    await copyToClipboard(buildCardExport(video));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hl = (text) => highlight(text, query);

  return (
    <article
      className={`bg-slate-900 border rounded-xl overflow-hidden flex flex-col transition ${
        selected ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-slate-800'
      } ${reanalyzing ? 'opacity-70' : ''}`}
    >
      <div className="aspect-video bg-slate-800 relative">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">
            {video.platform === 'youtube' ? '▶' : video.platform === 'instagram' ? '◫' : '♪'}
          </div>
        )}
        <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded bg-black/70 capitalize">
          {video.platform}
        </span>
        <label
          className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded cursor-pointer text-xs select-none"
          title="Select for export"
        >
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(video.id)}
            className="accent-indigo-500 w-3.5 h-3.5"
          />
          <span>{selected ? 'Selected' : 'Select'}</span>
        </label>
        {reanalyzing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-sm">
            <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-2" />
            Analyzing...
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <h3 className="font-semibold leading-snug">{hl(a.title || '(untitled)')}</h3>
        {a.mainTopic && <p className="text-sm text-slate-400 leading-snug">{hl(a.mainTopic)}</p>}

        <div className="flex flex-wrap gap-1.5">
          {a.sentiment && (
            <span className={`text-xs px-2 py-0.5 rounded border ${SENTIMENT_COLOR[a.sentiment] || ''}`}>
              {a.sentiment}
            </span>
          )}
          {a.contentType && (
            <span className="text-xs px-2 py-0.5 rounded border bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
              {a.contentType}
            </span>
          )}
          {a.dataConfidence && (
            <span
              className={`text-xs px-2 py-0.5 rounded border ${CONFIDENCE_COLOR[a.dataConfidence] || ''}`}
            >
              confidence: {a.dataConfidence}
            </span>
          )}
        </div>

        {a.summary && (
          <div>
            <button
              onClick={() => setShowSummary((s) => !s)}
              className="text-xs uppercase tracking-wide text-slate-400 hover:text-slate-200"
            >
              Summary {showSummary ? '▾' : '▸ Show more'}
            </button>
            {showSummary && <p className="text-sm text-slate-300 mt-1">{hl(a.summary)}</p>}
          </div>
        )}

        {a.keyPoints?.length > 0 && (
          <div>
            <button
              onClick={() => setShowPoints((s) => !s)}
              className="text-xs uppercase tracking-wide text-slate-400 hover:text-slate-200"
            >
              Key points ({a.keyPoints.length}) {showPoints ? '▾' : '▸ Show more'}
            </button>
            {showPoints && (
              <ul className="text-sm text-slate-300 mt-1 space-y-1 list-disc pl-5">
                {a.keyPoints.map((kp, i) => (
                  <li key={i}>{hl(kp)}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {a.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {a.tags.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                #{hl(t)}
              </span>
            ))}
          </div>
        )}

        <div className="relative" ref={collRef}>
          <button
            onClick={() => setCollOpen((o) => !o)}
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
          >
            ☰ Collections{memberIds.size ? ` (${memberIds.size})` : ''}
          </button>
          {collOpen && (
            <div className="absolute z-20 mt-1 w-60 bg-slate-900 border border-slate-700 rounded-md shadow-lg p-2 max-h-64 overflow-auto">
              {collections.length === 0 && (
                <p className="text-xs text-slate-500 px-2 py-1">
                  No collections yet. Create one from the sidebar.
                </p>
              )}
              {collections.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={memberIds.has(c.id)}
                    onChange={() => toggleCollection(c.id)}
                    className="accent-indigo-500"
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="truncate hover:text-indigo-300"
              title={video.url}
            >
              {video.url}
            </a>
            <button
              onClick={() => onReanalyze?.(video.id)}
              disabled={reanalyzing}
              className="shrink-0 px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 disabled:opacity-50"
              title="Re-analyze"
              aria-label="Re-analyze"
            >
              ↻
            </button>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={copyCard}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => onDelete(video.id)}
              className="px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/70 text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
