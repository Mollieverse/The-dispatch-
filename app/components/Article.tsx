"use client";

import { Story } from "../types";

interface Props {
  story: Story;
}

const CATEGORY_COLORS: Record<string, string> = {
  WORLD: "#c9a84c",
  TECH: "#4c82c9",
  ECONOMY: "#4caf7a",
  SCIENCE: "#9b59b6",
  CONFLICT: "#c94c4c",
};

function confidenceLabel(score: number): { label: string; cls: string } {
  if (score >= 85) return { label: `Verified · ${score}%`, cls: "byline-confidence" };
  if (score >= 65) return { label: `Moderate · ${score}%`, cls: "byline-confidence medium" };
  return { label: `Unverified · ${score}%`, cls: "byline-confidence low" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

export default function Article({ story }: Props) {
  const conf = confidenceLabel(story.confidence);
  const catColor = CATEGORY_COLORS[story.category] ?? "#c9a84c";

  return (
    <article className="article">

      {/* Category + kicker */}
      <div className="article-kicker">
        <span className="article-category" style={{ color: catColor, borderColor: catColor }}>
          {story.category ?? "DISPATCH"}
        </span>
        Breaking Analysis
      </div>

      {/* Headline */}
      <h1 className="article-headline">{story.headline}</h1>

      {/* Dispatch note — editorial insight */}
      {story.dispatch_note && (
        <div className="dispatch-note">
          <span className="dispatch-note-label">Editor&apos;s Note</span>
          {story.dispatch_note}
        </div>
      )}

      {/* Byline */}
      <div className="article-byline">
        <span className={conf.cls}>{conf.label}</span>
        <span className="byline-sources">
          {story.sources_count} source{story.sources_count !== 1 ? "s" : ""}
        </span>
        <span className="byline-time">{formatDate(story.last_updated)}</span>
      </div>

      {/* What Happened */}
      <div className="section">
        <div className="section-label">What Happened</div>
        <p className="section-body lead">{story.what_happened}</p>
      </div>

      {/* Why It Matters */}
      <div className="section">
        <div className="section-label">Why It Matters</div>
        <p className="section-body">{story.why_it_matters}</p>
      </div>

      {/* What We Know */}
      <div className="section">
        <div className="section-label">What We Know</div>
        <div className="known-box">{story.what_we_know}</div>
      </div>

      {/* What We Don't Know */}
      <div className="section">
        <div className="section-label">What We Don&apos;t Know</div>
        <div className="unknown-box">{story.what_we_dont_know}</div>
      </div>

      {/* Contradictions */}
      <div className="section">
        <div className="section-label">Contradictions</div>
        <div className="contradiction-box">{story.contradictions}</div>
      </div>

      {/* Timeline */}
      {story.timeline && story.timeline.length > 0 && (
        <div className="section">
          <div className="section-label">Timeline</div>
          <ul className="timeline">
            {story.timeline.map((item, i) => (
              <li key={i} className="timeline-item">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {story.sources && story.sources.length > 0 && (
        <div className="section">
          <div className="section-label">Sources ({story.sources.length})</div>
          <div className="sources-list">
            {story.sources.map((src, i) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="source-link">
                <span className="source-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="source-name">{src.name}</span>
                <span className="source-arrow">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
