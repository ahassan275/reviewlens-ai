import { NextRequest, NextResponse } from "next/server";
import { parseCsvText } from "@/lib/csv-parser";
import { scrapeTrustpilot } from "@/lib/scraper";
import { createSession } from "@/lib/review-store";
import { Review } from "@/types/review";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, url, csvText, sampleData } = body;

    let reviews: Review[] = [];
    let sourceUrl: string | undefined;
    let sourceName: string | undefined;

    if (type === "url") {
      if (!url || typeof url !== "string") {
        return NextResponse.json(
          { error: "Please provide a valid Trustpilot URL" },
          { status: 400 }
        );
      }

      // Validate it looks like a Trustpilot URL
      const normalizedUrl = url.trim().toLowerCase();
      if (!normalizedUrl.includes("trustpilot.com")) {
        return NextResponse.json(
          {
            error:
              "Please provide a Trustpilot URL (e.g., https://www.trustpilot.com/review/example.com)",
          },
          { status: 400 }
        );
      }

      const result = await scrapeTrustpilot(url);
      reviews = result.reviews;
      sourceUrl = url;
      sourceName = result.sourceName;

      if (reviews.length === 0) {
        return NextResponse.json(
          {
            error:
              "No reviews could be extracted from this URL. The page structure may have changed, or the company may not have reviews. Try using CSV upload instead.",
          },
          { status: 422 }
        );
      }
    } else if (type === "csv") {
      if (!csvText || typeof csvText !== "string") {
        return NextResponse.json(
          { error: "Please provide CSV data" },
          { status: 400 }
        );
      }

      reviews = parseCsvText(csvText);
      sourceName = "CSV Import";

      if (reviews.length === 0) {
        return NextResponse.json(
          {
            error:
              "No reviews could be parsed from the CSV. Ensure your CSV has columns like: reviewer, rating, title, body, date",
          },
          { status: 422 }
        );
      }
    } else if (type === "sample") {
      // Load sample data
      if (!sampleData || !Array.isArray(sampleData)) {
        return NextResponse.json(
          { error: "Invalid sample data" },
          { status: 400 }
        );
      }

      reviews = sampleData.map(
        (r: { reviewer: string; rating: number; title: string; body: string; date: string }) => ({
          id: uuidv4(),
          reviewer: r.reviewer,
          rating: r.rating,
          title: r.title,
          body: r.body,
          date: r.date,
          source: "csv" as const,
        })
      );
      sourceName = "Sample Product Reviews";
    } else {
      return NextResponse.json(
        { error: "Invalid ingestion type. Use 'url', 'csv', or 'sample'." },
        { status: 400 }
      );
    }

    const session = createSession(reviews, sourceUrl, sourceName);

    return NextResponse.json({
      sessionId: session.id,
      reviewCount: session.reviews.length,
      sourceName: session.sourceName,
      stats: session.stats,
    });
  } catch (err) {
    console.error("Ingestion error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
