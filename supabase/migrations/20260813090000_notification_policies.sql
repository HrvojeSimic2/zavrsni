-- Policies the notifications bar depends on.
--
-- Reservations are readable by two parties: the guide who owns the tour, and
-- the traveller who booked it. Reservations carry no user_id, so the traveller
-- is matched on the email captured with the booking.
--
-- Safe to run more than once.

alter table public.reservations enable row level security;

drop policy if exists "guides can read their reservations" on public.reservations;

create policy "guides can read their reservations"
  on public.reservations for select
  to authenticated
  using (
    exists (
      select 1
      from public.guides g
      where g.id = reservations.guide_id
        and g.user_id = auth.uid()
    )
  );

drop policy if exists "travellers can read their reservations" on public.reservations;

create policy "travellers can read their reservations"
  on public.reservations for select
  to authenticated
  using (
    customer_email is not null
    and lower(customer_email) = lower(auth.jwt() ->> 'email')
  );

-- Confirming or declining a request is the guide's call only.
drop policy if exists "guides can update their reservations" on public.reservations;

create policy "guides can update their reservations"
  on public.reservations for update
  to authenticated
  using (
    exists (
      select 1
      from public.guides g
      where g.id = reservations.guide_id
        and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.guides g
      where g.id = reservations.guide_id
        and g.user_id = auth.uid()
    )
  );

alter table public.guide_applications enable row level security;

drop policy if exists "users can read their own guide applications"
  on public.guide_applications;

create policy "users can read their own guide applications"
  on public.guide_applications for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists reservations_guide_id_status_idx
  on public.reservations (guide_id, status);

create index if not exists reservations_customer_email_idx
  on public.reservations (lower(customer_email));
