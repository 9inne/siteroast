-- SiteRoast Phase 1: Head to Head + before & after. Safe to run more than once.

-- 'main' = a visitor's own site, 'rival' = a competitor added in Head to Head.
alter table public.roasts add column if not exists kind text not null default 'main';

-- Finds earlier/later reviews of the same site quickly (before & after).
create index if not exists roasts_host_time_idx on public.roasts (host, created_at desc);
create index if not exists roasts_kind_ip_time_idx on public.roasts (kind, ip_hash, created_at);

create table if not exists public.comparisons (
  id         text primary key,
  you_id     text not null references public.roasts (id) on delete cascade,
  rival_ids  text[] not null,
  ip_hash    text,
  created_at timestamptz not null default now()
);
create index if not exists comparisons_ip_time_idx on public.comparisons (ip_hash, created_at);
create index if not exists comparisons_you_idx on public.comparisons (you_id);

-- Same lock as the other tables: only the website's server can read or write.
alter table public.comparisons enable row level security;
