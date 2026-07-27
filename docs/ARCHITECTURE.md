# 🏗️ Architecture Technique — PréventIA Protect

## Principes

1. **Modulaire** — Chaque outil est un module autonome dans `modules/`
2. **Partagé** — La couche transversale IA (`core/`) est importée par tous les modules
3. **Isolé** — Chaque module a son propre namespace de stockage
4. **Évolutif** — Ajouter un module = créer un dossier + l'enregistrer dans `modules.registry.js`
5. **Sécurisé** — Pas de données de santé, webhooks externalisés, CSP

## Flux de données

```
┌─────────────────────────────────────────────────┐
│                  NAVIGATEUR                      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Module A │  │ Module B │  │ Module C │ ...   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │            │
│  ┌────┴──────────────┴──────────────┴───────┐   │
│  │          COUCHE TRANSVERSALE (core/)       │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │   │
│  │  │ AI  │ │Photo│ │ OCR │ │Voice│ ...     │   │
│  │  └──┬──┘ └──┬──┘ └──┬──┘ └─────┘        │   │
│  └─────┼───────┼───────┼────────────────────┘   │
│        │       │       │                         │
│  ┌─────┴───────┴───────┴─────┐  ┌────────────┐ │
│  │    localStorage (isolé)    │  │   UI/CSS    │ │
│  └────────────────────────────┘  └────────────┘ │
└────────────────┬────────────────────────────────┘
                 │ HTTPS (fetch)
         ┌───────┴────────┐
         │   Make.com      │
         │   Webhooks      │
         └───────┬─────────┘
                 │
         ┌───────┴────────┐
         │   Claude API    │
         │   (Anthropic)   │
         └─────────────────┘
```

## Convention de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichier module | `kebab-case` | `analyse-poste` |
| Fichier core | `kebab-case.js` | `ai-assistant.js` |
| Clé storage | `pp_moduleId_vN_key` | `pp_chimique_v1_products` |
| Export JS | `camelCase` | `createAssistant()` |
| CSS class | `pp-component` | `pp-card`, `pp-badge` |

## Ajouter un module

1. Créer le dossier : `modules/categorie/mon-module/`
2. Créer `index.html` (page du module)
3. Enregistrer dans `config/modules.registry.js`
4. Importer les services `core/` nécessaires
5. Utiliser `createStore('mon-module')` pour le stockage

## Sécurité

- Webhooks : jamais dans le HTML, toujours via `config/webhooks.config.js`
- En production : proxy via Supabase Edge Functions
- localStorage : namespace isolé par module
- CSP : restreindre les origines (fonts.googleapis.com, hook.eu2.make.com)
- Pas de `eval()`, pas de `innerHTML` non sanitisé

## Roadmap technique

| Phase | Stack | Fonctionnalités |
|-------|-------|-----------------|
| 1 (actuel) | GitHub Pages + localStorage | Prototypes, validation terrain |
| 2 | + Supabase Auth & DB | Multi-utilisateurs, persistance serveur |
| 3 | + Supabase Storage | Photos, FDS, rapports stockés en cloud |
| 4 | + PWA | Mode hors-ligne terrain, sync différée |
| 5 | + API REST | Intégration ERP, Power BI, exports |
