# Vartā — Voice-Enabled Expense Tracker

Log expenses by speaking or typing in English or Telugu ("idols 4000, oil 100, recharge 400"),
get them split into categorized line items, confirm, and ask natural-language questions like
"how much did I spend this month".

Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind, Supabase (Postgres + Auth),
Groq (free-tier hosted LLM + Whisper) for parsing, Q&A, and speech-to-text, Recharts for charts.
See the `expense-tracker-project` project skill for the full architecture rationale — note this
project uses Groq instead of the Claude API the skill originally specified, to avoid needing paid
Anthropic API credits (a Claude Pro/Max subscription doesn't include API access).

**Requires Node.js 20.9 or newer** (Next 16's minimum). Check with `node -v` before installing.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `0001_init.sql` — `users`, `categories`, `expenses` tables, seeds default categories for new
     signups, sets up row-level security.
   - `0002_search_expenses.sql` then `0003_search_expenses_word_match.sql` — the `search_expenses`
     function the Q&A tool uses to look up a specific named item (0003 supersedes 0002's matching
     logic, same function name, safe to run both in order).
   - Also needs `query_expense_summary`, defined at the bottom of `0001_init.sql`.
3. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your
   deployed URL's equivalent) as a redirect URL.
4. Copy your Project URL, anon key, and service role key from **Project Settings → API**.

## 2. Configure environment variables

```
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase.
- `GROQ_API_KEY` — powers both the LLM calls (expense parsing + natural-language Q&A, via
  `GROQ_LLM_MODEL`, default `llama-3.3-70b-versatile`) and speech-to-text below. Free tier, no
  credit card, no org registration.
  1. Sign up at [console.groq.com](https://console.groq.com) (just an email).
  2. Create an API key at **console.groq.com/keys** and set `GROQ_API_KEY`.
- `STT_PROVIDER` — `groq` (default here), `google`, or `bhashini`.
  - **Groq (recommended)**: free tier — 2,000 transcription requests/day, same key as above.
    Runs hosted Whisper large-v3, which handles Telugu well.
  - Google Cloud STT: no org registration, but does need a Google Cloud billing account
    (personal card, free monthly quota).
    1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
    2. Enable the **Cloud Speech-to-Text API** and billing for it.
    3. Create an API key under **APIs & Services → Credentials** and set `GOOGLE_STT_API_KEY`.
  - Bhashini (free, strong Telugu support, but requires registering as an org/developer):
    register at [bhashini.gov.in](https://bhashini.gov.in) to get `BHASHINI_API_KEY`,
    `BHASHINI_USER_ID`, `BHASHINI_INFERENCE_PIPELINE_ID`, then set `STT_PROVIDER=bhashini`.
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally, your real domain once deployed.

Voice input won't work until one STT provider is configured, but manual entry, typed-note
parsing, the ledger, and charts all work without it.

## 3. Turn off email confirmation (recommended for personal use)

Auth is email + password, not a magic link, so no email needs to go out at all — as long as
Supabase isn't also requiring email confirmation on signup. In the Supabase dashboard, go to
**Authentication → Sign In / Providers → User Signups** and turn **Confirm email** off. With it
off, creating an account signs you in immediately, no inbox required.

(If you'd rather keep email confirmation on, note Supabase's built-in mailer is capped at 2
emails/hour — fine for occasional use, but you'll want a custom SMTP provider configured under
**Authentication → Emails** if you're testing signup/reset repeatedly.)

Sessions stay signed in until you explicitly sign out — no extra config needed for that.

## 4. Run it

```
npm install
npm run dev
```

Visit `http://localhost:3000`, use **Create account** with an email and password, and you're in.
A `public.users` profile row plus the 9 default categories are created automatically on signup
via a Postgres trigger.

## 5. Deploy

Push to a repo and import into Vercel; add the same env vars there (using your production
`NEXT_PUBLIC_SITE_URL`). Supabase needs no separate hosting step.

## Project layout

- `src/app/api/expenses/text|voice` — parse a note into **draft** line items (nothing saved yet).
- `src/app/api/expenses` — POST saves confirmed drafts; GET returns a day or month's ledger.
- `src/app/api/query` — natural-language question → Groq + two tools (`query_expenses` for
  category-level totals, `search_expenses` for a specific named item) → answer. The model is
  prompted to use category totals for whole-category questions and the item search for anything
  that isn't literally one of the category names (see `src/lib/claude/prompts.ts`).
- `src/lib/claude/prompts.ts` / `src/lib/claude/client.ts` — the parsing and Q&A system prompts,
  tool schemas, and the Groq chat-completions calls (kept as named exports so edge cases can be
  iterated on without touching route handlers; folder name is a holdover, not a dependency).
- `src/lib/dates.ts` — includes `normalizeExclusiveRange`, a safety net for a date-range mistake
  the model occasionally makes (passing the same start/end date for a "today" question, which
  matches zero rows under our exclusive-end-date convention).
- `src/lib/stt/` — STT provider interface; swap providers via `STT_PROVIDER`, not by touching
  UI or route code.
- `supabase/migrations/` — `0001_init.sql` (schema, RLS, `query_expense_summary`), `0002` /
  `0003` (the `search_expenses` function, parameterized and scoped to `auth.uid()` like the rest).

## Build phase status

- [x] Phase 1 — Core ledger: auth, manual entry, day-wise list, month total
- [x] Phase 2 — Smart text parsing (Groq splits typed notes into line items + confirm screen)
- [x] Phase 3 — Voice input (mic capture, STT for EN + TE, feeds into Phase 2 pipeline)
- [x] Phase 4 — Natural-language summaries (`/api/query` + tool use)
- [x] Phase 5 — Polish (charts, edit/delete UI, PWA manifest, CSV export)

All five phases are coded and have been exercised live (auth, text parsing, and Q&A all confirmed
working against real Supabase + Groq calls). One known limitation to keep in mind: Groq's free
Llama 3.3 model is noticeably weaker than Claude at fuzzy reasoning, so the Q&A prompts and tools
have some extra guardrails (word-based item search, category-name matching, date-range
normalization) to compensate — if you hit another wrong-answer case, the fix is usually in
`src/lib/claude/prompts.ts` (tighten the instructions) or the `runQuery`/`runSearch` handlers in
`src/app/api/query/route.ts` (add another safety net), not a sign of a deeper bug.
