begin;

create table if not exists public.competition_courts (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  court_number integer not null,
  name text not null,
  status text not null default 'available',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_courts_number_positive check (court_number > 0),
  constraint competition_courts_status_check check (status in ('available','unavailable')),
  constraint competition_courts_competition_number_key unique (competition_id,court_number)
);

create index if not exists competition_courts_competition_sort_idx
on public.competition_courts (competition_id,sort_order,court_number);

alter table public.matches add column if not exists court_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='matches_court_id_fkey'
      and conrelid='public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_court_id_fkey
      foreign key (court_id)
      references public.competition_courts(id)
      on delete set null;
  end if;
end $$;

create index if not exists matches_court_id_idx on public.matches(court_id);

alter table public.competition_courts enable row level security;

drop policy if exists competition_courts_select_by_active_member on public.competition_courts;
create policy competition_courts_select_by_active_member
on public.competition_courts for select to authenticated
using (
  exists (
    select 1
    from public.competitions c
    join public.members m on m.organization_id=c.organization_id
    where c.id=competition_courts.competition_id
      and m.user_id=auth.uid()
      and m.status='active'::member_status
  )
);

drop policy if exists competition_courts_insert_by_manager_or_owner_or_coach on public.competition_courts;
create policy competition_courts_insert_by_manager_or_owner_or_coach
on public.competition_courts for insert to authenticated
with check (
  exists (
    select 1
    from public.competitions c
    join public.members m on m.organization_id=c.organization_id
    where c.id=competition_courts.competition_id
      and m.user_id=auth.uid()
      and m.status='active'::member_status
      and m.role = any(array['owner'::member_role,'manager'::member_role,'coach'::member_role])
  )
);

drop policy if exists competition_courts_update_by_manager_or_owner_or_coach on public.competition_courts;
create policy competition_courts_update_by_manager_or_owner_or_coach
on public.competition_courts for update to authenticated
using (
  exists (
    select 1
    from public.competitions c
    join public.members m on m.organization_id=c.organization_id
    where c.id=competition_courts.competition_id
      and m.user_id=auth.uid()
      and m.status='active'::member_status
      and m.role = any(array['owner'::member_role,'manager'::member_role,'coach'::member_role])
  )
)
with check (
  exists (
    select 1
    from public.competitions c
    join public.members m on m.organization_id=c.organization_id
    where c.id=competition_courts.competition_id
      and m.user_id=auth.uid()
      and m.status='active'::member_status
      and m.role = any(array['owner'::member_role,'manager'::member_role,'coach'::member_role])
  )
);

drop policy if exists competition_courts_delete_by_manager_or_owner_or_coach on public.competition_courts;
create policy competition_courts_delete_by_manager_or_owner_or_coach
on public.competition_courts for delete to authenticated
using (
  exists (
    select 1
    from public.competitions c
    join public.members m on m.organization_id=c.organization_id
    where c.id=competition_courts.competition_id
      and m.user_id=auth.uid()
      and m.status='active'::member_status
      and m.role = any(array['owner'::member_role,'manager'::member_role,'coach'::member_role])
  )
);

commit;
