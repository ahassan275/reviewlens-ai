import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/review-store";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  const session = await getSession(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: "Session not found. Please ingest reviews first." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    reviews: session.reviews,
    stats: session.stats,
    sourceName: session.sourceName,
    sourceUrl: session.sourceUrl,
    createdAt: session.createdAt,
  });
}
