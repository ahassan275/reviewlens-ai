import { put, del, get } from "@vercel/blob";
import { Review, ReviewSession, ReviewStats } from "@/types/review";
import { v4 as uuidv4 } from "uuid";

export function computeStats(reviews: Review[]): ReviewStats {
  const ratings = reviews.map((r) => r.rating);
  const dates = reviews
    .map((r) => r.date)
    .filter(Boolean)
    .sort();

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    const rounded = Math.round(Math.min(5, Math.max(1, r)));
    distribution[rounded] = (distribution[rounded] || 0) + 1;
  }

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;

  return {
    totalReviews: reviews.length,
    avgRating:
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0,
    ratingDistribution: distribution,
    dateRange: {
      earliest: dates[0] || "N/A",
      latest: dates[dates.length - 1] || "N/A",
    },
    sentimentBreakdown: {
      positive,
      neutral,
      negative,
    },
  };
}

export async function createSession(
  reviews: Review[],
  sourceUrl?: string,
  sourceName?: string
): Promise<ReviewSession> {
  const id = uuidv4();
  const session: ReviewSession = {
    id,
    reviews,
    sourceUrl,
    sourceName,
    createdAt: new Date().toISOString(),
    stats: computeStats(reviews),
  };

  await put(`sessions/${id}.json`, JSON.stringify(session), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  return session;
}

export async function getSession(id: string): Promise<ReviewSession | null> {
  try {
    const pathname = `sessions/${id}.json`;
    const blob = await get(pathname, {
      access: "private",
      useCache: false,
    });

    if (!blob) return null;

    const text = await new Response(blob.stream).text();
    return JSON.parse(text) as ReviewSession;
  } catch (error) {
    console.error("Failed to load review session", { id, error });
    return null;
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await del(`sessions/${id}.json`);
  } catch {
    // ignore
  }
}
