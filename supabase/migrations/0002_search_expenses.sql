-- Backs a second Q&A tool (search_expenses, see src/lib/claude/prompts.ts) for questions about a
-- specific line item by name (e.g. "SIP", "petrol") rather than a whole category. query_expense_summary
-- only returns category-level sums, which is unreliable for anything that isn't literally a category
-- name (e.g. a one-off item that landed in "Other") — this returns the actual matching rows instead.
-- Runs as the calling user (auth.uid()), parameterized, scoped to that user's own rows only.
create or replace function public.search_expenses(
  p_start_date date,
  p_end_date date,        -- exclusive
  p_search text           -- matched case-insensitively against item_name
)
returns table (
  item_name text,
  amount numeric,
  expense_date date,
  category text
)
language sql
security invoker
stable
as $$
  select
    e.item_name,
    e.amount,
    e.expense_date,
    coalesce(c.name, 'Other') as category
  from public.expenses e
  left join public.categories c on c.id = e.category_id
  where e.user_id = auth.uid()
    and e.expense_date >= p_start_date
    and e.expense_date < p_end_date
    and e.item_name ilike '%' || p_search || '%'
  order by e.expense_date desc
  limit 50;
$$;
