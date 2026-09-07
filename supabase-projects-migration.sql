-- Run this once in the Supabase SQL Editor for the project configured in config/supabase.js.
-- This migration is idempotent and can be run more than once.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
      and role = 'admin'
  );
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  department text,
  semester smallint check (semester between 1 and 8),
  category text,
  project_status text not null default 'ongoing' check (project_status in ('ongoing','completed')),
  verification_status text not null default 'approved' check (verification_status in ('pending','approved','rejected')),
  tech_stack text,
  required_skills text,
  github_url text,
  live_url text,
  thumbnail_url text,
  thumbnail_path text,
  project_file_path text,
  student_name text,
  team_members text,
  creator_id uuid references auth.users(id) on delete set null,
  contributors_count int not null default 1 check (contributors_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  department text,
  semester smallint check (semester between 1 and 8),
  project_status text not null check (project_status in ('ongoing','completed')),
  tech_stack text,
  github_url text,
  live_url text,
  student_name text not null,
  team_members text,
  thumbnail_path text,
  project_file_path text,
  submitted_by uuid references auth.users(id) on delete set null,
  verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected')),
  admin_note text,
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.projects add column if not exists team_members text;
alter table public.project_submissions add column if not exists team_members text;

create index if not exists projects_status_idx
  on public.projects(project_status, verification_status);
create index if not exists project_submissions_status_idx
  on public.project_submissions(verification_status, submitted_at desc);

alter table public.projects enable row level security;
alter table public.project_submissions enable row level security;

drop policy if exists "public read approved projects" on public.projects;
create policy "public read approved projects"
  on public.projects for select
  using (verification_status = 'approved');

drop policy if exists "anyone submit project" on public.project_submissions;
create policy "anyone submit project"
  on public.project_submissions for insert
  to anon, authenticated
  with check (verification_status = 'pending');

drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects"
  on public.projects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage submissions" on public.project_submissions;
create policy "admins manage submissions"
  on public.project_submissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
