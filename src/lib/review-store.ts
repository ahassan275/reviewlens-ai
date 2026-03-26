import { Review, ReviewSession, ReviewStats } from "@/types/review";
import { v4 as uuidv4 } from "uuid";

// Use globalThis to persist across hot reloads and module instances in dev
const globalForStore = globalThis as unknown as {
  __reviewSessions?: Map<string, ReviewSession>;
};

if (!globalForStore.__reviewSessions) {
  globalForStore.__reviewSessions = new Map<string, ReviewSession>();
}

const sessions = globalForStore.__reviewSessions;

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

export function createSession(
  reviews: Review[],
  sourceUrl?: string,
  sourceName?: string
): ReviewSession {
  const id = uuidv4();
  const session: ReviewSession = {
    id,
    reviews,
    sourceUrl,
    sourceName,
    createdAt: new Date().toISOString(),
    stats: computeStats(reviews),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): ReviewSession | undefined {
  return sessions.get(id);
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}
