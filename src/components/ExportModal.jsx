import { useState } from 'react';
import { buildExport, copyToClipboard, downloadText } from '../lib/export.js';

export default function ExportModal({ videos, collections = [], onClose }) {
  const [copied, setCopied] = useState(false);
  const text = buildExport(videos, collections);

  const copy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Export for LLM</h2>
            <p className="text-sm text-slate-400">
              {videos.length} video(s) ready to paste into Claude, ChatGPT, or Gemini.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-xl">
            ✕
          </button>
        </div>

        <pre className="flex-1 overflow-auto p-5 text-xs font-mono whitespace-pre-wrap bg-slate-950/50 text-slate-300">
          {text}
        </pre>

        <div className="p-5 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => downloadText(`video-synth-${Date.now()}.txt`, text)}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Download .txt
          </button>
          <button
            onClick={() => window.open('https://claude.ai', '_blank')}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Open in Claude
          </button>
          <button
            onClick={copy}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
