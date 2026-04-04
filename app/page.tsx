"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Article from "./components/Article";
import InsightsPanel from "./components/InsightsPanel";
import { Story, StoriesResponse } from "./types";

type MobileView = "list" | "article" | "insights";

const LOADER_STEPS = [
  "Scanning live sources across 5 beats…",
  "Fetching breaking news worldwide…",
  "Clustering related stories…",
  "Verifying facts across sources…",
  "Scoring confidence levels…",
  "Writing editorial briefs…",
  "Checking for contradictions…",
  "Finalising The Dispatch…",
];

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [meta, setMeta] = useState<StoriesResponse["meta"] | null>(null);
  const [active, setActive] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [readProgress, setReadProgress] = useState(0);
  const [loaderStep, setLoaderStep] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animated loader steps ──────────────────────────────────────
  useEffect(() => {
    if (loading) {
      setLoaderStep(0);
      loaderRef.current = setInterval(() => {
        setLoaderStep((s) => (s < LOADER_STEPS.length - 1 ? s + 1 : s));
      }, 2800);
    } else {
      if (loaderRef.current) clearInterval(loaderRef.current);
    }
    return () => { if (loaderRef.current) clearInterval(loaderRef.current); };
  }, [loading]);

  // ── Fetch stories ──────────────────────────────────────────────
  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stories");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to fetch stories."); return; }
      setStories(data.stories);
      setMeta(data.meta);
      if (data.stories.length > 0) setActive(data.stories[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  // ── Keyboard navigation ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!stories.length || !active) return;
      const idx = stories.findIndex((s) => s.id === active.id);
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); if (idx < stories.length - 1) setActive(stories[idx + 1]); }
      if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); if (idx > 0) setActive(stories[idx - 1]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stories, active]);

  // ── Reading progress ───────────────────────────────────────────
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = scrollHeight <= clientHeight ? 0 : (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadProgress(Math.round(pct));
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [active]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setReadProgress(0);
  }, [active]);

  const handleSelectStory = (story: Story) => {
    setActive(story);
    setMobileView("article");
  };

  return (
    <div className="app-shell">
      {/* ── Reading progress bar ── */}
      {active && (
        <div className="read-progress-bar">
          <div className="read-progress-fill" style={{ width: `${readProgress}%` }} />
        </div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-title">The <span>Dispatch</span></div>
          <div className="header-subtitle">AI-native newsroom · real-time verification</div>
        </div>
        <div className="header-meta">
          {meta && <span className="sources-meta-label">{meta.total_sources} live sources</span>}
          <div className="live-badge">
            <div className="live-dot" />
            Live
          </div>
          <button className={`refresh-btn ${loading ? "spinning" : ""}`} onClick={fetchStories} disabled={loading}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span className="refresh-label">{loading ? "Fetching…" : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <div className={`sidebar-wrapper ${mobileView === "list" ? "mobile-visible" : "mobile-hidden"}`}>
        <Sidebar stories={stories} activeId={active?.id ?? null} onSelect={handleSelectStory} meta={meta} loading={loading} />
      </div>

      {/* ── Main panel ── */}
      <main ref={mainRef} className={`main-panel ${mobileView === "article" ? "mobile-visible" : "mobile-hidden"}`}>
        <button className="mobile-back-btn" onClick={() => setMobileView("list")}>← Stories</button>

        {/* Cinematic loader */}
        {loading && stories.length === 0 && (
          <div className="cinematic-loader">
            <div className="loader-masthead">
              <div className="loader-title">The <span>Dispatch</span></div>
              <div className="loader-rule" />
            </div>
            <div className="loader-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="loading-cell" />
              ))}
            </div>
            <div className="loader-step">{LOADER_STEPS[loaderStep]}</div>
            <div className="loader-progress-track">
              <div
                className="loader-progress-fill"
                style={{ width: `${((loaderStep + 1) / LOADER_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="loader-footnote">
              Powered by Claude AI · Sourced from live newswires
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <div className="error-title">⚠ System Error</div>
            <div className="error-msg">{error}</div>
          </div>
        )}

        {/* Branded landing — no story selected yet */}
        {!loading && !error && stories.length === 0 && (
          <div className="landing-state">
            <div className="landing-title">The <span>Dispatch</span></div>
            <div className="landing-rule" />
            <p className="landing-body">
              An AI-native newsroom. Real sources, real facts, structured journalism.
              <br />No spin. No filler. Just the brief.
            </p>
            <button className="landing-btn" onClick={fetchStories}>
              Begin Today&apos;s Briefing →
            </button>
          </div>
        )}

        {/* Story selected but loading refresh — show article with overlay */}
        {loading && stories.length > 0 && active && (
          <div className="refresh-overlay">
            <div className="loading-text">Refreshing sources…</div>
          </div>
        )}

        {active && <Article story={active} />}

        {active && (
          <button className="mobile-insights-btn" onClick={() => setMobileView("insights")}>
            View Analysis →
          </button>
        )}

        {stories.length > 1 && active && (
          <div className="keyboard-hint">↑ ↓ or J / K to navigate stories</div>
        )}
      </main>

      {/* ── Insights panel ── */}
      <div className={`insights-wrapper ${mobileView === "insights" ? "mobile-visible" : "mobile-hidden"}`}>
        <button className="mobile-back-btn insights-back" onClick={() => setMobileView("article")}>← Article</button>
        <InsightsPanel story={active} meta={meta} allStories={stories} />
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        <button className={`mobile-nav-btn ${mobileView === "list" ? "active" : ""}`} onClick={() => setMobileView("list")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
          </svg>
          Stories
          {stories.length > 0 && <span className="nav-count">{stories.length}</span>}
        </button>
        <button className={`mobile-nav-btn ${mobileView === "article" ? "active" : ""}`} onClick={() => active && setMobileView("article")} disabled={!active}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Article
          {active && readProgress > 0 && <span className="nav-progress">{readProgress}%</span>}
        </button>
        <button className={`mobile-nav-btn ${mobileView === "insights" ? "active" : ""}`} onClick={() => active && setMobileView("insights")} disabled={!active}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Analysis
        </button>
      </nav>
    </div>
  );
}
