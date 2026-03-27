"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Star,
  MessageSquare,
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Calendar,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Review, ReviewStats } from "@/types/review";

interface ReviewData {
  reviews: Review[];
  stats: ReviewStats;
  sourceName: string;
  sourceUrl?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

function extractKeywords(reviews: Review[]): { word: string; count: number }[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "its", "this", "that", "was",
    "are", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "can", "i", "my",
    "me", "we", "our", "you", "your", "they", "them", "their", "he", "she",
    "his", "her", "not", "no", "so", "if", "as", "up", "out", "about",
    "just", "very", "really", "also", "more", "than", "only", "when", "what",
    "all", "been", "after", "into", "some", "get", "got", "one", "two",
    "much", "even", "well", "don", "didn", "doesn", "won", "isn", "wasn",
    "were", "which", "there", "then", "how", "any", "other", "over", "too",
    "back", "like", "im", "ive", "its",
  ]);

  const counts: Record<string, number> = {};
  for (const review of reviews) {
    const text = `${review.title} ${review.body}`.toLowerCase();
    const words = text.match(/[a-z]{3,}/g) || [];
    const seen = new Set<string>();
    for (const word of words) {
      if (!stopWords.has(word) && !seen.has(word)) {
        seen.add(word);
        counts[word] = (counts[word] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .filter((k) => k.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

export default function DashboardPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");

  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    fetch(`/api/reviews?sessionId=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  const keywords = useMemo(
    () => (data ? extractKeywords(data.reviews) : []),
    [data]
  );

  const filteredReviews = useMemo(() => {
    if (!data) return [];
    let reviews = data.reviews;
    if (ratingFilter !== null) {
      reviews = reviews.filter((r) => r.rating === ratingFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      reviews = reviews.filter(
        (r) =>
          r.body.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.reviewer.toLowerCase().includes(q)
      );
    }
    return reviews;
  }, [data, ratingFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Session not found"}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </Link>
      </div>
    );
  }

  const { stats, sourceName } = data;
  const maxDistCount = Math.max(...Object.values(stats.ratingDistribution));

  return (
    <div className="min-h-screen bg-background bg-dots bg-grain">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                ReviewLens<span className="text-emerald-600">.</span>
              </span>
            </Link>
            <Badge variant="secondary" className="font-semibold">{sourceName}</Badge>
          </div>
          <Link href={`/chat?sessionId=${sessionId}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <MessageSquare className="mr-2 h-4 w-4" /> Ask AI Questions
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 animate-fade-up">
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Scraping Summary
          </h2>
          <p className="text-muted-foreground mt-1">
            {stats.totalReviews} reviews from{" "}
            <span className="font-semibold text-foreground">{sourceName}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <Card className="border-border/60 overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <Users className="h-3.5 w-3.5" /> Total Reviews
              </div>
              <p className="text-4xl font-black text-foreground tabular-nums">
                {stats.totalReviews}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 overflow-hidden">
            <div className="h-1 bg-amber-400" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <Star className="h-3.5 w-3.5" /> Avg Rating
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-4xl font-black text-foreground tabular-nums">
                  {stats.avgRating}
                </p>
                <span className="text-muted-foreground text-sm font-medium">/ 5</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 overflow-hidden">
            <div className="h-1 bg-emerald-400" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Positive
              </div>
              <p className="text-4xl font-black text-emerald-600 tabular-nums">
                {stats.totalReviews > 0
                  ? Math.round(
                      (stats.sentimentBreakdown.positive /
                        stats.totalReviews) *
                        100
                    )
                  : 0}
                <span className="text-2xl">%</span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 overflow-hidden">
            <div className="h-1 bg-red-400" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Negative
              </div>
              <p className="text-4xl font-black text-red-600 tabular-nums">
                {stats.totalReviews > 0
                  ? Math.round(
                      (stats.sentimentBreakdown.negative /
                        stats.totalReviews) *
                        100
                    )
                  : 0}
                <span className="text-2xl">%</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {/* Rating Distribution */}
          <Card className="md:col-span-1 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const pct = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0;
                return (
                  <button
                    key={rating}
                    onClick={() =>
                      setRatingFilter(ratingFilter === rating ? null : rating)
                    }
                    className={`w-full flex items-center gap-2.5 text-sm rounded-lg px-2.5 py-1.5 transition-all duration-150 ${
                      ratingFilter === rating
                        ? "bg-emerald-50 ring-2 ring-emerald-300"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="w-8 text-right font-bold tabular-nums text-foreground/80">
                      {rating}
                      <Star className="h-3 w-3 inline ml-0.5 -mt-0.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md transition-all duration-500 ${
                          rating >= 4
                            ? "bg-emerald-500"
                            : rating === 3
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground font-semibold tabular-nums text-xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Sentiment Breakdown */}
          <Card className="md:col-span-1 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "Positive",
                  value: stats.sentimentBreakdown.positive,
                  icon: TrendingUp,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 border border-emerald-100",
                  desc: "4-5 stars",
                },
                {
                  label: "Neutral",
                  value: stats.sentimentBreakdown.neutral,
                  icon: Minus,
                  color: "text-amber-600",
                  bg: "bg-amber-50 border border-amber-100",
                  desc: "3 stars",
                },
                {
                  label: "Negative",
                  value: stats.sentimentBreakdown.negative,
                  icon: TrendingDown,
                  color: "text-red-600",
                  bg: "bg-red-50 border border-red-100",
                  desc: "1-2 stars",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}
                  >
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-foreground text-sm">
                        {item.label}
                      </span>
                      <span className={`text-xl font-black tabular-nums ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  {stats.dateRange.earliest} to {stats.dateRange.latest}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card className="md:col-span-1 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Top Keywords</CardTitle>
              <CardDescription className="text-xs">
                Most mentioned terms across reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <button
                    key={kw.word}
                    onClick={() => setSearchQuery(kw.word)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg bg-muted hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 transition-all duration-150"
                  >
                    {kw.word}
                    <span className="text-[10px] font-bold text-muted-foreground bg-background rounded px-1">
                      {kw.count}
                    </span>
                  </button>
                ))}
                {keywords.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Not enough data for keywords
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card className="border-border/60 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">All Reviews</CardTitle>
                <CardDescription className="mt-1">
                  {filteredReviews.length} of {stats.totalReviews} reviews
                  {ratingFilter !== null && ` (${ratingFilter}-star filter)`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                {(ratingFilter !== null || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRatingFilter(null);
                      setSearchQuery("");
                    }}
                    className="text-muted-foreground"
                  >
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-24 font-bold text-xs uppercase tracking-wide">Rating</TableHead>
                    <TableHead className="w-32 font-bold text-xs uppercase tracking-wide">Reviewer</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wide">Review</TableHead>
                    <TableHead className="w-28 font-bold text-xs uppercase tracking-wide">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.slice(0, 50).map((review) => (
                    <TableRow key={review.id} className="hover:bg-muted/30">
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell className="font-semibold text-sm text-foreground/80">
                        {review.reviewer}
                      </TableCell>
                      <TableCell>
                        <div>
                          {review.title && (
                            <p className="font-semibold text-sm text-foreground mb-0.5">
                              {review.title}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {review.date || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReviews.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No reviews match your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredReviews.length > 50 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 50 of {filteredReviews.length} reviews
              </p>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center animate-fade-up" style={{ animationDelay: "200ms" }}>
          <Link href={`/chat?sessionId=${sessionId}`}>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base h-13 px-8 shadow-lg shadow-emerald-600/20 btn-press">
              <MessageSquare className="mr-2 h-5 w-5" />
              Ask AI About These Reviews
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer accent line */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
    </div>
  );
}
