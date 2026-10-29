-- Optional: run in Supabase SQL editor for real tables
-- Step 3 currently uses Storage JSON (gifts/all.json, withdrawals/all.json)

create table if not exists public.donations (
  id text primary key,
  campaign_id text not null,
  owner_email text,
  title text,
  donor text,
  amount numeric not null default 0,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.withdrawals (
  id text primary key,
  email text not null,
  amount numeric not null default 0,
  method text,
  address text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  processed_at timestamptz
);

alter table public.donations enable row level security;
alter table public.withdrawals enable row level security;

create policy "donations open" on public.donations for all using (true) with check (true);
create policy "withdrawals open" on public.withdrawals for all using (true) with check (true);
