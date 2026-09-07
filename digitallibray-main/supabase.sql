-- Digital Library CMS schema. Run after creating the first Supabase Auth user.
-- After creating that user in Supabase Auth, add them as an admin:
-- insert into public.admin_users (user_id, role) values ('AUTH_USER_UUID', 'admin');
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
	user_id uuid primary key references auth.users(id) on delete cascade,
	role text not null default 'admin' check (role in ('admin')),
	active boolean not null default true,
	created_at timestamptz not null default now()
);

alter table public.admin_users add column if not exists active boolean not null default true;
alter table public.admin_users add column if not exists created_at timestamptz not null default now();

do $$
begin
	if to_regclass('public.admin_profiles') is not null then
		insert into public.admin_users (user_id, role, active)
		select user_id, role, active from public.admin_profiles
		on conflict (user_id) do nothing;
	end if;
end;
$$;

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1 from public.admin_users
		where user_id = auth.uid() and active = true and role = 'admin'
	);
$$;

drop policy if exists "admins read users" on public.admin_users;
create policy "admins read users" on public.admin_users for select to authenticated using (public.is_admin() or user_id = auth.uid());

create table if not exists public.resources (
	id uuid primary key default gen_random_uuid(),
	title text not null check (length(trim(title)) > 0),
	description text,
	resource_type text not null check (resource_type in ('Book','Notes','PYQ','Lab Manual','Syllabus','Cheatsheet','Beyond Curriculum','Publication','Newsletter','Magazine')),
	branch text,
	semester smallint check (semester between 1 and 8),
	subject text,
	academic_year int check (academic_year between 2000 and 2100),
	tags text[] not null default '{}',
	file_url text,
	image_url text,
	file_path text,
	image_path text,
	file_size bigint not null default 0 check (file_size >= 0),
	image_size bigint not null default 0 check (image_size >= 0),
	status text not null default 'draft' check (status in ('draft','published')),
	downloads bigint not null default 0 check (downloads >= 0),
	views bigint not null default 0 check (views >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.resources add column if not exists file_path text;
alter table public.resources add column if not exists image_path text;
alter table public.resources add column if not exists file_url text;
alter table public.resources add column if not exists image_url text;
alter table public.resources add column if not exists file_size bigint not null default 0;
alter table public.resources add column if not exists image_size bigint not null default 0;

alter table public.resources drop constraint if exists resources_resource_type_check;
alter table public.resources add constraint resources_resource_type_check check (resource_type in ('Book','Notes','PYQ','Lab Manual','Syllabus','Cheatsheet','Beyond Curriculum','Publication','Newsletter','Magazine'));

create table if not exists public.announcements (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	message text not null,
	type text not null default 'Info' check (type in ('Info','Important','New','Update','Notice')),
	status text not null default 'draft' check (status in ('draft','published')),
	start_date timestamptz,
	end_date timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
	id bigint primary key default 1 check (id = 1),
	website_name text not null default 'Digital Library',
	website_description text,
	hero_heading text,
	hero_description text,
	hero_button_text text,
	hero_button_link text,
	logo_url text,
	favicon_url text,
	contact_email text,
	footer_text text,
	social_links jsonb not null default '{}'::jsonb,
	maintenance_mode boolean not null default false,
	updated_at timestamptz not null default now()
);

create table if not exists public.featured_resources (
	resource_id uuid primary key references public.resources(id) on delete cascade,
	position smallint not null default 0,
	created_at timestamptz not null default now()
);

create index if not exists resources_type_idx on public.resources(resource_type);
create index if not exists resources_status_idx on public.resources(status);
create index if not exists resources_created_idx on public.resources(created_at desc);
create index if not exists announcements_status_idx on public.announcements(status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists resources_updated_at on public.resources;
create trigger resources_updated_at before update on public.resources for each row execute function public.set_updated_at();
drop trigger if exists announcements_updated_at on public.announcements;
create trigger announcements_updated_at before update on public.announcements for each row execute function public.set_updated_at();
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

alter table public.resources enable row level security;
alter table public.announcements enable row level security;
alter table public.site_settings enable row level security;
alter table public.featured_resources enable row level security;

drop policy if exists "public read published resources" on public.resources;
create policy "public read published resources" on public.resources for select using (status = 'published');
drop policy if exists "admins manage resources" on public.resources;
create policy "admins manage resources" on public.resources for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read active announcements" on public.announcements;
create policy "public read active announcements" on public.announcements for select using (
	status = 'published' and (start_date is null or start_date <= now()) and (end_date is null or end_date >= now())
);
drop policy if exists "admins manage announcements" on public.announcements;
create policy "admins manage announcements" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select using (true);
drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read featured resources" on public.featured_resources;
create policy "public read featured resources" on public.featured_resources for select using (exists (select 1 from public.resources r where r.id = resource_id and r.status = 'published'));
drop policy if exists "admins manage featured resources" on public.featured_resources;
create policy "admins manage featured resources" on public.featured_resources for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.increment_resource_metric(resource_id uuid, metric text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if metric = 'views' then
		update public.resources set views = views + 1 where id = resource_id and status = 'published';
	elsif metric = 'downloads' then
		update public.resources set downloads = downloads + 1 where id = resource_id and status = 'published';
	else
		raise exception 'Unsupported metric';
	end if;
end;
$$;

insert into storage.buckets (id, name, public) values ('resources','resources',true), ('images','images',true)
on conflict (id) do nothing;
drop policy if exists "public read published files" on storage.objects;
create policy "public read published files" on storage.objects for select using (bucket_id in ('resources','images'));
drop policy if exists "admins upload files" on storage.objects;
drop policy if exists "Admins can upload resources" on storage.objects;
drop policy if exists "Admins can upload images" on storage.objects;
create policy "Admins can upload resources" on storage.objects
for insert to authenticated
with check (
	bucket_id = 'resources'
	and exists (
		select 1 from public.admin_users
		where public.admin_users.user_id = auth.uid()
		and public.admin_users.role = 'admin'
		and public.admin_users.active = true
	)
);
create policy "Admins can upload images" on storage.objects
for insert to authenticated
with check (
	bucket_id = 'images'
	and exists (
		select 1 from public.admin_users
		where public.admin_users.user_id = auth.uid()
		and public.admin_users.role = 'admin'
		and public.admin_users.active = true
	)
);
drop policy if exists "admins update files" on storage.objects;
drop policy if exists "Admins can update resources" on storage.objects;
drop policy if exists "Admins can update images" on storage.objects;
create policy "Admins can update resources" on storage.objects
for update to authenticated
using (bucket_id = 'resources' and exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and active = true))
with check (bucket_id = 'resources' and exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and active = true));
create policy "Admins can update images" on storage.objects
for update to authenticated
using (bucket_id = 'images' and exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and active = true))
with check (bucket_id = 'images' and exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and active = true));
drop policy if exists "admins delete files" on storage.objects;
drop policy if exists "Admins can delete resources" on storage.objects;
drop policy if exists "Admins can delete images" on storage.objects;
create policy "Admins can delete resources" on storage.objects
for delete to authenticated
using (bucket_id = 'resources' and exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and active = true));
create policy "Admins can delete images" on storage.objects
for delete to authenticated
using (bucket_id = 'images' and exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and active = true));

-- ================= STUDENT PROJECTS MODULE =================
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
  thumbnail_path text,
  project_file_path text,
  submitted_by uuid references auth.users(id) on delete set null,
	team_members text,
  verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected')),
  admin_note text,
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.projects add column if not exists team_members text;
alter table public.project_submissions add column if not exists team_members text;

create index if not exists projects_status_idx on public.projects(project_status, verification_status);
create index if not exists project_submissions_status_idx on public.project_submissions(verification_status, submitted_at desc);

alter table public.projects enable row level security;
alter table public.project_submissions enable row level security;

drop policy if exists "public read approved projects" on public.projects;
create policy "public read approved projects" on public.projects for select using (verification_status='approved');

drop policy if exists "anyone submit project" on public.project_submissions;
create policy "anyone submit project" on public.project_submissions for insert to anon, authenticated with check (verification_status='pending');

drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage submissions" on public.project_submissions;
create policy "admins manage submissions" on public.project_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage buckets (create them in Storage if your project does not allow SQL bucket creation)
insert into storage.buckets (id,name,public) values ('project-images','project-images',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('project-files','project-files',false) on conflict (id) do nothing;

drop policy if exists "public read project images" on storage.objects;
create policy "public read project images" on storage.objects for select using (bucket_id='project-images');

drop policy if exists "anyone upload project images" on storage.objects;
create policy "anyone upload project images" on storage.objects for insert to anon, authenticated with check (bucket_id='project-images');

drop policy if exists "anyone upload project files" on storage.objects;
create policy "anyone upload project files" on storage.objects for insert to anon, authenticated with check (bucket_id='project-files');

drop policy if exists "admins manage project files" on storage.objects;
create policy "admins manage project files" on storage.objects for all to authenticated using (bucket_id in ('project-files','project-images') and public.is_admin()) with check (bucket_id in ('project-files','project-images') and public.is_admin());
