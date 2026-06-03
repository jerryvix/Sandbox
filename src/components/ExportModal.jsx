import { useState } from 'react';
import { buildExport, copyToClipboard, downloadText } from '../lib/export.js';
import { loadExportContext, loadExportFormat, saveExportFormat } from '../lib/storage.js';

const FORMATS = [
  {
    id: 'text',
    label: 'Structured Text',
    description: 'Header bars and bullet points. The original format.',
    extension: 'txt',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Clean ## headers, bullet lists, bold labels. Best for Claude and ChatGPT.',
    extension: 'md',
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Raw JSON array of the video objects. Best for technical workflows or APIs.',
    extension: 'json',
  },
];

export default function ExportModal({ videos, collections = [], onClose }) {
  const [lastFormat, setLastFormat] = useState(() => loadExportFormat());
  const [copiedFormat, setCopiedFormat] = useState(null);
  const contextText = loadExportContext();

  const handleCopy = async (id) => {
    const text = buildExport(id, videos, collections, contextText);
    await copyToClipboard(text);
    setLastFormat(id);
    saveExportFormat(id);
    setCopiedFormat(id);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  const handleDownload = (id, ext) => {
    const text = buildExport(id, videos, collections, contextText);
    downloadText(`video-synth-${Date.now()}.${ext}`, text);
    setLastFormat(id);
    saveExportFormat(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Export for LLM</h2>
            <p className="text-sm text-slate-400">
              {videos.length} video{videos.length === 1 ? '' : 's'} · choose a format below.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-xl">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3">
          {contextText && contextText.trim() && (
            <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
              Your custom USER CONTEXT block will be prepended. Edit it in Settings.
            </p>
          )}
          {FORMATS.map((f) => (
            <div
              key={f.id}
              className={`border rounded-md p-4 ${
                lastFormat === f.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-800/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[12rem]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{f.label}</h3>
                    {lastFormat === f.id && (
                      <span className="text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded px-2 py-0.5">
                        last used
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(f.id)}
                    className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
                  >
                    {copiedFormat === f.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload(f.id, f.extension)}
                    className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => window.open('https://claude.ai', '_blank')}
            className="text-sm text-slate-300 hover:text-indigo-300"
          >
            Open Claude.ai →
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
