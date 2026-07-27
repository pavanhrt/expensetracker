-- Improves search_expenses (0002) to match on individual words rather than requiring the whole
-- search phrase as one contiguous substring. Without this, a search for "electric car" would miss
-- an item named "electric kid car", since "kid" sits between the two words in the stored name.
create or replace function public.search_expenses(
  p_start_date date,
  p_end_date date,        -- exclusive
  p_search text           -- matched case-insensitively; every word in this phrase must appear
                           -- somewhere in item_name, in any order
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
    and not exists (
      select 1
      from unnest(array_remove(string_to_array(lower(trim(p_search)), ' '), '')) as w(word)
      where e.item_name not ilike '%' || w.word || '%'
    )
  order by e.expense_date desc
  limit 50;
$$;
