import { useState } from 'react';
import { saveKeys } from '../lib/storage.js';

export default function SettingsModal({ initial, onClose, onSaved }) {
  const [anthropic, setAnthropic] = useState(initial.anthropic || '');
  const [apify, setApify] = useState(initial.apify || '');

  const save = () => {
    saveKeys({ anthropic: anthropic.trim(), apify: apify.trim() });
    onSaved?.({ anthropic: anthropic.trim(), apify: apify.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold mb-1">Settings</h2>
        <p className="text-sm text-slate-400 mb-5">
          Keys are stored only in your browser's localStorage. Never sent anywhere except the respective APIs.
        </p>

        <label className="block text-sm font-medium mb-1">Anthropic API key</label>
        <input
          type="password"
          value={anthropic}
          onChange={(e) => setAnthropic(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 mb-4 focus:border-indigo-500 outline-none"
        />

        <label className="block text-sm font-medium mb-1">
          Apify API key <span className="text-slate-500 font-normal">(optional — TikTok only)</span>
        </label>
        <input
          type="password"
          value={apify}
          onChange={(e) => setApify(e.target.value)}
          placeholder="apify_api_..."
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 mb-6 focus:border-indigo-500 outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
