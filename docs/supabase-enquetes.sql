-- ════════════════════════════════════════════════════════════════════
-- PréventIA Protect — Enquêtes collectives anonymes (Supabase, région UE)
-- Utilisé par : EndoPrév, Diagnostic RPS (baromètre et COPSOQ à distance), puis MénoPrév, SeinPrév…
--
-- Principe « boîte aux lettres » :
--   • la salariée DÉPOSE une réponse avec le code public de la campagne (lien / QR) ;
--   • personne ne peut RELIRE une réponse isolée : les tables sont fermées (RLS sans règle) ;
--   • l'infirmier·e lit les résultats avec un code secret, et seulement
--     à partir du seuil (5 réponses minimum), dans un ordre mélangé ;
--   • aucune identité, aucune date, aucune adresse IP n'est enregistrée.
-- Tout passe par 5 fonctions (« RPC ») qui vérifient ces règles côté serveur.
-- ════════════════════════════════════════════════════════════════════

-- 1. Les campagnes ────────────────────────────────────────────────────
create table if not exists public.enq_campagnes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,          -- public : dans le lien envoyé aux salariées
  code_lecture  text not null unique,          -- secret : réservé à l'infirmier·e
  outil         text not null check (outil in ('endoprev','menoprev','seinprev','rps_baro','rps_copsoq','rps_ind')),
  entreprise    text check (char_length(entreprise) <= 120),
  ouverte       boolean not null default true,
  seuil         int not null default 5 check (seuil >= 5),
  fin           date,                           -- clôture automatique (facultatif)
  created_at    timestamptz not null default now()
);

-- 2. Les réponses : AUCUNE colonne d'identité ni de date ─────────────
create table if not exists public.enq_reponses (
  id           bigint generated always as identity primary key,
  campagne_id  uuid not null references public.enq_campagnes(id) on delete cascade,
  reponses     jsonb not null check (jsonb_typeof(reponses) = 'object' and pg_column_size(reponses) < 4000)
);
create index if not exists enq_reponses_campagne_idx on public.enq_reponses(campagne_id);

-- 3. Tables fermées : RLS activé, aucune règle ⇒ aucun accès direct ──
alter table public.enq_campagnes enable row level security;
alter table public.enq_reponses  enable row level security;
revoke all on public.enq_campagnes, public.enq_reponses from anon, authenticated;

-- 4. Fonctions (exécutées avec les droits du propriétaire, règles vérifiées dedans)

-- 4a. Créer une campagne → renvoie le code public et le code secret
create or replace function public.enq_creer(p_outil text, p_entreprise text default null, p_fin date default null)
returns table(code text, code_lecture text)
language plpgsql security definer set search_path = public as $$
declare c text; l text;
begin
  if p_outil not in ('endoprev','menoprev','seinprev','rps_baro','rps_copsoq','rps_ind') then raise exception 'outil inconnu'; end if;
  c := upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 8));
  l := replace(gen_random_uuid()::text,'-','') || substr(replace(gen_random_uuid()::text,'-',''),1,8);
  insert into enq_campagnes(code, code_lecture, outil, entreprise, fin)
  values (c, l, p_outil, nullif(trim(left(p_entreprise,120)),''), p_fin);
  return query select c, l;
end $$;

-- 4b. Infos publiques d'une campagne (page de réponse)
create or replace function public.enq_info(p_code text)
returns table(outil text, entreprise text, ouverte boolean)
language sql security definer set search_path = public stable as $$
  select outil, entreprise, (ouverte and (fin is null or fin >= current_date))
  from enq_campagnes where code = upper(p_code);
$$;

-- 4c. Déposer une réponse (anonyme)
create or replace function public.enq_repondre(p_code text, p_reponses jsonb)
returns boolean
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select id into cid from enq_campagnes
   where code = upper(p_code) and ouverte and (fin is null or fin >= current_date);
  if cid is null then raise exception 'campagne fermée ou inconnue'; end if;
  if jsonb_typeof(p_reponses) <> 'object' or pg_column_size(p_reponses) >= 4000 then raise exception 'réponse invalide'; end if;
  insert into enq_reponses(campagne_id, reponses) values (cid, p_reponses);
  return true;
end $$;

-- 4d. Lire les résultats (code secret) : rien sous le seuil, ordre mélangé
create or replace function public.enq_resultats(p_code_lecture text)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare cp enq_campagnes; n int; r jsonb;
begin
  select * into cp from enq_campagnes where code_lecture = p_code_lecture;
  if cp.id is null then raise exception 'code de lecture inconnu'; end if;
  select count(*) into n from enq_reponses where campagne_id = cp.id;
  if n >= cp.seuil then
    select jsonb_agg(reponses order by random()) into r from enq_reponses where campagne_id = cp.id;
  end if;
  return jsonb_build_object('code', cp.code, 'outil', cp.outil, 'entreprise', cp.entreprise,
    'ouverte', cp.ouverte and (cp.fin is null or cp.fin >= current_date), 'fin', cp.fin,
    'n', n, 'seuil', cp.seuil, 'reponses', r);
end $$;

-- 4e. Ouvrir / fermer une campagne (code secret)
create or replace function public.enq_ouvrir(p_code_lecture text, p_ouverte boolean)
returns boolean
language sql security definer set search_path = public as $$
  update enq_campagnes set ouverte = p_ouverte where code_lecture = p_code_lecture returning true;
$$;

revoke all on function public.enq_creer(text,text,date), public.enq_info(text), public.enq_repondre(text,jsonb),
  public.enq_resultats(text), public.enq_ouvrir(text,boolean) from public;
grant execute on function public.enq_creer(text,text,date), public.enq_info(text), public.enq_repondre(text,jsonb),
  public.enq_resultats(text), public.enq_ouvrir(text,boolean) to anon, authenticated;

-- 5. Diagnostic RPS — indicateurs RH (outil 'rps_ind') : chiffres déjà agrégés, lisibles dès 1 envoi
alter table public.enq_campagnes drop constraint if exists enq_campagnes_seuil_check;
alter table public.enq_campagnes add constraint enq_campagnes_seuil_check
  check (seuil >= 5 or (outil = 'rps_ind' and seuil >= 1));
-- enq_creer insère seuil = 1 pour 'rps_ind', 5 sinon (migration Supabase « enq_rps_indicateurs_rh »).
