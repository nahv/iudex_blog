-- Add SES tracking columns to registrations for the institutional auto-reply
-- sent in parallel to the existing EmailJS flow. These columns make the
-- send-inscription-email Edge Function idempotent: a row with ses_sent_at
-- already set is skipped on retries.

alter table public.registrations
  add column if not exists ses_sent_at    timestamptz,
  add column if not exists ses_message_id text;

create index if not exists registrations_ses_sent_at_idx
  on public.registrations (ses_sent_at)
  where ses_sent_at is null;
