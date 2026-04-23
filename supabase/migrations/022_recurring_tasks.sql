-- Add recurring fields to captures
alter table captures
  add column if not exists recurring           boolean not null default false,
  add column if not exists recurring_frequency text    check (recurring_frequency in ('daily','weekly','monthly')),
  add column if not exists recurring_parent_id uuid    references captures(id) on delete set null;

create index if not exists captures_recurring on captures (clerk_user_id, recurring)
  where recurring = true;
