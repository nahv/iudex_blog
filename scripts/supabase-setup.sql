-- ============================================
-- Iudex MVP — Supabase Table Setup
-- ============================================
-- Run this in Supabase SQL Editor (supabase.com > project > SQL Editor)
-- This creates the registrations table and configures Row Level Security.

-- 1. Create the registrations table
create table if not exists public.registrations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre     text not null,
  apellido   text not null,
  email      text not null,
  telefono   text,
  perfil     text,
  provincia  text not null default 'Corrientes',
  fuero      text,
  tamano     text,
  mensaje    text,
  source     text not null default 'contact-form',
  status     text not null default 'pending'
);

-- 2. Add unique constraint on email (prevents duplicate registrations)
alter table public.registrations
  add constraint registrations_email_unique unique (email);

-- 3. Enable Row Level Security
alter table public.registrations enable row level security;

-- 4. Policy: allow anonymous users to INSERT only (the website form)
create policy "Allow anonymous inserts"
  on public.registrations
  for insert
  to anon
  with check (true);

-- 5. Policy: allow authenticated users (you in the dashboard) to do everything
create policy "Allow authenticated full access"
  on public.registrations
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================
-- Done! The table is ready.
--
-- Status values for tracking beta selection:
--   'pending'   — new registration, not reviewed yet
--   'selected'  — accepted as beta tester
--   'waitlist'  — good profile, waiting for next batch
--   'rejected'  — does not qualify for beta
--
-- To update a registration status, run:
--   update public.registrations set status = 'selected' where email = 'user@example.com';
--
-- Or use the Table Editor in the Supabase dashboard (click row > edit).
-- ============================================
