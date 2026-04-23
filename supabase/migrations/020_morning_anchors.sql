-- Add morning anchors to profiles (up to 3 short strings)
alter table profiles
  add column if not exists morning_anchors jsonb default '[]'::jsonb;

-- Daily log of which anchors were checked off
create table if not exists morning_anchor_logs (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null references profiles(clerk_user_id) on delete cascade,
  anchor_index    int  not null check (anchor_index between 0 and 2),
  log_date        date not null default current_date,
  created_at      timestamptz not null default now(),
  unique (clerk_user_id, anchor_index, log_date)
);

create index if not exists morning_anchor_logs_user_date
  on morning_anchor_logs (clerk_user_id, log_date);

alter table morning_anchor_logs enable row level security;
create policy "Users manage own anchor logs"
  on morning_anchor_logs for all
  using  (clerk_user_id = current_setting('app.user_id', true))
  with check (clerk_user_id = current_setting('app.user_id', true));
