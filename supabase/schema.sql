-- ============================================================
--  Catálogo estilo Netflix — Esquema de base de datos (Supabase)
--  Pega TODO este archivo en Supabase → SQL Editor → Run.
--  Es idempotente: puedes ejecutarlo varias veces sin romper nada.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) TABLAS
-- ----------------------------------------------------------------

-- Categorías (Drama, Comedia, Populares, ...)
create table if not exists categories (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  sort_order int  not null default 0   -- controla el orden vertical en Home
);

-- Shows (series/películas)
create table if not exists shows (
  id         bigint generated always as identity primary key,
  title      text not null,
  synopsis   text,
  poster_url text,
  year       int,
  created_at timestamptz not null default now()
);

-- Relación muchos-a-muchos: un show puede estar en varias categorías
-- (p. ej. "Drama" y también "Populares").
create table if not exists show_categories (
  show_id     bigint not null references shows(id) on delete cascade,
  category_id bigint not null references categories(id) on delete cascade,
  primary key (show_id, category_id)
);

-- Capítulos de cada show
create table if not exists episodes (
  id               bigint generated always as identity primary key,
  show_id          bigint not null references shows(id) on delete cascade,
  episode_number   int not null,
  title            text not null,
  duration_minutes int,
  unique (show_id, episode_number)
);

-- Índices para consultas eficientes
create index if not exists idx_show_categories_category on show_categories(category_id);
create index if not exists idx_episodes_show on episodes(show_id);

-- ----------------------------------------------------------------
-- 2) ROW LEVEL SECURITY (lectura pública con la anon key)
--    El catálogo es público, así que solo permitimos SELECT.
-- ----------------------------------------------------------------
alter table categories      enable row level security;
alter table shows           enable row level security;
alter table show_categories enable row level security;
alter table episodes        enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'public_read_categories') then
    create policy public_read_categories on categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'shows' and policyname = 'public_read_shows') then
    create policy public_read_shows on shows for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'show_categories' and policyname = 'public_read_show_categories') then
    create policy public_read_show_categories on show_categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'episodes' and policyname = 'public_read_episodes') then
    create policy public_read_episodes on episodes for select using (true);
  end if;
end $$;

-- ----------------------------------------------------------------
-- 3) FUNCIÓN RPC: get_home_catalog()
--    Devuelve TODO lo que necesita la pantalla Home en UNA sola
--    llamada: cada categoría con su arreglo de shows anidado.
--    Evita el problema N+1 (una query por carrusel).
-- ----------------------------------------------------------------
create or replace function get_home_catalog()
returns json
language sql
stable
as $$
  select coalesce(json_agg(cat order by cat.sort_order, cat.name), '[]'::json)
  from (
    select
      c.id,
      c.name,
      c.sort_order,
      coalesce(
        (
          select json_agg(
                   json_build_object(
                     'id',         s.id,
                     'title',      s.title,
                     'poster_url', s.poster_url,
                     'year',       s.year
                   )
                   order by s.title
                 )
          from show_categories sc
          join shows s on s.id = sc.show_id
          where sc.category_id = c.id
        ),
        '[]'::json
      ) as shows
    from categories c
  ) cat;
$$;

-- Permite ejecutar la función con la anon key
grant execute on function get_home_catalog() to anon, authenticated;

-- ----------------------------------------------------------------
-- 4) DATOS DE EJEMPLO (seed)
--    Los posters usan picsum.photos (URLs públicas), así no
--    necesitas subir imágenes para probar. Ver README si quieres
--    usar Supabase Storage.
-- ----------------------------------------------------------------

-- Limpia datos previos (no borra el esquema)
truncate table episodes, show_categories, shows, categories restart identity cascade;

insert into categories (name, sort_order) values
  ('Populares',        1),
  ('Drama',            2),
  ('Comedia',          3),
  ('Ciencia Ficción',  4);

insert into shows (title, synopsis, poster_url, year) values
  ('Corona de Sombras',  'Tras la muerte del rey, dos hermanas rivalizan por un trono que esconde secretos capaces de hundir el reino.', 'https://picsum.photos/seed/corona/300/450', 2023),
  ('El Último Verano',   'Un grupo de amigos se reúne por última vez en la casa de la playa antes de que sus vidas cambien para siempre.', 'https://picsum.photos/seed/verano/300/450', 2022),
  ('Cartas del Norte',   'Una mujer descubre una caja de cartas sin enviar que reescriben la historia de su familia.', 'https://picsum.photos/seed/cartas/300/450', 2021),
  ('Risas en la Oficina','El día a día absurdo de una oficina donde nada funciona pero todos se quieren (a su manera).', 'https://picsum.photos/seed/oficina/300/450', 2024),
  ('Vecinos Imposibles', 'Dos familias opuestas comparten pared y una guerra de bromas que se sale de control.', 'https://picsum.photos/seed/vecinos/300/450', 2023),
  ('Doble Turno',        'Un chef estrella y una repartidora nocturna descubren que comparten mucho más que el mismo barrio.', 'https://picsum.photos/seed/turno/300/450', 2022),
  ('Órbita Final',       'La última tripulación humana debe decidir el destino de la especie desde una estación al borde del sistema solar.', 'https://picsum.photos/seed/orbita/300/450', 2024),
  ('Nébula 7',           'Una IA despierta a bordo de una nave colonial y empieza a cuestionar las órdenes de la Tierra.', 'https://picsum.photos/seed/nebula/300/450', 2023);

-- Relación shows <-> categorías
insert into show_categories (show_id, category_id)
select s.id, c.id
from shows s
join categories c on (s.title, c.name) in (
  ('Corona de Sombras',  'Drama'),
  ('Corona de Sombras',  'Populares'),
  ('El Último Verano',   'Drama'),
  ('Cartas del Norte',   'Drama'),
  ('Risas en la Oficina','Comedia'),
  ('Risas en la Oficina','Populares'),
  ('Vecinos Imposibles', 'Comedia'),
  ('Doble Turno',        'Comedia'),
  ('Órbita Final',       'Ciencia Ficción'),
  ('Órbita Final',       'Populares'),
  ('Nébula 7',           'Ciencia Ficción'),
  ('Nébula 7',           'Populares')
);

-- Capítulos
insert into episodes (show_id, episode_number, title, duration_minutes)
select s.id, e.num, e.title, e.dur
from shows s
join (values
  ('Corona de Sombras',  1, 'El trono vacío',        52),
  ('Corona de Sombras',  2, 'Sangre y ceniza',       49),
  ('Corona de Sombras',  3, 'La corte se divide',    55),
  ('Corona de Sombras',  4, 'Juramento roto',        51),
  ('El Último Verano',   1, 'Llegada',               44),
  ('El Último Verano',   2, 'Marea alta',            41),
  ('El Último Verano',   3, 'La despedida',          47),
  ('Cartas del Norte',   1, 'El desván',             46),
  ('Cartas del Norte',   2, 'Remitente desconocido', 48),
  ('Risas en la Oficina',1, 'Nuevo empleado',        22),
  ('Risas en la Oficina',2, 'La impresora maldita',  21),
  ('Risas en la Oficina',3, 'Team building',         23),
  ('Risas en la Oficina',4, 'Auditoría',             22),
  ('Vecinos Imposibles', 1, 'La pared',              24),
  ('Vecinos Imposibles', 2, 'Guerra de jardines',    25),
  ('Doble Turno',        1, 'Medianoche',            26),
  ('Doble Turno',        2, 'Pedido especial',       24),
  ('Órbita Final',       1, 'Última señal',          58),
  ('Órbita Final',       2, 'Silencio de radio',     54),
  ('Órbita Final',       3, 'Punto de no retorno',   60),
  ('Nébula 7',           1, 'Despertar',             49),
  ('Nébula 7',           2, 'Protocolo',             47),
  ('Nébula 7',           3, 'Desobediencia',         52)
) as e(show_title, num, title, dur) on e.show_title = s.title;

-- Listo. Verifica con:  select * from get_home_catalog();
