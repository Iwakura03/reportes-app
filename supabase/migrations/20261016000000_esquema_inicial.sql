-- =====================================================================
-- Esquema inicial: reportes ciudadanos con PostGIS
--
-- Cómo aplicarlo: copia todo este archivo en Supabase > SQL Editor y
-- ejecútalo una sola vez.
--
-- Modelo de usuarios:
--   * Cualquiera (rol "anon") puede crear reportes sin cuenta.
--   * Quien crea una cuenta (rol "authenticated") queda asociado a sus reportes.
--   * El personal municipal tiene rol 'admin' en public.perfiles. Para
--     nombrar a alguien admin, ejecuta en el SQL Editor:
--       update public.perfiles set rol = 'admin' where id = '<uuid del usuario>';
-- =====================================================================

create extension if not exists postgis with schema extensions;

create type public.estado_reporte as enum (
  'pendiente', 'en_revision', 'en_proceso', 'resuelto', 'rechazado'
);

create type public.rol_usuario as enum ('ciudadano', 'admin');


-- ---------------------------------------------------------------------
-- Perfiles (uno por usuario registrado)
-- ---------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text check (char_length(nombre) <= 80),
  rol public.rol_usuario not null default 'ciudadano',
  created_at timestamptz not null default now()
);

-- Se usa dentro de las políticas RLS. Es "security definer" para poder leer
-- perfiles sin provocar recursión en la política de esa misma tabla.
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin'
  );
$$;

-- Crea el perfil automáticamente cuando alguien se registra.
create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, left(new.raw_user_meta_data ->> 'nombre', 80));
  return new;
end;
$$;

revoke execute on function public.crear_perfil() from public, anon, authenticated;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();


-- ---------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------
create table public.categorias (
  id smallint generated always as identity primary key,
  slug text not null unique,
  nombre text not null,
  icono text not null,          -- nombre del icono en lucide-react
  color text not null,          -- color hexadecimal del marcador
  orden smallint not null default 0,
  activa boolean not null default true
);

insert into public.categorias (slug, nombre, icono, color, orden) values
  ('baches',       'Baches y calzada',       'Construction',  '#ea580c', 1),
  ('alumbrado',    'Alumbrado público',      'Lightbulb',     '#ca8a04', 2),
  ('basura',       'Basura y limpieza',      'Trash2',        '#16a34a', 3),
  ('agua',         'Agua y alcantarillado',  'Droplets',      '#0284c7', 4),
  ('mobiliario',   'Mobiliario urbano',      'Armchair',      '#7c3aed', 5),
  ('senalizacion', 'Señalización y tráfico', 'TriangleAlert', '#dc2626', 6),
  ('zonas-verdes', 'Parques y zonas verdes', 'Trees',         '#15803d', 7),
  ('otro',         'Otro',                   'CircleHelp',    '#475569', 99);


-- ---------------------------------------------------------------------
-- Reportes
-- ---------------------------------------------------------------------
create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(trim(titulo)) between 5 and 120),
  descripcion text check (char_length(descripcion) <= 2000),
  categoria_id smallint not null references public.categorias (id),
  estado public.estado_reporte not null default 'pendiente',

  -- Punto en WGS84. Desde el cliente se envía como texto EWKT:
  --   'SRID=4326;POINT(<lng> <lat>)'   (¡primero la longitud!)
  ubicacion extensions.geography (Point, 4326) not null,
  -- Columnas calculadas para leer las coordenadas sin decodificar PostGIS.
  lat double precision generated always as
    (extensions.st_y(ubicacion::extensions.geometry)) stored,
  lng double precision generated always as
    (extensions.st_x(ubicacion::extensions.geometry)) stored,

  direccion text check (char_length(direccion) <= 200),
  foto_path text check (foto_path like 'reportes/%'),
  usuario_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reportes_ubicacion_idx on public.reportes using gist (ubicacion);
create index reportes_estado_idx on public.reportes (estado);
create index reportes_categoria_idx on public.reportes (categoria_id);
create index reportes_created_at_idx on public.reportes (created_at desc);
create index reportes_usuario_idx on public.reportes (usuario_id);

-- Impide que el cliente falsee campos protegidos: un reporte nuevo siempre
-- nace "pendiente" y asociado a quien lo crea (null si es anónimo).
create function public.proteger_campos_reporte()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.usuario_id := auth.uid();
    new.created_at := now();
  else
    new.usuario_id := old.usuario_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger proteger_campos_reporte
  before insert or update on public.reportes
  for each row execute function public.proteger_campos_reporte();


-- ---------------------------------------------------------------------
-- Actualizaciones (historial de estados y respuestas del municipio)
-- ---------------------------------------------------------------------
create table public.actualizaciones (
  id bigint generated always as identity primary key,
  reporte_id uuid not null references public.reportes (id) on delete cascade,
  estado public.estado_reporte not null,
  comentario text check (char_length(comentario) <= 1000),
  autor_id uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index actualizaciones_reporte_idx on public.actualizaciones (reporte_id, created_at);

-- Al registrar una actualización, el reporte pasa a ese estado.
create function public.aplicar_actualizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.reportes set estado = new.estado where id = new.reporte_id;
  return new;
end;
$$;

create trigger aplicar_actualizacion
  after insert on public.actualizaciones
  for each row execute function public.aplicar_actualizacion();


-- ---------------------------------------------------------------------
-- Búsqueda geoespacial: reportes abiertos cerca de un punto
-- (para avisar de posibles duplicados antes de crear uno nuevo)
-- ---------------------------------------------------------------------
create function public.reportes_cercanos(
  p_lat double precision,
  p_lng double precision,
  p_radio_m integer default 50
)
returns table (
  id uuid,
  titulo text,
  categoria_id smallint,
  estado public.estado_reporte,
  distancia_m double precision,
  created_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  with punto as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  )
  select r.id, r.titulo, r.categoria_id, r.estado,
         extensions.st_distance(r.ubicacion, punto.g) as distancia_m,
         r.created_at
  from public.reportes r, punto
  where extensions.st_dwithin(r.ubicacion, punto.g, least(greatest(p_radio_m, 1), 1000))
    and r.estado not in ('resuelto', 'rechazado')
  order by distancia_m
  limit 10;
$$;


-- ---------------------------------------------------------------------
-- Permisos y Row Level Security
-- ---------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.reportes enable row level security;
alter table public.actualizaciones enable row level security;

-- Partimos de cero y concedemos solo lo necesario.
revoke all on public.perfiles, public.categorias, public.reportes, public.actualizaciones
  from anon, authenticated;

grant select on public.categorias to anon, authenticated;
grant insert, update, delete on public.categorias to authenticated;

grant select, insert on public.reportes to anon, authenticated;
grant update, delete on public.reportes to authenticated;

grant select on public.actualizaciones to anon, authenticated;
grant insert on public.actualizaciones to authenticated;

grant select on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;  -- el rol no se puede cambiar desde la app

-- Categorías
create policy "Categorías visibles para todos"
  on public.categorias for select to anon, authenticated
  using (true);

create policy "Admins gestionan categorías"
  on public.categorias for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Reportes
create policy "Reportes visibles para todos"
  on public.reportes for select to anon, authenticated
  using (true);

create policy "Cualquiera puede crear reportes"
  on public.reportes for insert to anon, authenticated
  with check (true);  -- el trigger fija estado y usuario_id

create policy "Admins actualizan reportes"
  on public.reportes for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy "Admins borran reportes"
  on public.reportes for delete to authenticated
  using (public.es_admin());

-- Actualizaciones
create policy "Actualizaciones visibles para todos"
  on public.actualizaciones for select to anon, authenticated
  using (true);

create policy "Admins publican actualizaciones"
  on public.actualizaciones for insert to authenticated
  with check (public.es_admin() and autor_id = (select auth.uid()));

-- Perfiles
create policy "Cada usuario ve su perfil; los admins ven todos"
  on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

create policy "Cada usuario edita su perfil"
  on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- Storage: fotos de los reportes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-reportes', 'fotos-reportes', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Bucket público: las fotos se leen por URL. No hay política de select,
-- así que nadie puede listar el bucket, y sin política de update no se
-- pueden sobrescribir fotos ajenas.
create policy "Cualquiera sube fotos de reportes"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'fotos-reportes'
    and (storage.foldername(name))[1] = 'reportes'
  );

create policy "Admins borran fotos de reportes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-reportes' and public.es_admin());
