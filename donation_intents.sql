-- Run this once in Supabase SQL Editor
create table if not exists public.donation_intents (
  id text primary key,
  campaign_id text not null,
  amount numeric default 0,
  created_at timestamptz default now()
);

alter table public.donation_intents enable row level security;
create policy "intents open" on public.donation_intents for all using (true) with check (true);
