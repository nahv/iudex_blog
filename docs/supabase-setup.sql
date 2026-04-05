-- =============================================
-- Iudex Pre-Access Registration — Supabase Setup
-- =============================================
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================

-- 1. Create the registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT '',
  apellido TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  telefono TEXT,
  provincia TEXT,
  fuero TEXT,
  tamano TEXT,
  mensaje TEXT,
  source TEXT DEFAULT 'contact-form',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Unique index on email (prevents duplicate registrations)
CREATE UNIQUE INDEX IF NOT EXISTS registrations_email_unique ON registrations (email);

-- 3. Enable Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous inserts only (the website can write, but not read/update/delete)
CREATE POLICY "Allow anonymous inserts"
  ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Block all other operations from anon
-- (No SELECT/UPDATE/DELETE policies = denied by default with RLS on)

-- =============================================
-- Verification: after running, check Table Editor
-- to confirm the table exists with the right columns.
-- =============================================
