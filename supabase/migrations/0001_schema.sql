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
  display_name          text not null check (char_length(display_name) between 1 and 40),
  birth_date            date not null,
  is_minor              boolean not null,
  guardian_consent      boolean not null default false,
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

-- Alta de perfil al registrarse. Aplica la edad mínima en el servidor:
--   < 13 → no se permite.
--   13 → requiere consentimiento de madre/padre/tutor (LOPDGDD art. 7: 14 años).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_birth   date;
  v_age     integer;
  v_consent boolean;
  v_name    text;
  v_tz      text;
begin
  v_birth   := (new.raw_user_meta_data ->> 'birth_date')::date;
  v_consent := coalesce((new.raw_user_meta_data ->> 'guardian_consent')::boolean, false);
  v_name    := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Lagun'), 40);
  v_tz      := coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Europe/Madrid');

  if v_birth is null then
    raise exception 'birth_date es obligatoria';
  end if;

  v_age := extract(year from age(current_date, v_birth))::integer;

  if v_age < 13 then
    raise exception 'Lagun es para personas de 13 años en adelante';
  end if;
  if v_age < 14 and not v_consent then
    raise exception 'Hace falta el consentimiento de madre, padre o tutor';
  end if;

  insert into public.profiles (id, display_name, birth_date, is_minor, guardian_consent, timezone)
  values (new.id, v_name, v_birth, v_age < 18, v_consent, v_tz);

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
