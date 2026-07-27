/**
 * PréventIA Protect — Core Planning
 * ═══════════════════════════════════
 * Gestion du calendrier de contrôles, vérifications et actions.
 */

/**
 * Génère les échéances futures à partir d'items avec date et périodicité
 * @param {Array} items — objets avec dateField et periodeMonths
 * @returns {Array} — événements triés par date
 */
export function generateSchedule(items, dateField = 'nextDate') {
  return items
    .filter(i => i[dateField])
    .map(i => ({
      ...i,
      _scheduledDate: new Date(i[dateField]),
    }))
    .sort((a, b) => a._scheduledDate - b._scheduledDate);
}

/** Formate une date en français */
export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

/** Date du jour ISO */
export function today() {
  return new Date().toISOString().split('T')[0];
}
