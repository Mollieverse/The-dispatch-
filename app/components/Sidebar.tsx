"use client";

import { Story } from "../types";

interface Props {
  stories: Story[];
  activeId: string | null;
  onSelect: (story: Story) => void;
  meta: { total_sources: number; generated_at: string } | null;
  loading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  WORLD: "#c9a84c",
  TECH: "#4c82c9",
  ECONOMY: "#4caf7a",
  SCIENCE: "#9b59b6",
  CONFLICT: "#c94c4c",
};

function confidenceColor(score: number): string {
  if (score >= 85) return "#4caf7a";
  if (score >= 65) return "#c9a84c";
  return "#c94c4c";
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Sidebar({ stories, activeId, onSelect, meta, loading }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-label">Active Stories</div>
        <div className="sidebar-count">
          {loading && stories.length === 0
            ? "Loading…"
            : meta
            ? `${stories.length} clusters · ${meta.total_sources} sources`
            : "—"}
        </div>
      </div>

      <div className="story-list">
        {loading && stories.length === 0 && (
          <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-line" style={{ width: "85%", height: 11, marginBottom: 6 }} />
                <div className="skeleton-line" style={{ width: "60%", height: 11, marginBottom: 8 }} />
                <div className="skeleton-line" style={{ width: "40%", height: 8 }} />
              </div>
            ))}
          </div>
        )}

        {stories.map((story) => {
          const confColor = confidenceColor(story.confidence);
          const catColor = CATEGORY_COLORS[story.category] ?? "#c9a84c";
          return (
            <div
              key={story.id}
              className={`story-item ${story.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(story)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div className="story-category-dot" style={{ background: catColor }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: catColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {story.category}
                </span>
              </div>
              <div className="story-item-headline">{story.headline}</div>
              <div className="story-item-meta">
                <div className="confidence-bar-wrap">
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${story.confidence}%`, background: confColor }} />
                  </div>
                  <span className="confidence-label" style={{ color: confColor }}>{story.confidence}%</span>
                </div>
                <span className="sources-badge">{story.sources_count}{story.sources_count === 1 ? " src" : " srcs"}</span>
              </div>
              <div style={{ marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                {timeAgo(story.last_updated)}
              </div>
            </div>
          );
        })}
      </div>

      {meta && (
        <div className="footer-strip">
          <span className="footer-text">
            {new Date(meta.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="footer-text text-gold">The Dispatch</span>
        </div>
      )}
    </aside>
  );
}
