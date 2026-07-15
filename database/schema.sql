create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 30),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  vocation text not null check (vocation in ('knight','paladin','sorcerer','druid','monk')),
  level integer not null check (level >= 1),
  skill integer not null default 10,
  magic_level integer not null default 0,
  is_public boolean not null default false,
  equipment jsonb not null default '{}'::jsonb,
  wheel jsonb not null default '[]'::jsonb,
  weapon_proficiency jsonb not null default '{}'::jsonb,
  rotation jsonb not null default '[]'::jsonb,
  views integer not null default 0,
  likes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index builds_owner_idx on public.builds(owner_id);
create index builds_public_created_idx on public.builds(is_public, created_at desc);
alter table public.profiles enable row level security;
alter table public.builds enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "owner updates profile" on public.profiles for update using (auth.uid() = id);
create policy "public builds or owner" on public.builds for select using (is_public or auth.uid() = owner_id);
create policy "owner creates build" on public.builds for insert with check (auth.uid() = owner_id);
create policy "owner updates build" on public.builds for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner deletes build" on public.builds for delete using (auth.uid() = owner_id);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,username)
  values(new.id,coalesce(new.raw_user_meta_data->>'username','player_'||substr(new.id::text,1,8)));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();
