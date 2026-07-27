/**
 * PréventIA Protect — Core Storage
 * ══════════════════════════════════
 * Abstraction du stockage avec :
 * - Namespace par module (isolation des données)
 * - Versionning du schéma (migrations futures)
 * - Compression optionnelle (LZ-string)
 * - Prêt pour migration vers Supabase (Phase 2)
 *
 * Usage :
 *   import { createStore } from '../../core/storage.js';
 *   const store = createStore('chimique');
 *   store.set('products', [...]);
 *   const products = store.get('products', []);
 */

import { APP_CONFIG } from '../config/app.config.js';

const PREFIX = APP_CONFIG.storagePrefix;
const VERSION = APP_CONFIG.dataVersion;

/**
 * Crée un store isolé pour un module
 * @param {string} moduleId — identifiant unique du module
 * @returns {object} — API du store { get, set, remove, clear, keys, export, import }
 */
export function createStore(moduleId) {
  const ns = `${PREFIX}_${moduleId}_v${VERSION}`;

  return {
    /**
     * Récupère une valeur
     * @param {string} key
     * @param {*} defaultValue — valeur par défaut si clé absente
     */
    get(key, defaultValue = null) {
      try {
        const raw = localStorage.getItem(`${ns}_${key}`);
        if (raw === null) return defaultValue;
        return JSON.parse(raw);
      } catch (e) {
        console.warn(`[Storage] Erreur lecture ${ns}_${key}:`, e);
        return defaultValue;
      }
    },

    /**
     * Stocke une valeur
     * @param {string} key
     * @param {*} value — sera sérialisé en JSON
     */
    set(key, value) {
      try {
        localStorage.setItem(`${ns}_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error(`[Storage] Erreur écriture ${ns}_${key}:`, e);
        // Quota dépassé ? Nettoyer les plus anciens
        if (e.name === 'QuotaExceededError') {
          console.warn('[Storage] Quota localStorage dépassé');
        }
        return false;
      }
    },

    /** Supprime une clé */
    remove(key) {
      localStorage.removeItem(`${ns}_${key}`);
    },

    /** Supprime toutes les données du module */
    clear() {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(ns)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    },

    /** Liste les clés du module */
    keys() {
      const result = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(ns)) result.push(k.replace(`${ns}_`, ''));
      }
      return result;
    },

    /**
     * Exporte toutes les données du module (pour backup/migration)
     * @returns {object} — { moduleId, version, data, exportDate }
     */
    export() {
      const data = {};
      this.keys().forEach(k => { data[k] = this.get(k); });
      return {
        moduleId,
        version: VERSION,
        data,
        exportDate: new Date().toISOString(),
        app: APP_CONFIG.name,
      };
    },

    /**
     * Importe des données (depuis backup)
     * @param {object} backup — objet retourné par export()
     */
    import(backup) {
      if (backup.moduleId !== moduleId) {
        throw new Error(`Import incompatible: ${backup.moduleId} ≠ ${moduleId}`);
      }
      Object.entries(backup.data).forEach(([k, v]) => this.set(k, v));
    },
  };
}

/**
 * Utilitaire : taille totale utilisée par PréventIA
 * @returns {{ used, total, percentage }}
 */
export function getStorageUsage() {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIX)) {
      used += localStorage.getItem(k).length * 2; // UTF-16
    }
  }
  const total = 5 * 1024 * 1024; // ~5MB typical
  return {
    used,
    total,
    percentage: Math.round((used / total) * 100),
    usedFormatted: `${(used / 1024).toFixed(1)} Ko`,
  };
}
