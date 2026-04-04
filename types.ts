export interface Story {
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

export interface StoriesResponse {
  stories: Story[];
  meta: {
    total_sources: number;
    generated_at: string;
    story_count: number;
  };
}
