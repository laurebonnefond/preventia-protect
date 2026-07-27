/**
 * PréventIA Protect — Core Alerts
 * ═════════════════════════════════
 * Système d'alertes transversal : échéances, péremptions, non-conformités.
 *
 * Usage :
 *   import { checkAlerts, ALERT_LEVELS } from '../../core/alerts.js';
 *   const alerts = checkAlerts(items, { dateField: 'nextDate' });
 */

import { APP_CONFIG } from '../config/app.config.js';

export const ALERT_LEVELS = {
  ok:       { label: 'Conforme',       color: '#22c55e', bg: '#dcfce7', priority: 0 },
  warning:  { label: 'À surveiller',   color: '#eab308', bg: '#fef9c3', priority: 1 },
  critical: { label: 'Action requise', color: '#ef4444', bg: '#fee2e2', priority: 2 },
  expired:  { label: 'Périmé / Retard',color: '#dc2626', bg: '#fecaca', priority: 3 },
};

/**
 * Calcule le nombre de jours jusqu'à une date
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

/**
 * Détermine le niveau d'alerte d'un item
 * @param {object} item — objet contenant une date d'échéance
 * @param {string} dateField — nom du champ date (défaut 'nextDate')
 */
export function getAlertLevel(item, dateField = 'nextDate') {
  const date = item[dateField];
  if (!date) return 'ok';
  const days = daysUntil(date);
  if (days < 0) return 'expired';
  if (days < APP_CONFIG.alerts.critical) return 'critical';
  if (days < APP_CONFIG.alerts.warning) return 'warning';
  return 'ok';
}

/**
 * Filtre et trie les items en alerte
 * @param {Array} items
 * @param {object} options — { dateField, levels }
 * @returns {Array} — items triés par urgence
 */
export function checkAlerts(items, options = {}) {
  const { dateField = 'nextDate', levels = ['expired', 'critical', 'warning'] } = options;
  return items
    .map(item => ({
      ...item,
      _alertLevel: getAlertLevel(item, dateField),
      _daysLeft: daysUntil(item[dateField]),
    }))
    .filter(item => levels.includes(item._alertLevel))
    .sort((a, b) => (a._daysLeft ?? 999) - (b._daysLeft ?? 999));
}
