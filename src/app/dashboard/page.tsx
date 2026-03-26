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
              : "text-slate-200"
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
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                ReviewLens AI
              </span>
            </Link>
            <Badge variant="secondary">{sourceName}</Badge>
          </div>
          <Link href={`/chat?sessionId=${sessionId}`}>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" /> Ask AI Questions
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Scraping Summary
          </h2>
          <p className="text-slate-600">
            {stats.totalReviews} reviews from {sourceName}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Users className="h-4 w-4" /> Total Reviews
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {stats.totalReviews}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Star className="h-4 w-4" /> Average Rating
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">
                  {stats.avgRating}
                </p>
                <span className="text-slate-400">/ 5</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Positive
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {stats.totalReviews > 0
                  ? Math.round(
                      (stats.sentimentBreakdown.positive /
                        stats.totalReviews) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" /> Negative
              </div>
              <p className="text-3xl font-bold text-red-600">
                {stats.totalReviews > 0
                  ? Math.round(
                      (stats.sentimentBreakdown.negative /
                        stats.totalReviews) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Rating Distribution */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const pct = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0;
                return (
                  <button
                    key={rating}
                    onClick={() =>
                      setRatingFilter(ratingFilter === rating ? null : rating)
                    }
                    className={`w-full flex items-center gap-2 text-sm rounded-md px-2 py-1 transition-colors ${
                      ratingFilter === rating
                        ? "bg-indigo-50 ring-1 ring-indigo-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-8 text-right font-medium">
                      {rating}
                      <Star className="h-3 w-3 inline ml-0.5 -mt-0.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          rating >= 4
                            ? "bg-emerald-500"
                            : rating === 3
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Sentiment Breakdown */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "Positive",
                  value: stats.sentimentBreakdown.positive,
                  icon: TrendingUp,
                  color: "text-emerald-600",
                  bg: "bg-emerald-100",
                  desc: "4-5 stars",
                },
                {
                  label: "Neutral",
                  value: stats.sentimentBreakdown.neutral,
                  icon: Minus,
                  color: "text-amber-600",
                  bg: "bg-amber-100",
                  desc: "3 stars",
                },
                {
                  label: "Negative",
                  value: stats.sentimentBreakdown.negative,
                  icon: TrendingDown,
                  color: "text-red-600",
                  bg: "bg-red-100",
                  desc: "1-2 stars",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg ${item.bg} flex items-center justify-center`}
                  >
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-slate-900">
                        {item.label}
                      </span>
                      <span className={`text-lg font-bold ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  {stats.dateRange.earliest} to {stats.dateRange.latest}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Top Keywords</CardTitle>
              <CardDescription>
                Most mentioned terms across reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <Badge
                    key={kw.word}
                    variant="secondary"
                    className="cursor-pointer hover:bg-indigo-100"
                    onClick={() => setSearchQuery(kw.word)}
                  >
                    {kw.word}
                    <span className="ml-1 text-xs text-slate-400">
                      {kw.count}
                    </span>
                  </Badge>
                ))}
                {keywords.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Not enough data for keywords
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">All Reviews</CardTitle>
                <CardDescription>
                  {filteredReviews.length} of {stats.totalReviews} reviews
                  {ratingFilter !== null && ` (${ratingFilter}-star filter)`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Rating</TableHead>
                    <TableHead className="w-32">Reviewer</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="w-28">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.slice(0, 50).map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {review.reviewer}
                      </TableCell>
                      <TableCell>
                        <div>
                          {review.title && (
                            <p className="font-medium text-sm text-slate-900">
                              {review.title}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {review.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {review.date || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReviews.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-slate-500"
                      >
                        No reviews match your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredReviews.length > 50 && (
              <p className="text-sm text-slate-500 mt-4 text-center">
                Showing 50 of {filteredReviews.length} reviews
              </p>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link href={`/chat?sessionId=${sessionId}`}>
            <Button size="lg">
              <MessageSquare className="mr-2 h-5 w-5" />
              Ask AI About These Reviews
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
