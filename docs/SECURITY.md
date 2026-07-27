# 🔒 Politique de sécurité — PréventIA Protect

## Principes

1. **Aucune donnée personnelle de santé** n'est collectée ni stockée
2. **Données HSE uniquement** : inventaires, risques, dates, conformité
3. **Stockage local** : toutes les données restent dans le navigateur de l'utilisateur
4. **Webhooks sécurisés** : les tokens Make.com ne sont jamais exposés dans le HTML

## Données stockées

| Donnée | Sensibilité | Stockage |
|--------|-------------|----------|
| Inventaire EPI/EPC | Faible | localStorage |
| Évaluation des risques | Moyenne | localStorage |
| Produits chimiques | Moyenne | localStorage |
| Photos équipements | Faible | localStorage (base64) |
| Conversations IA | Éphémère | Mémoire uniquement |

## Ce qui n'est PAS stocké

- Données de santé des salariés
- Résultats d'examens médicaux
- Dossiers médicaux
- Informations personnelles (nom, adresse des salariés)
- Données biométriques

## Conformité RGPD

- Pas de collecte de données personnelles → pas de DPO requis
- Pas de transfert vers des tiers (les données restent locales)
- Les appels IA transitent par Make.com (EU) → Anthropic (US)
  - Seules les descriptions d'équipements/risques sont transmises
  - Aucune donnée nominative dans les prompts

## Signalement de vulnérabilité

Contacter : [à définir]
