-- Admin panel: tablas de auditoria de envios manuales y borradores.
-- Ver supabase/README.md (seccion "Admin panel") para el contexto completo.

-- ============================================================================
-- public.sent_emails
-- ============================================================================
-- Cada envio realizado desde /admin/emails registra una fila aca.
-- Usado para: history view, audit "quien mando que", repetir un send.

create table if not exists public.sent_emails (
  id                uuid primary key default gen_random_uuid(),
  sent_by           text not null,
  sent_at           timestamptz not null default now(),
  template          text,                              -- 'beta-invite' | 'blank-iudex' | 'ad-hoc' | etc
  subject           text not null,
  recipients        text[] not null default '{}',      -- emails directos (si fue 1-a-1 o multi)
  audience_id       text,                              -- id de audience de Resend (si fue por audience)
  audience_name     text,                              -- nombre cacheado de la audience (para history)
  resend_message_id text,
  variables         jsonb,                             -- vars usadas en el template (auditoria)
  body_html         text,                              -- HTML final enviado (para repetir / inspeccionar)
  status            text not null default 'sent',     -- 'sent' | 'failed'
  error_message     text,
  test_mode         boolean not null default false
);

create index if not exists sent_emails_sent_at_idx on public.sent_emails (sent_at desc);
create index if not exists sent_emails_sent_by_idx on public.sent_emails (sent_by);

alter table public.sent_emails enable row level security;

-- SELECT permitido a authenticated. Los inserts vienen de la Edge Function via
-- service_role (que bypassea RLS), asi que no se necesita policy de INSERT.
create policy "sent_emails_select_authenticated"
  on public.sent_emails for select
  using (auth.role() = 'authenticated');

-- ============================================================================
-- public.email_drafts
-- ============================================================================
-- Borradores guardados desde el composer del admin panel.
-- Cada usuario ve solo los suyos (RLS por owner = email).

create table if not exists public.email_drafts (
  id           uuid primary key default gen_random_uuid(),
  owner        text not null,                          -- email del autor
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  title        text not null default 'Sin titulo',
  template     text,
  subject      text,
  recipients   text[] default '{}',
  audience_id  text,
  variables    jsonb,
  body_html    text                                    -- para template = 'ad-hoc'
);

create index if not exists email_drafts_owner_updated_idx
  on public.email_drafts (owner, updated_at desc);

alter table public.email_drafts enable row level security;

-- Cada user solo ve / edita sus propios drafts.
create policy "email_drafts_select_own"
  on public.email_drafts for select
  using (auth.jwt() ->> 'email' = owner);

create policy "email_drafts_insert_own"
  on public.email_drafts for insert
  with check (auth.jwt() ->> 'email' = owner);

create policy "email_drafts_update_own"
  on public.email_drafts for update
  using (auth.jwt() ->> 'email' = owner)
  with check (auth.jwt() ->> 'email' = owner);

create policy "email_drafts_delete_own"
  on public.email_drafts for delete
  using (auth.jwt() ->> 'email' = owner);
