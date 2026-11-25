/* ════════════════════════════════════════════════════════════════
   PréventIA Protect · Santé de la femme — BASE DE FICHES VÉRIFIÉES
   Utilisée par assistant-droits.html (assistant droits et aménagements).

   Règle : l'assistant ne répond QU'À PARTIR de ces fiches et cite chacune.
   Chaque fiche = un fait vérifié sur une source officielle ou scientifique,
   reformulé (pas de copie), avec son lien et sa date de vérification.

   Pour ajouter une fiche :
     1. ouvrir la source officielle (Code du travail, HAS, INRS, INCa, service-public, sociétés savantes) ;
     2. reformuler en 2 à 4 phrases, sans rien ajouter que la source ne dise ;
     3. renseigner src (nom lisible), url, verifie (date) et des mots-clés ;
     4. faire relire par le médecin du travail avant mise en ligne.
   Fiches à revoir : chaque année, et à chaque nouvelle recommandation signalée (champ « revoir »).
   ════════════════════════════════════════════════════════════════ */
window.DROITS = (function () {
  const V = '2026-11-25'; // date de vérification des sources
  const THEMES = {
    sst: 'Service de santé au travail',
    amenag: 'Aménager le travail',
    droits: 'Droits et dispositifs',
    grossesse: 'Grossesse, allaitement',
    endo: 'Règles douloureuses, endométriose',
    meno: 'Ménopause',
    sein: 'Cancer du sein'
  };
  const F = [
    /* ── Service de santé au travail ── */
    { id: 'visite-demande', th: 'sst', t: 'Demander une visite au médecin du travail, à tout moment',
      x: "Tout salarié peut demander, à tout moment, à être reçu par le médecin du travail (ou un autre professionnel de santé du service, à son choix). Cette demande ne peut entraîner aucune sanction. Le médecin du travail peut aussi organiser une visite lui-même s'il l'estime nécessaire.",
      src: 'Code du travail, art. R4624-34', url: 'https://code.travail.gouv.fr/code-du-travail/r4624-34',
      k: 'visite demande medecin du travail rendez-vous parler infirmiere sante travail sanction confidentiel' },
    { id: 'amenagement-mdt', th: 'amenag', t: "Les aménagements proposés par le médecin du travail",
      x: "Après avoir échangé avec le salarié et l'employeur, le médecin du travail peut proposer par écrit des mesures individuelles : aménagement, adaptation ou transformation du poste, ou aménagement du temps de travail. Ces mesures peuvent être justifiées notamment par l'âge ou l'état de santé physique et mental.",
      src: 'Code du travail, art. L4624-3', url: 'https://code.travail.gouv.fr/code-du-travail/l4624-3',
      k: 'amenagement poste adaptation horaires temps de travail medecin du travail preconisation ecrit employeur' },
    { id: 'pre-reprise', th: 'sst', t: 'Préparer le retour après un arrêt long : la visite de pré-reprise',
      x: "Pendant un arrêt de travail de plus de 30 jours, une visite de pré-reprise avec le médecin du travail peut être demandée par le salarié, son médecin traitant, le médecin conseil de l'Assurance maladie ou le médecin du travail. Elle sert à préparer le retour, par exemple avec des aménagements de poste. Elle ne remplace pas la visite de reprise.",
      src: 'Service-public / Code du travail, art. L4624-2-4', url: 'https://www.justice.fr/fiche/salarie-passer-visite-medicale-arret-travail',
      k: 'pre-reprise preprise arret maladie long retour reprise 30 jours medecin traitant' },
    { id: 'reprise-maternite', th: 'grossesse', t: 'La visite de reprise après un congé de maternité',
      x: "Le salarié bénéficie d'un examen de reprise par le médecin du travail après un congé de maternité. La visite de reprise a lieu au plus tard dans les 8 jours qui suivent la reprise du travail, à l'initiative de l'employeur.",
      src: 'Code du travail, art. R4624-31 ; service-public', url: 'https://code.travail.gouv.fr/code-du-travail/r4624-31',
      k: 'reprise conge maternite retour visite 8 jours apres accouchement' },
    /* ── Droits et dispositifs ── */
    { id: 'tpt', th: 'droits', t: 'Le temps partiel thérapeutique',
      x: "Le temps partiel thérapeutique permet de travailler à temps réduit pour raison de santé, le temps non travaillé étant couvert par un arrêt de travail. Il est prescrit par le médecin traitant et peut être mis en place sans arrêt de travail préalable. Il relève du Code de la sécurité sociale.",
      src: 'INRS, Focus juridique « Temps partiel thérapeutique »', url: 'https://www.inrs.fr/publications/juridique/focus-juridiques/focus-juridique-temps-partiel-therapeutique.html',
      k: 'temps partiel therapeutique mi-temps reprise progressive horaires reduits medecin traitant' },
    { id: 'rqth', th: 'droits', t: 'La reconnaissance de la qualité de travailleur handicapé (RQTH)',
      x: "La RQTH est une décision administrative de la MDPH qui donne accès à des mesures pour garder son emploi ou en trouver un : aménagements, accompagnement par Cap emploi, aides de l'Agefiph. Elle peut concerner une maladie chronique qui a des répercussions sur le travail. La démarche est personnelle : la salariée choisit d'en informer ou non son employeur.",
      src: 'Mon Parcours Handicap (service public) ; Service-public', url: 'https://www.monparcourshandicap.gouv.fr/aides/la-reconnaissance-de-la-qualite-de-travailleur-handicape-rqth',
      k: 'rqth handicap mdph maladie chronique maintien emploi cap emploi agefiph confidentiel employeur' },
    { id: 'ald31-endo', th: 'endo', t: "Endométriose et affection de longue durée (ALD 31 « hors liste »)",
      x: "L'endométriose ne figure pas sur la liste des affections de longue durée (ALD 30). Certaines formes peuvent être prises en charge au titre de l'ALD « hors liste » (ALD 31) : formes évolutives ou invalidantes, avec un traitement prévu sur plus de 6 mois et particulièrement coûteux. La demande est faite par le médecin traitant.",
      src: 'Santé.fr (EndoFrance) ; réponse ministérielle, Assemblée nationale', url: 'https://www.sante.fr/prise-en-charge-de-lendometriose-ald',
      k: 'ald 31 hors liste endometriose 100 % prise en charge medecin traitant affection longue duree' },
    /* ── Grossesse, allaitement ── */
    { id: 'grossesse-absences', th: 'grossesse', t: 'Absences pour les examens médicaux de la grossesse et de l\'AMP',
      x: "La salariée enceinte peut s'absenter pour se rendre aux examens médicaux obligatoires de surveillance de la grossesse. Des autorisations d'absence existent aussi pour les actes de l'assistance médicale à la procréation (AMP). La personne qui vit en couple avec elle peut s'absenter pour 3 de ces examens au maximum.",
      src: 'Code du travail, art. L1225-16 ; fiche Service-public', url: 'https://code.travail.gouv.fr/fiche-service-public/une-salariee-a-t-elle-droit-a-des-absences-liees-a-sa-grossesse',
      k: 'enceinte grossesse absence examen medical rendez-vous echographie pma amp fiv conjoint' },
    { id: 'allaitement', th: 'grossesse', t: 'Allaiter ou tirer son lait au travail',
      x: "Pendant un an à compter de la naissance, la salariée qui allaite dispose d'une heure par jour pendant ses heures de travail, répartie en principe en 30 minutes le matin et 30 minutes l'après-midi. Elle peut allaiter dans l'établissement. Un employeur de plus de 100 salariées peut être mis en demeure d'installer un local dédié.",
      src: 'Code du travail, art. L1225-30 à L1225-32 et R1225-5', url: 'https://code.travail.gouv.fr/code-du-travail/l1225-30',
      k: 'allaitement allaiter tirer lait tire-lait pause heure local retour conge maternite' },
    { id: 'grossesse-chimique', th: 'grossesse', t: 'Produits chimiques interdits pendant la grossesse et l\'allaitement',
      x: "Il est interdit d'affecter ou de maintenir une femme enceinte ou allaitante à un poste qui l'expose à certains agents chimiques, dont ceux classés toxiques pour la reproduction. Le dépliant de l'INRS sensibilise les femmes enceintes à ces risques dès le tout début de la grossesse.",
      src: 'INRS, ED 6261 « Protégez votre grossesse » ; Code du travail, art. D4152-10', url: 'https://www.inrs.fr/media.html?refINRS=ED+6261',
      k: 'enceinte grossesse allaitement produit chimique cmr reprotoxique toxique reproduction h360 h362 fds interdit' },
    { id: 'grossesse-prevention', th: 'grossesse', t: 'Grossesse : évaluer les risques du poste et en parler tôt',
      x: "L'employeur doit tenir compte de la situation des femmes enceintes et allaitantes dans l'évaluation des risques. Certains travaux leur sont interdits ou réglementés (risques chimiques, physiques, biologiques). L'INRS recommande d'informer tôt le médecin du travail, y compris en cas de projet de grossesse ; le médecin du travail informe la salariée des risques du poste.",
      src: 'INRS, dossier « Femmes enceintes » et « Reproduction : démarche de prévention »', url: 'https://www.inrs.fr/risques/reproduction/demarche-prevention',
      k: 'enceinte grossesse projet de grossesse risque poste evaluation duerp informer medecin du travail travail interdit' },
    { id: 'grossesse-amenagements', th: 'grossesse', t: 'Grossesse : changement d\'affectation et aménagements',
      x: "La réglementation prévoit pour la femme enceinte des possibilités de changement temporaire d'affectation, de mutation ou de transformation de poste et d'aménagement des horaires, en plus des travaux interdits. L'aide-mémoire juridique de l'INRS « Grossesse, maternité et travail » détaille ces règles.",
      src: 'INRS, aide-mémoire juridique TJ 14 « Grossesse, maternité et travail »', url: 'https://www.inrs.fr/media.html?refINRS=TJ+14',
      k: 'enceinte grossesse changement affectation mutation horaires amenagement poste nuit' },
    { id: 'fausse-couche', th: 'grossesse', t: 'Fausse couche : arrêt sans carence et protection contre le licenciement',
      x: "Depuis le 1er janvier 2024, l'arrêt de travail après une interruption spontanée de grossesse survenue avant la 22e semaine d'aménorrhée est indemnisé sans délai de carence. Le contrat de travail ne peut pas être rompu pendant les 10 semaines qui suivent une fausse couche tardive (entre la 14e et la 21e semaine d'aménorrhée incluses), sauf faute grave ou impossibilité de maintenir le contrat.",
      src: 'Loi n° 2023-567 du 7 juillet 2023 (Vie-publique)', url: 'https://www.vie-publique.fr/loi/288561-fausses-couches-accompagner-les-femmes-victimes-loi-7-juillet-2023',
      k: 'fausse couche interruption spontanee grossesse arret carence licenciement protection' },
    /* ── Endométriose : références médicales ── */
    { id: 'endo-reco', th: 'endo', t: 'Endométriose : les recommandations françaises de référence',
      x: "La HAS et le CNGOF ont publié en décembre 2017 les recommandations françaises sur l'endométriose. Elles constatent une maladie souvent mal repérée, avec un retard de diagnostic, et visent un parcours de soins coordonné, des traitements individualisés et une information complète des patientes. L'adénomyose en est exclue.",
      src: 'HAS / CNGOF, « Prise en charge de l\'endométriose », décembre 2017', url: 'https://www.has-sante.fr/jcms/c_2819733/fr/prise-en-charge-de-l-endometriose',
      k: 'endometriose diagnostic recommandation has cngof retard errance parcours douleur pelvienne regles douloureuses' },
    { id: 'endo-traitement', th: 'endo', t: 'Endométriose douloureuse : les traitements recommandés',
      x: "Selon les recommandations CNGOF-HAS, la contraception hormonale combinée et le stérilet au lévonorgestrel sont les traitements hormonaux de première intention de l'endométriose douloureuse (grade B). En deuxième intention : microprogestatif au désogestrel, implant à l'étonogestrel, agonistes de la GnRH, diénogest (grade C). Le choix se fait avec le médecin.",
      src: 'CNGOF-HAS, Gynécol Obstét Fertil Sénol 2018;46(3):267-272', url: 'https://pubmed.ncbi.nlm.nih.gov/29510966/',
      k: 'endometriose traitement hormonal pilule sterilet dienogest progestatif douleur medicament' },
    { id: 'endo-eshre', th: 'endo', t: 'Endométriose : la recommandation européenne (ESHRE 2022)',
      x: "La recommandation européenne de l'ESHRE (2022) compte 109 recommandations sur le diagnostic, la prise en charge de la douleur et de l'infertilité, les récidives, et l'endométriose chez l'adolescente et après la ménopause. Les options contre la douleur incluent les antalgiques, les traitements hormonaux et la chirurgie.",
      src: 'Becker C.M. et al., ESHRE guideline: endometriosis, Hum Reprod Open 2022', url: 'https://pubmed.ncbi.nlm.nih.gov/35350465/',
      k: 'endometriose eshre europe recommandation traitement douleur infertilite chirurgie antalgique' },
    /* ── Ménopause ── */
    { id: 'meno-thm', th: 'meno', t: 'Ménopause : le traitement hormonal (THM)',
      x: "En octobre 2025, la HAS a réévalué les traitements hormonaux de la ménopause et confirmé leur place pour les troubles du climatère, la prévention de l'ostéoporose et la ménopause précoce. La prescription est individualisée et régulièrement réévaluée. L'hygiène de vie (activité physique, arrêt du tabac, alcool limité) reste essentielle, avec ou sans traitement.",
      src: 'HAS, réévaluation des THM (oct. 2025), via Vidal ; Santé.fr', url: 'https://www.vidal.fr/actualites/31630-traitements-hormonaux-de-la-menopause-la-has-confirme-leur-place-dans-la-strategie-therapeutique.html',
      k: 'menopause traitement hormonal thm bouffees de chaleur osteoporose medecin hygiene de vie' },
    { id: 'meno-rpc', th: 'meno', t: 'Ménopause : les recommandations des gynécologues (CNGOF-GEMVi 2021)',
      x: "Le CNGOF et le GEMVi ont publié en 2021 des recommandations pour la pratique clinique sur les femmes ménopausées : hygiène de vie, activité physique, nutrition, traitement hormonal, alternatives non hormonales aux bouffées de chaleur, syndrome génito-urinaire et prévention de l'ostéoporose.",
      src: 'CNGOF-GEMVi, Gynécol Obstét Fertil Sénol 2021;49:305-317', url: 'https://www.em-consulte.com/es/revue/GOFS/49/5/table-des-matieres/',
      k: 'menopause recommandation gynecologue cngof gemvi bouffees de chaleur non hormonal activite physique' },
    { id: 'meno-has-2027', th: 'meno', t: 'Ménopause : recommandations HAS en préparation',
      x: "Saisie par le ministère, la HAS prépare des recommandations sur la prise en charge de la péri-ménopause et de la ménopause en soins de premier recours (note de cadrage adoptée le 6 novembre 2025). Elles visent une meilleure information des femmes et des professionnels et une prise en charge personnalisée.",
      src: 'HAS, note de cadrage, novembre 2025', url: 'https://www.has-sante.fr/jcms/p_3737819/fr/prise-en-charge-de-la-femme-en-periode-de-peri-menopause',
      k: 'menopause perimenopause has recommandation information medecin generaliste', revoir: 'Recommandations attendues : mettre à jour à leur publication.' },
    { id: 'meno-travail', th: 'meno', t: 'Ménopause et travail : la priorité annoncée par le Gouvernement',
      x: "À la remise du rapport de la mission parlementaire sur la ménopause (rapport Rist, avril 2025), le Gouvernement a annoncé quatre priorités, dont la prise en compte de la ménopause dans le monde professionnel, avec l'aménagement de l'environnement de travail des femmes concernées.",
      src: 'Ordre national des pharmaciens, synthèse du rapport Rist', url: 'https://www.ordre.pharmacien.fr/les-communications/focus-sur/les-actualites/ameliorer-la-prise-en-charge-de-la-menopause-ce-que-propose-le-rapport-rist',
      k: 'menopause travail rapport rist amenagement environnement entreprise employeur' },
    /* ── Cancer du sein ── */
    { id: 'sein-depistage', th: 'sein', t: 'Le dépistage organisé du cancer du sein',
      x: "Le dépistage organisé concerne les femmes de 50 à 74 ans à risque moyen : mammographie et examen clinique tous les 2 ans, pris en charge à 100 %. La HAS évalue l'élargissement des bornes d'âge (dès 45 ans, jusqu'à 79 ans) ; tant qu'aucune décision n'est publiée, les repères restent 50-74 ans.",
      src: 'HAS, note de cadrage « bornes d\'âge du dépistage organisé », mars 2026', url: 'https://www.has-sante.fr/jcms/p_3892250/fr/evaluation-de-l-opportunite-d-elargir-les-bornes-d-age-du-depistage-organise-du-cancer-du-sein-en-france-note-de-cadrage',
      k: 'cancer du sein depistage mammographie 50 74 ans invitation octobre rose', revoir: 'Avis HAS attendu fin 2026 : mettre à jour les âges dès publication.' },
    { id: 'sein-reprise', th: 'sein', t: 'Reprendre le travail pendant ou après un cancer',
      x: "L'Institut national du cancer (INCa) décrit les dispositifs pour se maintenir ou revenir au travail pendant et après un cancer : visite de pré-reprise avec le médecin du travail pendant l'arrêt, temps partiel thérapeutique, aménagements de poste, RQTH. Il conseille de préparer la reprise suffisamment tôt.",
      src: 'INCa, « Maintien et retour à l\'emploi pendant et après un cancer », avril 2024', url: 'https://cancer.fr/content/download/42149/file/Fiche-MG-FICHEMGEMPLOI24-@.pdf?version=5',
      k: 'cancer sein reprise retour travail apres traitement pre-reprise temps partiel therapeutique fatigue' }
  ];

  /* ── Recherche : normalisation + score par mots-clés (pas d'IA) ── */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const VIDES = new Set('a au aux avec ce ces dans de des du elle en est et il je la le les leur ma mais me mes mon ne nous on ou par pas pour qu que qui sa se ses son sur ta te tes ton tu un une vous y est ai as avoir etre fait faire peut peux puis quel quelle quels quelles comment quand pourquoi dois doit travail travailler'.split(' '));
  const SYN = { mitemps: 'temps partiel therapeutique', fiv: 'amp pma', bebe: 'grossesse naissance', enceinte: 'grossesse', regles: 'endometriose regles douloureuses', menstruel: 'regles endometriose', allaiter: 'allaitement', chaleur: 'bouffees menopause', mammographie: 'depistage sein', handicap: 'rqth', medecin: 'medecin du travail visite' };
  const INDEX = F.map(f => ({ f, mots: new Set(norm(`${f.t} ${f.k} ${THEMES[f.th]}`).split(' ')) }));
  function chercher(q, n = 5) {
    let m = norm(q).split(' ').filter(w => w.length > 2 && !VIDES.has(w));
    m = m.concat(...m.map(w => SYN[w] ? norm(SYN[w]).split(' ') : []));
    if (!m.length) return [];
    return INDEX.map(({ f, mots }) => {
      let s = 0; m.forEach(w => { if (mots.has(w)) s += 2; else if ([...mots].some(x => x.length > 4 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5))))) s += 1; });
      return { f, s };
    }).filter(r => r.s >= 2).sort((a, b) => b.s - a.s).slice(0, n).map(r => r.f);
  }
  return { V, THEMES, FICHES: F, chercher, norm };
})();
