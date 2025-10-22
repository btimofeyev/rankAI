-- Migration to add web search support with citations
-- Run this after running migrations.sql

-- Add citations column to query_results table
alter table public.query_results
add column if not exists citations jsonb default '[]'::jsonb;

-- Add used_web_search flag to track which queries used web search
alter table public.query_results
add column if not exists used_web_search boolean default false;

-- Create index on citations for faster queries
create index if not exists idx_query_results_citations
on public.query_results using gin (citations);

-- Create index on used_web_search for filtering
create index if not exists idx_query_results_web_search
on public.query_results (used_web_search);

-- Comments for documentation
comment on column public.query_results.citations is 'Array of {url, title, domain, snippet} objects from web search results';
comment on column public.query_results.used_web_search is 'Whether this query result used real-time web search';

-- Example query to find queries with citations from specific domain
-- SELECT * FROM public.query_results
-- WHERE citations @> '[{"domain": "stripe.com"}]'::jsonb;

-- Example query to count queries that used web search
-- SELECT COUNT(*) FROM public.query_results
-- WHERE used_web_search = true;
