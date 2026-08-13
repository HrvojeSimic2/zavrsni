-- Let a guide open, adjust and remove dates on their own tours.
--
-- Until now nothing in the app could write tour_availability at all: a guide
-- could publish a tour but never make a date bookable. Reads stay open because
-- availability is public information on the tour page.
--
-- Safe to run more than once.

alter table public.tour_availability enable row level security;

-- Ownership is "the tour belongs to a guide profile claimed by this user".
drop policy if exists "availability is readable by everyone"
  on public.tour_availability;

create policy "availability is readable by everyone"
  on public.tour_availability for select
  using (true);

drop policy if exists "guides can add availability to their tours"
  on public.tour_availability;

create policy "guides can add availability to their tours"
  on public.tour_availability for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tours t
      join public.guides g on g.id = t.guide_id
      where t.id = tour_availability.tour_id
        and g.user_id = auth.uid()
    )
  );

drop policy if exists "guides can change availability on their tours"
  on public.tour_availability;

create policy "guides can change availability on their tours"
  on public.tour_availability for update
  to authenticated
  using (
    exists (
      select 1
      from public.tours t
      join public.guides g on g.id = t.guide_id
      where t.id = tour_availability.tour_id
        and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tours t
      join public.guides g on g.id = t.guide_id
      where t.id = tour_availability.tour_id
        and g.user_id = auth.uid()
    )
  );

drop policy if exists "guides can remove availability from their tours"
  on public.tour_availability;

create policy "guides can remove availability from their tours"
  on public.tour_availability for delete
  to authenticated
  using (
    exists (
      select 1
      from public.tours t
      join public.guides g on g.id = t.guide_id
      where t.id = tour_availability.tour_id
        and g.user_id = auth.uid()
    )
  );

create index if not exists tour_availability_date_idx
  on public.tour_availability (date);
