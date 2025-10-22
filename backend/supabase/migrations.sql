-- Additional tables for brand project functionality
-- Run this AFTER running schema.sql

-- Brand Projects table
-- Stores user's brand monitoring projects
create table if not exists public.brand_projects (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  brand_name text not null,
  keywords text[] default array[]::text[],
  competitors text[] default array[]::text[],
  tracked_queries text[] default array[]::text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Analysis Runs table
-- Tracks each time an analysis is run for a project
create table if not exists public.analysis_runs (
  id uuid primary key,
  project_id uuid references public.brand_projects (id) on delete cascade,
  run_at timestamp with time zone default now(),
  queries_generated int not null
);

-- Query Results table
-- Stores individual query results with brand mentions
create table if not exists public.query_results (
  id uuid primary key,
  run_id uuid references public.analysis_runs (id) on delete cascade,
  query_text text not null,
  brand text,
  position int,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  context text,
  response_text text
);

-- Project Snapshots table
-- Stores aggregate metrics for trend tracking
create table if not exists public.project_snapshots (
  id uuid primary key,
  project_id uuid references public.brand_projects (id) on delete cascade,
  run_id uuid references public.analysis_runs (id) on delete cascade,
  snapshot_date timestamp with time zone default now(),
  total_queries int not null,
  queries_with_mentions int not null,
  brand_mentions int not null,
  brand_share_pct int not null,
  competitor_shares jsonb default '{}'::jsonb
);

-- Indexes for better query performance
create index if not exists idx_brand_projects_user on public.brand_projects (user_id);
create index if not exists idx_brand_projects_created on public.brand_projects (created_at desc);

create index if not exists idx_analysis_runs_project on public.analysis_runs (project_id);
create index if not exists idx_analysis_runs_date on public.analysis_runs (run_at desc);

create index if not exists idx_query_results_run on public.query_results (run_id);
create index if not exists idx_query_results_brand on public.query_results (brand);

create index if not exists idx_project_snapshots_project on public.project_snapshots (project_id);
create index if not exists idx_project_snapshots_date on public.project_snapshots (snapshot_date desc);

-- Row Level Security (RLS) Policies
-- These ensure users can only access their own data

-- Enable RLS on all tables
alter table public.brand_projects enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.query_results enable row level security;
alter table public.project_snapshots enable row level security;

-- Brand Projects: Users can only see their own projects
create policy "Users can view their own projects"
  on public.brand_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.brand_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.brand_projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.brand_projects for delete
  using (auth.uid() = user_id);

-- Analysis Runs: Users can only see runs for their projects
create policy "Users can view runs for their projects"
  on public.analysis_runs for select
  using (
    exists (
      select 1 from public.brand_projects
      where brand_projects.id = analysis_runs.project_id
      and brand_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert runs for their projects"
  on public.analysis_runs for insert
  with check (
    exists (
      select 1 from public.brand_projects
      where brand_projects.id = analysis_runs.project_id
      and brand_projects.user_id = auth.uid()
    )
  );

-- Query Results: Users can only see results for their runs
create policy "Users can view results for their runs"
  on public.query_results for select
  using (
    exists (
      select 1 from public.analysis_runs
      join public.brand_projects on brand_projects.id = analysis_runs.project_id
      where analysis_runs.id = query_results.run_id
      and brand_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert results for their runs"
  on public.query_results for insert
  with check (
    exists (
      select 1 from public.analysis_runs
      join public.brand_projects on brand_projects.id = analysis_runs.project_id
      where analysis_runs.id = query_results.run_id
      and brand_projects.user_id = auth.uid()
    )
  );

-- Project Snapshots: Users can only see snapshots for their projects
create policy "Users can view snapshots for their projects"
  on public.project_snapshots for select
  using (
    exists (
      select 1 from public.brand_projects
      where brand_projects.id = project_snapshots.project_id
      and brand_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert snapshots for their projects"
  on public.project_snapshots for insert
  with check (
    exists (
      select 1 from public.brand_projects
      where brand_projects.id = project_snapshots.project_id
      and brand_projects.user_id = auth.uid()
    )
  );

-- Comments for documentation
comment on table public.brand_projects is 'User brand monitoring projects';
comment on table public.analysis_runs is 'Individual analysis run records';
comment on table public.query_results is 'Detailed query results with brand mentions';
comment on table public.project_snapshots is 'Aggregate metrics snapshots for trending';

comment on column public.brand_projects.tracked_queries is 'Up to 10 custom queries to always include in analysis';
comment on column public.query_results.response_text is 'Full AI response text for context';
comment on column public.project_snapshots.competitor_shares is 'JSON object mapping competitor names to share percentages';
