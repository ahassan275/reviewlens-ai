import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import { Review } from "@/types/review";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "review" && pathParts[1]) {
      return pathParts[1];
    }
    return parsed.hostname;
  } catch {
    return url;
  }
}

function parseReviewDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function parseReviewsFromHtml(html: string): Review[] {
  const $ = cheerio.load(html);
  const reviews: Review[] = [];
  const seen = new Set<string>();

  // Trustpilot uses data-service-review-card-paper on article elements
  $("article[data-service-review-card-paper]").each((_, el) => {
    const $el = $(el);

    // Rating: first try the data attribute on the review header div
    let rating = 0;
    const ratingDiv = $el.find("[data-service-review-rating]");
    if (ratingDiv.length) {
      rating = parseInt(ratingDiv.attr("data-service-review-rating") || "0");
    }
    // Fallback: parse from star image alt text "Rated X out of 5 stars"
    if (!rating) {
      const starImg = $el.find("img[alt*='Rated']").first();
      const altText = starImg.attr("alt") || "";
      const match = altText.match(/Rated\s+(\d)\s+out/);
      if (match) rating = parseInt(match[1]);
    }

    // Reviewer name from data-consumer-name-typography
    const reviewer =
      $el.find("[data-consumer-name-typography]").first().text().trim() ||
      "Anonymous";

    // Title from data-service-review-title-typography
    const title = $el
      .find("[data-service-review-title-typography]")
      .first()
      .text()
      .trim();

    // Body from data-service-review-text-typography
    let body = $el
      .find("[data-service-review-text-typography]")
      .first()
      .text()
      .trim();

    // Some cards use data-relevant-review-text-typography instead
    if (!body) {
      body = $el
        .find("[data-relevant-review-text-typography]")
        .first()
        .text()
        .trim();
    }

    // Date from time element with data-service-review-date-time-ago
    const dateEl = $el
      .find("time[data-service-review-date-time-ago]")
      .first();
    const date = parseReviewDate(dateEl.attr("datetime"));

    // Deduplicate by body text (carousel and main list may overlap)
    const dedupeKey = `${reviewer}:${(body || title).slice(0, 50)}`;

    if ((body || title) && !seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      reviews.push({
        id: uuidv4(),
        reviewer,
        rating: rating || 3,
        title,
        body: body || title,
        date,
        source: "trustpilot",
      });
    }
  });

  return reviews;
}

export async function scrapeTrustpilot(
  url: string,
  maxPages: number = 3
): Promise<{ reviews: Review[]; sourceName: string }> {
  const domain = extractDomain(url);
  const baseUrl = `https://www.trustpilot.com/review/${domain}`;
  const allReviews: Review[] = [];

  // First fetch to get page 1 and company name
  let firstPageHtml = "";

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
    try {
      const html = await fetchPage(pageUrl);
      if (page === 1) firstPageHtml = html;

      const pageReviews = parseReviewsFromHtml(html);
      console.log(
        `[Scraper] Page ${page}: found ${pageReviews.length} reviews`
      );

      if (pageReviews.length === 0 && page > 1) break;
      allReviews.push(...pageReviews);

      if (page < maxPages) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(`[Scraper] Error fetching page ${page}:`, err);
      if (page === 1) throw err;
      break;
    }
  }

  // Extract company name from page title
  let sourceName = domain;
  if (firstPageHtml) {
    const $ = cheerio.load(firstPageHtml);
    const pageTitle = $("title").text().trim();
    const nameMatch = pageTitle.match(
      /(.+?)(?:\s*Reviews|\s*\||\s*-\s*Trustpilot)/
    );
    if (nameMatch) sourceName = nameMatch[1].trim();
  }

  return { reviews: allReviews, sourceName };
}
