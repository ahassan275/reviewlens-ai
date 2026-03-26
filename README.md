# ReviewLens AI

A web-based Review Intelligence Portal that ingests customer reviews from Trustpilot (or CSV) and provides AI-powered Q&A analysis with strict scope guardrails.

Built for the FutureSight Technical Take-Home Assignment.

## Live Demo

> **[Link to deployed app]** — _Add after deploying to Vercel_

## Features

### 1. Review Ingestion
- **Trustpilot URL scraping** — Paste a Trustpilot business URL to automatically extract reviews
- **CSV upload** — Upload or paste CSV data with flexible column mapping
- **Sample data** — One-click demo with 30 pre-loaded reviews for instant exploration

### 2. Scraping Summary Dashboard
- Total reviews, average rating, date range
- Rating distribution bar chart (interactive — click to filter)
- Sentiment breakdown (positive/neutral/negative)
- Top keywords extracted from review text
- Searchable, filterable reviews table

### 3. Guardrailed Q&A Chat
- Natural language questions about ingested reviews
- **Scope Guard** — AI strictly refuses off-topic questions (external platforms, general knowledge, weather, etc.) with a clear message
- Streaming responses with markdown formatting
- Suggested starter questions
- Visual "Scope Guard" badge when the AI declines a question

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| LLM | Google Gemini 1.5 Flash (free tier) |
| Streaming | Vercel AI SDK |
| Scraping | Cheerio (server-side HTML parsing) |
| CSV Parsing | PapaParse |
| Hosting | Vercel (free Hobby tier) |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Landing     │────>│  /api/ingest │────>│  In-Memory │
│  (URL/CSV)   │     │  (scrape/    │     │  Session   │
│              │     │   parse)     │     │  Store     │
└─────────────┘     └──────────────┘     └─────┬──────┘
                                               │
┌─────────────┐     ┌──────────────┐           │
│  Dashboard   │<───│ /api/reviews │<──────────┤
│  (stats,     │     └──────────────┘           │
│   table)     │                               │
└─────────────┘     ┌──────────────┐           │
                    │  /api/chat   │<──────────┘
┌─────────────┐     │  (Gemini +   │
│  Chat Q&A   │<───│   scope      │
│  (streaming) │     │   guard)    │
└─────────────┘     └──────────────┘
```

- **Monorepo**: Single Next.js project — API routes serve as backend, React components as frontend
- **In-memory store**: Reviews are stored in a server-side Map keyed by session ID (sufficient for demo; a database would be used in production)
- **Scope guard**: Enforced primarily through the system prompt — the LLM receives all review data and strict instructions to refuse any off-topic queries

## Getting Started

### Prerequisites
- Node.js 20+
- A Google Gemini API key ([free from ai.google.dev](https://ai.google.dev/))

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd reviewlens-ai

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local and add your GOOGLE_GENERATIVE_AI_API_KEY

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deployment (Vercel)

1. Push to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `GOOGLE_GENERATIVE_AI_API_KEY` as an environment variable
4. Deploy

## Assumptions & Design Decisions

1. **Trustpilot as primary platform** — Server-rendered HTML makes it scrape-able without a headless browser. CSV fallback handles cases where scraping is blocked.

2. **In-memory storage** — For a demo/prototype, server-side Map is sufficient. In production, this would be Redis or a database.

3. **Scope guard via system prompt** — The assignment states this should be "primarily driven by your system prompt configuration." The system prompt includes explicit rules, refusal templates, and all review data in context.

4. **Google Gemini Flash** — Selected for its generous free tier (1M tokens/day, 15 RPM) and large context window (1M tokens), which allows injecting all reviews directly into the system prompt.

5. **No authentication** — As required by the assignment constraints.

6. **Streaming responses** — The chat uses server-sent text streaming for real-time response display.

## What I'd Do Differently With More Time

- Database-backed storage (PostgreSQL/Redis) for persistence
- Embeddings-based RAG for better context retrieval on large review sets
- More review platforms (Amazon, G2, Google Maps)
- Automated scope guard testing suite
- Export functionality (PDF reports, CSV export of analysis)
- Rate limiting and abuse protection
- Review pagination for very large datasets
