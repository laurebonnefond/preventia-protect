# Santé de la femme : outils, méthodes de calcul et sources

Ce module rassemble six outils de prévention, des étapes de vie des femmes au travail. Ce document explique ce que fait chacun, **comment chaque résultat est calculé et d'où vient la méthode**, comment fonctionne l'enquête anonyme par lien ou QR code, et quelles sont les limites.

> **À retenir.** Ce sont des outils de **repérage et d'aménagement**, pas de diagnostic. Aucun ne dit si une salariée est malade, ni si son travail est la cause de ses symptômes. Les enquêtes collectives reposent sur le volontariat : elles ne mesurent pas une fréquence dans l'entreprise.

| Outil | Fichier | Pour qui | En bref |
|---|---|---|---|
| **SeinPrév** | `seinprev.html` | Salariées, infirmier·e, employeur | Dépistage du cancer du sein, Octobre rose, retour au travail après un cancer |
| **EndoPrév** | `endoprev.html` · `endo-data.js` | Salariées, infirmier·e, RH, CSE | Règles douloureuses, endométriose, adénomyose : bilan personnel, droits, enquête collective |
| **MénoPrév** | `menoprev.html` · `meno-data.js` · `meno-metiers.js` | Salariées, infirmier·e, RH, CSE | Ménopause et travail : symptômes croisés avec le poste, suivi, enquête collective |
| **MaterPrév** | `materprev.html` | Salariées, infirmier·e, employeur | Grossesse et allaitement : expositions interdites ou à aménager, droits, congé |
| **Droits et aménagements** | `assistant-droits.html` · `droits-data.js` | Salariées, infirmier·e, managers | Assistant qui répond uniquement à partir de fiches vérifiées et cite chaque source |
| **Postes à aménager en priorité** | `analyse-postes.html` | Infirmier·e, médecin du travail, RH, CSE | Croise les résultats des enquêtes et les postes pour cibler les aménagements |
| Enquête anonyme | `enquete.html` · `enquetes.js` | Salariées (réponse) | Page de réponse commune aux enquêtes par lien ou QR code |

---

## 1. SeinPrév — dépistage du cancer du sein

**Pour la salariée** : « Connaître mes seins » (repères, journal, signes qui doivent faire consulter), rythme de suivi selon l'âge, rappels, fiche pour la consultation, préparation de la visite de pré-reprise après un cancer.
**Pour l'infirmier·e et l'employeur** : campagne Octobre rose (actions, saisie anonyme des freins et attentes, bilan, 10 engagements, propositions pour l'année suivante).

**Calculs et repères**

| Élément | Règle | Origine |
|---|---|---|
| Dépistage organisé | 50 à 74 ans, mammographie et examen clinique tous les 2 ans, 100 % (constantes `DEP` dans le code) | HAS, programme national ; [note de cadrage HAS, mars 2026](https://www.has-sante.fr/jcms/p_3892250/fr/evaluation-de-l-opportunite-d-elargir-les-bornes-d-age-du-depistage-organise-du-cancer-du-sein-en-france-note-de-cadrage) |
| Score familial | Score d'**Eisinger** calculé par branche (maternelle, paternelle), on garde la plus élevée. À partir de 3 : consultation d'oncogénétique indiquée ; à 5 ou plus : indication excellente | Cotation diffusée par la HAS et l'INCa |
| Autopalpation | Présentée comme un moyen de connaître ses seins, **pas** comme un dépistage | INCa, HAS |
| Bilan de campagne | Part des 50-74 ans dont la dernière mammographie date de moins de 2 ans ; freins et souhaits en % des répondantes | Calcul simple ; masqué sous 5 réponses |

> **À surveiller** : la HAS évalue l'ouverture du dépistage organisé dès 45 ans et jusqu'à 79 ans ; avis attendu fin 2026. Il suffira de changer `DEP.AGE_MIN` et `DEP.AGE_MAX`.

---

## 2. EndoPrév — règles douloureuses et endométriose

**Pour la salariée** : 6 étapes (douleur, symptômes sur 3 mois, signes justifiant un avis médical, poste, travail les jours difficiles, bilan), calendrier, droits (visite à la demande, aménagements, ALD 31, RQTH, temps partiel thérapeutique), message de demande d'aménagement rédigé par l'IA **sans aucune mention de la maladie ni des symptômes**.
**Pour l'infirmier·e** : enquête collective, plan d'action (rédigé par l'IA à partir des seuls résultats regroupés), conduite à tenir en cas de crise douloureuse.

### Logique de calcul

```
Symptôme (8 items, intensité 0 à 3)  ×  Contrainte du poste (8 items, poids 1 ou 2)  =  score du croisement
   score ≥ 4  → « prioritaire »          score 2 ou 3 → « à discuter »          score < 2 → non retenu
```

*Exemple :* douleurs pendant les règles **sévères (3)** × horaires imposés ou travail de nuit (**poids 2**) = **6**, croisement prioritaire. Les pistes proposées sont celles du symptôme : souplesse horaire les jours difficiles, télétravail ponctuel, etc.

| Élément | Règle | Origine |
|---|---|---|
| Matrice symptômes × contraintes | Poids 2 = contrainte qui aggrave directement le symptôme, 1 = qui le gêne. Construite à partir des aménagements décrits dans la littérature et par les associations | **Méthode PréventIA, non validée** (même principe que MénoPrév) |
| Douleur | Échelle numérique 0-10 : 1-3 légère, 4-6 modérée, 7-10 intense | Seuils usuels de l'échelle numérique de la douleur |
| Signes justifiant un avis médical | Douleur des règles ≥ 8/10, absences répétées, antalgiques courants insuffisants, douleurs à la défécation ou urinaires pendant les règles, difficulté à avoir un enfant (question personnelle, jamais posée dans l'enquête) | [Recommandations HAS / CNGOF, décembre 2017](https://www.has-sante.fr/jcms/c_2819733/fr/prise-en-charge-de-l-endometriose) |
| Règles abondantes | Changement toutes les 1-2 h, caillots, plus de 7 jours, lever la nuit ; fatigue ou essoufflement (manque de fer possible) | Repères cliniques usuels |
| Capacité de travail | Une question de 0 à 10 (Work Ability Score) | Échelle validée en une question |
| Bilan en 3 niveaux | **Rouge** : signe médical avec douleur ≥ 7, ou au moins 2 signes, ou au moins 2 signes de règles abondantes ; ou travail très touché (capacité ≤ 5, gêne ≥ 7, 3 jours d'absence ou plus, travail souvent malgré la douleur). **Orange** : un signe médical, un croisement prioritaire, une douleur ou une gêne ≥ 4. **Vert** sinon | Règle PréventIA (fonction `bilan()` de `endo-data.js`) |

**Références sur les symptômes et les traitements** (reprises dans l'assistant « Droits et aménagements ») :
- HAS / CNGOF, *Prise en charge de l'endométriose*, décembre 2017 — [has-sante.fr](https://www.has-sante.fr/jcms/c_2819733/fr/prise-en-charge-de-l-endometriose)
- CNGOF-HAS, traitement médical de l'endométriose douloureuse, *Gynécol Obstét Fertil Sénol* 2018 ; 46(3) : 267-272 — [PubMed 29510966](https://pubmed.ncbi.nlm.nih.gov/29510966/)
- ESHRE, *Endometriosis guideline*, Becker C.M. et al., *Hum Reprod Open* 2022 — [PubMed 35350465](https://pubmed.ncbi.nlm.nih.gov/35350465/)

---

## 3. MénoPrév — ménopause et travail

**Pour la salariée** : symptômes, poste, travail, synthèse et croisements, suivi dans le temps (avant / après), respiration rythmée, journal des bouffées de chaleur, carte du corps et du lieu de travail, préparation de l'échange avec son manager.
**Pour l'infirmier·e** : enquête collective, cartographie des lieux difficiles, référent·e ménopause, formation des managers.

### Logique de calcul

**① Sous-scores de symptômes** — 9 items adaptés de la **Menopause Rating Scale** (MRS, Heinemann et al. 2004), cotés de 0 à 4. Les items 8 (sexualité) et 10 (sécheresse vaginale) sont **retirés volontairement** : sans lien avec le poste. Il n'y a donc **pas de score total MRS**, seulement deux sous-scores aux seuils publiés :

| Sous-score | Items MRS | Aucun | Léger | Modéré | Sévère |
|---|---|---|---|---|---|
| Somatique | 1, 2, 3, 11 | 0-2 | 3-4 | 5-8 | 9 et plus |
| Psychique | 4, 5, 6, 7 | 0-1 | 2-3 | 4-6 | 7 et plus |

Une seule non-réponse dans un sous-score est compensée par la moyenne des autres items (score marqué « estimé ») ; au-delà, le sous-score n'est pas calculé.

**② Croisement avec le poste** — même moteur qu'EndoPrév : intensité (0-4) × poids de la contrainte (1 ou 2), **≥ 4 prioritaire**, 2-3 à discuter. 3 compléments (maux de tête, règles abondantes, yeux secs) entrent dans les croisements mais pas dans les sous-scores.

**③ Travail** — capacité de travail en une question (Work Ability Score, 0-10) ; gêne sur 7 jours inspirée du WPAI ; absences sur 3 mois.

**Orientation médicale proposée** si : palpitations ≥ 3, règles abondantes ≥ 3, ou un sous-score « sévère ».

| Élément | Origine |
|---|---|
| Items et seuils des sous-scores | Heinemann K. et al., *The Menopause Rating Scale (MRS): a methodological review*, 2004 |
| Matrice symptômes × contraintes, poids | **Méthode PréventIA, non validée** |
| Cartographie du lieu de travail | Wales TUC Cymru, reprise par le rapport Rist (recommandation 19) |
| Respiration rythmée, journal | Hardy C. et al., MENOS@Work (TCC auto-administrée, essai contrôlé) |

**Références sur les symptômes et les traitements** :
- HAS, réévaluation des traitements hormonaux de la ménopause, octobre 2025 — [synthèse Vidal](https://www.vidal.fr/actualites/31630-traitements-hormonaux-de-la-menopause-la-has-confirme-leur-place-dans-la-strategie-therapeutique.html)
- CNGOF-GEMVi, *Les femmes ménopausées : recommandations pour la pratique clinique*, *Gynécol Obstét Fertil Sénol* 2021 ; 49 : 305-317 — [sommaire du numéro](https://www.em-consulte.com/es/revue/GOFS/49/5/table-des-matieres/)
- HAS, note de cadrage *Péri-ménopause et ménopause en soins de premier recours*, novembre 2025 — [has-sante.fr](https://www.has-sante.fr/jcms/p_3737819/fr/prise-en-charge-de-la-femme-en-periode-de-peri-menopause) (recommandations attendues)
- NICE NG23, *Menopause: identification and management* (Royaume-Uni)

---

## 4. MaterPrév — grossesse, allaitement et travail

**Ce que fait l'outil** : la salariée (ou l'infirmier·e avec elle) indique sa situation (grossesse, allaitement) et les expositions de son poste. Chaque exposition est classée :

| Classe | Sens | Exemples de références |
|---|---|---|
| **Interdit** | Exposition interdite : retrait du poste exposé | Produits toxiques pour la reproduction ou l'allaitement (art. D4152-10), plomb, benzène… |
| **Changement d'affectation** | Un poste sans exposition peut être demandé | Travail de nuit : poste de jour sur demande (art. L1225-9) |
| **À aménager** | Exposition à réduire avec le médecin du travail | Charges, station debout, rayonnements (dose à l'enfant à naître < 1 mSv), champs électromagnétiques (art. R4152-7-1) |

Il calcule aussi le calendrier du congé de maternité et liste 8 engagements de l'entreprise. **Rien n'est enregistré** : tout reste à l'écran. Sources : Code du travail (L1225-x, D4152-x, R4152-7-1, R4541-9) ; INRS, [aide-mémoire TJ 14 « Grossesse, maternité et travail »](https://www.inrs.fr/media.html?refINRS=TJ+14) et [dossier « Femmes enceintes »](https://www.inrs.fr/demarche/femmes-enceintes.html).

---

## 5. Assistant « Droits et aménagements »

**Principe** : l'IA **ne sait rien d'autre** que les fiches de `droits-data.js`.

```
Question ──► Recherche dans les fiches vérifiées (mots-clés, sans IA)
               │
               ├─ aucune fiche  ──► « Aucune fiche vérifiée ne répond » + fiche « visite à la demande »
               │
               └─ 1 à 5 fiches ──► affichées avec leur source et leur date
                                   │
                                   └─ (au choix) l'IA rédige ≤ 150 mots à partir de CES fiches seulement,
                                      chaque phrase citée [1], [2]… ; une référence inconnue ou une réponse
                                      sans citation est signalée à l'écran
```

- **22 fiches** au 25/11/2026 : visite à la demande (R4624-34), aménagements par le médecin du travail (L4624-3), pré-reprise, reprise après maternité, temps partiel thérapeutique, RQTH, ALD 31 et endométriose, absences de grossesse et d'AMP (L1225-16), allaitement (L1225-30 à 32), produits chimiques interdits, évaluation des risques et changement d'affectation pendant la grossesse, fausse couche (loi du 7 juillet 2023), recommandations endométriose (HAS/CNGOF 2017, traitements CNGOF-HAS, ESHRE 2022), ménopause (THM HAS 2025, CNGOF-GEMVi 2021, HAS en préparation, rapport Rist), dépistage du sein, reprise après un cancer (INCa 2024).
- Chaque fiche porte sa source, son lien et sa date de vérification ; les fiches à surveiller portent une mention « À surveiller ».
- L'IA (Mistral, UE, via `core/preventia-ia.js` qui masque les données personnelles) reçoit la question et les fiches trouvées, rien d'autre.
- **Ajouter une fiche** : suivre la procédure en tête de `droits-data.js`, puis faire relire par le médecin du travail.

---

## 6. Analyse collective « Postes à aménager en priorité »

**Ce qu'elle croise**

```
Enquêtes EndoPrév et MénoPrév (résultats regroupés)        Postes du DUERP (saisis par l'infirmier·e)
   symptômes × contraintes déclarées                         contraintes · effectif féminin · indicateurs
                  │                                                            │
                  └────────────── taux par contrainte ──────► score par poste ◄┘
                                                                   │
                                              classement + pistes + note rédigée par l'IA
```

**Étape 1 — taux par contrainte.** Pour chaque contrainte, part des répondantes **exposées** qui ont au moins un croisement **prioritaire** (score ≥ 4) portant sur cette contrainte. Calculé seulement à partir de **5 répondantes exposées** (sinon « – », pour l'anonymat). Les deux enquêtes n'ont pas les mêmes codes de contraintes : une table de correspondance (`U` dans le code) les ramène à 12 contraintes communes.

**Étape 2 — score du poste** (0 à 100) :

| Composante | Calcul |
|---|---|
| **Impact** | Taux de la contrainte la plus pénalisante du poste × 100 (le plus élevé des deux enquêtes) |
| **Cumul** | +5 par autre contrainte du poste dont le taux atteint 50 %, au plus +15 |
| **Signaux** | +10 si l'absentéisme du poste dépasse 1,25 fois celui de l'établissement (ou 5 % s'il n'est pas renseigné) ; +10 si au moins une visite à la demande ; +10 si au moins une demande d'aménagement |
| **Priorité** | Somme, plafonnée à 100 : **≥ 60 prioritaire**, 35-59 à planifier, < 35 à surveiller |

*Exemple :* IDE de nuit, contraintes « sanitaires » (taux 55 %), « charges » (38 %), « horaires » (36 %), « poste fixe » (18 %). Impact 55 ; cumul 0 (aucune autre contrainte n'atteint 50 %) ; signaux +30 (absentéisme, visites à la demande, demande d'aménagement) → **85, prioritaire**.

**Étape 3 — pistes.** Les symptômes qui expliquent les croisements prioritaires sur les contraintes du poste donnent leurs pistes d'aménagement (celles d'EndoPrév et de MénoPrév), classées par fréquence.

**Ordre de grandeur** affiché : effectif féminin × taux de la contrainte la plus pénalisante. Ce n'est **pas** une prévalence : les répondantes sont volontaires et concernées.

**IA** : la note de priorisation est rédigée à partir du seul tableau de classement (postes, scores, contraintes, pistes), jamais à partir de réponses individuelles. Les réponses chargées ne sont jamais enregistrées ; seule la liste des postes l'est, dans le navigateur.

> Méthode PréventIA, **non validée** : les seuils et les points sont des conventions explicites, à discuter avec le médecin du travail.

---

## 7. Enquête anonyme par lien ou QR code

Utilisée par EndoPrév, MénoPrév et le diagnostic RPS. Schéma de la base : [`docs/supabase-enquetes.sql`](../../../docs/supabase-enquetes.sql). Analyse d'impact : [`docs/AIPD-enquetes.md`](../../../docs/AIPD-enquetes.md).

```
Infirmier·e                         Salariées                         Base (Supabase, UE)
   │ crée la campagne ─────────────────────────────────────────────►  code public + code secret de lecture
   │ envoie le lien / QR code ──► répondent sur leur téléphone ─────►  réponse sans identité ni date
   │ lit avec le code secret ◄──────────────────────────────────────  rien sous 5 réponses, puis par paliers de 5
```

**Protections**

| Protection | Comment |
|---|---|
| Pas d'identité | Ni nom, ni âge, ni service, ni question ouverte. Aucune colonne d'identité ni de date sur la réponse |
| Seuil | Aucun résultat sous **5 réponses** |
| **Paliers de 5** | Les résultats ne changent qu'à 5, 10, 15… réponses : comparer deux consultations ne peut jamais isoler une réponse |
| Tables fermées | Accès uniquement par 5 fonctions contrôlées ; lecture réservée au code secret |
| Ordre mélangé | Les réponses sont renvoyées dans un ordre aléatoire |
| Anti-abus | Plafond de 200 campagnes par jour et de réponses par campagne |
| Conservation | Suppression automatique chaque nuit : 12 mois après la plus tardive de la clôture, de la dernière réponse ou de la création ; 3 mois pour une campagne restée vide |
| Bibliothèques | QR code et lecture Excel hébergés dans le dépôt (`assets/vendor/`), SheetJS 0.20.3 |

**Plan B** : Microsoft Forms ou Google Forms, avec un modèle fourni et l'import du fichier de résultats. C'est moins protecteur : le propriétaire du formulaire voit chaque réponse avec l'heure, et les données sont hébergées par Google ou Microsoft.

**Limites connues** : une même personne peut répondre plusieurs fois au même lien (pas de compte, par choix) ; les résultats sont des réponses de volontaires.

---

## 8. Confidentialité, en résumé

- Bilans personnels (EndoPrév, MénoPrév, SeinPrév « mes seins ») : enregistrés **uniquement dans le navigateur** de la salariée, effaçables à tout moment.
- MaterPrév : rien n'est enregistré.
- IA : modules santé → **Mistral, dans l'Union européenne**, via une fonction serveur qui masque les données personnelles et journalise sans le contenu.
- Enquêtes : voir § 7 et l'[AIPD](../../../docs/AIPD-enquetes.md).
