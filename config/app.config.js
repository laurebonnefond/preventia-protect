/**
 * PréventIA Protect — Configuration globale
 * ═══════════════════════════════════════════
 * Ce fichier centralise toute la configuration de la plateforme.
 * Les webhooks sont chargés depuis webhooks.config.js (non versionné en production).
 */

export const APP_CONFIG = {
  name: "PréventIA Protect",
  version: "1.0.0",
  tagline: "Prévenir aujourd'hui, protéger demain",
  author: "Laure Bonnefond — IDE-ST / IPRP",
  repo: "https://github.com/laurebonnefond/preventia-protect",
  lab: "https://laurebonnefond.github.io/PreventIA-LaB/",

  // Préfixe de stockage localStorage (évite collisions)
  storagePrefix: "pp",

  // Version du schéma de données (pour migrations futures)
  dataVersion: 1,

  // Thème
  theme: {
    navy:      "#0c1e3c",
    navyLight: "#1e3a5f",
    teal:      "#0f766e",
    tealLight: "#14b8a6",
    purple:    "#7c3aed",
    rose:      "#be185d",
    orange:    "#ea580c",
    red:       "#dc2626",
    green:     "#22c55e",
    yellow:    "#eab308",
    fonts: {
      sans:  "'DM Sans', system-ui, sans-serif",
      serif: "'DM Serif Display', serif",
    },
  },

  // Alertes (jours avant échéance)
  alerts: {
    warning: 90,  // J-90 : à surveiller
    critical: 30, // J-30 : action requise
  },

  // IA — Modèle par défaut
  ai: {
    model: "claude-sonnet-4-5-20250514",
    maxTokens: 2500,
    temperature: 0.3,
  },
};
