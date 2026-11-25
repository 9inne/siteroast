-- SiteRoast database. Run once in Supabase → SQL Editor.
-- Row Level Security is ON with no public policies: only the website's
-- server (using the secret key) can read or write these tables.

create table if not exists public.roasts (
  id             text primary key,
  url            text not null,
  host           text not null,
  score          smallint not null check (score between 0 and 100),
  categories     jsonb not null,
  headline       text not null,
  fixes          jsonb not null,
  verdict_source text,                     -- 'ai' or 'rules'
  metrics        jsonb,
  shot_mobile    text,                     -- phone screenshot (data URL)
  shot_desktop   text,                     -- laptop screenshot (data URL)
  has_mobile_shot  boolean generated always as (shot_mobile is not null) stored,
  has_desktop_shot boolean generated always as (shot_desktop is not null) stored,
  ip_hash        text,                     -- hashed, never the raw IP
  created_at     timestamptz not null default now()
);

create index if not exists roasts_ip_time_idx on public.roasts (ip_hash, created_at);
create index if not exists roasts_score_idx   on public.roasts (score);

create table if not exists public.leads (
  id         bigint generated always as identity primary key,
  roast_id   text references public.roasts (id) on delete set null,
  name       text not null,
  email      text not null,
  phone      text,
  fixes      jsonb not null default '[]'::jsonb,
  budget     text,
  ip_hash    text,
  status     text not null default 'new',   -- new / contacted / won / lost
  created_at timestamptz not null default now()
);

create index if not exists leads_ip_time_idx on public.leads (ip_hash, created_at);
create index if not exists leads_roast_idx on public.leads (roast_id);

alter table public.roasts enable row level security;
alter table public.leads  enable row level security;

-- Phase 1 additions (Head to Head, before & after) live in phase1.sql.
