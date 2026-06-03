function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlight(text, query) {
  if (!query || !text) return text;
  const q = query.trim();
  if (!q) return text;
  const parts = String(text).split(new RegExp(`(${escapeRegex(q)})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-yellow-500/30 text-yellow-100 rounded px-0.5">
        {p}
      </mark>
    ) : (
      p
    ),
  );
}
