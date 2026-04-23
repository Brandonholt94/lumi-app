-- Daily habits (max 3 per user)
create table if not exists habits (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references profiles(clerk_user_id) on delete cascade,
  name          text not null,
  emoji         text not null default '✦',
  position      int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists habits_user on habits (clerk_user_id, position);

alter table habits enable row level security;
create policy "Users manage own habits"
  on habits for all
  using  (clerk_user_id = current_setting('app.user_id', true))
  with check (clerk_user_id = current_setting('app.user_id', true));

-- Daily habit check-ins
create table if not exists habit_logs (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references profiles(clerk_user_id) on delete cascade,
  habit_id      uuid not null references habits(id) on delete cascade,
  log_date      date not null default current_date,
  created_at    timestamptz not null default now(),
  unique (clerk_user_id, habit_id, log_date)
);

create index if not exists habit_logs_user_date on habit_logs (clerk_user_id, log_date);

alter table habit_logs enable row level security;
create policy "Users manage own habit logs"
  on habit_logs for all
  using  (clerk_user_id = current_setting('app.user_id', true))
  with check (clerk_user_id = current_setting('app.user_id', true));
