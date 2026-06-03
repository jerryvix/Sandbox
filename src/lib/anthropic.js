const ANALYSIS_SYSTEM_PROMPT = `You are a content intelligence analyst. Given raw video content (transcript, caption, metadata), extract structured intelligence.

Return ONLY a valid JSON object. No markdown. No preamble. No explanation. Just the JSON.

Schema:
{
  "title": "Concise descriptive title for this video's content",
  "platform": "youtube | tiktok",
  "contentType": "tutorial | review | vlog | list | opinion | news | entertainment | travel | food | other",
  "mainTopic": "One sentence describing exactly what this video is about",
  "summary": "3-5 sentence executive summary of the key content and insights",
  "keyPoints": [
    "Specific actionable or informational point 1",
    "Specific actionable or informational point 2",
    "Specific actionable or informational point 3",
    "Specific actionable or informational point 4",
    "Specific actionable or informational point 5"
  ],
  "entities": {
    "people": ["person mentioned 1", "person mentioned 2"],
    "places": ["place mentioned 1", "place mentioned 2"],
    "brands": ["brand mentioned 1"],
    "products": ["product mentioned 1"]
  },
  "sentiment": "positive | negative | neutral | mixed",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "quotableLines": ["Most interesting or memorable line from the content"],
  "dataConfidence": "high | medium | low"
}`;

const LINKS_SYSTEM_PROMPT = `You are a resource link generator. Given a list of entities extracted from a video (restaurants, hotels, clubs, beaches, products, brands, attractions), generate the most useful direct links for each one.

Return ONLY a JSON array, no markdown, no preamble:
[
  {
    "entity": "Name of the place or product",
    "type": "restaurant|hotel|club|beach|attraction|product|brand|other",
    "links": [
      { "label": "Google Maps", "url": "https://www.google.com/maps/search/[entity+name+location]" },
      { "label": "TripAdvisor", "url": "https://www.tripadvisor.com/Search?q=[entity+name]" },
      { "label": "Website", "url": "direct website URL if you know it with confidence, else null" },
      { "label": "Instagram", "url": "https://www.instagram.com/[handle] if you know it with confidence, else null" }
    ]
  }
]

For products add an Amazon search link. For restaurants in a known city add an OpenTable or Resy search link. Only include links where the URL will actually be useful — omit nulls from the final array.`;

async function callClaude({ system, userContent, anthropicKey, maxTokens = 1500 }) {
  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
  } catch {
    throw new Error('Connection failed. Check your internet connection.');
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    if (response.status === 401 || response.status === 403) {
      throw new Error('AI call failed. Check your Anthropic API key in Settings.');
    }
    throw new Error(`AI call failed (${response.status}). ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.content?.find((b) => b.type === 'text')?.text || '';
}

function parseJson(text, fallback) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export async function analyzeContent(rawContent, platform, anthropicKey) {
  if (!anthropicKey) throw new Error('AI analysis failed. Check your Anthropic API key in Settings.');
  const text = await callClaude({
    system: ANALYSIS_SYSTEM_PROMPT,
    userContent: `Platform: ${platform}\n\nRaw Content:\n${rawContent.slice(0, 12000)}`,
    anthropicKey,
    maxTokens: 1500,
  });
  const parsed = parseJson(text, null);
  if (!parsed) throw new Error('AI analysis returned invalid JSON.');
  return parsed;
}

export async function generateResourceLinks(analysis, anthropicKey) {
  if (!anthropicKey) throw new Error('Missing Anthropic key.');
  const entities = analysis?.entities || {};
  const targets = [
    ...(entities.places || []).map((name) => ({ name, kind: 'place' })),
    ...(entities.brands || []).map((name) => ({ name, kind: 'brand' })),
    ...(entities.products || []).map((name) => ({ name, kind: 'product' })),
  ].filter((t) => t.name && t.name.trim());

  if (!targets.length) return [];

  const locationContext = (entities.places || []).join(', ') || 'unknown';
  const userContent = `Entities (one per line, "name — kind"):
${targets.map((t) => `- ${t.name} — ${t.kind}`).join('\n')}

Geographic context (places mentioned in this video): ${locationContext}

Video topic: ${analysis?.mainTopic || 'unknown'}`;

  const text = await callClaude({
    system: LINKS_SYSTEM_PROMPT,
    userContent,
    anthropicKey,
    maxTokens: 2000,
  });
  const parsed = parseJson(text, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => ({
      entity: String(entry.entity || '').trim(),
      type: String(entry.type || 'other'),
      links: (entry.links || [])
        .filter((l) => l && l.url && l.label && typeof l.url === 'string' && /^https?:\/\//i.test(l.url))
        .map((l) => ({ label: String(l.label), url: String(l.url) })),
    }))
    .filter((entry) => entry.entity && entry.links.length > 0);
}
