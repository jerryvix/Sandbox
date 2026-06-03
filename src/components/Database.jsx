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
  collections,
  activeCollectionId,
  onSelectCollection,
  onSetVideoCollections,
  onReanalyze,
  reanalyzingIds,
}) {
  const selectedCount = selectedIds.size;
  const allSelected = videos.length > 0 && videos.every((v) => selectedIds.has(v.id));
  const trimmed = search.trim();
  const activeCollection = activeCollectionId
    ? collections.find((c) => c.id === activeCollectionId)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search titles, topics, summaries, key points, tags, people, places..."
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 focus:border-indigo-500 outline-none"
        />
        {trimmed && (
          <p className="text-xs text-slate-400 mt-2">
            {videos.length} result{videos.length === 1 ? '' : 's'} for{' '}
            <span className="text-slate-200">"{trimmed}"</span>
            <button onClick={() => onSearch('')} className="ml-2 text-indigo-400 hover:text-indigo-300">
              Clear
            </button>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <CollectionChip
          active={activeCollectionId === null}
          onClick={() => onSelectCollection(null)}
        >
          All
        </CollectionChip>
        {collections.map((c) => (
          <CollectionChip
            key={c.id}
            active={activeCollectionId === c.id}
            onClick={() => onSelectCollection(c.id)}
          >
            {c.name}
          </CollectionChip>
        ))}
      </div>

      {videos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-2">
          <span className="text-sm text-slate-300">
            {selectedCount > 0
              ? `${selectedCount} selected`
              : activeCollection
                ? `Viewing "${activeCollection.name}"`
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
          {trimmed
            ? `No videos match "${trimmed}".`
            : 'No videos match your filters. Add some on the Add Videos tab.'}
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
              collections={collections}
              onSetCollections={onSetVideoCollections}
              onReanalyze={onReanalyze}
              reanalyzing={reanalyzingIds.has(v.id)}
              query={trimmed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition ${
        active
          ? 'bg-indigo-600 border-indigo-500 text-white'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
