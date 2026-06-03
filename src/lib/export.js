export function buildExport(videos) {
  const lines = [];
  lines.push('=== VIDEO INTELLIGENCE DATABASE ===');
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push(`Total Videos: ${videos.length}`);
  lines.push('────────────────────────────────────');

  videos.forEach((v, i) => {
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
    lines.push('────────────────────────────────────');
  });

  lines.push('=== END OF DATABASE ===');
  lines.push('');
  lines.push('SUGGESTED PROMPTS FOR FURTHER ANALYSIS:');
  lines.push('• "Based on these videos, what are the most common themes or recommendations?"');
  lines.push('• "Which of these sources seem most credible and why?"');
  lines.push('• "Summarize the key disagreements or conflicting information across these videos"');
  lines.push('• "What questions should I research further based on this content?"');

  return lines.join('\n');
}

export function buildCardExport(video) {
  return buildExport([video]);
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
