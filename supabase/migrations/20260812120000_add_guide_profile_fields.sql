-- Guide profiles: public-facing profile fields on public.guides.
--
-- The guides table was created outside of migrations, so this file only adds
-- the new profile columns and the policy a guide needs to edit their own row.
-- It is safe to run more than once.

alter table public.guides
  add column if not exists headline text,
  add column if not exists bio text,
  add column if not exists years_experience integer,
  add column if not exists website text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.guides
  drop constraint if exists guides_years_experience_check;

alter table public.guides
  add constraint guides_years_experience_check
  check (years_experience is null or (years_experience >= 0 and years_experience <= 80));

-- Keep updated_at fresh. public.handle_updated_at() is created by the profiles
-- migration; re-create it here so this file can be applied standalone.
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_guides_updated_at on public.guides;

create trigger set_guides_updated_at
before update on public.guides
for each row execute function public.handle_updated_at();

-- A signed-in guide may edit the profile row they have claimed.
drop policy if exists "guides can update their own profile" on public.guides;

create policy "guides can update their own profile"
  on public.guides for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists guides_user_id_idx on public.guides (user_id);
