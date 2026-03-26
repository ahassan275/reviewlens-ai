import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { Review } from "@/types/review";

interface CsvRow {
  reviewer?: string;
  author?: string;
  name?: string;
  rating?: string | number;
  stars?: string | number;
  score?: string | number;
  title?: string;
  heading?: string;
  subject?: string;
  body?: string;
  review?: string;
  text?: string;
  content?: string;
  date?: string;
  created?: string;
  posted?: string;
  [key: string]: string | number | undefined;
}

function findField(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key] ?? row[key.toLowerCase()];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

function parseRating(val: string): number {
  const num = parseFloat(val);
  if (isNaN(num)) return 3;
  return Math.min(5, Math.max(1, Math.round(num)));
}

export function parseCsvText(csvText: string): Review[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .map((row): Review | null => {
      const body = findField(row, "body", "review", "text", "content", "comment");
      if (!body) return null;

      return {
        id: uuidv4(),
        reviewer: findField(row, "reviewer", "author", "name", "user", "username") || "Anonymous",
        rating: parseRating(findField(row, "rating", "stars", "score")),
        title: findField(row, "title", "heading", "subject", "summary"),
        body,
        date: findField(row, "date", "created", "posted", "created_at", "date_posted"),
        source: "csv",
      };
    })
    .filter((r): r is Review => r !== null);
}
