-- Leads de eventos (NEA Tech 2026, 15-17/10, MACC Corrientes).
-- Formulario /neatech/: gente de cualquier industria nos cuenta su
-- organización y el problema que quiere resolver (Iudex Labs).
--
-- Tabla aparte de `registrations` a propósito: el welcome de registrations
-- está escrito para abogados y su Notion sync mapea campos del producto
-- legal. Acá el aviso lo manda `notify-event-lead` (Database Webhook sobre
-- INSERT). Ver supabase/README.md, sección «Leads de eventos».

create table if not exists public.event_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- Idempotencia: el formulario genera el id en el browser y reintenta si
  -- no hay señal (Wi-Fi del evento). Un reintento que ya había entrado
  -- choca acá (409) y el cliente lo da por enviado.
  client_id       uuid not null unique,

  evento          text not null default 'neatech-2026',
  origen          text not null default 'web'
                    check (origen in ('qr', 'web', 'stand')),

  industria       text not null check (length(industria) between 1 and 60),
  industria_otra  text check (industria_otra is null or length(industria_otra) <= 120),
  problemas       text[] not null default '{}'
                    check (cardinality(problemas) <= 12),
  problema        text check (problema is null or length(problema) <= 2000),
  tamano          text check (tamano is null or length(tamano) <= 20),

  nombre          text not null check (length(trim(nombre)) between 1 and 120),
  organizacion    text check (organizacion is null or length(organizacion) <= 160),
  contacto_tipo   text not null check (contacto_tipo in ('whatsapp', 'email')),
  contacto        text not null check (length(trim(contacto)) between 5 and 160),

  -- Aceptó que lo contactemos por ese medio (Ley 25.326). El formulario no
  -- deja enviar sin esto.
  consentimiento  boolean not null check (consentimiento),

  -- Lo escribe la Edge Function (service_role).
  notified_at     timestamptz,
  notify_error    text
);

create index if not exists event_leads_created_at_idx on public.event_leads (created_at desc);
create index if not exists event_leads_evento_idx on public.event_leads (evento, created_at desc);

alter table public.event_leads enable row level security;

-- El formulario es público: anon sólo puede INSERTAR (nada de leer, editar
-- ni borrar). La Edge Function usa service_role, que bypassea RLS.
create policy "event_leads_insert_anon"
  on public.event_leads for insert
  to anon
  with check (notified_at is null and notify_error is null);

-- El equipo los lee desde el dashboard / panel autenticado.
create policy "event_leads_select_authenticated"
  on public.event_leads for select
  to authenticated
  using (true);
