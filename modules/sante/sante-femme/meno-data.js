/* ════════════════════════════════════════════════════════════════
   MénoPrév — RÉFÉRENTIEL (questions, scores, croisements, questionnaire à distance)

   ① Symptômes : 9 items adaptés de la Menopause Rating Scale (Heinemann et al. 2004),
      recommandée par la HAS (note de cadrage, nov. 2025), cotés 0 à 4.
      Items 8 (sexualité) et 10 (sécheresse vaginale) RETIRÉS : sans lien avec le poste.
      → sous-score somatique (items 1, 2, 3, 11) et sous-score psychique (items 4 à 7)
        gardent les seuils publiés ; pas de score total MRS.
      + 3 compléments « travail » (maux de tête, règles abondantes, yeux secs) sans score.
   ② Croisement avec le poste : intensité (0-4) × poids de la contrainte (1 ou 2)
      score ≥ 4 → « prioritaire » · score 2-3 → « à discuter »
   ③ Travail : capacité de travail en une question (Work Ability Score, 0-10),
      gêne au travail sur 7 jours (inspirée du WPAI), heures perdues.
   ⚠ Outil de repérage et d'aménagement : AUCUN diagnostic.
   ════════════════════════════════════════════════════════════════ */
window.MENO = (function () {
  const CONTRAINTES = {
    C1: "Ambiance chaude / tenue ou EPI couvrant",
    C2: "Travail de nuit / horaires décalés",
    C3: "Accès aux sanitaires limité",
    C4: "Port de charges / postures pénibles",
    C5: "Tâches de vigilance / sécurité",
    C6: "Contact public / charge émotionnelle",
    C7: "Open space / bruit / interruptions",
    C8: "Uniforme imposé (matière, couleur, coupe)",
    C9: "Travail sur écran prolongé"
  };

  /* g = fiche conseils (onglet « Que faire ? ») ; d = sous-score MRS ; mrs = n° d'item d'origine */
  const ITEMS = {
    M1:  { mrs: 1,  d: 'soma', g: 'S1',  label: "Bouffées de chaleur, sueurs", court: "Bouffées de chaleur",
           contraintes: { C1: 2, C6: 1, C8: 1 }, pistes: ["Pauses en zone fraîche", "Accès à l'eau", "Tenue respirante", "Ventilateur individuel"] },
    M2:  { mrs: 2,  d: 'soma', g: 'S9',  label: "Palpitations, gêne ou oppression dans la poitrine", court: "Palpitations",
           contraintes: { C5: 1, C4: 1 }, pistes: ["Orientation médicale prioritaire", "Pouvoir s'arrêter et s'asseoir"] },
    M3:  { mrs: 3,  d: 'soma', g: 'S2',  label: "Troubles du sommeil (endormissement, réveils)", court: "Sommeil",
           contraintes: { C2: 2, C5: 2 }, pistes: ["Horaires adaptés", "Éviter temporairement le travail de nuit", "Pauses régulières"] },
    M4:  { mrs: 4,  d: 'psy',  g: 'S4',  label: "Humeur triste, moral en baisse", court: "Moral",
           contraintes: { C6: 2 }, pistes: ["Soutien de l'encadrement", "Temps de récupération", "Entretien avec le service de santé au travail"] },
    M5:  { mrs: 5,  d: 'psy',  g: 'S4',  label: "Irritabilité, nervosité", court: "Irritabilité",
           contraintes: { C6: 2, C7: 1 }, pistes: ["Rotation des tâches exposées", "Pouvoir s'isoler quelques minutes"] },
    M6:  { mrs: 6,  d: 'psy',  g: 'S4',  label: "Anxiété, inquiétude", court: "Anxiété",
           contraintes: { C6: 1, C7: 1 }, pistes: ["Priorités claires", "Temps de récupération"] },
    M7:  { mrs: 7,  d: 'psy',  g: 'S3',  label: "Fatigue, difficultés de concentration ou de mémoire", court: "Fatigue, concentration",
           contraintes: { C5: 2, C7: 1, C2: 1 }, pistes: ["Check-lists", "Zone calme", "Tâches critiques en début de poste"] },
    M9:  { mrs: 9,  d: 'soma', g: 'S7',  label: "Envies fréquentes d'uriner, fuites (à l'effort, en portant)", court: "Urinaire",
           contraintes: { C3: 2, C4: 1 }, pistes: ["Pauses à la demande", "Remplacement organisé", "Aides à la manutention"] },
    M11: { mrs: 11, d: 'soma', g: 'S5',  label: "Douleurs articulaires et musculaires (poignets, mains, épaules…)", court: "Douleurs articulaires",
           contraintes: { C4: 2, C9: 1 }, pistes: ["Aides à la manutention", "Alternance des postures", "Réglage du poste"] },
    X1:  { d: 'compl', g: 'S6', label: "Maux de tête, migraines", court: "Maux de tête",
           contraintes: { C7: 1, C1: 1, C9: 1 }, pistes: ["Éclairage adapté", "Pauses écran", "Hydratation"] },
    X2:  { d: 'compl', g: 'S8', label: "Règles abondantes ou imprévisibles", court: "Règles abondantes",
           contraintes: { C3: 2, C1: 1, C8: 1 }, pistes: ["Accès facilité aux sanitaires", "Tenue de rechange"] },
    X3:  { d: 'compl', g: 'S10', label: "Yeux secs, fatigue visuelle", court: "Yeux secs", facultatif: true,
           contraintes: { C9: 2, C1: 1 }, pistes: ["Pauses écran (règle 20-20-20)", "Humidité de l'air, éloigner la ventilation du visage"] }
  };
  const NIVEAUX = ['0 - Aucun', '1 - Léger', '2 - Modéré', '3 - Sévère', '4 - Très sévère'];
  const NR = 'Je préfère ne pas répondre';

  /* Seuils publiés de la MRS (Heinemann 2004) : valeur ≤ seuil[i] → aucun / léger / modéré, au-delà = sévère */
  const SEUILS = { soma: [2, 4, 8], psy: [1, 3, 6] };
  const MAX = { soma: 16, psy: 16 };
  const NIV_TXT = ['aucun', 'léger', 'modéré', 'sévère'];
  const niveau = (v, d) => { const i = SEUILS[d].findIndex(x => v <= x); return NIV_TXT[i < 0 ? 3 : i]; };

  /* Sous-scores : null = « je préfère ne pas répondre » (une question laissée vide compte 0).
     Une seule non-réponse est compensée (moyenne des autres), au-delà « non calculable » */
  function sousScores(s) {
    const out = {};
    for (const d of ['soma', 'psy']) {
      const ks = Object.keys(ITEMS).filter(k => ITEMS[k].d === d);
      const rep = ks.map(k => s?.[k]).filter(v => v !== null).map(v => v ?? 0);
      if (ks.length - rep.length > 1) { out[d] = null; continue; }
      const somme = rep.reduce((a, b) => a + +b, 0);
      const v = rep.length === ks.length ? somme : Math.round(somme / rep.length * ks.length);
      out[d] = { v, niveau: niveau(v, d), estime: rep.length < ks.length };
    }
    return out;
  }

  const SEUIL_PRIORITAIRE = 4, SEUIL_A_DISCUTER = 2;
  function calculerScores(s, c) {
    const res = [];
    for (const [code, m] of Object.entries(ITEMS)) {
      const v = +(s?.[code] || 0); if (!v) continue;
      for (const [cc, poids] of Object.entries(m.contraintes)) {
        if (!(c || []).includes(cc)) continue;
        const score = v * poids; if (score < SEUIL_A_DISCUTER) continue;
        res.push({ code, codeC: cc, symptome: m.label, contrainte: CONTRAINTES[cc], score, niveau: score >= SEUIL_PRIORITAIRE ? 'prioritaire' : 'à discuter', pistes: m.pistes });
      }
    }
    res.sort((a, b) => b.score - a.score);
    const ss = sousScores(s);
    const orientationMedicale = +(s?.M2 || 0) >= 3 || +(s?.X2 || 0) >= 3 || ss.psy?.niveau === 'sévère' || ss.soma?.niveau === 'sévère';
    return { resultats: res, orientationMedicale, sous: ss };
  }

  /* ③ Travail */
  const TRAVAIL = {
    was:  { label: "Si 10 correspond à votre meilleure capacité de travail, quelle note donnez-vous à votre capacité actuelle ?", type: 'echelle', min: 0, max: 10, bornes: ['incapable de travailler', 'au meilleur'] },
    gene: { label: "Ces 7 derniers jours, à quel point vos symptômes ont-ils gêné votre travail ?", type: 'echelle', min: 0, max: 10, bornes: ['pas du tout', 'complètement'] },
    abs:  { label: "Ces 3 derniers mois, absences à cause de ces symptômes", type: 'choix', options: [['0', 'Aucune'], ['1', 'Quelques heures à 2 jours'], ['3', '3 jours ou plus']] },
    parle:{ label: "En avez-vous déjà parlé à quelqu'un au travail ?", type: 'choix', options: [['non', 'Non, à personne'], ['oui', 'Oui (collègue, manager, RH ou service de santé au travail)']] }
  };

  /* Cartographie du lieu de travail (Wales TUC, repris par le rapport Rist, recommandation 19) */
  const LIEUX = {
    L1: "Mon poste de travail",
    L2: "Les sanitaires (distance, propreté, accès)",
    L3: "Les vestiaires, les tenues",
    L4: "La salle de pause / un endroit pour s'isoler",
    L5: "Les réunions, l'open space",
    L6: "Le véhicule, les déplacements, les chantiers",
    L7: "L'accueil, le contact avec le public"
  };
  const GENES_LIEU = { chaud: 'Trop chaud, mal aéré', loin: 'Trop loin, difficile à quitter', bruit: 'Bruyant, interruptions', intime: "Pas d'endroit où s'isoler", tenue: 'Tenue inadaptée' };

  /* Questionnaire affiché par enquete.html (lien / QR code) */
  const QUESTIONNAIRE = {
    titre: 'Ménopause et travail',
    couleur: 'mauve',
    intro: "Neuf questions sur vos symptômes, trois compléments, puis quelques questions sur votre poste et votre travail. Environ 3 minutes. Vous pouvez passer toute question. Cette enquête ne pose aucun diagnostic : elle aide l'entreprise à savoir quels aménagements seraient utiles.",
    filtre: "Vous sentez-vous concernée par la périménopause ou la ménopause (règles qui changent ou arrêtées, bouffées de chaleur…) ou vous posez-vous la question ?",
    filtreNon: "Cette enquête concerne les personnes en périménopause ou en ménopause. Aucune réponse n'a été enregistrée.",
    niveaux: NIVEAUX, nr: NR,
    questions: [
      ...Object.entries(ITEMS).map(([k, m]) => ({ cle: 's.' + k, type: 'niveau', label: m.label, aide: 'Ces dernières semaines', nr: true })),
      { cle: 'c', type: 'multi', label: 'Mon poste de travail comporte…', aide: 'Plusieurs réponses possibles', options: Object.entries(CONTRAINTES) },
      { cle: 'l', type: 'multi', label: 'Les endroits du travail où c\'est le plus difficile…', aide: 'Plusieurs réponses possibles', options: Object.entries(LIEUX) },
      ...Object.entries(TRAVAIL).map(([k, q]) => ({ cle: k, ...q, facultatif: true }))
    ],
    recap(R) {
      const ss = sousScores(R.s || {});
      const t = (d, l) => `<div><span>${l}</span><b>${ss[d] ? `${ss[d].v}/${MAX[d]} · ${ss[d].niveau}` : 'non calculable'}</b></div>`;
      return t('soma', 'Symptômes physiques') + t('psy', 'Symptômes psychiques') +
        `<div><span>Contraintes du poste</span><b>${(R.c || []).length}</b></div><div><span>Capacité de travail</span><b>${R.was ?? '–'}/10</b></div>`;
    },
    alerte(R) { return calculerScores(R.s || {}, R.c || []).orientationMedicale
      ? "<b>Un avis médical est conseillé.</b> Certains symptômes sont marqués : parlez-en à votre médecin traitant, à votre gynécologue ou à une sage-femme, indépendamment de cette enquête." : ''; },
    lienPerso: 'menoprev.html#suivi',
    lienPersoTexte: 'Ouvrir MénoPrév pour mon suivi personnel (rien n\'est envoyé)'
  };
  if (window.ENQ) ENQ.QUESTIONNAIRES.menoprev = QUESTIONNAIRE;

  /* ── Microsoft Forms / Google Forms : modèle à recopier (mêmes intitulés ⇒ import automatique) ── */
  const MODELE_FORMS = [
    'TITRE : Ménopause et travail — enquête anonyme',
    '',
    'PARAMÈTRES INDISPENSABLES',
    '• Microsoft Forms : « Qui peut répondre » = Tout le monde (ou personnes de l\'organisation SANS enregistrer le nom) ; ne pas cocher « Une réponse par personne ».',
    '• Google Forms : ne pas collecter les adresses e-mail ; ne pas limiter à une réponse (cela impose la connexion).',
    '• Aucune question ouverte, aucune question sur l\'âge, le service ou le nom. Toutes les questions facultatives.',
    '',
    'Q0 (choix unique, obligatoire) : ' + QUESTIONNAIRE.filtre + '  → Oui / Non  (si Non : fin du formulaire)',
    '',
    `Q1 à Q12 (choix unique, facultatif) — options : ${NIVEAUX.join(' / ')} / ${NR}`,
    ...Object.values(ITEMS).map((m, i) => `Q${i + 1} : ${m.label} (ces dernières semaines)`),
    '',
    'Q13 (choix multiples) : Mon poste de travail comporte…',
    ...Object.values(CONTRAINTES).map(l => '   □ ' + l),
    '',
    'Q14 (choix multiples) : Les endroits du travail où c\'est le plus difficile…',
    ...Object.values(LIEUX).map(l => '   □ ' + l),
    '',
    `Q15 (échelle de 0 à 10) : ${TRAVAIL.was.label}`,
    `Q16 (échelle de 0 à 10) : ${TRAVAIL.gene.label}`,
    `Q17 (choix unique) : ${TRAVAIL.abs.label}\n   → ${TRAVAIL.abs.options.map(o => o[1]).join(' / ')}`,
    `Q18 (choix unique) : ${TRAVAIL.parle.label}\n   → ${TRAVAIL.parle.options.map(o => o[1]).join(' / ')}`
  ].join('\n');

  /* Une ligne d'export Forms → réponse au format commun {s, c, l, was, gene, abs, parle} */
  function depuisForms(row) {
    const n = ENQ.norm, cols = Object.keys(row);
    const col = label => cols.find(h => n(h).includes(n(label).slice(0, 28)));
    const filtre = col('Vous sentez-vous concernée par la périménopause');
    if (filtre && /^non/i.test(n(row[filtre]))) return null;
    const s = {};
    for (const [k, m] of Object.entries(ITEMS)) {
      const h = col(m.label); if (!h) continue;
      const brut = String(row[h]);
      if (n(brut).startsWith('je prefere')) s[k] = null;
      else { const v = brut.match(/[0-4]/); if (v) s[k] = +v[0]; }
    }
    const multi = (label, ref) => { const h = col(label); const b = h ? n(row[h]) : ''; return Object.entries(ref).filter(([, l]) => b.includes(n(l).slice(0, 22))).map(([k]) => k); };
    const r = { s, c: multi('Mon poste de travail comporte', CONTRAINTES), l: multi("Les endroits du travail où c'est le plus difficile", LIEUX) };
    for (const k of ['was', 'gene']) { const h = col(TRAVAIL[k].label); const v = h && String(row[h]).match(/\d+/); if (v && +v[0] <= 10) r[k] = +v[0]; }
    for (const k of ['abs', 'parle']) {
      const h = col(TRAVAIL[k].label); if (!h) continue;
      const o = TRAVAIL[k].options.find(([, l]) => n(row[h]).startsWith(n(l).slice(0, 8))); if (o) r[k] = o[0];
    }
    return Object.keys(s).length ? r : null;
  }

  return { CONTRAINTES, ITEMS, NIVEAUX, NR, SEUILS, MAX, TRAVAIL, LIEUX, GENES_LIEU, SEUIL_PRIORITAIRE, sousScores, calculerScores, QUESTIONNAIRE, MODELE_FORMS, depuisForms };
})();
