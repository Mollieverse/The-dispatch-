"use client";

import { Story } from "../types";

interface Props {
  story: Story | null;
  meta: { total_sources: number; generated_at: string; story_count: number } | null;
  allStories: Story[];
}

function GaugeRing({ value, color }: { value: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="gauge-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#242428" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="gauge-text">{value}</div>
    </div>
  );
}

function confidenceColor(score: number): string {
  if (score >= 75) return "#4caf7a";
  if (score >= 50) return "#c9a84c";
  return "#c94c4c";
}

function confidenceDesc(score: number): string {
  if (score >= 80) return "High agreement across sources.";
  if (score >= 60) return "Moderate corroboration.";
  if (score >= 40) return "Limited sourcing. Treat with caution.";
  return "Low confidence. Single or conflicting sources.";
}

function confidenceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Low";
  return "Unverified";
}

const SIGNAL_THRESHOLDS = [20, 40, 60, 80];

export default function InsightsPanel({ story, meta, allStories }: Props) {
  const avgConf = allStories.length
    ? Math.round(allStories.reduce((s, x) => s + x.confidence, 0) / allStories.length)
    : 0;

  return (
    <div className="insights-panel">
      <div className="insights-panel-label">Analysis</div>

      {/* Global stats */}
      <div className="insight-card">
        <div className="insight-card-title">Newsroom Stats</div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value gold">{meta?.story_count ?? "—"}</div>
            <div className="stat-label">Clusters</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{meta?.total_sources ?? "—"}</div>
            <div className="stat-label">Live Sources</div>
          </div>
          <div className="stat-item">
            <div className="stat-value green">{avgConf || "—"}</div>
            <div className="stat-label">Avg Conf.</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {meta
                ? new Date(meta.generated_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </div>
            <div className="stat-label">Last Fetch</div>
          </div>
        </div>
      </div>

      {story ? (
        <>
          {/* Confidence gauge */}
          <div className="insight-card">
            <div className="insight-card-title">Confidence Score</div>
            <div className="gauge-wrap">
              <GaugeRing
                value={story.confidence}
                color={confidenceColor(story.confidence)}
              />
              <div>
                <div
                  className="gauge-label"
                  style={{ color: confidenceColor(story.confidence) }}
                >
                  {confidenceLabel(story.confidence)}
                </div>
                <div className="gauge-desc">{confidenceDesc(story.confidence)}</div>
              </div>
            </div>
          </div>

          {/* Signal strength */}
          <div className="insight-card">
            <div className="insight-card-title">Signal Strength</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div className="signal-bars">
                {SIGNAL_THRESHOLDS.map((t, i) => (
                  <div
                    key={i}
                    className={`signal-bar ${story.confidence >= t ? "active" : ""}`}
                    style={{ height: `${8 + i * 5}px` }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {story.sources_count} source{story.sources_count !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Story verified across {story.sources_count} distinct source
              {story.sources_count !== 1 ? "s" : ""}.
            </div>
          </div>

          {/* Source breakdown */}
          {story.sources.length > 0 && (
            <div className="insight-card">
              <div className="insight-card-title">Source Breakdown</div>
              <div className="source-breakdown">
                {story.sources.slice(0, 6).map((src, i) => (
                  <div key={i} className="breakdown-row">
                    <div
                      className="breakdown-dot"
                      style={{ background: `hsl(${i * 50}, 60%, 55%)` }}
                    />
                    <span className="breakdown-name">{src.name}</span>
                  </div>
                ))}
                {story.sources.length > 6 && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    +{story.sources.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contradictions flag */}
          {story.contradictions &&
            story.contradictions !== "No contradictions detected" && (
              <div className="insight-card">
                <div
                  className="insight-card-title"
                  style={{ color: "var(--accent-red)" }}
                >
                  ⚠ Contradiction Flag
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {story.contradictions}
                </div>
              </div>
            )}
        </>
      ) : (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Select a story to
          <br />
          view analysis
        </div>
      )}

      {/* Branding footer */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          lineHeight: 1.8,
        }}
      >
        The Dispatch
        <br />
        AI-Native Newsroom
        <br />
        <span style={{ color: "var(--accent-gold-dim)" }}>
          Powered by Claude + NewsAPI
        </span>
      </div>
    </div>
  );
}
