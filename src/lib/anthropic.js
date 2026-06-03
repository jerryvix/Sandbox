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

export async function analyzeContent(rawContent, platform, anthropicKey) {
  if (!anthropicKey) throw new Error('AI analysis failed. Check your Anthropic API key in Settings.');

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
        max_tokens: 1500,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Platform: ${platform}\n\nRaw Content:\n${rawContent.slice(0, 12000)}`,
          },
        ],
      }),
    });
  } catch {
    throw new Error('Connection failed. Check your internet connection.');
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    if (response.status === 401 || response.status === 403) {
      throw new Error('AI analysis failed. Check your Anthropic API key in Settings.');
    }
    throw new Error(`AI analysis failed (${response.status}). ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.find((b) => b.type === 'text')?.text || '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AI analysis returned invalid JSON.');
  }
}
