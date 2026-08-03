-- 3SETS Club Pass - schema Supabase complet et securise
-- A executer dans SQL Editor. Sauvegarder la base avant une migration existante.

begin;

create extension if not exists "pgcrypto";

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sport text not null check (sport in ('tennis','badminton','padel','tennis-de-table','pickleball')),
  sports text[] not null default '{}',
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  pass_token uuid unique not null default gen_random_uuid(),
  first_name text not null check (length(trim(first_name)) between 1 and 80),
  last_name text not null check (length(trim(last_name)) between 1 and 80),
  email text not null,
  phone text not null,
  sport text not null check (sport in ('tennis','badminton','padel','tennis-de-table','pickleball')),
  club_id uuid not null references clubs(id) on delete restrict,
  newsletter boolean not null default false,
  created_at timestamptz not null default now(),
  constraint players_email_club_unique unique (email, club_id)
);
create index if not exists idx_players_club_id on players(club_id);
create index if not exists idx_players_email_lower on players(lower(email));

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sport text not null check (sport in ('tennis','badminton','padel','tennis-de-table','pickleball','tous-sports')),
  club_id uuid references clubs(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  terms text not null,
  active boolean not null default true,
  valeur_euros numeric(10,2) not null default 0 check (valeur_euros >= 0),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists idx_coupons_sport on coupons(sport);

create table if not exists player_coupons (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  coupon_id uuid not null references coupons(id) on delete cascade,
  status text not null default 'available' check (status in ('available','used','expired')),
  used_at timestamptz,
  montant_panier numeric(10,2) check (montant_panier is null or montant_panier >= 0),
  created_at timestamptz not null default now(),
  unique (player_id, coupon_id),
  check ((status = 'used' and used_at is not null) or status <> 'used')
);
create index if not exists idx_player_coupons_player_id on player_coupons(player_id);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'player' check (role in ('admin','player')),
  created_at timestamptz not null default now()
);

-- Migration sans perte pour une base creee avec une ancienne version.
alter table clubs add column if not exists sports text[] not null default '{}';
update clubs set sports='{}' where sports is null;
alter table clubs alter column sports set default '{}';
alter table clubs alter column sports set not null;
alter table players add column if not exists pass_token uuid default gen_random_uuid();
alter table players add column if not exists newsletter boolean not null default false;
update players set pass_token=gen_random_uuid() where pass_token is null;
alter table players alter column pass_token set not null;
create unique index if not exists players_pass_token_unique on players(pass_token);
alter table coupons add column if not exists valeur_euros numeric(10,2) not null default 0;
update coupons set valeur_euros=0 where valeur_euros is null;
alter table coupons alter column valeur_euros set default 0;
alter table coupons alter column valeur_euros set not null;
alter table player_coupons add column if not exists montant_panier numeric(10,2);
alter table clubs drop constraint if exists clubs_sport_check;
alter table clubs add constraint clubs_sport_check check (sport in ('tennis','badminton','padel','tennis-de-table','pickleball')) not valid;
alter table players drop constraint if exists players_sport_check;
alter table players add constraint players_sport_check check (sport in ('tennis','badminton','padel','tennis-de-table','pickleball')) not valid;
alter table coupons drop constraint if exists coupons_sport_check;
alter table coupons add constraint coupons_sport_check check (sport in ('tennis','badminton','padel','tennis-de-table','pickleball','tous-sports')) not valid;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  description text,
  color text not null default 'orange' check (color in ('orange','navy','green','red','purple')),
  start_date date not null,
  end_date date not null,
  image_url text,
  coupon_id uuid references coupons(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Compatibilite avec l'ancienne table d'abonnements (subscription en texte).
alter table push_subscriptions add column if not exists endpoint text;
alter table push_subscriptions add column if not exists updated_at timestamptz not null default now();
alter table push_subscriptions alter column subscription type jsonb using subscription::jsonb;
update push_subscriptions set endpoint=subscription->>'endpoint' where endpoint is null;
delete from push_subscriptions where endpoint is null or endpoint='';
alter table push_subscriptions alter column endpoint set not null;
create unique index if not exists push_subscriptions_endpoint_unique on push_subscriptions(endpoint);
create index if not exists idx_push_subscriptions_player on push_subscriptions(player_id);

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles(id,email,role) values(new.id,new.email,'player')
  on conflict(id) do update set email=excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Normalisation telephone pour les recherches (chiffres uniquement).
create or replace function public.normalized_phone(value text) returns text
language sql immutable strict set search_path = public
as $$ select regexp_replace(value, '[^0-9]', '', 'g') $$;

-- Inscription atomique : cree le joueur et attribue ses coupons en une transaction.
create or replace function public.register_player(
  p_club_slug text, p_first_name text, p_last_name text,
  p_email text, p_phone text, p_newsletter boolean default false
) returns uuid language plpgsql security definer set search_path = public
as $$
declare v_club clubs%rowtype; v_player players%rowtype; v_email text; v_phone text;
begin
  v_email := lower(trim(p_email)); v_phone := public.normalized_phone(p_phone);
  if length(trim(p_first_name)) not between 1 and 80 or length(trim(p_last_name)) not between 1 and 80 then raise exception 'INVALID_NAME'; end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'INVALID_EMAIL'; end if;
  if length(v_phone) not between 10 and 15 then raise exception 'INVALID_PHONE'; end if;
  select * into v_club from clubs where slug=p_club_slug and active=true;
  if not found then raise exception 'CLUB_NOT_FOUND'; end if;
  select * into v_player from players where lower(email)=v_email and club_id=v_club.id;
  if found then
    if public.normalized_phone(v_player.phone) <> v_phone then raise exception 'ACCOUNT_EXISTS'; end if;
    return v_player.pass_token;
  end if;
  if exists(select 1 from players where lower(email)=v_email or public.normalized_phone(phone)=v_phone) then raise exception 'ACCOUNT_EXISTS_OTHER_CLUB'; end if;
  insert into players(first_name,last_name,email,phone,sport,club_id,newsletter)
  values(trim(p_first_name),trim(p_last_name),v_email,v_phone,v_club.sport,v_club.id,coalesce(p_newsletter,false)) returning * into v_player;
  insert into player_coupons(player_id,coupon_id)
  select v_player.id,c.id from coupons c
  where c.active and (c.club_id is null or c.club_id=v_club.id)
    and (c.sport='tous-sports' or c.sport=any(case when cardinality(v_club.sports)>0 then v_club.sports else array[v_club.sport] end))
  on conflict do nothing;
  return v_player.pass_token;
end $$;
revoke all on function public.register_player(text,text,text,text,text,boolean) from public;
grant execute on function public.register_player(text,text,text,text,text,boolean) to anon,authenticated;

-- Recuperation du pass avec deux informations personnelles, jamais par simple email.
create or replace function public.find_player_passes(p_email text,p_phone text)
returns table(pass_token uuid,first_name text,last_name text,sport text,club_name text)
language sql security definer set search_path = public stable
as $$
  select p.pass_token,p.first_name,p.last_name,p.sport,c.name
  from players p join clubs c on c.id=p.club_id
  where lower(p.email)=lower(trim(p_email)) and public.normalized_phone(p.phone)=public.normalized_phone(p_phone)
$$;
revoke all on function public.find_player_passes(text,text) from public;
grant execute on function public.find_player_passes(text,text) to anon,authenticated;

-- Vue publique limitee d'un pass. Aucune coordonnee n'est renvoyee.
create or replace function public.get_player_pass(p_pass_token uuid)
returns jsonb language sql security definer set search_path = public stable
as $$
 select jsonb_build_object(
   'player',jsonb_build_object('first_name',p.first_name,'sport',p.sport,'club',jsonb_build_object('name',cl.name,'sports',cl.sports)),
   'coupons',coalesce((select jsonb_agg(jsonb_build_object(
     'playerCouponId',pc.id,'title',c.title,'description',c.description,'terms',c.terms,
     'endDate',c.end_date,'sport',c.sport,'status',pc.status,'usedAt',pc.used_at
   ) order by pc.created_at) from player_coupons pc join coupons c on c.id=pc.coupon_id
     where pc.player_id=p.id and c.active and c.start_date<=current_date),'[]'::jsonb)
 ) from players p join clubs cl on cl.id=p.club_id where p.pass_token=p_pass_token
$$;
revoke all on function public.get_player_pass(uuid) from public;
grant execute on function public.get_player_pass(uuid) to anon,authenticated;

create or replace function public.save_push_subscription(p_pass_token uuid,p_subscription jsonb)
returns void language plpgsql security definer set search_path = public
as $$
declare v_player uuid; v_endpoint text;
begin
  select id into v_player from players where pass_token=p_pass_token;
  if v_player is null then raise exception 'PASS_NOT_FOUND'; end if;
  v_endpoint := p_subscription->>'endpoint';
  if coalesce(v_endpoint,'')='' then raise exception 'INVALID_SUBSCRIPTION'; end if;
  insert into push_subscriptions(player_id,endpoint,subscription)
  values(v_player,v_endpoint,p_subscription)
  on conflict(endpoint) do update set player_id=excluded.player_id,subscription=excluded.subscription,updated_at=now();
end $$;
revoke all on function public.save_push_subscription(uuid,jsonb) from public;
grant execute on function public.save_push_subscription(uuid,jsonb) to anon,authenticated;

alter table clubs enable row level security;
alter table players enable row level security;
alter table coupons enable row level security;
alter table player_coupons enable row level security;
alter table profiles enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;

-- Retirer aussi toutes les politiques des anciennes versions.
drop policy if exists "clubs_select_public" on clubs;
drop policy if exists "clubs_write_admin" on clubs;
drop policy if exists "coupons_select_public" on coupons;
drop policy if exists "coupons_write_admin" on coupons;
drop policy if exists "players_select_public" on players;
drop policy if exists "players_insert_public" on players;
drop policy if exists "players_update_admin" on players;
drop policy if exists "players_delete_admin" on players;
drop policy if exists "player_coupons_select_public" on player_coupons;
drop policy if exists "player_coupons_insert_public" on player_coupons;
drop policy if exists "player_coupons_update_admin" on player_coupons;
drop policy if exists "player_coupons_delete_admin" on player_coupons;
drop policy if exists "profiles_select_own_or_admin" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own_or_admin" on profiles;

drop policy if exists clubs_select_public on clubs;
create policy clubs_select_public on clubs for select using(active or public.is_admin());
drop policy if exists clubs_admin on clubs;
create policy clubs_admin on clubs for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists coupons_select_public on coupons;
create policy coupons_select_public on coupons for select using(active or public.is_admin());
drop policy if exists coupons_admin on coupons;
create policy coupons_admin on coupons for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists players_admin on players;
create policy players_admin on players for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists player_coupons_admin on player_coupons;
create policy player_coupons_admin on player_coupons for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists profiles_own_select on profiles;
create policy profiles_own_select on profiles for select using(id=auth.uid() or public.is_admin());
drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists notifications_select_public on notifications;
create policy notifications_select_public on notifications for select using((active and start_date<=current_date and end_date>=current_date) or public.is_admin());
drop policy if exists notifications_admin on notifications;
create policy notifications_admin on notifications for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists push_subscriptions_admin on push_subscriptions;
create policy push_subscriptions_admin on push_subscriptions for all using(public.is_admin()) with check(public.is_admin());

-- Images de notifications : lecture publique, ecriture admin seulement.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('images','images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists images_public_read on storage.objects;
create policy images_public_read on storage.objects for select using(bucket_id='images');
drop policy if exists images_admin_insert on storage.objects;
create policy images_admin_insert on storage.objects for insert with check(bucket_id='images' and public.is_admin());
drop policy if exists images_admin_update on storage.objects;
create policy images_admin_update on storage.objects for update using(bucket_id='images' and public.is_admin());
drop policy if exists images_admin_delete on storage.objects;
create policy images_admin_delete on storage.objects for delete using(bucket_id='images' and public.is_admin());

-- Premiere installation : creer le compte magasin dans Authentication, puis executer :
-- update profiles set role='admin' where email='magasin@3sets.fr';

commit;
