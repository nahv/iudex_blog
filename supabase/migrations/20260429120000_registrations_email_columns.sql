-- Migracion a Resend: agregar columnas neutras `email_sent_at` y
-- `email_message_id`. Las columnas legacy `ses_sent_at` / `ses_message_id`
-- se mantienen para no perder historial; la Edge Function chequea ambas
-- para idempotencia y solo escribe en las nuevas.

alter table public.registrations
  add column if not exists email_sent_at    timestamptz,
  add column if not exists email_message_id text;

create index if not exists registrations_email_sent_at_idx
  on public.registrations (email_sent_at)
  where email_sent_at is null;
