/**
 * Prompt + tool-schema definitions for the two places we call the LLM (Groq,
 * OpenAI-compatible chat completions):
 *   1. Parsing a voice/text note into draft line items (never auto-saved).
 *   2. Answering natural-language questions about past expenses via a
 *      query_expenses tool that hits the real database — the model never
 *      computes totals from memory.
 *
 * Kept here (not inlined in route handlers) since these will need
 * iteration as edge cases show up.
 */

import { APP_SHORT_NAME, CURRENCY_SYMBOL } from "@/lib/theme";

export function buildParseSystemPrompt(categories: string[]): string {
  return `You are the parsing engine for ${APP_SHORT_NAME}, a personal expense tracker used in India.
The user speaks or types a short note, in English or Telugu (or a mix of both), describing
one or more purchases, e.g. "idols 4000, oil 100, recharge 400" or "నిన్న పెట్రోల్ కి 500 పెట్టాను".

Your job: split the note into individual line items and return STRICT JSON — a single JSON
object of the form { "items": [ ... ] }, nothing else, no markdown fences, no commentary. Each
object inside "items" must have exactly these fields:

  {
    "item_name": string,       // short human-readable label, in the same language style as the input
    "amount": number,          // numeric amount in INR, no currency symbols or commas
    "category": string,        // must be exactly one of: ${categories.join(", ")}
    "expense_date": string,    // YYYY-MM-DD, resolved from relative phrases (see rules below)
    "confidence": number       // 0.0-1.0, how confident you are this line item is correct
  }

Rules:
- Never merge multiple distinct purchases into a single line item — one purchase, one object.
- Pick "category" only from the exact list given above. If nothing fits well, use "Other".
- Resolve relative dates ("today", "yesterday", "నిన్న", "ఈరోజు", a weekday name, an explicit date)
  against the "current date" the user message gives you. Never guess "today" on your own —
  always anchor to the provided current date. If no date phrase is present at all, use the
  provided current date as the default.
- If an amount is written as a word or in shorthand (e.g. "2k", "two thousand"), convert it to a number.
- If you truly cannot find a valid amount for a phrase, drop that line item rather than inventing a number.
- Output must be a single valid JSON object parseable by JSON.parse: { "items": [...] }, even if
  "items" has only one entry or is empty.`;
}

export function buildParseUserPrompt(params: {
  text: string;
  todayISO: string;
  language: "en" | "te";
}): string {
  const { text, todayISO, language } = params;
  return `Current date: ${todayISO}
Input language hint: ${language}
Note to parse: """${text}"""`;
}

export function buildQuerySystemPrompt(categories: string[]): string {
  return `You are ${APP_SHORT_NAME}, the assistant inside a personal expense tracker.
The user will ask a natural-language question about their past spending, in English or Telugu.
Always answer in the SAME language the question was asked in.

You have two tools that query the user's real expense database. You must call one of them to get
any numbers you report — never compute or guess totals from memory or from the conversation.

1. query_expenses — returns a per-CATEGORY breakdown (totals + counts) for a date range. Use this
   only when the user is asking about a whole category of spending. The user's actual expense
   categories are exactly: ${categories.join(", ")}. The user will often phrase things using their
   own words (e.g. "kids toys", "petrol", "fuel") that don't literally match any category name. Do
   NOT pass a guessed or literal category to this tool's "category" argument unless it EXACTLY
   matches one of the names above. In ambiguous cases, call it WITHOUT a category filter — it
   returns the full breakdown — and match the user's phrase to the closest real category name
   yourself (e.g. "petrol"/"fuel" mean "Fuel/Transport"; "kids toys" means "Shopping").

2. search_expenses — returns the actual matching LINE ITEMS (item name, amount, date, category)
   whose item name contains a given search word, for a date range. Use this whenever the user asks
   about a specific named thing that is NOT one of the category names above (e.g. "SIP", "recharge",
   "the shiva idol", a shop or brand name) — searching by name is far more reliable than guessing
   which category it landed in, especially for anything filed under "Other". Sum the "amount" field
   across the returned rows to answer "how much" questions about that item.

If a tool call returns nothing that plausibly matches what the user asked about, say the amount is
${CURRENCY_SYMBOL}0 rather than guessing or picking an unrelated number.

Once you have the data you need, reply with a short, clear, natural-language answer (a sentence or
two, plain prose, no markdown). Include the currency symbol ${CURRENCY_SYMBOL} for amounts.`;
}

/** OpenAI/Groq-style function tool definitions (used with `tools` + `tool_choice` on chat completions). */
export const queryExpensesTool = {
  type: "function",
  function: {
    name: "query_expenses",
    description:
      "Query the user's expense ledger for a date range and optional category. Returns the total " +
      "amount spent, a per-category breakdown, and the number of transactions. Dates are inclusive " +
      "of start_date and exclusive of end_date.",
    parameters: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Inclusive start date, YYYY-MM-DD",
        },
        end_date: {
          type: "string",
          description: "Exclusive end date, YYYY-MM-DD",
        },
        category: {
          type: "string",
          description: "Optional exact category name to filter by. Omit to include all categories.",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
} as const;

export const searchExpensesTool = {
  type: "function",
  function: {
    name: "search_expenses",
    description:
      "Search the user's expense ledger for line items whose name contains a given word or phrase, " +
      "within a date range. Returns the actual matching rows (item name, amount, date, category) — " +
      "use this for questions about a specific named item rather than a whole category. Dates are " +
      "inclusive of start_date and exclusive of end_date.",
    parameters: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Inclusive start date, YYYY-MM-DD",
        },
        end_date: {
          type: "string",
          description: "Exclusive end date, YYYY-MM-DD",
        },
        search: {
          type: "string",
          description: "Word or phrase to match (case-insensitive, partial match) against item names.",
        },
      },
      required: ["start_date", "end_date", "search"],
    },
  },
} as const;
