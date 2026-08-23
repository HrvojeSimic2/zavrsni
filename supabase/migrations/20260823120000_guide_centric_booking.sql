-- Guide-centric booking: you hire a person for a slot of their time.
--
-- Until now `tours` was the anchor for five things that belong to the guide:
-- availability, price, reservations, reviews, and the guide's own identity
-- (interests, rating and location were all derived from their tours). A guide
-- could not open a single date without first inventing a product, and the price
-- was quoted per person, which is what an OTA sells, not what hiring a person
-- costs.
--
-- After this migration:
--   * the guide carries the rate, the specialties and the group cap;
--   * `guide_availability` holds time slots -- the schedulable unit;
--   * a reservation is one traveller taking one slot, priced rate x hours;
--   * reviews are about the guide.
--
-- `tours` and `tour_availability` are left in place but are no longer read by
-- the app. Dropping them is a separate, deliberate step once the data is no
-- longer wanted.
--
-- Safe to run more than once.

-- === 1. What the guide offers lives on the guide =============================

alter table public.guides
  add column if not exists hourly_rate numeric(10, 2),
  add column if not exists specialties text[] not null default '{}',
  add column if not exists max_group_size integer not null default 6,
  add column if not exists default_meeting_point text,
  add column if not exists rating numeric(3, 2) not null default 0,
  add column if not exists review_count integer not null default 0;

comment on column public.guides.hourly_rate is
  'What an hour of this guide costs. Shown as "from X EUR/h"; null means the rate is not published yet.';
comment on column public.guides.specialties is
  'What the guide is into. Was derived from the categories of their tours.';
comment on column public.guides.max_group_size is
  'Largest party the guide takes at once. Replaces the free-text tours.group_size.';

alter table public.guides drop constraint if exists guides_hourly_rate_check;
alter table public.guides
  add constraint guides_hourly_rate_check
  check (hourly_rate is null or (hourly_rate >= 0 and hourly_rate <= 10000));

alter table public.guides drop constraint if exists guides_max_group_size_check;
alter table public.guides
  add constraint guides_max_group_size_check
  check (max_group_size >= 1 and max_group_size <= 100);

alter table public.guides drop constraint if exists guides_rating_check;
alter table public.guides
  add constraint guides_rating_check
  check (rating >= 0 and rating <= 5);

alter table public.guides drop constraint if exists guides_specialties_valid;
alter table public.guides
  add constraint guides_specialties_valid
  check (specialties <@ array['food', 'nature', 'culture', 'adventure', 'history']::text[]);

-- === 2. The slot is the schedulable unit ====================================

create table if not exists public.guide_availability (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  note text,
  created_at timestamptz not null default now(),
  constraint guide_availability_time_order check (end_time > start_time)
);

comment on table public.guide_availability is
  'Blocks of time a guide has opened. One reservation takes one whole slot.';
comment on column public.guide_availability.note is
  'Optional label the guide gives the block. Internal to the schedule.';

create unique index if not exists guide_availability_slot_key
  on public.guide_availability (guide_id, date, start_time);

create index if not exists guide_availability_date_idx
  on public.guide_availability (date);

create index if not exists guide_availability_guide_date_idx
  on public.guide_availability (guide_id, date);

alter table public.guide_availability enable row level security;

-- Open slots are public information: they are what a traveller picks from.
drop policy if exists "slots are readable by everyone" on public.guide_availability;
create policy "slots are readable by everyone"
  on public.guide_availability for select
  using (true);

drop policy if exists "guides can open their own slots" on public.guide_availability;
create policy "guides can open their own slots"
  on public.guide_availability for insert
  to authenticated
  with check (
    exists (
      select 1 from public.guides g
      where g.id = guide_availability.guide_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "guides can change their own slots" on public.guide_availability;
create policy "guides can change their own slots"
  on public.guide_availability for update
  to authenticated
  using (
    exists (
      select 1 from public.guides g
      where g.id = guide_availability.guide_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.guides g
      where g.id = guide_availability.guide_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "guides can remove their own slots" on public.guide_availability;
create policy "guides can remove their own slots"
  on public.guide_availability for delete
  to authenticated
  using (
    exists (
      select 1 from public.guides g
      where g.id = guide_availability.guide_id and g.user_id = auth.uid()
    )
  );

-- === 3. A reservation takes a slot ==========================================

alter table public.reservations
  add column if not exists availability_id uuid
    references public.guide_availability (id) on delete set null,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists duration_hours numeric(4, 2),
  add column if not exists hourly_rate numeric(10, 2),
  add column if not exists meeting_point text,
  add column if not exists interests text[];

comment on column public.reservations.hourly_rate is
  'The rate at the moment of booking. Kept here so a later rate change cannot rewrite history.';
comment on column public.reservations.meeting_point is
  'Where these two actually meet. Belongs to the booking, not to a catalogue entry.';

-- `note` already existed and was never written to. It is now what the traveller
-- says when asking, rather than a second column beside it.
comment on column public.reservations.note is
  'What the traveller wrote when requesting: what they would like to see.';

-- The tour is no longer required, or written, by the booking flow.
alter table public.reservations alter column tour_id drop not null;

-- A guide who has not published a rate yet still takes requests; the price is
-- agreed between them. A zero would read as "free" on the bookings page.
alter table public.reservations alter column total_amount drop not null;

-- One live request per slot. The insert is the lock: no read-then-write, and
-- none of the spot arithmetic the tour flow needed.
create unique index if not exists reservations_one_active_per_slot
  on public.reservations (availability_id)
  where availability_id is not null and status in ('pending', 'confirmed');

create index if not exists reservations_availability_id_idx
  on public.reservations (availability_id);

-- === 4. Reviews are about the guide =========================================

alter table public.reviews
  add column if not exists guide_id uuid references public.guides (id) on delete cascade;

-- reviews.tour_id is text while tours.id is uuid, so the join needs the cast.
-- Casting the uuid to text (rather than the other way) keeps a review whose
-- tour_id is not a well-formed uuid from breaking the whole statement.
update public.reviews r
set guide_id = t.guide_id
from public.tours t
where r.guide_id is null and r.tour_id = t.id::text and t.guide_id is not null;

create index if not exists reviews_guide_id_idx on public.reviews (guide_id);

-- guides.rating / review_count are denormalised so browse and the cards do not
-- aggregate reviews on every request. This trigger is the only writer.
create or replace function public.recount_guide_reviews(target uuid)
returns void as $recount_guide_reviews$
begin
  if target is null then
    return;
  end if;

  update public.guides g
  set rating = coalesce(sub.avg_rating, 0),
      review_count = coalesce(sub.n, 0)
  from (
    select avg(rating)::numeric(3, 2) as avg_rating, count(*) as n
    from public.reviews
    where guide_id = target
  ) sub
  where g.id = target;
end;
$recount_guide_reviews$ language plpgsql security definer set search_path = public;

-- NEW is unassigned on DELETE and OLD on INSERT, so each branch reads only the
-- record it actually has. A review moved between guides has to refresh both.
create or replace function public.refresh_guide_rating()
returns trigger as $refresh_guide_rating$
begin
  if tg_op = 'DELETE' then
    perform public.recount_guide_reviews(old.guide_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.guide_id is distinct from new.guide_id then
    perform public.recount_guide_reviews(old.guide_id);
  end if;

  perform public.recount_guide_reviews(new.guide_id);
  return new;
end;
$refresh_guide_rating$ language plpgsql security definer set search_path = public;

drop trigger if exists refresh_guide_rating_on_reviews on public.reviews;

create trigger refresh_guide_rating_on_reviews
after insert or update or delete on public.reviews
for each row execute function public.refresh_guide_rating();

-- === 5. Carry the existing data over ========================================

-- Specialties were the categories of the guide's tours.
update public.guides g
set specialties = sub.cats
from (
  select guide_id, array_agg(distinct category) as cats
  from public.tours
  where guide_id is not null and category is not null
  group by guide_id
) sub
where g.id = sub.guide_id
  and (g.specialties is null or g.specialties = '{}')
  and sub.cats <@ array['food', 'nature', 'culture', 'adventure', 'history']::text[];

-- Rating and review count, from the reviews that now point at a guide.
update public.guides g
set rating = coalesce(sub.avg_rating, 0),
    review_count = coalesce(sub.n, 0)
from (
  select guide_id, avg(rating)::numeric(3, 2) as avg_rating, count(*) as n
  from public.reviews
  where guide_id is not null
  group by guide_id
) sub
where g.id = sub.guide_id;

-- Open tour dates become slots, so a database that already has availability
-- still has something bookable after the switch. A three-hour block starting at
-- the tour's own start time, capped so it cannot run past midnight.
insert into public.guide_availability (guide_id, date, start_time, end_time, note)
select distinct on (t.guide_id, a.date)
  t.guide_id,
  a.date,
  least(coalesce(t.start_time, time '10:00'), time '18:00'),
  least(coalesce(t.start_time, time '10:00'), time '18:00') + interval '3 hours',
  t.title
from public.tour_availability a
join public.tours t on t.id = a.tour_id
where t.guide_id is not null
  and a.date >= current_date
  and coalesce(a.available_spots, 0) > 0
order by t.guide_id, a.date, t.start_time nulls last
on conflict (guide_id, date, start_time) do nothing;
