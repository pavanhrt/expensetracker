import {
  buildParseSystemPrompt,
  buildParseUserPrompt,
  buildQuerySystemPrompt,
  queryExpensesTool,
  searchExpensesTool,
} from "./prompts";
import { GROQ_CHAT_ENDPOINT, GROQ_LLM_MODEL, LLM_MAX_TOOL_TURNS, LLM_TEMPERATURE } from "@/lib/config";
import type { DraftLineItem, Language } from "@/types";

// Free-tier Groq chat completions (OpenAI-compatible), same account as the
// speech-to-text provider — no Anthropic credits required. Endpoint, model,
// and tuning are centralized in src/lib/config.ts (env-overridable); must
// support tool calling for /api/query if you swap GROQ_LLM_MODEL.

function apiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not set — add it to .env.local (get a free key at https://console.groq.com/keys)"
    );
  }
  return key;
}

async function groqChat(body: Record<string, unknown>): Promise<any> {
  const res = await fetch(GROQ_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ model: GROQ_LLM_MODEL, ...body }),
  });
  if (!res.ok) {
    throw new Error(`Groq chat request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Parse a raw voice/text note into draft line items. Never saves anything. */
export async function parseExpenseNote(params: {
  text: string;
  categories: string[];
  todayISO: string;
  language: Language;
}): Promise<DraftLineItem[]> {
  const { text, categories, todayISO, language } = params;

  const data = await groqChat({
    messages: [
      { role: "system", content: buildParseSystemPrompt(categories) },
      { role: "user", content: buildParseUserPrompt({ text, todayISO, language }) },
    ],
    response_format: { type: "json_object" },
    temperature: LLM_TEMPERATURE,
  });

  const raw: string | undefined = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Groq did not return a response for parsing");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Could not parse Groq's response as JSON: " + raw.slice(0, 200));
  }

  const items = Array.isArray(parsed) ? parsed : (parsed as any)?.items;
  if (!Array.isArray(items)) {
    throw new Error("Expected an 'items' array from Groq");
  }

  return items
    .filter((item): item is DraftLineItem => {
      return (
        item &&
        typeof item.item_name === "string" &&
        typeof item.amount === "number" &&
        item.amount > 0 &&
        typeof item.category === "string" &&
        typeof item.expense_date === "string"
      );
    })
    .map((item) => ({
      item_name: item.item_name,
      amount: item.amount,
      category: categories.includes(item.category) ? item.category : "Other",
      expense_date: item.expense_date,
      confidence: typeof item.confidence === "number" ? item.confidence : 0.7,
    }));
}

export type QueryExpensesFn = (args: {
  start_date: string;
  end_date: string;
  category?: string;
}) => Promise<{
  total: number;
  count: number;
  by_category: { category: string; total: number; count: number }[];
}>;

export type SearchExpensesFn = (args: {
  start_date: string;
  end_date: string;
  search: string;
}) => Promise<{
  items: { item_name: string; amount: number; expense_date: string; category: string }[];
}>;

/** Runs the tool-use loop for a natural-language question about past spending. */
export async function answerExpenseQuery(params: {
  question: string;
  language: Language;
  todayISO: string;
  categories: string[];
  runQuery: QueryExpensesFn;
  runSearch: SearchExpensesFn;
}): Promise<string> {
  const { question, language, todayISO, categories, runQuery, runSearch } = params;

  const messages: any[] = [
    { role: "system", content: buildQuerySystemPrompt(categories) },
    {
      role: "user",
      content: `Current date: ${todayISO}\nQuestion language: ${language}\nQuestion: ${question}`,
    },
  ];

  for (let turn = 0; turn < LLM_MAX_TOOL_TURNS; turn++) {
    const data = await groqChat({
      messages,
      tools: [queryExpensesTool, searchExpensesTool],
      tool_choice: "auto",
      temperature: LLM_TEMPERATURE,
    });

    const message = data?.choices?.[0]?.message;
    if (!message) throw new Error("Groq did not return a response for the query");

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      return (message.content ?? "").trim();
    }

    messages.push({ role: "assistant", content: message.content ?? null, tool_calls: toolCalls });

    for (const call of toolCalls) {
      let result: unknown;
      try {
        if (call.function?.name === "search_expenses") {
          const args: { start_date: string; end_date: string; search: string } = JSON.parse(
            call.function.arguments
          );
          result = await runSearch(args);
        } else {
          const args: { start_date: string; end_date: string; category?: string } = JSON.parse(
            call.function.arguments
          );
          result = await runQuery(args);
        }
      } catch (err: any) {
        result = { error: err.message ?? "Tool call failed" };
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return "Sorry, I couldn't put together an answer for that. Try rephrasing the question.";
}
