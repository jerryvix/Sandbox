import { useState } from 'react';
import { detectPlatform } from '../lib/platform.js';

export default function AddVideos({ queue, onSubmit }) {
  const [single, setSingle] = useState('');
  const [bulk, setBulk] = useState('');

  const submitSingle = () => {
    const url = single.trim();
    if (!url) return;
    onSubmit([url]);
    setSingle('');
  };

  const submitBulk = () => {
    const urls = bulk
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!urls.length) return;
    onSubmit(urls);
    setBulk('');
  };

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-3">Add a single video</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={single}
            onChange={(e) => setSingle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSingle()}
            placeholder="Paste a YouTube, TikTok, or Instagram URL"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={submitSingle}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium"
          >
            Add
          </button>
        </div>
        {single && (
          <p className="text-xs text-slate-400 mt-2">
            Detected platform: <span className="text-slate-200">{detectPlatform(single)}</span>
          </p>
        )}
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-3">Add many at once</h3>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder="One URL per line"
          rows={6}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 focus:border-indigo-500 outline-none font-mono text-sm"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={submitBulk}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium w-full sm:w-auto"
          >
            Analyze All
          </button>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-3">Processing queue</h3>
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing in queue. Add a URL above to begin.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 bg-slate-800/50 border border-slate-800 rounded-md p-3"
              >
                <StatusIcon state={item.state} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-slate-300">{item.url}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      item.state === 'error'
                        ? 'text-red-400'
                        : item.state === 'done'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {item.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusIcon({ state }) {
  if (state === 'done') return <span className="text-emerald-400 mt-0.5">✓</span>;
  if (state === 'error') return <span className="text-red-400 mt-0.5">✗</span>;
  return (
    <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mt-0.5" />
  );
}
