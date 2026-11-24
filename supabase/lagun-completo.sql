-- =====================================================================
-- Lagun — instalación completa de la base de datos (todo en uno)
-- Pega este archivo ENTERO en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez: borra lo que hubiera de Lagun y lo
-- vuelve a crear. No toca nada que no sea de Lagun.
-- =====================================================================

-- Limpieza de intentos anteriores
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists
  public.push_subscriptions, public.exams, public.favorites, public.feed_posts,
  public.user_inventory, public.shop_items, public.activities, public.mood_checkins,
  public.emotions, public.assessments, public.profiles
  cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.apply_assessment() cascade;
drop function if exists public.award_points(text) cascade;
drop function if exists public.buy_item(text) cascade;
drop function if exists public.equip_item(text, text) cascade;

-- ===== 0001_schema.sql =====
-- =====================================================================
-- Lagun — esquema inicial
-- Principios:
--   * RLS activado en TODAS las tablas.
--   * Los datos de usuario solo son visibles para su dueño (auth.uid()).
--   * Puntos, compras y equipamiento de la rana pasan por funciones
--     SECURITY DEFINER: el cliente no puede escribir `points` directamente.
--   * El chat NO tiene tabla: es efímero y vive solo en memoria del cliente.
--   * Las evaluaciones (assessments) nunca se modifican ni se borran desde
--     la app; solo desaparecen si la persona borra su cuenta (derecho de
--     supresión RGPD → ON DELETE CASCADE).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  -- Inicio de sesión con nombre de usuario (sin email ni más datos personales).
  username              text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name          text not null check (char_length(display_name) between 1 and 40),
  -- Casilla del registro: "tengo 14 años o más, o mi madre/padre/tutor/a me da permiso".
  age_consent           boolean not null,
  consent_at            timestamptz not null default now(),
  theme                 text not null default 'system' check (theme in ('light', 'dark', 'system')),
  primary_area          text check (primary_area in ('acad', 'soc', 'fam', 'iden')),
  active_areas          text[] not null default '{}',
  frog_state            jsonb not null default '{"color":"color_verde"}'::jsonb,
  points                integer not null default 0 check (points >= 0),
  end_of_day_checkin    boolean not null default false,
  checkin_hour          integer not null default 21 check (checkin_hour between 0 and 23),
  -- 0 = domingo … 6 = sábado (como Date.getDay()). Frecuencia configurable.
  checkin_days          integer[] not null default '{0,1,2,3,4,5,6}',
  notifications_enabled boolean not null default false,
  timezone              text not null default 'Europe/Madrid',
  country               text not null default 'ES',
  onboarded_at          timestamptz,
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- assessments (cuestionario inicial + re-evaluaciones mensuales)
-- ---------------------------------------------------------------------
create table public.assessments (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  taken_at      timestamptz not null default now(),
  raw_answers   jsonb not null,
  scores        jsonb not null,
  primary_area  text check (primary_area in ('acad', 'soc', 'fam', 'iden')),
  active_areas  text[] not null default '{}'
);
create index assessments_user_taken_idx on public.assessments (user_id, taken_at desc);

-- ---------------------------------------------------------------------
-- emociones (jarra) y check-ins de ánimo
-- ---------------------------------------------------------------------
create table public.emotions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  emotion     text not null check (emotion in
                ('alegria', 'calma', 'gratitud', 'tristeza', 'ansiedad', 'enfado', 'miedo', 'cansancio')),
  color       text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  intensity   integer not null default 3 check (intensity between 1 and 5),
  created_at  timestamptz not null default now()
);
create index emotions_user_created_idx on public.emotions (user_id, created_at desc);

create table public.mood_checkins (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  mood        integer not null check (mood between 0 and 4),
  note        text check (note is null or char_length(note) <= 500),
  created_at  timestamptz not null default now()
);
create index mood_checkins_user_created_idx on public.mood_checkins (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- actividades de autocuidado (dan puntos). Solo se insertan vía award_points().
-- ---------------------------------------------------------------------
create table public.activities (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  type           text not null,
  points_earned  integer not null default 0 check (points_earned >= 0),
  created_at     timestamptz not null default now()
);
create index activities_user_created_idx on public.activities (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- tienda de la rana
-- ---------------------------------------------------------------------
create table public.shop_items (
  id         text primary key,
  name       text not null,
  category   text not null check (category in ('color', 'hat', 'glasses', 'outfit', 'accessory', 'corner')),
  cost       integer not null check (cost >= 0),
  asset_key  text not null unique
);

create table public.user_inventory (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  item_id      text not null references public.shop_items (id) on delete cascade,
  acquired_at  timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------------------------------------------------------------------
-- feed
-- ---------------------------------------------------------------------
create table public.feed_posts (
  id          bigint generated always as identity primary key,
  type        text not null check (type in ('frase', 'historia', 'consejo')),
  area        text not null check (area in ('acad', 'soc', 'fam', 'iden', 'general')),
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table public.favorites (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  post_id  bigint not null references public.feed_posts (id) on delete cascade,
  primary key (user_id, post_id)
);

-- ---------------------------------------------------------------------
-- exámenes / entregas (módulo académico)
-- ---------------------------------------------------------------------
create table public.exams (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  subject     text not null check (char_length(subject) between 1 and 60),
  title       text not null check (char_length(title) between 1 and 120),
  due_date    date not null,
  created_at  timestamptz not null default now()
);
create index exams_user_due_idx on public.exams (user_id, due_date);

-- ---------------------------------------------------------------------
-- suscripciones Web Push (opt-in)
-- ---------------------------------------------------------------------
create table public.push_subscriptions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.assessments        enable row level security;
alter table public.emotions           enable row level security;
alter table public.mood_checkins      enable row level security;
alter table public.activities         enable row level security;
alter table public.shop_items         enable row level security;
alter table public.user_inventory     enable row level security;
alter table public.feed_posts         enable row level security;
alter table public.favorites          enable row level security;
alter table public.exams              enable row level security;
alter table public.push_subscriptions enable row level security;

-- Privilegios base: nadie anónimo toca datos de usuario.
revoke all on public.profiles, public.assessments, public.emotions, public.mood_checkins,
  public.activities, public.user_inventory, public.favorites, public.exams,
  public.push_subscriptions from anon;
revoke all on public.profiles, public.activities, public.user_inventory from authenticated;

-- profiles: lectura propia; solo columnas "seguras" son editables desde el cliente.
grant select on public.profiles to authenticated;
grant update (display_name, theme, end_of_day_checkin, checkin_hour, checkin_days,
              notifications_enabled, timezone, country)
  on public.profiles to authenticated;

create policy "profiles: leer el propio" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- assessments: leer e insertar los propios. Sin update/delete (histórico intocable).
grant select, insert on public.assessments to authenticated;
create policy "assessments: leer propias" on public.assessments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "assessments: insertar propias" on public.assessments
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- emotions
create policy "emotions: leer propias" on public.emotions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "emotions: insertar propias" on public.emotions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "emotions: borrar propias" on public.emotions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- mood_checkins
create policy "mood: leer propios" on public.mood_checkins
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "mood: insertar propios" on public.mood_checkins
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "mood: borrar propios" on public.mood_checkins
  for delete to authenticated using ((select auth.uid()) = user_id);

-- activities: solo lectura desde el cliente (se insertan vía award_points()).
grant select on public.activities to authenticated;
create policy "activities: leer propias" on public.activities
  for select to authenticated using ((select auth.uid()) = user_id);

-- shop_items y feed_posts: lectura pública.
grant select on public.shop_items, public.feed_posts to anon, authenticated;
create policy "shop_items: lectura pública" on public.shop_items
  for select to anon, authenticated using (true);
create policy "feed_posts: lectura pública" on public.feed_posts
  for select to anon, authenticated using (true);

-- user_inventory: solo lectura (se compra vía buy_item()).
grant select on public.user_inventory to authenticated;
create policy "inventory: leer el propio" on public.user_inventory
  for select to authenticated using ((select auth.uid()) = user_id);

-- favorites
create policy "favorites: leer propios" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "favorites: insertar propios" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "favorites: borrar propios" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

-- exams
create policy "exams: leer propios" on public.exams
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "exams: insertar propios" on public.exams
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "exams: editar propios" on public.exams
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "exams: borrar propios" on public.exams
  for delete to authenticated using ((select auth.uid()) = user_id);

-- push_subscriptions
create policy "push: leer propias" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "push: insertar propias" on public.push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push: borrar propias" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- =====================================================================
-- Funciones y triggers
-- =====================================================================

-- Alta de perfil al registrarse (solo usuario + contraseña).
-- Exige la casilla de edad/consentimiento (LOPDGDD art. 7: 14 años).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_consent  boolean;
  v_tz       text;
begin
  v_username := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_consent  := coalesce((new.raw_user_meta_data ->> 'age_consent')::boolean, false);
  v_tz       := coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Europe/Madrid');

  if v_username is null or v_username !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'Nombre de usuario no válido';
  end if;
  if not v_consent then
    raise exception 'Hace falta confirmar la edad o el permiso de madre, padre o tutor/a';
  end if;

  insert into public.profiles (id, username, display_name, age_consent, timezone)
  values (new.id, v_username, v_username, v_consent, v_tz);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Al guardar una evaluación, se re-personaliza la home. El histórico queda intacto.
create or replace function public.apply_assessment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set primary_area = new.primary_area,
         active_areas = new.active_areas,
         onboarded_at = coalesce(onboarded_at, now())
   where id = new.user_id;
  return new;
end;
$$;

create trigger on_assessment_inserted
  after insert on public.assessments
  for each row execute function public.apply_assessment();

-- Puntos por AUTOCUIDADO. Nunca por constancia ni por entrar días seguidos.
-- Hay un tope diario por tipo solo para que no se pueda "farmear"; la
-- actividad se registra igual (cuenta en estadísticas) aunque dé 0 puntos.
create or replace function public.award_points(p_type text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_points integer;
  v_cap    integer;
  v_today  integer;
  v_earned integer;
begin
  if v_uid is null then
    raise exception 'no autenticado';
  end if;

  select pts, cap into v_points, v_cap
  from (values
    ('checkin',    5, 3),
    ('emotion',    3, 5),
    ('breathing',  5, 3),
    ('grounding',  5, 3),
    ('story',      2, 5),
    ('pomodoro',   5, 4),
    ('challenge',  5, 2),
    ('journal',    3, 3),
    ('module',     2, 5),
    ('chat',       3, 2),
    ('assessment', 10, 1)
  ) as t(kind, pts, cap)
  where kind = p_type;

  if v_points is null then
    raise exception 'tipo de actividad desconocido: %', p_type;
  end if;

  select count(*) into v_today
  from public.activities
  where user_id = v_uid and type = p_type and created_at >= date_trunc('day', now());

  v_earned := case when v_today < v_cap then v_points else 0 end;

  insert into public.activities (user_id, type, points_earned) values (v_uid, p_type, v_earned);
  if v_earned > 0 then
    update public.profiles set points = points + v_earned where id = v_uid;
  end if;

  return v_earned;
end;
$$;

-- Comprar un objeto de la tienda.
create or replace function public.buy_item(p_item text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_cost   integer;
  v_points integer;
begin
  if v_uid is null then
    raise exception 'no autenticado';
  end if;

  select cost into v_cost from public.shop_items where id = p_item;
  if v_cost is null then
    raise exception 'objeto no encontrado';
  end if;

  if exists (select 1 from public.user_inventory where user_id = v_uid and item_id = p_item) then
    raise exception 'ya lo tienes';
  end if;

  select points into v_points from public.profiles where id = v_uid for update;
  if v_points < v_cost then
    raise exception 'puntos insuficientes';
  end if;

  update public.profiles set points = points - v_cost where id = v_uid returning points into v_points;
  insert into public.user_inventory (user_id, item_id) values (v_uid, p_item);
  return v_points;
end;
$$;

-- Equipar / quitar un objeto (solo si es tuyo o gratuito).
create or replace function public.equip_item(p_category text, p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_state jsonb;
begin
  if v_uid is null then
    raise exception 'no autenticado';
  end if;
  if p_category not in ('color', 'hat', 'glasses', 'outfit', 'accessory', 'corner') then
    raise exception 'categoría no válida';
  end if;

  if p_item is not null and not exists (
    select 1 from public.shop_items s
    where s.id = p_item and s.category = p_category
      and (s.cost = 0 or exists (
        select 1 from public.user_inventory i where i.user_id = v_uid and i.item_id = s.id))
  ) then
    raise exception 'no tienes este objeto';
  end if;

  if p_item is null and p_category = 'color' then
    p_item := 'color_verde';
  end if;

  update public.profiles
     set frog_state = case
       when p_item is null then frog_state - p_category
       else jsonb_set(frog_state, array[p_category], to_jsonb(p_item))
     end
   where id = v_uid
   returning frog_state into v_state;

  return v_state;
end;
$$;

revoke all on function public.award_points(text), public.buy_item(text), public.equip_item(text, text) from public, anon;
grant execute on function public.award_points(text), public.buy_item(text), public.equip_item(text, text) to authenticated;
revoke all on function public.handle_new_user(), public.apply_assessment() from public, anon, authenticated;

-- ===== seed.sql =====
-- =====================================================================
-- Lagun — datos iniciales (tienda + feed)
-- =====================================================================

insert into public.shop_items (id, name, category, cost, asset_key) values
  -- colores de piel
  ('color_verde',     'Verde clásico',     'color', 0,   'color_verde'),
  ('color_turquesa',  'Turquesa Lagun',    'color', 40,  'color_turquesa'),
  ('color_lima',      'Lima',              'color', 40,  'color_lima'),
  ('color_rosa',      'Rosa chicle',       'color', 60,  'color_rosa'),
  ('color_lila',      'Lila',              'color', 60,  'color_lila'),
  ('color_dorado',    'Dorado',            'color', 120, 'color_dorado'),
  -- gorros
  ('hat_beanie',      'Gorro de lana',     'hat', 30,  'hat_beanie'),
  ('hat_cap',         'Gorra',             'hat', 30,  'hat_cap'),
  ('hat_flowers',     'Corona de flores',  'hat', 50,  'hat_flowers'),
  ('hat_headphones',  'Cascos',            'hat', 70,  'hat_headphones'),
  ('hat_crown',       'Coronita',          'hat', 150, 'hat_crown'),
  -- gafas
  ('glasses_round',   'Gafas redondas',    'glasses', 25, 'glasses_round'),
  ('glasses_sun',     'Gafas de sol',      'glasses', 40, 'glasses_sun'),
  ('glasses_heart',   'Gafas de corazón',  'glasses', 60, 'glasses_heart'),
  -- ropa
  ('outfit_scarf',    'Bufanda',           'outfit', 35, 'outfit_scarf'),
  ('outfit_bowtie',   'Pajarita',          'outfit', 30, 'outfit_bowtie'),
  ('outfit_hoodie',   'Sudadera',          'outfit', 80, 'outfit_hoodie'),
  ('outfit_cape',     'Capa de superhéroe','outfit', 120,'outfit_cape'),
  -- accesorios
  ('acc_tea',         'Taza de té',        'accessory', 20, 'acc_tea'),
  ('acc_book',        'Libro',             'accessory', 25, 'acc_book'),
  ('acc_plant',       'Plantita',          'accessory', 35, 'acc_plant'),
  ('acc_balloon',     'Globo',             'accessory', 45, 'acc_balloon'),
  -- rinconcito
  ('corner_lily',     'Nenúfar',           'corner', 0,   'corner_lily'),
  ('corner_cushion',  'Cojín blandito',    'corner', 40,  'corner_cushion'),
  ('corner_lights',   'Lucecitas',         'corner', 60,  'corner_lights'),
  ('corner_rainbow',  'Arcoíris',          'corner', 90,  'corner_rainbow'),
  ('corner_night',    'Cielo estrellado',  'corner', 110, 'corner_night')
on conflict (id) do nothing;

insert into public.feed_posts (type, area, title, body) values
  -- generales
  ('frase', 'general', 'Un día a la vez', 'No tienes que tenerlo todo resuelto hoy. Basta con el siguiente paso pequeño.'),
  ('frase', 'general', 'Tu ritmo vale', 'Descansar no es rendirse. Es parte del camino.'),
  ('frase', 'general', 'Sentir no es fallar', 'Estar mal a veces no significa que estés haciendo algo mal. Significa que eres humano/a.'),
  ('consejo', 'general', 'Respiración 4-7-8', 'Inspira por la nariz contando 4, aguanta 7, suelta por la boca en 8. Repite 3 o 4 veces. Le dice a tu cuerpo que puede bajar revoluciones.'),
  ('consejo', 'general', 'Grounding 5-4-3-2-1', 'Nombra 5 cosas que ves, 4 que puedes tocar, 3 que oyes, 2 que hueles y 1 que saboreas. Te ayuda a volver al presente cuando la cabeza va a mil.'),
  ('consejo', 'general', 'Dormir también es autocuidado', 'Deja el móvil un rato antes de dormir y prueba a apuntar en un papel lo que te ronda. Sacarlo de la cabeza ayuda a soltarlo.'),
  ('historia', 'general', 'El día que pedí ayuda', 'Laia llevaba semanas sin ganas de nada. Pensaba que contarlo era molestar. Un día se lo dijo a su prima, casi sin querer. "No arregló todo, pero dejé de cargarlo sola", cuenta. A veces el primer paso es solo decirlo en voz alta.'),
  ('historia', 'general', 'Volver sin culpa', 'Marc dejó de hacer las cosas que le sentaban bien durante un mes. Cuando volvió, se sintió fatal por "haberlo dejado". Hasta que entendió que volver ya era cuidarse. No hay que empezar de cero: se sigue desde donde estás.'),
  -- académico
  ('consejo', 'acad', 'La técnica Pomodoro', '25 minutos de foco, 5 de descanso. Tras 4 rondas, descanso largo. Lo importante no es estudiar mucho rato, es estudiar con la cabeza fresca.'),
  ('consejo', 'acad', 'Repaso espaciado', 'Repasar un poco hoy, otro poco en 2 días y otro en una semana funciona mejor que una maratón la noche antes. Tu memoria te lo agradece.'),
  ('consejo', 'acad', 'Trocea la montaña', 'Si una tarea te agobia, divídela en pasos tan pequeños que den casi risa. "Abrir el libro" ya es un paso.'),
  ('frase', 'acad', 'Una nota no te define', 'Eres mucho más que un examen. Tu valor no cabe en un número del 0 al 10.'),
  ('historia', 'acad', 'Compararme me agotaba', 'Iker siempre miraba las notas de los demás. "Cuanto más me comparaba, peor estudiaba", dice. Empezó a apuntar solo sus pequeños avances de cada semana. Le cambió la manera de verse.'),
  ('consejo', 'acad', 'Antes del examen', 'Si notas nervios, prueba a respirar lento y a recordarte: "me he preparado lo que he podido". Los nervios también son energía para concentrarte.'),
  -- social
  ('consejo', 'soc', 'Empezar una conversación', 'Una pregunta abierta sobre algo que compartís ("¿qué te ha parecido el examen?") es una puerta fácil. No hace falta ser gracioso/a, basta con tener curiosidad.'),
  ('frase', 'soc', 'No hace falta gustar a todo el mundo', 'Las personas que de verdad son para ti te van a querer tal y como eres.'),
  ('historia', 'soc', 'Sola en el recreo', 'Nerea cambió de insti y pasó semanas sola. Se apuntó a un taller de teatro sin conocer a nadie. "Me temblaban las piernas", recuerda. Hoy dos de sus mejores amigas salieron de ahí.'),
  ('consejo', 'soc', 'Cuando la ansiedad social aprieta', 'Recuerda que la mayoría de la gente está pendiente de sí misma, no de ti. Céntrate en lo que dice la otra persona: baja el foco de tu propia cabeza.'),
  ('frase', 'soc', 'Sentirse solo/a pasa', 'Sentir soledad no dice nada malo de ti. Dice que necesitas conexión, y eso es muy humano.'),
  -- familiar
  ('consejo', 'fam', 'Mensajes "yo"', 'En vez de "nunca me escuchas", prueba "yo me siento ignorado/a cuando…". Hablar desde lo que sientes suele bajar la tensión.'),
  ('consejo', 'fam', 'Elegir el momento', 'Las conversaciones importantes van mejor cuando nadie está con prisa ni enfadado. Puedes decir: "¿podemos hablar luego de algo que me importa?".'),
  ('frase', 'fam', 'Poner límites también es querer', 'Decir "esto no me sienta bien" es cuidar la relación, no romperla.'),
  ('historia', 'fam', 'Una carta en la nevera', 'A Pablo le costaba hablar con su padre sin discutir. Un día le escribió una nota explicando cómo se sentía. "No hablamos de ello hasta dos días después, pero fue la primera conversación de verdad en meses".'),
  ('consejo', 'fam', 'Cuando en casa hay tensión', 'Busca un pequeño refugio: tu música, un paseo, un rincón tranquilo. Y recuerda que no eres responsable de arreglar los problemas de los adultos.'),
  -- identidad
  ('frase', 'iden', 'Eres válido/a', 'Quién eres y a quién quieres no necesita la aprobación de nadie para ser real.'),
  ('frase', 'iden', 'Sin prisa', 'No tienes que ponerte una etiqueta hoy, ni nunca si no quieres. Conocerte es un proceso, no un examen.'),
  ('historia', 'iden', 'Lo que me hubiera gustado oír', 'Álex tardó años en hablar de su identidad. "Me habría ayudado saber que no era la única persona sintiéndose así", dice. Hoy forma parte de un grupo de jóvenes donde se apoyan mutuamente.'),
  ('consejo', 'iden', 'Busca tu gente', 'Hay colectivos y grupos de jóvenes LGTBIQ+ donde puedes hablar con personas que entienden lo que vives. Encontrar tu sitio ayuda muchísimo.'),
  ('consejo', 'iden', 'Si temes el rechazo', 'No tienes que contárselo a nadie antes de estar preparado/a. Empieza, si quieres, por alguien de confianza que sepas que te va a cuidar.'),
  ('frase', 'iden', 'Mereces sentirte bien siendo tú', 'Tu forma de ser no es un problema que haya que resolver.');

-- ===== 0002_idiomas.sql =====
-- =====================================================================
-- Lagun — idiomas (castellano, català, euskara, galego, English)
-- Ejecutar DESPUÉS de 0001_schema.sql y seed.sql.
-- =====================================================================

-- Idioma de la persona
alter table public.profiles
  add column if not exists locale text not null default 'es'
  check (locale in ('es', 'ca', 'eu', 'gl', 'en'));
grant update (locale) on public.profiles to authenticated;

-- Idioma de cada post del feed (los existentes son en castellano)
alter table public.feed_posts
  add column if not exists lang text not null default 'es'
  check (lang in ('es', 'ca', 'eu', 'gl', 'en'));
create index if not exists feed_posts_lang_area_idx on public.feed_posts (lang, area);

-- El registro guarda el idioma elegido en la portada
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_consent  boolean;
  v_tz       text;
  v_locale   text;
begin
  v_username := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_consent  := coalesce((new.raw_user_meta_data ->> 'age_consent')::boolean, false);
  v_tz       := coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Europe/Madrid');
  v_locale   := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'es');
  if v_locale not in ('es', 'ca', 'eu', 'gl', 'en') then
    v_locale := 'es';
  end if;

  if v_username is null or v_username !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'Nombre de usuario no válido';
  end if;
  if not v_consent then
    raise exception 'Hace falta confirmar la edad o el permiso de madre, padre o tutor/a';
  end if;

  insert into public.profiles (id, username, display_name, age_consent, timezone, locale)
  values (new.id, v_username, v_username, v_consent, v_tz, v_locale);

  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Feed traducido (català, euskara, galego, English)
-- ---------------------------------------------------------------------
insert into public.feed_posts (type, area, title, body, lang) values
  ('frase', 'general', 'Un dia cada vegada', 'No ho has de tenir tot resolt avui. N''hi ha prou amb la següent passa petita.', 'ca'),
  ('frase', 'general', 'El teu ritme compta', 'Descansar no és rendir-se. És part del camí.', 'ca'),
  ('frase', 'general', 'Sentir no és fallar', 'Estar malament de vegades no vol dir que facis res malament. Vol dir que ets humà/ana.', 'ca'),
  ('consejo', 'general', 'Respiració 4-7-8', 'Inspira pel nas comptant 4, aguanta 7, deixa anar per la boca en 8. Repeteix-ho 3 o 4 vegades. Li diu al teu cos que pot abaixar revolucions.', 'ca'),
  ('consejo', 'general', 'Grounding 5-4-3-2-1', 'Anomena 5 coses que veus, 4 que pots tocar, 3 que sents, 2 que olores i 1 que tastes. T''ajuda a tornar al present quan el cap va a mil.', 'ca'),
  ('consejo', 'general', 'Dormir també és autocura', 'Deixa el mòbil una estona abans de dormir i prova d''apuntar en un paper el que et volta pel cap. Treure-ho del cap ajuda a deixar-ho anar.', 'ca'),
  ('historia', 'general', 'El dia que vaig demanar ajuda', 'La Laia feia setmanes que no tenia ganes de res. Pensava que explicar-ho era molestar. Un dia ho va dir a la seva cosina, gairebé sense voler. «No ho va arreglar tot, però vaig deixar de carregar-ho sola», explica. A vegades la primera passa és només dir-ho en veu alta.', 'ca'),
  ('historia', 'general', 'Tornar sense culpa', 'En Marc va deixar de fer les coses que li anaven bé durant un mes. Quan hi va tornar, se sentia fatal per «haver-ho deixat». Fins que va entendre que tornar ja era cuidar-se. No cal començar de zero: se segueix des d''on ets.', 'ca'),
  ('consejo', 'acad', 'La tècnica Pomodoro', '25 minuts de focus, 5 de descans. Després de 4 rondes, descans llarg. L''important no és estudiar molta estona, és estudiar amb el cap fresc.', 'ca'),
  ('consejo', 'acad', 'Repàs espaiat', 'Repassar una mica avui, una altra mica d''aquí a 2 dies i una altra d''aquí a una setmana funciona millor que una marató la nit abans. La teva memòria t''ho agrairà.', 'ca'),
  ('consejo', 'acad', 'Divideix la muntanya', 'Si una tasca t''angoixa, divideix-la en passos tan petits que gairebé facin riure. «Obrir el llibre» ja és un pas.', 'ca'),
  ('frase', 'acad', 'Una nota no et defineix', 'Ets molt més que un examen. El teu valor no cap en un número del 0 al 10.', 'ca'),
  ('historia', 'acad', 'Comparar-me m''esgotava', 'L''Iker sempre mirava les notes dels altres. «Com més em comparava, pitjor estudiava», diu. Va començar a apuntar només els seus petits avenços de cada setmana. Li va canviar la manera de veure''s.', 'ca'),
  ('consejo', 'acad', 'Abans de l''examen', 'Si notes nervis, prova de respirar a poc a poc i recordar-te: «m''he preparat el que he pogut». Els nervis també són energia per concentrar-te.', 'ca'),
  ('consejo', 'soc', 'Començar una conversa', 'Una pregunta oberta sobre alguna cosa que compartiu («què t''ha semblat l''examen?») és una porta fàcil. No cal ser graciós/osa, n''hi ha prou amb tenir curiositat.', 'ca'),
  ('frase', 'soc', 'No cal agradar a tothom', 'Les persones que de veritat són per a tu t''estimaran tal com ets.', 'ca'),
  ('historia', 'soc', 'Sola al pati', 'La Nerea va canviar d''institut i va passar setmanes sola. Es va apuntar a un taller de teatre sense conèixer ningú. «Em tremolaven les cames», recorda. Avui dues de les seves millors amigues van sortir d''allà.', 'ca'),
  ('consejo', 'soc', 'Quan l''ansietat social estreny', 'Recorda que la majoria de la gent està pendent de si mateixa, no de tu. Centra''t en el que diu l''altra persona: abaixa el focus del teu propi cap.', 'ca'),
  ('frase', 'soc', 'Sentir-se sol/a passa', 'Sentir soledat no diu res dolent de tu. Diu que necessites connexió, i això és molt humà.', 'ca'),
  ('consejo', 'fam', 'Missatges «jo»', 'En lloc de «mai m''escoltes», prova «jo em sento ignorat/da quan…». Parlar des del que sents sol rebaixar la tensió.', 'ca'),
  ('consejo', 'fam', 'Triar el moment', 'Les converses importants van millor quan ningú té pressa ni està enfadat. Pots dir: «en podem parlar després? És una cosa que m''importa».', 'ca'),
  ('frase', 'fam', 'Posar límits també és estimar', 'Dir «això no em fa sentir bé» és cuidar la relació, no trencar-la.', 'ca'),
  ('historia', 'fam', 'Una carta a la nevera', 'Al Pablo li costava parlar amb el seu pare sense discutir. Un dia li va escriure una nota explicant com se sentia. «No en vam parlar fins dos dies després, però va ser la primera conversa de veritat en mesos».', 'ca'),
  ('consejo', 'fam', 'Quan a casa hi ha tensió', 'Busca un petit refugi: la teva música, un passeig, un racó tranquil. I recorda que no ets responsable d''arreglar els problemes dels adults.', 'ca'),
  ('frase', 'iden', 'Ets vàlid/a', 'Qui ets i a qui estimes no necessita l''aprovació de ningú per ser real.', 'ca'),
  ('frase', 'iden', 'Sense pressa', 'No t''has de posar cap etiqueta avui, ni mai si no vols. Conèixer-te és un procés, no un examen.', 'ca'),
  ('historia', 'iden', 'El que m''hauria agradat sentir', 'L''Àlex va trigar anys a parlar de la seva identitat. «M''hauria ajudat saber que no era l''única persona que se sentia així», diu. Avui forma part d''un grup de joves on es donen suport mútuament.', 'ca'),
  ('consejo', 'iden', 'Busca la teva gent', 'Hi ha col·lectius i grups de joves LGTBIQ+ on pots parlar amb persones que entenen el que vius. Trobar el teu lloc ajuda moltíssim.', 'ca'),
  ('consejo', 'iden', 'Si tens por del rebuig', 'No ho has d''explicar a ningú abans d''estar preparat/da. Comença, si vols, per algú de confiança que sàpigues que et cuidarà.', 'ca'),
  ('frase', 'iden', 'Mereixes sentir-te bé sent tu', 'La teva manera de ser no és un problema que s''hagi de resoldre.', 'ca'),
  ('frase', 'general', 'Egun bat aldi bakoitzean', 'Ez duzu gaur dena konponduta izan behar. Hurrengo pauso txikia nahikoa da.', 'eu'),
  ('frase', 'general', 'Zure erritmoak balio du', 'Atseden hartzea ez da amore ematea. Bidearen parte da.', 'eu'),
  ('frase', 'general', 'Sentitzea ez da huts egitea', 'Batzuetan gaizki egoteak ez du esan nahi zerbait gaizki egiten ari zarenik. Gizakia zarela esan nahi du.', 'eu'),
  ('consejo', 'general', '4-7-8 arnasketa', 'Hartu arnasa sudurretik 4ra arte zenbatuz, eutsi 7, bota ahotik 8an. Errepikatu 3 edo 4 aldiz. Zure gorputzari esaten dio abiadura jaits dezakeela.', 'eu'),
  ('consejo', 'general', '5-4-3-2-1 grounding', 'Esan ikusten dituzun 5 gauza, uki ditzakezun 4, entzuten dituzun 3, usaintzen dituzun 2 eta dastatzen duzun 1. Orainaldira itzultzen laguntzen dizu burua milaka doanean.', 'eu'),
  ('consejo', 'general', 'Lo egitea ere norbera zaintzea da', 'Utzi mugikorra pixka batean lo egin aurretik eta saiatu paper batean idazten buruan duzuna. Burutik ateratzeak askatzen laguntzen du.', 'eu'),
  ('historia', 'general', 'Laguntza eskatu nuen eguna', 'Laiak asteak zeramatzan ezer egiteko gogorik gabe. Kontatzea molestatzea zela uste zuen. Egun batean bere lehengusinari esan zion, ia nahi gabe. «Ez zuen dena konpondu, baina bakarrik eramateari utzi nion», kontatzen du. Batzuetan lehen pausoa ozen esatea besterik ez da.', 'eu'),
  ('historia', 'general', 'Errurik gabe itzultzea', 'Marcek hilabete batez utzi zion ondo sentiarazten zioten gauzak egiteari. Itzuli zenean, oso gaizki sentitu zen «utzi izanagatik». Itzultzea bera bere burua zaintzea zela ulertu zuen arte. Ez da zerotik hasi behar: zauden lekutik jarraitzen da.', 'eu'),
  ('consejo', 'acad', 'Pomodoro teknika', '25 minutu arreta, 5 atseden. 4 txandaren ondoren, atseden luzea. Garrantzitsuena ez da denbora luzez ikastea, burua fresko duzula ikastea baizik.', 'eu'),
  ('consejo', 'acad', 'Errepaso tartekatua', 'Gaur pixka bat errepasatzeak, 2 egun barru beste pixka batek eta astebete barru beste batek hobeto funtzionatzen dute aurreko gaueko maratoi batek baino. Zure memoriak eskertuko dizu.', 'eu'),
  ('consejo', 'acad', 'Zatitu mendia', 'Zeregin batek larritzen bazaitu, zatitu barre eragiteko moduko pauso txikitan. «Liburua ireki» dagoeneko pauso bat da.', 'eu'),
  ('frase', 'acad', 'Nota batek ez zaitu definitzen', 'Azterketa bat baino askoz gehiago zara. Zure balioa ez da sartzen 0tik 10erako zenbaki batean.', 'eu'),
  ('historia', 'acad', 'Konparatzeak nekatu egiten ninduen', 'Ikerrek beti begiratzen zituen besteen notak. «Zenbat eta gehiago konparatu, orduan eta okerrago ikasten nuen», dio. Astero bere aurrerapen txikiak bakarrik idazten hasi zen. Bere burua ikusteko modua aldatu zion.', 'eu'),
  ('consejo', 'acad', 'Azterketaren aurretik', 'Urduri bazaude, saiatu poliki arnasa hartzen eta zeure buruari gogorarazten: «ahal izan dudana prestatu dut». Urduritasuna ere kontzentratzeko energia da.', 'eu'),
  ('consejo', 'soc', 'Elkarrizketa bat hasi', 'Partekatzen duzuen zerbaiti buruzko galdera ireki bat («zer iruditu zaizu azterketa?») ate erraza da. Ez da barregarria izan behar, jakin-mina izatea nahikoa da.', 'eu'),
  ('frase', 'soc', 'Ez diozu denei gustatu behar', 'Benetan zuretzat diren pertsonek zaren bezala maitatuko zaituzte.', 'eu'),
  ('historia', 'soc', 'Bakarrik jolastorduan', 'Nerea ikastetxez aldatu zen eta asteak eman zituen bakarrik. Antzerki-tailer batean izena eman zuen inor ezagutu gabe. «Hankak dardarka nituen», gogoratzen du. Gaur bere lagun onenetako bi handik atera ziren.', 'eu'),
  ('consejo', 'soc', 'Antsietate soziala estutzen duenean', 'Gogoratu jende gehiena bere buruari adi dagoela, ez zuri. Zentratu besteak esaten duenean: zure buruaren fokua jaisten du.', 'eu'),
  ('frase', 'soc', 'Bakarrik sentitzea igarotzen da', 'Bakardadea sentitzeak ez du ezer txarrik esaten zutaz. Konexioa behar duzula esaten du, eta hori oso gizatiarra da.', 'eu'),
  ('consejo', 'fam', '«Ni» mezuak', '«Ez didazu inoiz entzuten» esan beharrean, saiatu «baztertuta sentitzen naiz… denean». Sentitzen duzunetik hitz egiteak tentsioa jaitsi ohi du.', 'eu'),
  ('consejo', 'fam', 'Unea aukeratu', 'Elkarrizketa garrantzitsuak hobeto doaz inork presarik ez duenean eta haserre ez dagoenean. Esan dezakezu: «geroago hitz egin dezakegu garrantzitsua den zerbaiti buruz?».', 'eu'),
  ('frase', 'fam', 'Mugak jartzea ere maitatzea da', '«Honek ez nau ondo sentiarazten» esatea harremana zaintzea da, ez apurtzea.', 'eu'),
  ('historia', 'fam', 'Gutun bat hozkailuan', 'Pablori kosta egiten zitzaion bere aitarekin eztabaidatu gabe hitz egitea. Egun batean ohar bat idatzi zion nola sentitzen zen azalduz. «Ez genuen horretaz hitz egin bi egun geroago arte, baina hilabeteetako lehen benetako elkarrizketa izan zen».', 'eu'),
  ('consejo', 'fam', 'Etxean tentsioa dagoenean', 'Bilatu babesleku txiki bat: zure musika, paseo bat, txoko lasai bat. Eta gogoratu ez zarela helduen arazoak konpontzeko arduraduna.', 'eu'),
  ('frase', 'iden', 'Baliozkoa zara', 'Nor zaren eta nor maite duzun ez dago inoren onespenaren beharrik benetakoa izateko.', 'eu'),
  ('frase', 'iden', 'Presarik gabe', 'Ez duzu gaur etiketarik jarri behar, ezta inoiz ere nahi ez baduzu. Zeure burua ezagutzea prozesu bat da, ez azterketa bat.', 'eu'),
  ('historia', 'iden', 'Entzutea gustatuko litzaidakeena', 'Alexek urteak behar izan zituen bere identitateaz hitz egiteko. «Lagungarria izango zitzaidan jakitea ez nintzela horrela sentitzen zen bakarra», dio. Gaur elkarri laguntzen dioten gazte-talde bateko kide da.', 'eu'),
  ('consejo', 'iden', 'Bilatu zure jendea', 'Badira LGTBIQ+ gazteen kolektibo eta taldeak, bizi duzuna ulertzen duten pertsonekin hitz egiteko. Zure lekua aurkitzeak asko laguntzen du.', 'eu'),
  ('consejo', 'iden', 'Baztertua izateko beldurra baduzu', 'Ez diozu inori kontatu behar prest egon aurretik. Nahi baduzu, hasi zaindu egingo zaituela dakizun konfiantzazko norbaitekin.', 'eu'),
  ('frase', 'iden', 'Zu izanda ondo sentitzea merezi duzu', 'Zure izateko modua ez da konpondu beharreko arazo bat.', 'eu'),
  ('frase', 'general', 'Un día de cada vez', 'Non tes que telo todo resolto hoxe. Abonda co seguinte paso pequeno.', 'gl'),
  ('frase', 'general', 'O teu ritmo vale', 'Descansar non é renderse. É parte do camiño.', 'gl'),
  ('frase', 'general', 'Sentir non é fallar', 'Estar mal ás veces non significa que esteas facendo algo mal. Significa que es humano/a.', 'gl'),
  ('consejo', 'general', 'Respiración 4-7-8', 'Inspira polo nariz contando 4, aguanta 7, solta pola boca en 8. Repite 3 ou 4 veces. Dille ao teu corpo que pode baixar revolucións.', 'gl'),
  ('consejo', 'general', 'Grounding 5-4-3-2-1', 'Nomea 5 cousas que ves, 4 que podes tocar, 3 que oes, 2 que cheiras e 1 que saboreas. Axúdache a volver ao presente cando a cabeza vai a mil.', 'gl'),
  ('consejo', 'general', 'Durmir tamén é autocoidado', 'Deixa o móbil un anaco antes de durmir e proba a apuntar nun papel o que che rolda. Sacalo da cabeza axuda a soltalo.', 'gl'),
  ('historia', 'general', 'O día que pedín axuda', 'Laia levaba semanas sen gana de nada. Pensaba que contalo era molestar. Un día díxollo á súa curmá, case sen querer. «Non arranxou todo, pero deixei de cargalo soa», conta. Ás veces o primeiro paso é só dicilo en voz alta.', 'gl'),
  ('historia', 'general', 'Volver sen culpa', 'Marc deixou de facer as cousas que lle sentaban ben durante un mes. Cando volveu, sentiuse fatal por «telo deixado». Ata que entendeu que volver xa era coidarse. Non hai que comezar de cero: séguese desde onde estás.', 'gl'),
  ('consejo', 'acad', 'A técnica Pomodoro', '25 minutos de foco, 5 de descanso. Tras 4 roldas, descanso longo. O importante non é estudar moito tempo, é estudar coa cabeza fresca.', 'gl'),
  ('consejo', 'acad', 'Repaso espazado', 'Repasar un pouco hoxe, outro pouco en 2 días e outro nunha semana funciona mellor que unha maratón a noite anterior. A túa memoria agradeceracho.', 'gl'),
  ('consejo', 'acad', 'Divide a montaña', 'Se unha tarefa te agobia, divídea en pasos tan pequenos que case dean risa. «Abrir o libro» xa é un paso.', 'gl'),
  ('frase', 'acad', 'Unha nota non te define', 'Es moito máis ca un exame. O teu valor non cabe nun número do 0 ao 10.', 'gl'),
  ('historia', 'acad', 'Compararme esgotábame', 'Iker sempre miraba as notas dos demais. «Canto máis me comparaba, peor estudaba», di. Comezou a apuntar só os seus pequenos avances de cada semana. Cambioulle a maneira de verse.', 'gl'),
  ('consejo', 'acad', 'Antes do exame', 'Se notas nervios, proba a respirar amodo e a lembrarte: «prepareime o que puiden». Os nervios tamén son enerxía para concentrarte.', 'gl'),
  ('consejo', 'soc', 'Comezar unha conversa', 'Unha pregunta aberta sobre algo que compartides («que che pareceu o exame?») é unha porta doada. Non fai falta ser gracioso/a, abonda con ter curiosidade.', 'gl'),
  ('frase', 'soc', 'Non fai falta gustarlle a todo o mundo', 'As persoas que de verdade son para ti vante querer tal e como es.', 'gl'),
  ('historia', 'soc', 'Soa no recreo', 'Nerea cambiou de instituto e pasou semanas soa. Apuntouse a un obradoiro de teatro sen coñecer a ninguén. «Tremíanme as pernas», lembra. Hoxe dúas das súas mellores amigas saíron de alí.', 'gl'),
  ('consejo', 'soc', 'Cando a ansiedade social aperta', 'Lembra que a maioría da xente está pendente de si mesma, non de ti. Céntrate no que di a outra persoa: baixa o foco da túa propia cabeza.', 'gl'),
  ('frase', 'soc', 'Sentirse só/soa pasa', 'Sentir soidade non di nada malo de ti. Di que precisas conexión, e iso é moi humano.', 'gl'),
  ('consejo', 'fam', 'Mensaxes «eu»', 'En vez de «nunca me escoitas», proba «eu síntome ignorado/a cando…». Falar desde o que sentes adoita baixar a tensión.', 'gl'),
  ('consejo', 'fam', 'Escoller o momento', 'As conversas importantes van mellor cando ninguén ten présa nin está anoxado. Podes dicir: «podemos falar logo de algo que me importa?».', 'gl'),
  ('frase', 'fam', 'Poñer límites tamén é querer', 'Dicir «isto non me senta ben» é coidar a relación, non rompela.', 'gl'),
  ('historia', 'fam', 'Unha carta na neveira', 'A Pablo custáballe falar co seu pai sen discutir. Un día escribiulle unha nota explicando como se sentía. «Non falamos diso ata dous días despois, pero foi a primeira conversa de verdade en meses».', 'gl'),
  ('consejo', 'fam', 'Cando na casa hai tensión', 'Busca un pequeno refuxio: a túa música, un paseo, un recuncho tranquilo. E lembra que non es responsable de arranxar os problemas dos adultos.', 'gl'),
  ('frase', 'iden', 'Es válido/a', 'Quen es e a quen queres non precisa a aprobación de ninguén para ser real.', 'gl'),
  ('frase', 'iden', 'Sen présa', 'Non tes que poñerte unha etiqueta hoxe, nin nunca se non queres. Coñecerte é un proceso, non un exame.', 'gl'),
  ('historia', 'iden', 'O que me gustaría ter oído', 'Álex tardou anos en falar da súa identidade. «Axudaríame saber que non era a única persoa sentíndose así», di. Hoxe forma parte dun grupo de mozos e mozas onde se apoian mutuamente.', 'gl'),
  ('consejo', 'iden', 'Busca a túa xente', 'Hai colectivos e grupos de mocidade LGTBIQ+ onde podes falar con persoas que entenden o que vives. Atopar o teu sitio axuda moitísimo.', 'gl'),
  ('consejo', 'iden', 'Se temes o rexeitamento', 'Non llo tes que contar a ninguén antes de estar preparado/a. Comeza, se queres, por alguén de confianza que saibas que te vai coidar.', 'gl'),
  ('frase', 'iden', 'Mereces sentirte ben sendo ti', 'A túa forma de ser non é un problema que haxa que resolver.', 'gl'),
  ('frase', 'general', 'One day at a time', 'You don''t have to have everything figured out today. The next small step is enough.', 'en'),
  ('frase', 'general', 'Your pace matters', 'Resting isn''t giving up. It''s part of the journey.', 'en'),
  ('frase', 'general', 'Feeling isn''t failing', 'Feeling bad sometimes doesn''t mean you''re doing something wrong. It means you''re human.', 'en'),
  ('consejo', 'general', '4-7-8 breathing', 'Breathe in through your nose for 4, hold for 7, breathe out through your mouth for 8. Repeat 3 or 4 times. It tells your body it can slow down.', 'en'),
  ('consejo', 'general', '5-4-3-2-1 grounding', 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell and 1 you taste. It helps you come back to the present when your mind is racing.', 'en'),
  ('consejo', 'general', 'Sleep is self-care too', 'Put your phone away for a while before bed and try writing down on paper whatever is on your mind. Getting it out of your head helps you let it go.', 'en'),
  ('historia', 'general', 'The day I asked for help', 'Laia had felt like doing nothing for weeks. She thought telling someone would be a bother. One day she told her cousin, almost by accident. "It didn''t fix everything, but I stopped carrying it alone," she says. Sometimes the first step is just saying it out loud.', 'en'),
  ('historia', 'general', 'Coming back without guilt', 'Marc stopped doing the things that were good for him for a month. When he came back, he felt awful for "having dropped it". Until he realised that coming back was already looking after himself. You don''t have to start from zero: you carry on from where you are.', 'en'),
  ('consejo', 'acad', 'The Pomodoro technique', '25 minutes of focus, 5 of rest. After 4 rounds, a long break. What matters isn''t studying for ages, it''s studying with a fresh mind.', 'en'),
  ('consejo', 'acad', 'Spaced repetition', 'Reviewing a bit today, another bit in 2 days and again in a week works better than a marathon the night before. Your memory will thank you.', 'en'),
  ('consejo', 'acad', 'Break the mountain down', 'If a task overwhelms you, split it into steps so small they''re almost funny. "Open the book" is already a step.', 'en'),
  ('frase', 'acad', 'A grade doesn''t define you', 'You''re much more than an exam. Your worth doesn''t fit into a number from 0 to 10.', 'en'),
  ('historia', 'acad', 'Comparing myself wore me out', 'Iker always looked at other people''s grades. "The more I compared myself, the worse I studied," he says. He started writing down just his own small progress each week. It changed how he saw himself.', 'en'),
  ('consejo', 'acad', 'Before the exam', 'If you feel nervous, try breathing slowly and reminding yourself: "I''ve prepared as much as I could". Nerves are also energy to help you focus.', 'en'),
  ('consejo', 'soc', 'Starting a conversation', 'An open question about something you share ("what did you think of the exam?") is an easy way in. You don''t need to be funny, just curious.', 'en'),
  ('frase', 'soc', 'You don''t need everyone to like you', 'The people who are really right for you will love you just as you are.', 'en'),
  ('historia', 'soc', 'Alone at break time', 'Nerea changed schools and spent weeks on her own. She joined a drama workshop without knowing anyone. "My legs were shaking," she remembers. Today two of her best friends came from there.', 'en'),
  ('consejo', 'soc', 'When social anxiety hits', 'Remember that most people are focused on themselves, not on you. Focus on what the other person is saying: it takes the spotlight off your own head.', 'en'),
  ('frase', 'soc', 'Feeling lonely passes', 'Feeling lonely doesn''t say anything bad about you. It says you need connection, and that''s very human.', 'en'),
  ('consejo', 'fam', '"I" messages', 'Instead of "you never listen to me", try "I feel ignored when…". Speaking from what you feel usually lowers the tension.', 'en'),
  ('consejo', 'fam', 'Choosing the moment', 'Important conversations go better when nobody is in a hurry or angry. You can say: "can we talk later about something that matters to me?".', 'en'),
  ('frase', 'fam', 'Setting limits is also love', 'Saying "this doesn''t feel good to me" is looking after the relationship, not breaking it.', 'en'),
  ('historia', 'fam', 'A note on the fridge', 'Pablo found it hard to talk to his dad without arguing. One day he wrote him a note explaining how he felt. "We didn''t talk about it until two days later, but it was our first real conversation in months."', 'en'),
  ('consejo', 'fam', 'When there''s tension at home', 'Find a small refuge: your music, a walk, a quiet corner. And remember you''re not responsible for fixing adults'' problems.', 'en'),
  ('frase', 'iden', 'You are valid', 'Who you are and who you love doesn''t need anyone''s approval to be real.', 'en'),
  ('frase', 'iden', 'No rush', 'You don''t have to put a label on yourself today, or ever if you don''t want to. Getting to know yourself is a process, not an exam.', 'en'),
  ('historia', 'iden', 'What I would have liked to hear', 'Álex took years to talk about their identity. "It would have helped me to know I wasn''t the only one feeling this way," they say. Today they''re part of a youth group where they support each other.', 'en'),
  ('consejo', 'iden', 'Find your people', 'There are LGBTIQ+ youth groups and organisations where you can talk to people who understand what you''re going through. Finding your place helps a lot.', 'en'),
  ('consejo', 'iden', 'If you fear rejection', 'You don''t have to tell anyone before you''re ready. If you want, start with someone you trust who you know will look after you.', 'en'),
  ('frase', 'iden', 'You deserve to feel good being you', 'The way you are isn''t a problem that needs solving.', 'en');

-- ---------------------------------------------------------------------
-- Perfiles para cuentas creadas antes de tener las tablas
-- ---------------------------------------------------------------------
insert into public.profiles (id, username, display_name, age_consent, timezone, locale)
select u.id,
       lower(trim(u.raw_user_meta_data ->> 'username')),
       lower(trim(u.raw_user_meta_data ->> 'username')),
       true,
       coalesce(nullif(u.raw_user_meta_data ->> 'timezone', ''), 'Europe/Madrid'),
       case when u.raw_user_meta_data ->> 'locale' in ('es', 'ca', 'eu', 'gl', 'en')
            then u.raw_user_meta_data ->> 'locale' else 'es' end
from auth.users u
where lower(trim(u.raw_user_meta_data ->> 'username')) ~ '^[a-z0-9_.]{3,20}$'
on conflict do nothing;
