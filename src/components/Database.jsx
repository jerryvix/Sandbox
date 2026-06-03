import VideoCard from './VideoCard.jsx';

export default function Database({
  videos,
  search,
  onSearch,
  onDelete,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
}) {
  const selectedCount = selectedIds.size;
  const allSelected = videos.length > 0 && videos.every((v) => selectedIds.has(v.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search titles, topics, summaries, tags..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 focus:border-indigo-500 outline-none"
        />
        <span className="text-sm text-slate-400">{videos.length} result(s)</span>
      </div>

      {videos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-2">
          <span className="text-sm text-slate-300">
            {selectedCount > 0
              ? `${selectedCount} selected`
              : 'Select videos to limit export, or export all.'}
          </span>
          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={() => onSelectAll(videos.map((v) => v.id))}
              disabled={allSelected}
              className="px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allSelected ? 'All selected' : 'Select all'}
            </button>
            <button
              onClick={onClearSelection}
              disabled={selectedCount === 0}
              className="px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500">
          No videos match your filters. Add some on the Add Videos tab.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onDelete={onDelete}
              selected={selectedIds.has(v.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
