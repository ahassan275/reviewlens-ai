import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { getSession } from "@/lib/review-store";
import { buildSystemPrompt } from "@/lib/prompts";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = getSession(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found. Please ingest reviews first." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(
      session.reviews,
      session.sourceName
    );

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Chat error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
