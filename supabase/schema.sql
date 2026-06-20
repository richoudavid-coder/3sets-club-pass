-- ============================================================
-- 3SETS Club Pass — script SQL complet pour Supabase
-- ============================================================
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- (Dashboard Supabase > SQL Editor > New query > coller > Run).
--
-- Ce script :
--   1. Crée les tables clubs, players, coupons, player_coupons, profiles
--   2. Active les contraintes d'unicité nécessaires
--   3. Met en place les politiques RLS (Row Level Security)
--   4. Crée un trigger pour auto-créer un profil à l'inscription
--      (et promouvoir magasin@3sets.fr en admin automatiquement)
--   5. Insère les 8 clubs partenaires et les coupons d'exemple
-- ============================================================


-- ------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------

-- Table des clubs partenaires
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sport text not null check (sport in ('tennis', 'badminton', 'padel', 'tennis-de-table')),
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Table des joueurs inscrits
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  sport text not null check (sport in ('tennis', 'badminton', 'padel', 'tennis-de-table')),
  club_id uuid not null references clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint players_email_club_unique unique (email, club_id)
);

create index if not exists idx_players_club_id on players(club_id);
create index if not exists idx_players_email on players(email);

-- Table des coupons (catalogue d'offres)
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sport text not null check (sport in ('tennis', 'badminton', 'padel', 'tennis-de-table')),
  club_id uuid references clubs(id) on delete cascade, -- null = valable pour tout le sport, tous clubs
  start_date date not null,
  end_date date not null,
  terms text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_coupons_sport on coupons(sport);

-- Table de liaison joueur <-> coupon attribué
create table if not exists player_coupons (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  coupon_id uuid not null references coupons(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'used', 'expired')),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint player_coupons_unique unique (player_id, coupon_id)
);

create index if not exists idx_player_coupons_player_id on player_coupons(player_id);
create index if not exists idx_player_coupons_status on player_coupons(status);

-- Table des profils utilisateurs (liée à auth.users), porte le rôle admin/player
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'player' check (role in ('admin', 'player')),
  created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. TRIGGER : création automatique du profil à l'inscription
-- ------------------------------------------------------------
-- Dès qu'un utilisateur Supabase Auth est créé, on lui crée un profil.
-- Le compte magasin@3sets.fr est automatiquement promu admin.
-- Remarque : le code frontend fait déjà un upsert sur "profiles" après
-- signUp(), ce trigger sert de filet de sécurité supplémentaire et
-- fonctionne même si l'upsert frontend échoue.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'magasin@3sets.fr' then 'admin' else 'player' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Si le compte magasin@3sets.fr existe déjà (créé avant l'exécution de ce
-- script), cette commande le promeut admin manuellement :
update profiles set role = 'admin'
where email = 'magasin@3sets.fr';


-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
-- Approche retenue pour cette V1 : SIMPLE MAIS SÉCURISABLE.
--
-- - clubs / coupons : lecture publique (nécessaire pour la page
--   d'inscription publique /club/:slug et l'attribution des coupons),
--   écriture réservée aux admins.
-- - players : insertion publique (inscription), lecture publique par id
--   (nécessaire pour /pass/:playerId sans authentification du joueur),
--   lecture/écriture complète réservée aux admins.
-- - player_coupons : insertion publique (attribution automatique à
--   l'inscription), lecture publique (affichage du pass), la mise à
--   jour (passage en "used") est réservée aux admins uniquement.
-- - profiles : chacun lit son propre profil, les admins lisent tout.
--
-- LIMITE CONNUE DE CETTE V1 :
-- Le joueur n'étant pas authentifié (le pass est juste un lien avec un
-- UUID difficile à deviner), la lecture de "players" et "player_coupons"
-- est ouverte à toute personne connaissant l'UUID concerné, ce qui est
-- un choix volontaire de simplicité (équivalent à un lien de partage).
-- Pour une V2 plus stricte, on pourrait :
--   - envoyer un lien signé (JWT à courte durée) au lieu d'un UUID brut,
--   - ou faire passer la lecture du pass par une fonction Edge Function
--     qui vérifie un token avant de renvoyer les données.

alter table clubs enable row level security;
alter table players enable row level security;
alter table coupons enable row level security;
alter table player_coupons enable row level security;
alter table profiles enable row level security;

-- Helper : est-ce que l'utilisateur connecté est admin ?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- CLUBS ----
drop policy if exists "clubs_select_public" on clubs;
create policy "clubs_select_public"
  on clubs for select
  using (true);

drop policy if exists "clubs_write_admin" on clubs;
create policy "clubs_write_admin"
  on clubs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- COUPONS ----
drop policy if exists "coupons_select_public" on coupons;
create policy "coupons_select_public"
  on coupons for select
  using (true);

drop policy if exists "coupons_write_admin" on coupons;
create policy "coupons_write_admin"
  on coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- PLAYERS ----
drop policy if exists "players_select_public" on players;
create policy "players_select_public"
  on players for select
  using (true);

drop policy if exists "players_insert_public" on players;
create policy "players_insert_public"
  on players for insert
  with check (true);

drop policy if exists "players_update_admin" on players;
create policy "players_update_admin"
  on players for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "players_delete_admin" on players;
create policy "players_delete_admin"
  on players for delete
  using (public.is_admin());

-- ---- PLAYER_COUPONS ----
drop policy if exists "player_coupons_select_public" on player_coupons;
create policy "player_coupons_select_public"
  on player_coupons for select
  using (true);

drop policy if exists "player_coupons_insert_public" on player_coupons;
create policy "player_coupons_insert_public"
  on player_coupons for insert
  with check (true);

-- Seuls les admins peuvent modifier un coupon (passage en "used").
-- C'est la règle la plus importante : un joueur ne peut jamais valider
-- lui-même un coupon, uniquement un vendeur 3SETS connecté en admin.
drop policy if exists "player_coupons_update_admin" on player_coupons;
create policy "player_coupons_update_admin"
  on player_coupons for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "player_coupons_delete_admin" on player_coupons;
create policy "player_coupons_delete_admin"
  on player_coupons for delete
  using (public.is_admin());

-- ---- PROFILES ----
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin"
  on profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());


-- ------------------------------------------------------------
-- 5. DONNÉES DE DÉPART : LES 8 CLUBS PARTENAIRES
-- ------------------------------------------------------------

insert into clubs (name, slug, sport) values
  ('Tennis Club Brestois', 'tc-brestois', 'tennis'),
  ('Tennis Club du Relecq Kerhuon', 'tc-relecq-kerhuon', 'tennis'),
  ('Badminton Milizac', 'badminton-milizac', 'badminton'),
  ('Badminton Club de Lannilis', 'badminton-lannilis', 'badminton'),
  ('Tie Break à Guilers', 'tie-break-guilers', 'padel'),
  ('TT Guipavas', 'tt-guipavas', 'tennis-de-table'),
  ('TT des Abers', 'tt-des-abers', 'tennis-de-table'),
  ('TT Loperhet', 'tt-loperhet', 'tennis-de-table')
on conflict (slug) do nothing;


-- ------------------------------------------------------------
-- 6. DONNÉES DE DÉPART : COUPONS D'EXEMPLE
-- ------------------------------------------------------------
-- Tous valables du 1er septembre 2026 au 31 août 2027.
-- club_id = null => coupon valable pour tout licencié du sport concerné,
-- quel que soit son club.

-- ---- PADEL ----
insert into coupons (title, description, sport, club_id, start_date, end_date, terms)
values
  (
    '-20% chaussures Padel Wilson',
    'Offre valable sur la sélection chaussures padel Wilson en magasin.',
    'padel', null, '2026-09-01', '2027-08-31',
    'Offre non cumulable, valable une seule fois.'
  ),
  (
    '1 tube Wilson Premier Speed Padel offert',
    '1 tube offert pour toute raquette Wilson Padel achetée.',
    'padel', null, '2026-09-01', '2027-08-31',
    'Offre valable sur achat d''une raquette Wilson Padel, non cumulable.'
  );

-- ---- TENNIS ----
insert into coupons (title, description, sport, club_id, start_date, end_date, terms)
values
  (
    '1 pose de cordage tennis offerte',
    'Pose offerte hors prix du cordage.',
    'tennis', null, '2026-09-01', '2027-08-31',
    'Valable une seule fois, hors cordage.'
  ),
  (
    '-15% sur le textile',
    'Remise valable sur le rayon textile.',
    'tennis', null, '2026-09-01', '2027-08-31',
    'Hors promotions en cours.'
  ),
  (
    '-20% sur une sélection de chaussures tennis',
    'Offre valable sur une sélection de chaussures tennis.',
    'tennis', null, '2026-09-01', '2027-08-31',
    'Selon stock disponible.'
  );

-- ---- BADMINTON ----
insert into coupons (title, description, sport, club_id, start_date, end_date, terms)
values
  (
    '-15% sur le textile',
    'Remise valable sur le rayon textile badminton.',
    'badminton', null, '2026-09-01', '2027-08-31',
    'Hors promotions en cours.'
  ),
  (
    'Offre spéciale raquette badminton',
    'Remise spéciale sur une sélection de raquettes badminton.',
    'badminton', null, '2026-09-01', '2027-08-31',
    'Selon stock disponible.'
  ),
  (
    'Offre spéciale cordage badminton',
    'Pose offerte ou remise selon cordage choisi.',
    'badminton', null, '2026-09-01', '2027-08-31',
    'Valable une seule fois.'
  );

-- ---- TENNIS DE TABLE ----
insert into coupons (title, description, sport, club_id, start_date, end_date, terms)
values
  (
    '-20% sur la gamme Victas',
    'Remise valable sur la gamme Victas.',
    'tennis-de-table', null, '2026-09-01', '2027-08-31',
    'Hors promotions en cours.'
  ),
  (
    '-15% sur le textile',
    'Remise valable sur le textile tennis de table.',
    'tennis-de-table', null, '2026-09-01', '2027-08-31',
    'Hors promotions en cours.'
  ),
  (
    'Offre spéciale bois / revêtement',
    'Offre spéciale sur une sélection bois et revêtements.',
    'tennis-de-table', null, '2026-09-01', '2027-08-31',
    'Selon stock disponible.'
  );


-- ------------------------------------------------------------
-- 7. DONNER LE RÔLE ADMIN À magasin@3sets.fr (RAPPEL)
-- ------------------------------------------------------------
-- Le trigger handle_new_user() ci-dessus fait déjà cela automatiquement
-- à la création du compte. Si tu dois le refaire manuellement plus tard
-- (par exemple après avoir changé l'email d'un compte), exécute :
--
--   update profiles set role = 'admin' where email = 'magasin@3sets.fr';
--
-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
