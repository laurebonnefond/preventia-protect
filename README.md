# 🛡️ PréventIA Protect

**Plateforme HSE modulaire propulsée par l'IA**  
*Prévenir aujourd'hui, protéger demain*

> Suite d'outils d'aide à la décision pour préventeurs, infirmiers et médecins du travail.  
> Branche entreprise de [PréventIA-LaB](https://laurebonnefond.github.io/PreventIA-LaB/).

---

## 🏗️ Architecture

```
PréventIA-LaB (écosystème)
│
├── PréventIA PST (SPSTI)
├── PréventIA Protect (Entreprises)    ← CE REPO
├── PréventIA Senior
└── PréventIA Assistant
```

### Modules fonctionnels

| Module | Description | Outils |
|--------|-------------|--------|
| 🏭 **Évaluer les risques** | Identification et cotation | DUERP, Analyse de poste, Cartographie |
| 🦺 **Gérer les équipements** | Suivi du parc EPI/EPC/Machines | Inventaire, Fiche EPI, Maintenance, VGP |
| 📚 **Garantir la conformité** | Obligations réglementaires | Registres, Veille, GED, Contrôles |
| ☣️ **Risques spécifiques** | Expertise par domaine | Chimique, Radioprotection, Incendie, ATEX, Amiante |
| 📊 **Piloter la prévention** | Tableaux de bord et IA | Dashboard, Indicateurs, IA prédictive |

### Couche transversale IA (`core/`)

Chaque module partage les mêmes capacités via la couche `core/` :

| Service | Fichier | Description |
|---------|---------|-------------|
| 🧠 Assistant IA | `core/ai-assistant.js` | Chat contextuel par module |
| 📷 Analyse photo | `core/ai-photo.js` | Vision IA (identification, état, conformité) |
| 📄 OCR | `core/ai-ocr.js` | Extraction de données depuis documents |
| 🎤 Dictée vocale | `core/ai-voice.js` | Web Speech API, transcription |
| 📊 Statistiques | `core/stats.js` | Calculs, agrégations, KPI |
| 🔔 Alertes | `core/alerts.js` | Échéances, péremptions, non-conformités |
| 📅 Planification | `core/planning.js` | Calendrier de contrôles et actions |
| 📚 Réglementation | `core/reglementation.js` | Base juridique (Code du travail, INRS) |
| 🗄️ Stockage | `core/storage.js` | Abstraction localStorage / future BDD |
| 🎨 UI | `core/ui.js` | Composants, design system, thème |

---

## 📁 Structure du repo

```
preventia-protect/
│
├── index.html                          # Landing page / portail
├── app.html                            # Application SPA principale
├── README.md
│
├── assets/
│   ├── img/hero-preventia.png
│   ├── icons/                          # Pictogrammes SVG
│   └── styles/
│       ├── design-tokens.css           # Variables CSS (couleurs, typo, espacements)
│       ├── components.css              # Composants réutilisables
│       └── modules.css                 # Styles spécifiques modules
│
├── config/
│   ├── app.config.js                   # Configuration globale
│   ├── modules.registry.js             # Registre des modules
│   └── webhooks.config.js              # Endpoints IA (Make.com)
│
├── core/                               # Couche transversale IA
│   ├── ai-assistant.js
│   ├── ai-photo.js
│   ├── ai-ocr.js
│   ├── ai-voice.js
│   ├── storage.js
│   ├── alerts.js
│   ├── stats.js
│   ├── planning.js
│   ├── reglementation.js
│   └── ui.js
│
├── modules/
│   ├── evaluer/
│   │   ├── duerp/index.html
│   │   ├── analyse-poste/index.html
│   │   └── cartographie/index.html
│   ├── equipements/
│   │   ├── inventaire/index.html
│   │   ├── epi/index.html
│   │   ├── maintenance/index.html
│   │   └── vgp/index.html
│   ├── conformite/
│   │   ├── registres/index.html
│   │   ├── veille/index.html
│   │   ├── documents/index.html
│   │   └── controles/index.html
│   ├── risques/
│   │   ├── chimique/index.html
│   │   ├── radioprotection/index.html
│   │   ├── incendie/index.html
│   │   ├── atex/index.html
│   │   └── amiante/index.html
│   └── pilotage/
│       ├── dashboard/index.html
│       ├── indicateurs/index.html
│       └── ia-predictive/index.html
│
└── docs/
    ├── ARCHITECTURE.md                 # Architecture technique détaillée
    ├── CONTRIBUTING.md                 # Guide de contribution
    ├── SECURITY.md                     # Politique de sécurité
    └── MODULES.md                      # Spécifications des modules
```

---

## 🔒 Sécurité

- **Aucune donnée personnelle** stockée côté serveur (GitHub Pages = statique)
- **localStorage** chiffré par module (clé par entreprise)
- **Webhooks Make.com** : tokens non exposés dans le code source (`.env` / config séparée)
- **Pas de données de santé** dans les outils (conformité RGPD)
- **CSP headers** via `_headers` (Content-Security-Policy)
- **SRI** (Subresource Integrity) sur les CDN externes

---

## 🚀 Déploiement

### GitHub Pages (actuel)
```bash
git clone https://github.com/laurebonnefond/preventia-protect.git
cd preventia-protect
# Ouvrir index.html dans un navigateur
```

### Évolution future (Supabase)
```
Phase 1 : GitHub Pages + localStorage (actuel)
Phase 2 : Supabase Auth + PostgreSQL + Storage
Phase 3 : Multi-tenant (1 espace par entreprise)
Phase 4 : PWA (mode hors-ligne terrain)
```

---

## 📖 Réglementation intégrée

| Référence | Domaine |
|-----------|---------|
| Art. L4121-1 à L4121-5 | Obligations employeur, 9 principes |
| Art. R4121-1 à R4121-4 | DUERP |
| Art. R4323-95 | Vérification EPI |
| Art. R4224-17 | Vérification EPC |
| Art. R4512-6 à R4512-12 | Plan de Prévention |
| Art. R4412-59 à R4412-93 | CMR |
| Règlement (CE) 1272/2008 | CLP / GHS |
| Arrêté 01/03/2004 | VGP machines |
| Arrêté 19/03/1993 | Travaux dangereux |
| INRS ED 753 | Stockage chimique |

---

## 👩‍⚕️ Auteure

**Laure Bonnefond**  
IDE-ST / IPRP — SPSTI 23/87  
Master IA & Big Data — IPSSI Bordeaux (2026-2028)

*Des outils augmentés par l'IA au service de la prévention*

---

## 📄 Licence

© 2025-2026 — Tous droits réservés
