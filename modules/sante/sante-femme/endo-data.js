/* ════════════════════════════════════════════════════════════════
   EndoPrév — RÉFÉRENTIEL (symptômes, contraintes, croisements, questionnaire)
   Même moteur que MénoPrév : score = intensité du symptôme (0-3) × poids de la contrainte (1 ou 2)
     score ≥ 4 → « prioritaire » · score 2-3 → « à discuter »
   ⚠ Outil de repérage et d'aménagement : AUCUN diagnostic, AUCUN lien de cause avec le travail.
   ════════════════════════════════════════════════════════════════ */
window.ENDO = (function () {
  const CONTRAINTES = {
    C1: "Accès aux sanitaires limité (poste fixe, route, chantier)",
    C2: "Station debout prolongée, piétinement",
    C3: "Station assise prolongée, conduite",
    C4: "Port de charges, efforts, postures pénibles",
    C5: "Horaires imposés, travail posté ou de nuit",
    C6: "Tenue ou EPI difficile à retirer, vêtement clair imposé",
    C7: "Tâches de vigilance ou de sécurité (conduite, machines)",
    C8: "Impossible de quitter son poste (caisse, accueil, soins, ligne)"
  };
  const MATRICE = {
    S1: { label: "Douleurs pendant les règles", court: "Règles douloureuses", contraintes: { C5: 2, C8: 2, C2: 1, C4: 1 },
          pistes: ["Souplesse horaire les jours difficiles", "Télétravail ponctuel si le poste le permet", "Pouvoir s'isoler et se reposer quelques minutes", "Chaleur (bouillotte) autorisée au poste"] },
    S2: { label: "Douleurs pelviennes en dehors des règles", court: "Douleurs pelviennes", contraintes: { C3: 2, C4: 2, C2: 1 },
          pistes: ["Siège ergonomique, coussin", "Alternance assis / debout", "Aides à la manutention, rotation des tâches"] },
    S3: { label: "Saignements abondants ou imprévisibles", court: "Saignements", contraintes: { C1: 2, C6: 2, C8: 1 },
          pistes: ["Accès facilité aux sanitaires", "Protections périodiques à disposition", "Tenue de rechange, vêtement foncé autorisé", "Remplacement organisé sur poste fixe"] },
    S4: { label: "Fatigue importante", court: "Fatigue", contraintes: { C5: 2, C7: 2 },
          pistes: ["Horaires adaptés, éviter temporairement la nuit", "Pauses régulières", "Tâches critiques en début de poste"] },
    S5: { label: "Troubles digestifs ou urinaires", court: "Troubles digestifs / urinaires", contraintes: { C1: 2, C8: 1, C3: 1 },
          pistes: ["Pauses à la demande", "Poste proche des sanitaires", "Arrêts planifiés sur les trajets"] },
    S6: { label: "Douleurs lombaires ou dans les jambes", court: "Douleurs lombaires", contraintes: { C3: 2, C4: 2, C2: 1 },
          pistes: ["Réglages du poste, siège adapté", "Limiter le port de charges", "Alternance des postures"] },
    S7: { label: "Maux de tête ou migraines liés au cycle", court: "Migraines", contraintes: { C7: 1, C5: 1 },
          pistes: ["Pause dans un lieu calme et sombre", "Éclairage et écrans réglés", "Souplesse sur les tâches à haute vigilance"] },
    S8: { label: "Moral, anxiété liés à la douleur", court: "Moral", contraintes: { C8: 2, C5: 1 },
          pistes: ["Soutien de l'encadrement", "Possibilité de s'isoler", "Entretien avec le médecin ou l'infirmier·e du travail"] }
  };
  const SEUIL_PRIORITAIRE = 4, SEUIL_A_DISCUTER = 2;

  function calculerScores(s, c) {
    const res = [];
    for (const [code, m] of Object.entries(MATRICE)) {
      const v = +(s?.[code] || 0); if (!v) continue;
      for (const [cc, poids] of Object.entries(m.contraintes)) {
        if (!(c || []).includes(cc)) continue;
        const score = v * poids; if (score < SEUIL_A_DISCUTER) continue;
        res.push({ code, codeC: cc, symptome: m.label, contrainte: CONTRAINTES[cc], score, niveau: score >= SEUIL_PRIORITAIRE ? 'prioritaire' : 'à discuter', pistes: m.pistes });
      }
    }
    res.sort((a, b) => b.score - a.score);
    /* Règles qui empêchent de vivre normalement = à explorer médicalement, quel que soit le poste */
    const orientationMedicale = +(s?.S1 || 0) === 3 || +(s?.S2 || 0) >= 2 || +(s?.S3 || 0) === 3;
    return { resultats: res, orientationMedicale };
  }

  /* Questions supplémentaires de l'enquête collective (impact sur le travail) */
  const IMPACT = {
    abs:  { label: "Ces 3 derniers mois, jours d'absence à cause de ces symptômes", options: [['0', 'Aucun'], ['1', '1 à 2 jours'], ['3', '3 jours ou plus']] },
    pres: { label: "Ces 3 derniers mois, avez-vous travaillé malgré des douleurs importantes ?", options: [['0', 'Jamais'], ['1', 'Parfois'], ['2', 'Souvent']] },
    parle:{ label: "En avez-vous déjà parlé à quelqu'un au travail ?", options: [['non', 'Non, à personne'], ['oui', 'Oui (collègue, manager, RH ou service de santé au travail)']] }
  };
  const NIVEAUX = ['0 - Absent', '1 - Léger', '2 - Modéré', '3 - Sévère'];

  /* Questionnaire affiché par enquete.html */
  const QUESTIONNAIRE = {
    titre: 'Règles douloureuses et travail',
    intro: "Huit questions sur vos symptômes au moment des règles, puis quelques questions sur votre poste. Environ 2 minutes. Cette enquête ne pose aucun diagnostic : elle aide l'entreprise à savoir quels aménagements seraient utiles.",
    filtre: "Avez-vous des règles actuellement (ou en avez-vous eu au cours des 12 derniers mois) ?",
    questions: [
      ...Object.entries(MATRICE).map(([k, m]) => ({ cle: 's.' + k, type: 'niveau', label: m.label, aide: 'Ces 3 derniers mois' })),
      { cle: 'c', type: 'multi', label: 'Mon poste de travail comporte…', aide: 'Plusieurs réponses possibles', options: Object.entries(CONTRAINTES) },
      ...Object.entries(IMPACT).map(([k, q]) => ({ cle: k, type: 'choix', label: q.label, options: q.options }))
    ]
  };
  if (window.ENQ) ENQ.QUESTIONNAIRES.endoprev = QUESTIONNAIRE;

  /* ── Microsoft Forms / Google Forms ──
     Modèle à recopier dans Forms (mêmes intitulés ⇒ import automatique) */
  const MODELE_FORMS = [
    'TITRE : Règles douloureuses et travail — enquête anonyme',
    '',
    'PARAMÈTRES INDISPENSABLES',
    '• Microsoft Forms : « Qui peut répondre » = Tout le monde peut répondre (ou personnes de l\'organisation SANS enregistrer le nom) ; ne pas cocher « Une réponse par personne ».',
    '• Google Forms : ne pas collecter les adresses e-mail ; ne pas limiter à une réponse (cela impose la connexion).',
    '• Aucune question ouverte, aucune question sur l\'âge, le service ou le nom.',
    '',
    'Q0 (choix unique, obligatoire) : ' + QUESTIONNAIRE.filtre + '  → Oui / Non  (si Non : fin du formulaire)',
    '',
    'Q1 à Q8 (choix unique) — options : ' + NIVEAUX.join(' / '),
    ...Object.values(MATRICE).map((m, i) => `Q${i + 1} : ${m.label} (ces 3 derniers mois)`),
    '',
    'Q9 (choix multiples) : Mon poste de travail comporte…',
    ...Object.values(CONTRAINTES).map(l => '   □ ' + l),
    '',
    ...Object.values(IMPACT).map((q, i) => `Q${10 + i} (choix unique) : ${q.label}\n   → ${q.options.map(o => o[1]).join(' / ')}`)
  ].join('\n');

  /* Une ligne d'export Forms → réponse au format commun {s, c, abs, pres, parle} (null si hors champ) */
  function depuisForms(row) {
    const n = ENQ.norm, cols = Object.keys(row);
    const col = label => cols.find(h => n(h).includes(n(label).slice(0, 28)));
    const filtre = col('Avez-vous des règles actuellement');
    if (filtre && /^non/i.test(n(row[filtre]))) return null;
    const s = {};
    for (const [k, m] of Object.entries(MATRICE)) {
      const h = col(m.label); if (!h) continue;
      const v = String(row[h]).match(/[0-3]/); if (v) s[k] = +v[0];
    }
    const hc = col('Mon poste de travail comporte');
    const brut = hc ? n(row[hc]) : '';
    const c = Object.entries(CONTRAINTES).filter(([, l]) => brut.includes(n(l).slice(0, 22))).map(([k]) => k);
    const r = { s, c };
    for (const [k, q] of Object.entries(IMPACT)) {
      const h = col(q.label); if (!h) continue;
      const o = q.options.find(([, l]) => n(row[h]).startsWith(n(l).slice(0, 8)));
      if (o) r[k] = o[0];
    }
    return Object.keys(s).length ? r : null;
  }

  return { CONTRAINTES, MATRICE, IMPACT, NIVEAUX, SEUIL_PRIORITAIRE, calculerScores, QUESTIONNAIRE, MODELE_FORMS, depuisForms };
})();
