# 🏗️ Architecture technique — PréventIA Protect

*Mise à jour : novembre 2026. Vue d'ensemble, liste des modules et fonctionnement détaillé de l'IA : voir le [README](../README.md).*

## Principes

1. **Sans compilation** — HTML, CSS et JavaScript « purs », servis tels quels par GitHub Pages.
2. **Un module = un dossier** dans `modules/<domaine>/<module>/`, avec sa propre page autonome.
3. **Peu de briques communes**, chargées par une simple balise `<script>` (voir ci-dessous).
4. **Données de travail dans le navigateur** ; serveur seulement pour ce qui doit être partagé (compte, base FDS, enquêtes anonymes, IA).
5. **Aucune clé ni aucun jeton dans le code** — les clés des IA sont des secrets du serveur.

## Vue d'ensemble

```
┌────────────────────────── Navigateur ──────────────────────────┐
│  Modules (DUERP, chimique, RPS, infirmerie, EPI, …)             │
│        │                                                        │
│  Briques communes                                               │
│   core/preventia-ia.js ········ passerelle IA (objet PIA)       │
│   core/avertissement-prototype.js · bandeau « prototype »       │
│   assets/js/pp-entreprise.js ··· dossiers entreprise            │
│   assets/js/pp-auth.js ········· compte commun (objet PPAuth)   │
│   assets/js/duerp-passerelle.js  propositions vers le DUERP     │
│   assets/js/protect-registre.js  moteur des modules « registre »│
│        │                                                        │
│  localStorage : une clé par module (pp_*)                       │
└────────┬─────────────────────────────────────┬──────────────────┘
         │ HTTPS                               │ HTTPS
         ▼                                     ▼
┌──────────── Supabase · UE (Irlande) ──────────────────────────┐
│  Auth : compte commun avec PréventIA Réseau                    │
│  Base : fds*, substances, enq_*, ia_journal (règles RLS)       │
│  Fonction serveur « ia » ──► Mistral (UE)  modules santé       │
│                          └─► Claude        modules pro         │
└────────────────────────────────────────────────────────────────┘
```

## Briques communes

| Fichier | Objet global | Rôle | Chargé par |
|---|---|---|---|
| `core/preventia-ia.js` | `PIA` | Seul accès à l'IA : masque les données personnelles, ajoute la session, appelle la fonction serveur `ia` | Pages utilisant l'IA |
| `core/avertissement-prototype.js` | — | Bandeau et fenêtre « prototype pédagogique » | Pages de module |
| `assets/js/pp-entreprise.js` | `PPEntreprise` | Sélecteur « Dossier entreprise », export / import ; charge `pp-auth.js` | Pages avec barre entreprise |
| `assets/js/pp-auth.js` | `PPAuth` | Connexion Supabase partagée avec PréventIA Réseau, choix du SPSTI (`pr-org`) | `pp-entreprise.js` ou `preventia-ia.js` |
| `assets/js/duerp-passerelle.js` | `PPDuerp` | File de risques proposés (`pp_duerp_inbox`), validés dans l'onglet « À valider » du DUERP | DUERP, RPS, chimique, cartographie |
| `assets/js/protect-registre.js` | `PP` | Moteur des modules « registre » (`PP.app({...})`) | Modules registre |

## Côté serveur (Supabase, projet partagé avec PréventIA Réseau)

| Élément | Contenu | Accès |
|---|---|---|
| `organizations`, `memberships`, `profiles` | SPSTI, appartenance, profils | Règles RLS, partagées avec Réseau |
| `fds`, `substances`, `fds_composition`, `fds_mentions_h`, `fds_sections` | Base FDS partagée (contenu des FDS uniquement) | Lecture : mon SPSTI + FDS vérifiées partagées ; écriture : mon SPSTI |
| `enq_campagnes`, `enq_reponses` | Enquêtes anonymes (RPS, santé de la femme) | Fonctions dédiées ; aucun résultat sous 5 réponses |
| `ia_journal` | Appels IA : qui, quand, module, volume (jamais le texte) | Écrit par la fonction `ia` ; chacun lit ses lignes |
| Fonction `ia` | Passerelle IA : origine, compte, quotas, masquage, routage | Secrets `MISTRAL_API_KEY`, `ANTHROPIC_API_KEY` |

Chaque table porte une étiquette de catégorie dans Supabase : `[Comptes]`, `[Réseau]`, `[Enquêtes]`, `[FDS]`, `[IA]`, `[LaB]`.

## Conventions

| Élément | Convention | Exemple |
|---|---|---|
| Dossier de module | `kebab-case` | `analyse-poste` |
| Clé de stockage | `pp_<module>_<donnée>` (+ `_vN` si le format change) | `pp_100j_suivi`, `pp_rps_v1` |
| Objet global partagé | `PP…` / `PIA` | `PPAuth`, `PPDuerp` |
| Usage IA (journal) | chemin après `modules/` | `sante/sante-mentale/reprendre-pied` |

## Ajouter un module

1. Créer `modules/<domaine>/<module>/index.html`.
2. Ajouter les briques utiles :
   ```html
   <script src="../../../core/avertissement-prototype.js" defer></script>
   <script src="../../../core/preventia-ia.js"></script>          <!-- si IA -->
   <script src="../../../assets/js/pp-entreprise.js"></script>    <!-- si dossiers entreprise -->
   ```
3. Déclarer le module dans la liste `MODULES` de `index.html` (voir README, § 8).
4. Choisir une clé `pp_<module>_…` et l'ajouter au registre de `pp-entreprise.js` si elle dépend de l'entreprise suivie (jamais pour des données de santé individuelles).
5. Module destiné aux salariés sans compte ? Le placer sous `modules/sante/` : l'IA y passe alors par Mistral (UE), avec les limites prévues pour les accès sans compte.
6. Question sensible hors module santé (parole de salariés, situation d'entreprise) ? Appeler `PIA.texte(body, { sensibilite: 'sensible' })` : elle part chez Mistral (UE) au lieu de Claude.

## Feuille de route technique

| Phase | Stack | État |
|---|---|---|
| 1 | GitHub Pages + navigateur | ✅ |
| 2 | + Supabase UE : compte commun, base FDS, enquêtes anonymes, passerelle IA | 🟠 en cours (nov. 2026) |
| 3 | + stockage des PDF de FDS, assistant FDS (recherche texte + vecteurs) | À venir |
| 4 | Application hors-ligne pour le terrain | À venir |
| 5 | Exports et intégrations (Power BI…) | À venir |
