create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_tier text default 'free',
  plan_renews_at timestamp with time zone
);

create table if not exists public.analyses (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  brand text not null,
  keywords text[] default array[]::text[],
  competitors text[] default array[]::text[],
  created_at timestamp with time zone default now()
);

create table if not exists public.queries (
  id uuid primary key,
  analysis_id uuid references public.analyses (id) on delete cascade,
  query_text text not null,
  brand text not null,
  position int not null,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  context text,
  run_at timestamp with time zone default now()
);

create table if not exists public.history (
  id uuid primary key,
  analysis_id uuid references public.analyses (id) on delete cascade,
  week date not null,
  brand_mentions int not null,
  competitor_mentions jsonb not null
);

create index if not exists idx_queries_analysis on public.queries (analysis_id);
create index if not exists idx_history_analysis on public.history (analysis_id);
