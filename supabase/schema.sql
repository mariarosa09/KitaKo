-- KitaKo — Supabase database setup.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this whole file → Run.
-- Safe to run again: it creates what is missing and replaces functions, triggers and policies.

create extension if not exists pgcrypto with schema extensions;

-- ============ tables ============
create table if not exists public.businesses (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique check (username ~ '^[a-z0-9][a-z0-9-]{2,29}$'),
  name        text not null check (length(name) between 1 and 120),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- business password (cashiers enter it to open business mode). No policies: only the functions below read it.
create table if not exists public.business_secrets (
  biz_id     uuid primary key references public.businesses(id) on delete cascade,
  pass_hash  text not null
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  fullname    text not null default '',
  username    text check (username ~ '^[a-zA-Z0-9_.]{3,20}$'),   -- null until a Google sign-up picks one
  email       text not null default '',
  role        text check (role in ('owner', 'cashier')),          -- null until a Google sign-up picks one
  biz_id      uuid references public.businesses(id) on delete set null,
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));
create index if not exists profiles_biz on public.profiles (biz_id);

-- each business's app data: one row per data type (settings, products, …);
-- sales (txns:YYYY-MM) and stock moves (stockMoves:YYYY-MM) get one row per month
create table if not exists public.business_data (
  biz_id      uuid not null references public.businesses(id) on delete cascade,
  key         text not null check (length(key) <= 40),
  value       jsonb not null,
  version     integer not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null,
  primary key (biz_id, key)
);

-- ============ helper used by the policies ============
create or replace function public.my_biz() returns uuid
language sql stable security definer set search_path = '' as $$
  select biz_id from public.profiles where id = auth.uid()
$$;

-- ============ new login → profile row ============
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r  text  := m->>'role';
  un text  := m->>'username';
begin
  if r is not null and r not in ('owner', 'cashier') then r := null; end if;
  if un is not null and (un !~ '^[a-zA-Z0-9_.]{3,20}$'
       or exists (select 1 from public.profiles where lower(username) = lower(un))) then un := null; end if;
  insert into public.profiles (id, fullname, username, email, role)
  values (new.id,
          coalesce(nullif(m->>'fullname', ''), nullif(m->>'full_name', ''), nullif(m->>'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
          un, coalesce(new.email, ''), r);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;
drop trigger if exists on_auth_user_email on auth.users;
create trigger on_auth_user_email after update of email on auth.users
  for each row execute function public.handle_user_email();

-- ============ row level security ============
alter table public.profiles         enable row level security;
alter table public.businesses       enable row level security;
alter table public.business_secrets enable row level security;
alter table public.business_data    enable row level security;

drop policy if exists "profiles: self and coworkers" on public.profiles;
create policy "profiles: self and coworkers" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or biz_id = (select public.my_biz()));

drop policy if exists "profiles: edit self, owner edits staff" on public.profiles;
create policy "profiles: edit self, owner edits staff" on public.profiles for update to authenticated
  using (id = (select auth.uid())
         or (biz_id = (select public.my_biz())
             and exists (select 1 from public.businesses b where b.id = biz_id and b.owner_id = (select auth.uid()))))
  with check (true);

drop policy if exists "businesses: members read" on public.businesses;
create policy "businesses: members read" on public.businesses for select to authenticated
  using (id = (select public.my_biz()));

drop policy if exists "businesses: members rename" on public.businesses;
create policy "businesses: members rename" on public.businesses for update to authenticated
  using (id = (select public.my_biz())) with check (true);

drop policy if exists "data: members read" on public.business_data;
create policy "data: members read" on public.business_data for select to authenticated
  using (biz_id = (select public.my_biz()));

drop policy if exists "data: members insert" on public.business_data;
create policy "data: members insert" on public.business_data for insert to authenticated
  with check (biz_id = (select public.my_biz()));

drop policy if exists "data: members update" on public.business_data;
create policy "data: members update" on public.business_data for update to authenticated
  using (biz_id = (select public.my_biz())) with check (biz_id = (select public.my_biz()));

-- column-level limits: role, business and email only change through the functions and triggers here
revoke all on public.profiles, public.businesses, public.business_secrets, public.business_data from anon, authenticated;
grant select on public.profiles, public.businesses, public.business_data to authenticated;
grant update (fullname, username) on public.profiles to authenticated;
grant update (name) on public.businesses to authenticated;
grant insert, update on public.business_data to authenticated;

-- ============ functions the app calls ============
-- sign-up: is a username free? (answers only true/false)
create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(trim(p_username)))
$$;

-- log in with a username: returns that account's email so the app can sign in with it
create or replace function public.email_for_login(p_login text) returns text
language sql stable security definer set search_path = '' as $$
  select email from public.profiles where lower(username) = lower(trim(p_login)) limit 1
$$;

-- Google sign-up (or a sign-up whose username was taken meanwhile): choose role and username
create or replace function public.complete_profile(p_fullname text, p_username text, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_role not in ('owner', 'cashier') then raise exception 'Invalid role'; end if;
  update public.profiles
     set fullname = p_fullname, username = p_username, role = coalesce(role, p_role)
   where id = auth.uid() and (role is null or username is null);
  if not found then raise exception 'Profile is already set up'; end if;
end $$;

-- owner: create the business and become its owner
create or replace function public.create_business(p_username text, p_name text, p_password text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner' and biz_id is null) then
    raise exception 'Only a business owner without a business can create one';
  end if;
  if length(p_password) < 6 then raise exception 'Business password must be at least 6 characters'; end if;
  insert into public.businesses (username, name, owner_id) values (lower(trim(p_username)), p_name, auth.uid()) returning id into b;
  insert into public.business_secrets (biz_id, pass_hash) values (b, extensions.crypt(p_password, extensions.gen_salt('bf')));
  update public.profiles set biz_id = b where id = auth.uid();
  return b;
end $$;

-- cashier: join a business by its username
create or replace function public.join_business(p_username text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'cashier') then
    raise exception 'Only cashiers join a business';
  end if;
  select id into b from public.businesses where username = lower(trim(p_username));
  if b is null then raise exception 'No business uses that username' using errcode = 'P0002'; end if;
  update public.profiles set biz_id = b where id = auth.uid();
  return b;
end $$;

-- business mode: is this the business password of the caller's business?
create or replace function public.check_business_password(p_password text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.business_secrets s
                  where s.biz_id = (select biz_id from public.profiles where id = auth.uid())
                    and s.pass_hash = extensions.crypt(p_password, s.pass_hash))
$$;

create or replace function public.set_business_password(p_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if length(p_password) < 6 then raise exception 'Business password must be at least 6 characters'; end if;
  update public.business_secrets s set pass_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
    from public.businesses b where b.id = s.biz_id and b.owner_id = auth.uid();
  if not found then raise exception 'Only the business owner can change the business password'; end if;
end $$;

-- owner: remove a cashier from the business (their login stays; they can join again with the business username)
create or replace function public.remove_staff(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p set biz_id = null
    from public.businesses b
   where p.id = p_user and p.role = 'cashier' and p.biz_id = b.id and b.owner_id = auth.uid();
  if not found then raise exception 'Cashier not found in your business'; end if;
end $$;

-- save one data row only if nobody changed it since this device last read it (version check).
-- Returns the new version, or null when another device saved first (the app then merges and retries).
create or replace function public.put_data(p_biz uuid, p_key text, p_value jsonb, p_version integer) returns integer
language plpgsql security invoker set search_path = '' as $$
declare v integer;
begin
  if p_version = 0 then
    insert into public.business_data (biz_id, key, value, version, updated_by)
    values (p_biz, p_key, p_value, 1, auth.uid())
    on conflict (biz_id, key) do nothing
    returning version into v;
    return v;
  end if;
  update public.business_data
     set value = p_value, version = version + 1, updated_at = now(), updated_by = auth.uid()
   where biz_id = p_biz and key = p_key and version = p_version
  returning version into v;
  return v;
end $$;

-- who may call what
revoke execute on function
  public.my_biz(), public.handle_new_user(), public.handle_user_email(),
  public.username_available(text), public.email_for_login(text), public.complete_profile(text, text, text),
  public.create_business(text, text, text), public.join_business(text), public.check_business_password(text),
  public.set_business_password(text), public.remove_staff(uuid), public.put_data(uuid, text, jsonb, integer)
from public, anon, authenticated;

grant execute on function public.username_available(text), public.email_for_login(text) to anon, authenticated;
grant execute on function
  public.my_biz(), public.complete_profile(text, text, text), public.create_business(text, text, text),
  public.join_business(text), public.check_business_password(text), public.set_business_password(text),
  public.remove_staff(uuid), public.put_data(uuid, text, jsonb, integer)
to authenticated;
