# 🔒 Sécurité et données — PréventIA Protect

*Mise à jour : novembre 2026. Prototype : ce document décrit l'état réel, y compris ce qui reste à faire.*

## Principes

1. **Minimisation** : seules les données utiles à la prévention sont traitées.
2. **Données de travail dans le navigateur** : elles ne quittent le poste que par un export volontaire ou un appel IA.
3. **Aucune donnée de santé identifiable sur un serveur.**
4. **Anonymat par conception** pour les enquêtes auprès des salariés.
5. **Aucune clé ni aucun jeton dans le code public** : les clés des IA sont des secrets du serveur.

## Où sont les données

| Donnée | Sensibilité | Où |
|---|---|---|
| DUERP, inventaires, registres, plans de prévention, évaluation RPS | Moyenne | Navigateur (localStorage) |
| Registre infirmier (pseudonymisé), dépistages | Élevée | Navigateur uniquement, jamais exporté par les dossiers entreprise |
| Comptes des professionnels, SPSTI | Faible | Supabase, UE (Irlande) |
| Contenu des FDS (dangers, composition, EPI) | Faible, sans donnée d'entreprise | Supabase, UE |
| Réponses aux enquêtes anonymes | Moyenne | Supabase, UE — ni nom, ni e-mail, ni heure |
| Journal des appels IA | Faible — jamais le contenu | Supabase, UE |

## Enquêtes anonymes

- Lien ou QR code, sans compte ; seules les réponses sont enregistrées.
- Aucun résultat lisible sous 5 réponses (contrôlé par la base, pas par la page).
- Réponses rendues dans un ordre mélangé ; code de lecture aléatoire de 40 caractères.

## Intelligence artificielle

Tous les appels passent par `core/preventia-ia.js` puis par la fonction serveur Supabase `ia` (UE).

| Contrôle | Détail |
|---|---|
| Origine | Seules les pages `laurebonnefond.github.io` sont acceptées |
| Identité | Modules professionnels : compte PréventIA obligatoire. Modules santé : sans compte, avec limites |
| Quotas par jour | 60 par professionnel ; 15 par appareil (empreinte d'IP du jour, non réversible) ; 500 au total sans compte |
| Masquage | E-mails, n° de sécurité sociale, IBAN, téléphones, dates de naissance : dans le navigateur, puis à nouveau sur le serveur |
| Fournisseurs | Modules santé : **Mistral, point d'accès UE**, entraînement sur nos données désactivé, jamais de repli hors UE. Modules professionnels (documents techniques, sans donnée de salarié) : Claude (Anthropic) |
| Fichiers | Refusés dans les modules santé |
| Traçabilité | `ia_journal` : qui, quand, quel module, volume, statut — jamais le texte |
| Coûts | Plafonds de dépense mensuels chez chaque fournisseur |

## RGPD — état actuel

- Responsable de traitement envisagé : le SPSTI 23/87. Base légale, durées de conservation, AIPD et fiche au registre : **à établir avec le DPO**.
- Sous-traitants : Supabase (UE), Mistral AI (UE), Anthropic (États-Unis, modules professionnels), GitHub (pages, aucune donnée).
- Prévu : suppression automatique des réponses d'enquête 12 mois après la fin de campagne ; masquage des noms et des lieux dans les commentaires libres avant l'IA.

## Limites connues

- PréventIA-LaB utilise encore l'ancien circuit Make.com, dont le jeton est visible dans son code (dépense plafonnée en attendant la migration).
- Aucun hébergeur HDS : tout suivi de santé individuel sur serveur est exclu tant que ce n'est pas le cas.
- Offre gratuite de Supabase : pas de garantie de service.

## Signalement d'une vulnérabilité

Ouvrir une [issue](https://github.com/laurebonnefond/preventia-protect/issues) sans détail exploitable, ou contacter l'auteure. Contact dédié : à définir.
