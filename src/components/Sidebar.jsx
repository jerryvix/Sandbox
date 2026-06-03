export default function Sidebar({
  stats,
  filters,
  setFilters,
  onOpenSettings,
  onOpenExport,
  onClearAll,
}) {
  return (
    <aside className="w-full md:w-64 shrink-0 bg-slate-900 border-r border-slate-800 p-5 flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-indigo-400">▷</span> Video Synthesizer
        </h1>
        <p className="text-xs text-slate-500 mt-1">Paste links. Get intelligence.</p>
      </div>

      <div className="bg-slate-800/50 rounded-md p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Total</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-400">YouTube</span>
          <span>{stats.youtube}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-400">TikTok</span>
          <span>{stats.tiktok}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-400">Instagram</span>
          <span>{stats.instagram}</span>
        </div>
      </div>

      <div className="space-y-3">
        <FilterSelect
          label="Platform"
          value={filters.platform}
          onChange={(v) => setFilters({ ...filters, platform: v })}
          options={[
            ['all', 'All'],
            ['youtube', 'YouTube'],
            ['tiktok', 'TikTok'],
            ['instagram', 'Instagram'],
          ]}
        />
        <FilterSelect
          label="Content type"
          value={filters.contentType}
          onChange={(v) => setFilters({ ...filters, contentType: v })}
          options={[
            ['all', 'All'],
            ['tutorial', 'Tutorial'],
            ['review', 'Review'],
            ['vlog', 'Vlog'],
            ['list', 'List'],
            ['opinion', 'Opinion'],
            ['news', 'News'],
            ['entertainment', 'Entertainment'],
            ['travel', 'Travel'],
            ['food', 'Food'],
            ['other', 'Other'],
          ]}
        />
        <FilterSelect
          label="Sentiment"
          value={filters.sentiment}
          onChange={(v) => setFilters({ ...filters, sentiment: v })}
          options={[
            ['all', 'All'],
            ['positive', 'Positive'],
            ['negative', 'Negative'],
            ['neutral', 'Neutral'],
            ['mixed', 'Mixed'],
          ]}
        />
      </div>

      <button
        onClick={onOpenExport}
        className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 font-semibold"
      >
        Export for LLM
      </button>

      <div className="mt-auto space-y-2">
        <button
          onClick={onOpenSettings}
          className="w-full py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm border border-slate-700"
        >
          ⚙ Settings
        </button>
        <button
          onClick={onClearAll}
          className="w-full py-2 rounded-md bg-red-900/30 hover:bg-red-900/60 text-red-300 text-sm border border-red-900/50"
        >
          Clear database
        </button>
      </div>
    </aside>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm focus:border-indigo-500 outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
