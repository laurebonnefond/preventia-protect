-- ════════════════════════════════════════════════════════════════════
-- PréventIA Protect — Santé mentale · schéma Supabase (phase 2)
-- Projet Supabase région UE. Données NON médicales uniquement :
-- l'avis du médecin du travail ne contient que des constats collectifs.
-- Les données de santé nominatives (infirmerie) restent hors Supabase (local / hébergeur HDS).
-- ════════════════════════════════════════════════════════════════════

-- 1. Évaluation RPS (une ligne par démarche) ─────────────────────────
create table if not exists sm_evaluations (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null default auth.uid() references auth.users(id),  -- infirmier·e auteur·e
  entreprise   text not null,
  secteur      text,
  effectif     int,
  periode      text,
  equipes      jsonb not null default '[]',   -- [{n:'Quai', eff:34}]
  contexte     jsonb not null default '{}',   -- demande, comité de pilotage
  indicateurs  jsonb not null default '{}',   -- {abs:{n,n1}, tf:{n,n1}, …}
  avis         jsonb not null default '{}',   -- {cse:{f:[0..3 ×6], c:'…'}, …}
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Remontées (faits décrits sans nom) ──────────────────────────────
create table if not exists sm_remontees (
  id            bigint generated always as identity primary key,
  evaluation_id uuid not null references sm_evaluations(id) on delete cascade,
  date          date not null,
  source        text not null,
  equipe        text,
  facteur       text not null check (facteur in ('f1','f2','f3','f4','f5','f6')),
  gravite       smallint not null check (gravite between 1 and 3),
  texte         text not null,
  statut        text not null default 'À traiter'
);

-- 3. Réponses anonymes aux questionnaires ────────────────────────────
-- Volontairement : ni identifiant salarié, ni horodatage précis (anti-recoupement).
create table if not exists sm_reponses (
  id             bigint generated always as identity primary key,
  evaluation_id  uuid not null references sm_evaluations(id) on delete cascade,
  questionnaire  text not null check (questionnaire in ('preventia','copsoq')),
  equipe         text not null,
  reponses       smallint[] not null,      -- dans l'ordre des items du module
  sante          smallint[],               -- 2 items santé du baromètre PréventIA
  semaine        date not null default date_trunc('week', now())::date
);

-- 4. Restitution : jamais en dessous de 5 répondants par équipe ───────
create or replace view sm_effectifs_reponses as
  select evaluation_id, questionnaire, equipe, count(*) as n
  from sm_reponses group by 1,2,3 having count(*) >= 5;

-- 5. Sécurité (RLS) ──────────────────────────────────────────────────
alter table sm_evaluations enable row level security;
alter table sm_remontees  enable row level security;
alter table sm_reponses   enable row level security;

create policy "auteur : tout sur ses évaluations" on sm_evaluations
  for all using (owner = auth.uid()) with check (owner = auth.uid());

create policy "auteur : tout sur les remontées de ses évaluations" on sm_remontees
  for all using (exists (select 1 from sm_evaluations e where e.id = evaluation_id and e.owner = auth.uid()));

-- Les salariés (rôle anon, via un lien de questionnaire) peuvent seulement INSÉRER,
-- jamais lire : pas de policy select pour anon.
create policy "salarié : dépôt anonyme" on sm_reponses
  for insert to anon with check (true);

create policy "auteur : lecture des réponses de ses évaluations" on sm_reponses
  for select using (exists (select 1 from sm_evaluations e where e.id = evaluation_id and e.owner = auth.uid()));

-- À faire avant ouverture aux salariés : limiter l'insertion anon aux évaluations
-- « ouvertes » (colonne sm_evaluations.ouverte boolean + jeton de campagne), et
-- un quota d'insertions par minute (Edge Function) contre le remplissage abusif.
