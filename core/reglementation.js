/**
 * PréventIA Protect — Core Réglementation
 * ═════════════════════════════════════════
 * Base de données réglementaire intégrée.
 * Chaque module peut interroger les textes applicables.
 */

export const REGLEMENTATION = {
  // Principes généraux
  'L4121-1': { titre: "Obligation générale de sécurité de l'employeur", domaine: "Général" },
  'L4121-2': { titre: "9 principes généraux de prévention", domaine: "Général" },
  'L4121-3': { titre: "Évaluation des risques", domaine: "DUERP" },
  'L4121-3-1': { titre: "PAPRIPACT obligatoire ≥ 50 salariés", domaine: "DUERP" },

  // DUERP
  'R4121-1': { titre: "Document unique — contenu", domaine: "DUERP" },
  'R4121-2': { titre: "Mise à jour annuelle du DUERP", domaine: "DUERP" },
  'R4121-4': { titre: "Conservation 40 ans + dépôt dématérialisé", domaine: "DUERP" },

  // EPI
  'R4321-1': { titre: "Mise à disposition des EPI", domaine: "EPI" },
  'R4323-95': { titre: "Vérifications périodiques des EPI", domaine: "EPI" },
  'R4323-99': { titre: "Registre de sécurité — EPI", domaine: "EPI" },

  // EPC / Machines
  'R4224-17': { titre: "Vérification des installations et EPC", domaine: "EPC" },
  'R4322-1': { titre: "Maintien en état de conformité des équipements", domaine: "Machines" },

  // Coactivité
  'R4511-1': { titre: "Champ d'application — entreprises extérieures", domaine: "Plan de Prévention" },
  'R4512-2': { titre: "Inspection préalable commune", domaine: "Plan de Prévention" },
  'R4512-6': { titre: "Plan de prévention — contenu", domaine: "Plan de Prévention" },
  'R4512-7': { titre: "PdP écrit obligatoire ≥ 400h ou travaux dangereux", domaine: "Plan de Prévention" },

  // Chimique
  'R4412-1': { titre: "Champ d'application — risque chimique", domaine: "Chimique" },
  'R4412-5': { titre: "Évaluation du risque chimique", domaine: "Chimique" },
  'R4412-59': { titre: "Dispositions spécifiques agents CMR", domaine: "CMR" },
  'R4412-70': { titre: "Substitution des agents CMR", domaine: "CMR" },
  'R4412-76': { titre: "Fiche d'exposition CMR (traçabilité)", domaine: "CMR" },

  // Incendie
  'R4227-1': { titre: "Dispositions générales — incendie", domaine: "Incendie" },
  'R4227-28': { titre: "Moyens de lutte contre l'incendie", domaine: "Incendie" },

  // ATEX
  'R4227-42': { titre: "Prévention des explosions — ATEX", domaine: "ATEX" },
  'R4227-50': { titre: "Document relatif à la protection contre les explosions (DRPCE)", domaine: "ATEX" },

  // Amiante
  'R4412-94': { titre: "Dispositions spécifiques — amiante", domaine: "Amiante" },
  'R4412-97': { titre: "DTA — Dossier Technique Amiante", domaine: "Amiante" },

  // Radioprotection
  'R4451-1': { titre: "Dispositions générales — rayonnements ionisants", domaine: "Radioprotection" },

  // VGP
  'Arrêté 01/03/2004': { titre: "Vérifications générales périodiques", domaine: "VGP" },
  'Arrêté 19/03/1993': { titre: "Liste des travaux dangereux", domaine: "Plan de Prévention" },
};

/**
 * Recherche les textes par domaine
 */
export function getByDomain(domaine) {
  return Object.entries(REGLEMENTATION)
    .filter(([, v]) => v.domaine === domaine)
    .map(([code, v]) => ({ code: `Art. ${code}`, ...v }));
}

/**
 * Recherche par mot-clé
 */
export function search(keyword) {
  const kw = keyword.toLowerCase();
  return Object.entries(REGLEMENTATION)
    .filter(([code, v]) => code.toLowerCase().includes(kw) || v.titre.toLowerCase().includes(kw) || v.domaine.toLowerCase().includes(kw))
    .map(([code, v]) => ({ code, ...v }));
}
