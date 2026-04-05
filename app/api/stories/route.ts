export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return NextResponse.json({ headlines: [] });

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/top-headlines?lang=en&max=10&apikey=${key}`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ headlines: [] });
    const data = await res.json();
    const headlines = (data.articles ?? []).map((a: {
      title: string; source: { name: string }; url: string; publishedAt: string;
    }) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));
    return NextResponse.json({ headlines });
  } catch {
    return NextResponse.json({ headlines: [] });
  }
}
