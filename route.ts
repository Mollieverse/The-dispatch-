import { NextResponse } from "next/server";

interface NewsAPIArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
}

interface Story {
  id: string;
  headline: string;
  confidence: number;
  sources_count: number;
  last_updated: string;
  dispatch_note: string;
  what_happened: string;
  why_it_matters: string;
  what_we_know: string;
  what_we_dont_know: string;
  contradictions: string;
  timeline: string[];
  sources: { name: string; url: string }[];
  category: string;
}

async function fetchNewsArticles(): Promise<NewsAPIArticle[]> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) throw new Error("GNEWS_API_KEY is not set.");

  const queries = [
    "breaking news world",
    "technology artificial intelligence",
    "economy markets finance",
    "geopolitics conflict",
    "science climate environment",
  ];
  const results: NewsAPIArticle[] = [];

  for (const q of queries) {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&apikey=${key}`;
    try {
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) { console.warn(`GNews error for "${q}": ${res.status}`); continue; }
      const data = await res.json();
      if (data.articles) {
        results.push(...data.articles.map((a: {
          title: string; description: string | null; content: string | null;
          url: string; publishedAt: string; source: { name: string };
        }) => ({
          title: a.title, description: a.description, content: a.content,
          url: a.url, publishedAt: a.publishedAt, source: { name: a.source.name },
        })));
      }
    } catch (e) { console.warn(`GNews fetch failed for "${q}":`, e); }
  }

  const seen = new Set<string>();
  return results.filter((a) => {
    if (!a.url || !a.title || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

function buildPrompt(articles: NewsAPIArticle[]): string {
  const articleText = articles
    .slice(0, 30)
    .map((a, i) => `[${i + 1}]
SOURCE: ${a.source.name}
TITLE: ${a.title}
DESCRIPTION: ${a.description ?? "N/A"}
CONTENT: ${(a.content ?? "").slice(0, 600)}
URL: ${a.url}
PUBLISHED: ${a.publishedAt}`)
    .join("\n\n---\n\n");

  return `You are the chief editor of THE DISPATCH, an AI-native newsroom with the editorial standards of Reuters and the depth of The Economist.

Your job is to take raw article data and produce serious, substantive journalism briefs. You write with clarity, authority, and precision. Every sentence must earn its place.

STRICT RULES:
- Only use facts present in the provided articles. Never invent.
- If something is genuinely unknown, say so directly and specifically — not vaguely.
- Write like a senior journalist, not a summarizer. No filler phrases like "it is worth noting" or "this highlights the importance of".
- Headlines must be specific, declarative, and newsworthy — like NYT front page, not a blog post title.
- "what_happened" is your lead paragraph — make it gripping and informative. Minimum 3 solid sentences.
- "why_it_matters" must explain real-world consequences to real people. Be specific about who is affected and how.
- "what_we_know" must be a genuine list of confirmed facts. Each point should be a complete, informative sentence. Minimum 4 points.
- "what_we_dont_know" must be specific open questions — not generic. What specifically is unclear? Who hasn't responded? What data is missing?
- "contradictions" must name the contradiction precisely — which source said what. If none, say "No contradictions detected across sources."
- "dispatch_note" is a 1-sentence editorial observation — the insight a seasoned editor would add. Sharp, opinionated, useful.
- "category" must be one of: WORLD, TECH, ECONOMY, SCIENCE, CONFLICT
- "timeline" must have at least 3 entries in chronological order. Be specific with dates/times where available.
- Cluster related articles into 5–7 major story groups. Prioritise the most significant stories.
- Confidence score: 85+ means 3+ sources clearly agree. 65–84 means 2 sources or partial agreement. Below 65 means single source or conflict.

Return ONLY a valid JSON array. No markdown. No preamble. No explanation. Just the JSON.

Shape:
[
  {
    "headline": "Specific, declarative headline under 12 words",
    "category": "WORLD",
    "confidence": 87,
    "sources_count": 4,
    "dispatch_note": "One sharp editorial insight from a senior editor",
    "what_happened": "Gripping, informative lead paragraph of 3+ sentences",
    "why_it_matters": "Specific real-world consequences for specific people. 3 sentences.",
    "what_we_know": "• Confirmed fact one, complete sentence\\n• Confirmed fact two\\n• Confirmed fact three\\n• Confirmed fact four",
    "what_we_dont_know": "• Specific open question one\\n• Specific open question two\\n• Specific open question three",
    "contradictions": "Source A reported X while Source B reported Y. Or: No contradictions detected.",
    "timeline": ["Date/time: specific event", "Date/time: next event", "Date/time: latest"],
    "sources": [{ "name": "Source Name", "url": "https://real-url.com" }]
  }
]

ARTICLES TO PROCESS:
${articleText}`;
}

async function callClaude(prompt: string): Promise<Story[]> {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new Error("CLAUDE_API_KEY is not set.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? "[]";
  const clean = raw.replace(/```json|```/gi, "").trim();

  let parsed: Story[];
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("Claude returned invalid JSON.");
  }

  return parsed.map((s, i) => ({
    ...s,
    id: `story-${Date.now()}-${i}`,
    last_updated: new Date().toISOString(),
  }));
}

export async function GET() {
  try {
    const articles = await fetchNewsArticles();
    if (articles.length === 0) {
      return NextResponse.json({ error: "No articles fetched. Check your GNEWS_API_KEY." }, { status: 500 });
    }
    const stories = await callClaude(buildPrompt(articles));
    return NextResponse.json({
      stories,
      meta: {
        total_sources: articles.length,
        generated_at: new Date().toISOString(),
        story_count: stories.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/stories]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
