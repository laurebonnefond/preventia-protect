# Analyse d'impact relative à la protection des données (AIPD)
## Enquêtes anonymes en santé au travail — PréventIA Protect

| | |
|---|---|
| Traitement | Enquêtes collectives par lien ou QR code : EndoPrév (règles douloureuses, endométriose), MénoPrév (ménopause), diagnostic RPS (baromètre, COPSOQ, indicateurs RH) |
| Responsable de traitement | SPSTI 23/87 *(à confirmer par la direction et le délégué à la protection des données)* |
| Rédaction | Version de travail du 25/11/2026, préparée avec l'équipe projet — **à valider par le DPO** |
| Méthode | Trame de la CNIL (description, nécessité et proportionnalité, risques, mesures), adaptée |

> **Pourquoi une AIPD.** Les réponses portent sur la santé (symptômes, douleur, ménopause, épuisement) : ce sont des données de santé si elles se rattachent à une personne. Le dispositif est conçu pour les rendre anonymes, mais des éléments techniques (adresse IP vue par l'hébergeur, petits effectifs) laissent un risque résiduel. L'AIPD documente ce risque et les mesures qui le réduisent.

---

## 1. Description du traitement

**Finalité** : aider l'employeur, avec le service de prévention et de santé au travail, à repérer des besoins d'aménagement collectifs (postes, organisation, information) et à prévenir les risques professionnels. **Aucune décision individuelle** n'est prise à partir des réponses.

**Personnes concernées** : salariées et salariés volontaires des entreprises adhérentes.

**Données collectées**

| Catégorie | Contenu | Données d'identification |
|---|---|---|
| Réponse à l'enquête | Intensité de symptômes (0 à 3 ou 0 à 4), contraintes du poste cochées, échelles 0-10, absences par tranche, « en avez-vous parlé » ; pour le RPS : réponses aux items et équipe | **Aucune** : ni nom, ni âge, ni service (sauf l'équipe pour le RPS, choisie dans une liste), ni question ouverte, ni date |
| Campagne | Code public, code secret de lecture, outil, nom de l'entreprise (facultatif), date de fin, date de la dernière réponse | Aucune donnée sur les répondantes |
| Journal de la passerelle IA | Module, date, volume ; **sans le contenu** | Aucune |
| Données techniques | Adresse IP et en-têtes vus par l'hébergeur au moment de l'envoi (journaux techniques de Supabase) | **Oui, indirectement** — non stockées dans la base de l'application |

**Circuit**

```
Téléphone de la salariée ──HTTPS──► Supabase (UE, Irlande) : fonction enq_repondre → table enq_reponses
Navigateur de l'infirmier·e ◄──HTTPS── fonction enq_resultats (code secret) : rien sous 5 réponses, puis par paliers de 5
Navigateur de l'infirmier·e ──► IA (Mistral, UE) : uniquement des résultats REGROUPÉS, pour rédiger un plan d'action
```

**Durées de conservation** : suppression automatique chaque nuit (tâche planifiée) — campagne et réponses 12 mois après la plus tardive de la clôture, de la dernière réponse ou de la création ; campagne restée vide 3 mois ; journal IA 13 mois.

**Hébergement** : Supabase, région UE (eu-west-1). IA des modules santé : Mistral, traitement dans l'UE.

---

## 2. Nécessité et proportionnalité

| Principe | Mise en œuvre |
|---|---|
| Base légale | Mission de prévention du SPSTI (Code du travail, art. L4622-2) ; participation **volontaire** des salariés |
| Minimisation | Questions fermées uniquement ; aucune question sur l'âge, le service ou le nom ; question intime (douleurs pendant les rapports) retirée ; filtre initial (« êtes-vous concernée ? ») qui n'enregistre rien en cas de « non » |
| Exactitude | Sans objet pour des réponses anonymes ; les résultats sont présentés comme des réponses de volontaires, pas comme une prévalence |
| Information | Page d'accueil de l'enquête : objectif, anonymat, durée, caractère facultatif de chaque question |
| Droits des personnes | Les réponses n'étant rattachées à personne, l'accès ou l'effacement individuel est impossible ; l'information le précise |
| Sous-traitants | Supabase (hébergement), Mistral (IA) : contrats et clauses à vérifier par le DPO |

---

## 3. Risques et mesures

Échelle : vraisemblance et gravité de 1 (négligeable) à 4 (maximale), **après** mesures.

| Risque | Source | Mesures en place | Vraisemblance | Gravité |
|---|---|---|---|---|
| **Ré-identification par petit effectif** | Équipe ou entreprise de quelques personnes | Seuil de 5 réponses ; RPS masqué par équipe sous 5 ; taux par contrainte non calculé sous 5 exposées (analyse des postes) | 2 | 3 |
| **Ré-identification par différence** | Comparer les résultats à 5 puis 6 réponses isole la 6e | **Paliers de 5** : les résultats ne changent qu'à 5, 10, 15… (migration du 25/11/2026) | 1 | 3 |
| **Lecture par une personne non autorisée** | Code secret transmis à l'employeur | Code secret réservé au service de santé au travail (consigne à inscrire dans la charte d'usage) ; aucune lecture directe des tables (RLS, accès par fonctions) | 2 | 3 |
| **Rattachement par l'adresse IP** | Journaux techniques de l'hébergeur | Aucune IP stockée dans la base de l'application ; journaux de Supabase à durée courte ; accès au projet réservé à l'administratrice | 1 | 3 |
| **Rattachement par l'heure de réponse** | Séance de réponses à l'infirmerie | Aucune date sur la réponse ; seule la date de la dernière réponse est gardée sur la campagne ; ordre mélangé | 1 | 3 |
| **Réponses multiples / faussées** | Lien sans compte | Plafond de réponses par campagne ; plafond de créations par jour ; limite assumée et affichée (pas de compte, par choix) | 3 | 2 |
| **Fuite vers l'IA** | Rédaction du plan d'action | Seules des données regroupées sont envoyées ; masquage automatique des données personnelles dans la passerelle ; IA dans l'UE | 1 | 2 |
| **Bibliothèque compromise** | Scripts externes | QR code et lecture Excel hébergés dans le dépôt ; SheetJS 0.20.3 (failles de la 0.18.5 corrigées) | 1 | 3 |
| **Plan B Forms** | Microsoft ou Google voient chaque réponse avec l'heure | Avertissement explicite ; formulaire détenu par le service de santé au travail ; recommandation du lien PréventIA | 2 | 3 |

**Risque résiduel global** : faible à modéré, acceptable sous réserve des actions ci-dessous.

---

## 4. Actions à mener

| Action | Responsable | Échéance |
|---|---|---|
| Appliquer la migration « paliers de 5 » sur la base (fichier `docs/supabase-enquetes.sql`, § 7) | Administratrice du projet | Immédiat |
| Faire valider cette AIPD par le DPO du SPSTI et l'inscrire au registre des traitements | Direction / DPO | Avant diffusion large |
| Vérifier les contrats de sous-traitance (Supabase, Mistral) et la durée des journaux techniques | DPO | Avant diffusion large |
| Rédiger une charte d'usage signée par l'employeur (finalité, pas d'usage individuel, code secret réservé au SPST, restitution obligatoire) | Équipe projet | Avant la première campagne |
| Réexaminer l'AIPD à chaque nouveau questionnaire ou nouvelle donnée collectée | Équipe projet | À chaque évolution |
