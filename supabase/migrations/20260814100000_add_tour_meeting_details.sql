-- Meeting details for a tour: where and when the group actually gathers.
--
-- "Zagreb, Hrvatska" in tours.location is a city, not a place two people can
-- meet at, and tour_availability only carries a date. Without these two fields
-- the guide has to retype the meeting point for every booking, and a calendar
-- invite has no start time to anchor to.
--
-- start_time lives on the tour because there is no availability-editing UI yet;
-- a per-date override can be layered on later without touching this column.
--
-- Safe to run more than once.

alter table public.tours
  add column if not exists meeting_point text,
  add column if not exists start_time time;

comment on column public.tours.meeting_point is
  'Exact place the group meets, e.g. "Kod Mandusevca, ispred fontane".';

comment on column public.tours.start_time is
  'Local start time for the tour, used for calendar invites.';
