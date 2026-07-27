/**
 * PréventIA Protect — Core Stats
 * ════════════════════════════════
 * Calculs statistiques et indicateurs transversaux.
 */

/** Compteur par valeur d'un champ */
export function countBy(items, field) {
  const counts = {};
  items.forEach(item => {
    const val = item[field] || 'N/A';
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

/** Pourcentage */
export function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

/** Taux de fréquence AT : (nb AT × 1 000 000) / heures travaillées */
export function tauxFrequence(nbAT, heuresTravaillees) {
  return heuresTravaillees ? ((nbAT * 1000000) / heuresTravaillees).toFixed(2) : 0;
}

/** Taux de gravité : (nb jours arrêt × 1000) / heures travaillées */
export function tauxGravite(joursArret, heuresTravaillees) {
  return heuresTravaillees ? ((joursArret * 1000) / heuresTravaillees).toFixed(2) : 0;
}
