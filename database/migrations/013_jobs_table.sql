-- 013_jobs_table.sql
-- Minimal jobs table and basic policies

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  employer text not null,
  description text not null,
  location text,
  country text,
  job_type text, -- e.g., full_time, live_in, live_out
  accommodation text, -- e.g., provided, not_provided
  visa_status_required text[],
  service_type text[],
  requirements text[],
  languages_required text[],
  urgent boolean default false,
  salary_min numeric,
  salary_max numeric,
  currency text default 'USD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure required columns exist if the table pre-existed with an older schema
alter table public.jobs add column if not exists title text;
alter table public.jobs add column if not exists employer text;
alter table public.jobs add column if not exists description text;
alter table public.jobs add column if not exists location text;
alter table public.jobs add column if not exists country text;
alter table public.jobs add column if not exists job_type text;
alter table public.jobs add column if not exists accommodation text;
alter table public.jobs add column if not exists visa_status_required text[];
alter table public.jobs add column if not exists service_type text[];
alter table public.jobs add column if not exists requirements text[];
alter table public.jobs add column if not exists languages_required text[];
alter table public.jobs add column if not exists urgent boolean default false;
alter table public.jobs add column if not exists salary_min numeric;
alter table public.jobs add column if not exists salary_max numeric;
alter table public.jobs add column if not exists currency text default 'USD';
alter table public.jobs add column if not exists created_at timestamptz default now();
alter table public.jobs add column if not exists updated_at timestamptz default now();

-- Basic indexes to support filtering/sorting
create index if not exists idx_jobs_country on public.jobs using btree (country);
create index if not exists idx_jobs_job_type on public.jobs using btree (job_type);
create index if not exists idx_jobs_created_at on public.jobs using btree (created_at desc);
create index if not exists idx_jobs_urgent on public.jobs using btree (urgent);
create index if not exists idx_jobs_requirements_gin on public.jobs using gin (requirements);
create index if not exists idx_jobs_languages_required_gin on public.jobs using gin (languages_required);

-- RLS (adjust as needed for your app)
alter table public.jobs enable row level security;

do $$ begin
  create policy jobs_select_all on public.jobs
    for select using (true);
exception when duplicate_object then null; end $$;

-- Optionally limit insert/update/delete to authenticated or specific role
do $$ begin
  create policy jobs_insert_auth on public.jobs
    for insert to authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy jobs_update_auth on public.jobs
    for update to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy jobs_delete_auth on public.jobs
    for delete to authenticated using (true);
exception when duplicate_object then null; end $$;

-- Trigger to keep updated_at current
create or replace function public.set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_jobs_timestamp on public.jobs;
create trigger set_jobs_timestamp
before update on public.jobs
for each row execute function public.set_timestamp();
