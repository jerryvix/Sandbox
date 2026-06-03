function divider() {
  return '────────────────────────────────────';
}

function contextBlock(contextText) {
  if (!contextText || !contextText.trim()) return '';
  return [
    '=== USER CONTEXT ===',
    contextText.trim(),
    '=== END USER CONTEXT ===',
    '',
  ].join('\n');
}

function renderVideoText(v, i) {
  const lines = [];
  const a = v.analysis || {};
  lines.push(`VIDEO ${i + 1}: ${a.title || '(untitled)'}`);
  lines.push(`Source: ${v.url}`);
  lines.push(
    `Platform: ${v.platform} | Type: ${a.contentType || 'unknown'} | Sentiment: ${a.sentiment || 'unknown'}`,
  );
  if (a.mainTopic) lines.push(`Topic: ${a.mainTopic}`);
  lines.push('');
  if (a.summary) {
    lines.push('SUMMARY:');
    lines.push(a.summary);
    lines.push('');
  }
  if (a.keyPoints?.length) {
    lines.push('KEY POINTS:');
    a.keyPoints.forEach((kp) => lines.push(`• ${kp}`));
    lines.push('');
  }
  if (a.quotableLines?.length) {
    lines.push('NOTABLE QUOTES:');
    a.quotableLines.forEach((q) => lines.push(`"${q}"`));
    lines.push('');
  }
  if (a.tags?.length) lines.push(`TAGS: ${a.tags.join(', ')}`);
  return lines.join('\n');
}

function renderVideoMarkdown(v, i) {
  const lines = [];
  const a = v.analysis || {};
  lines.push(`### Video ${i + 1}: ${a.title || '(untitled)'}`);
  lines.push('');
  lines.push(`- **Source:** ${v.url}`);
  lines.push(
    `- **Platform:** ${v.platform} · **Type:** ${a.contentType || 'unknown'} · **Sentiment:** ${a.sentiment || 'unknown'}`,
  );
  if (a.mainTopic) lines.push(`- **Topic:** ${a.mainTopic}`);
  lines.push('');
  if (a.summary) {
    lines.push('**Summary:**');
    lines.push('');
    lines.push(a.summary);
    lines.push('');
  }
  if (a.keyPoints?.length) {
    lines.push('**Key points:**');
    a.keyPoints.forEach((kp) => lines.push(`- ${kp}`));
    lines.push('');
  }
  if (a.quotableLines?.length) {
    lines.push('**Notable quotes:**');
    a.quotableLines.forEach((q) => lines.push(`> ${q}`));
    lines.push('');
  }
  if (a.tags?.length) {
    lines.push(`**Tags:** ${a.tags.map((t) => `\`${t}\``).join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

function groupByCollection(videos, collections) {
  const byCollection = new Map();
  collections.forEach((c) => byCollection.set(c.id, { collection: c, videos: [] }));
  const uncategorized = [];

  videos.forEach((v) => {
    const ids = v.collectionIds || [];
    if (!ids.length) {
      uncategorized.push(v);
      return;
    }
    let matched = false;
    ids.forEach((cid) => {
      if (byCollection.has(cid)) {
        byCollection.get(cid).videos.push(v);
        matched = true;
      }
    });
    if (!matched) uncategorized.push(v);
  });

  const groups = [...byCollection.values()].filter((g) => g.videos.length);
  return { groups, uncategorized };
}

export function buildExportText(videos, collections = [], contextText = '') {
  const lines = [];
  const ctx = contextBlock(contextText);
  if (ctx) lines.push(ctx);
  lines.push('=== VIDEO INTELLIGENCE DATABASE ===');
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push(`Total Videos: ${videos.length}`);
  lines.push(divider());

  if (collections.length === 0) {
    videos.forEach((v, i) => {
      lines.push(renderVideoText(v, i));
      lines.push(divider());
    });
  } else {
    const { groups, uncategorized } = groupByCollection(videos, collections);
    let counter = 0;
    for (const { collection, videos: group } of groups) {
      lines.push(`━━━ COLLECTION: ${collection.name} (${group.length} video${group.length === 1 ? '' : 's'}) ━━━`);
      lines.push('');
      group.forEach((v) => {
        lines.push(renderVideoText(v, counter++));
        lines.push(divider());
      });
    }
    if (uncategorized.length) {
      lines.push(`━━━ UNCATEGORIZED (${uncategorized.length} video${uncategorized.length === 1 ? '' : 's'}) ━━━`);
      lines.push('');
      uncategorized.forEach((v) => {
        lines.push(renderVideoText(v, counter++));
        lines.push(divider());
      });
    }
    if (groups.length > 0) {
      lines.push('NOTE: videos belonging to multiple collections appear in each section.');
    }
  }

  lines.push('=== END OF DATABASE ===');
  lines.push('');
  lines.push('SUGGESTED PROMPTS FOR FURTHER ANALYSIS:');
  lines.push('• "Based on these videos, what are the most common themes or recommendations?"');
  lines.push('• "Which of these sources seem most credible and why?"');
  lines.push('• "Summarize the key disagreements or conflicting information across these videos"');
  lines.push('• "What questions should I research further based on this content?"');
  return lines.join('\n');
}

export function buildExportMarkdown(videos, collections = [], contextText = '') {
  const lines = [];
  if (contextText && contextText.trim()) {
    lines.push('## User context');
    lines.push('');
    lines.push(contextText.trim());
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  lines.push('# Video Intelligence Database');
  lines.push('');
  lines.push(`_Exported: ${new Date().toISOString()}_  `);
  lines.push(`_Total Videos: ${videos.length}_`);
  lines.push('');

  if (collections.length === 0) {
    videos.forEach((v, i) => {
      lines.push(renderVideoMarkdown(v, i));
      lines.push('---');
      lines.push('');
    });
  } else {
    const { groups, uncategorized } = groupByCollection(videos, collections);
    let counter = 0;
    for (const { collection, videos: group } of groups) {
      lines.push(`## ${collection.name} (${group.length})`);
      lines.push('');
      group.forEach((v) => {
        lines.push(renderVideoMarkdown(v, counter++));
        lines.push('---');
        lines.push('');
      });
    }
    if (uncategorized.length) {
      lines.push(`## Uncategorized (${uncategorized.length})`);
      lines.push('');
      uncategorized.forEach((v) => {
        lines.push(renderVideoMarkdown(v, counter++));
        lines.push('---');
        lines.push('');
      });
    }
    if (groups.length > 0) {
      lines.push('_Note: videos belonging to multiple collections appear in each section._');
      lines.push('');
    }
  }

  lines.push('## Suggested prompts');
  lines.push('- Based on these videos, what are the most common themes or recommendations?');
  lines.push('- Which of these sources seem most credible and why?');
  lines.push('- Summarize the key disagreements or conflicting information across these videos.');
  lines.push('- What questions should I research further based on this content?');
  return lines.join('\n');
}

export function buildExportJson(videos, collections = [], contextText = '') {
  const obj = {
    exportedAt: new Date().toISOString(),
    userContext: contextText && contextText.trim() ? contextText.trim() : null,
    collections: collections.map((c) => ({ id: c.id, name: c.name })),
    videos: videos.map((v) => ({
      id: v.id,
      url: v.url,
      platform: v.platform,
      addedAt: v.addedAt,
      starred: !!v.starred,
      thumbnailUrl: v.thumbnailUrl || null,
      collectionIds: v.collectionIds || [],
      analysis: v.analysis || null,
      resourceLinks: v.resourceLinks || [],
    })),
  };
  return JSON.stringify(obj, null, 2);
}

export function buildExport(format, videos, collections = [], contextText = '') {
  if (format === 'markdown') return buildExportMarkdown(videos, collections, contextText);
  if (format === 'json') return buildExportJson(videos, collections, contextText);
  return buildExportText(videos, collections, contextText);
}

export function buildCardExport(video) {
  return buildExportText([video]);
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
