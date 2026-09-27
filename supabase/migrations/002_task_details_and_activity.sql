alter table public.tasks
  add column if not exists description text;

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text not null default 'task',
  target_label text not null,
  member_name text,
  created_at timestamptz not null default now()
);

alter table public.task_activity
  add column if not exists member_name text;

create index if not exists task_activity_created_at_idx
  on public.task_activity (created_at desc);
