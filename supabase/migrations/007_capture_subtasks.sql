-- Add subtasks column to captures for inline step storage
alter table captures
  add column if not exists subtasks jsonb default null;
