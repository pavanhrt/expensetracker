-- PRISM AI expense tracker schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "uuid-ossp";

-- ---------- users (profile row, keyed to Supabase auth.users) ----------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone_or_email text unique,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'te')),
  created_at timestamptz not null default now()
);

-- Auto-create a public.users profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, phone_or_email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email)
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, is_default)
  select new.id, c.name, true
  from (values
    ('Food'), ('Groceries'), ('Pooja/Religious'), ('Fuel/Transport'),
    ('Utilities/Recharge'), ('Household'), ('Health'), ('Shopping'), ('Other')
  ) as c(name)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- expenses ----------
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_name text not null,
  amount numeric(10, 2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  expense_date date not null,
  raw_input text,
  input_mode text not null default 'text' check (input_mode in ('voice', 'text')),
  language text not null default 'en' check (language in ('en', 'te')),
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);
create index if not exists expenses_user_category_idx on public.expenses (user_id, category_id);

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "users can view own profile" on public.users;
create policy "users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users
  for update using (auth.uid() = id);

drop policy if exists "users can manage own categories" on public.categories;
create policy "users can manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can manage own expenses" on public.expenses;
create policy "users can manage own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- query_expense_summary ----------
-- Backs the Claude query_expenses tool (see src/lib/claude/prompts.ts). Runs as the
-- calling user (auth.uid()), parameterized — never string-built — and scoped to
-- that user's own rows only.
create or replace function public.query_expense_summary(
  p_start_date date,
  p_end_date date,       -- exclusive
  p_category text default null
)
returns table (
  category text,
  total numeric,
  count bigint
)
language sql
security invoker
stable
as $$
  select
    coalesce(c.name, 'Other') as category,
    sum(e.amount) as total,
    count(*) as count
  from public.expenses e
  left join public.categories c on c.id = e.category_id
  where e.user_id = auth.uid()
    and e.expense_date >= p_start_date
    and e.expense_date < p_end_date
    and (p_category is null or c.name = p_category)
  group by coalesce(c.name, 'Other')
  order by total desc;
$$;
