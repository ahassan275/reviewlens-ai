export interface Review {
  id: string;
  reviewer: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  source: "trustpilot" | "csv";
}

export interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
  dateRange: { earliest: string; latest: string };
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface ReviewSession {
  id: string;
  reviews: Review[];
  sourceUrl?: string;
  sourceName?: string;
  createdAt: string;
  stats: ReviewStats;
}
