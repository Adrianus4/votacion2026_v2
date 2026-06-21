-- ============================================================
-- ESQUEMA SUPABASE - Elecciones 2026
-- Encuesta publica: Fuerza Popular vs Juntos por el Peru
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Tabla 1: votos_encuesta (dato estructurado principal)
create table if not exists votos_encuesta (
  id uuid primary key default gen_random_uuid(),
  candidato text not null check (candidato in ('fuerza_popular', 'juntos_por_el_peru')),
  region text default 'No especificado',
  comentario text,
  session_id text not null unique,
  ip_hash text,
  creado_en timestamptz default now()
);

create index if not exists idx_votos_candidato on votos_encuesta(candidato);
create index if not exists idx_votos_region on votos_encuesta(region);

-- Tabla 2: actas_archivos (metadata estructurada de archivos guardados en Backblaze B2)
create table if not exists actas_archivos (
  id uuid primary key default gen_random_uuid(),
  mesa_votacion text not null,
  region text,
  b2_key text not null,
  nombre_original text,
  tipo_mime text,
  tamano_bytes integer,
  creado_en timestamptz default now()
);

create index if not exists idx_actas_mesa on actas_archivos(mesa_votacion);
create index if not exists idx_actas_region on actas_archivos(region);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- El backend usa la "service_role key" que SALTA RLS por diseño,
-- asi que estas politicas solo importan si en el futuro conectas
-- el frontend directo a Supabase con la "anon key".
-- Las dejamos activadas como buena practica de seguridad.
-- ============================================================

alter table votos_encuesta enable row level security;
alter table actas_archivos enable row level security;

-- Permitir lectura publica de resultados agregados (solo SELECT)
create policy "Lectura publica de votos"
  on votos_encuesta for select
  using (true);

create policy "Lectura publica de metadata de actas"
  on actas_archivos for select
  using (true);

-- NOTA: no se crean policies de INSERT para el rol "anon" a proposito.
-- Todas las escrituras pasan por el backend (service_role key),
-- que aplica sus propias validaciones (un voto por session_id, etc).
