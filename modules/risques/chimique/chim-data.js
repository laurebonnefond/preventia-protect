/* ════════════════════════════════════════════════════════════════
   PréventIA Protect · Risque chimique — RÉFÉRENTIELS
   Tout ce qui est « connaissance » est ici (pas de logique d'écran) :
   mentions H/P/EUH, classes de danger, familles, compatibilités,
   groupes de stockage, coefficients d'évaluation, produits de démo.
   ⚠ Paramètres INSPIRÉS de la méthode INRS ND 2233 (base de Seirich),
     simplifiés : à valider par l'équipe pluridisciplinaire du SPSTI.
   ════════════════════════════════════════════════════════════════ */
window.CHIM = (function () {

  /* ── 1. Pictogrammes SGH ─────────────────────────────────────── */
  const PICTOS = {
    SGH01: { label: 'Explosif',            court: 'Explosif' },
    SGH02: { label: 'Inflammable',         court: 'Inflammable' },
    SGH03: { label: 'Comburant',           court: 'Comburant' },
    SGH04: { label: 'Gaz sous pression',   court: 'Gaz' },
    SGH05: { label: 'Corrosif',            court: 'Corrosif' },
    SGH06: { label: 'Toxicité aiguë',      court: 'Toxique' },
    SGH07: { label: 'Nocif / irritant',    court: 'Irritant' },
    SGH08: { label: 'Danger grave pour la santé (CMR, sensibilisant…)', court: 'CMR / santé' },
    SGH09: { label: 'Dangereux pour l\'environnement', court: 'Environnement' }
  };

  /* ── 2. Mentions de danger H / EUH ───────────────────────────────
     cd  = classe de danger santé 1→5 (hiérarchisation type ND 2233)
     t   = type : P physique, S santé, E environnement
     voie: i inhalation, c cutanée, o oculaire, g ingestion          */
  const H = {
    H200:{t:'P',l:"Explosif instable"},
    H201:{t:'P',l:"Explosif ; danger d'explosion en masse"},
    H202:{t:'P',l:"Explosif ; danger sérieux de projection"},
    H203:{t:'P',l:"Explosif ; danger d'incendie, d'effet de souffle ou de projection"},
    H204:{t:'P',l:"Danger d'incendie ou de projection"},
    H205:{t:'P',l:"Danger d'explosion en masse en cas d'incendie"},
    H220:{t:'P',l:"Gaz extrêmement inflammable"},
    H221:{t:'P',l:"Gaz inflammable"},
    H222:{t:'P',l:"Aérosol extrêmement inflammable"},
    H223:{t:'P',l:"Aérosol inflammable"},
    H224:{t:'P',l:"Liquide et vapeurs extrêmement inflammables"},
    H225:{t:'P',l:"Liquide et vapeurs très inflammables"},
    H226:{t:'P',l:"Liquide et vapeurs inflammables"},
    H228:{t:'P',l:"Matière solide inflammable"},
    H229:{t:'P',l:"Récipient sous pression : peut éclater sous l'effet de la chaleur"},
    H230:{t:'P',l:"Peut exploser même en l'absence d'air"},
    H240:{t:'P',l:"Peut exploser sous l'effet de la chaleur"},
    H241:{t:'P',l:"Peut s'enflammer ou exploser sous l'effet de la chaleur"},
    H242:{t:'P',l:"Peut s'enflammer sous l'effet de la chaleur"},
    H250:{t:'P',l:"S'enflamme spontanément au contact de l'air"},
    H251:{t:'P',l:"Matière auto-échauffante ; peut s'enflammer"},
    H252:{t:'P',l:"Matière auto-échauffante en grandes quantités ; peut s'enflammer"},
    H260:{t:'P',l:"Dégage au contact de l'eau des gaz inflammables qui peuvent s'enflammer spontanément"},
    H261:{t:'P',l:"Dégage au contact de l'eau des gaz inflammables"},
    H270:{t:'P',l:"Peut provoquer ou aggraver un incendie ; comburant"},
    H271:{t:'P',l:"Peut provoquer un incendie ou une explosion ; comburant puissant"},
    H272:{t:'P',l:"Peut aggraver un incendie ; comburant"},
    H280:{t:'P',l:"Contient un gaz sous pression ; peut exploser sous l'effet de la chaleur"},
    H281:{t:'P',l:"Contient un gaz réfrigéré ; peut causer des brûlures ou blessures cryogéniques"},
    H290:{t:'P',l:"Peut être corrosif pour les métaux"},
    H300:{t:'S',cd:5,v:'g',l:"Mortel en cas d'ingestion"},
    H301:{t:'S',cd:4,v:'g',l:"Toxique en cas d'ingestion"},
    H302:{t:'S',cd:3,v:'g',l:"Nocif en cas d'ingestion"},
    H304:{t:'S',cd:3,v:'g',l:"Peut être mortel en cas d'ingestion et de pénétration dans les voies respiratoires"},
    H310:{t:'S',cd:5,v:'c',l:"Mortel par contact cutané"},
    H311:{t:'S',cd:4,v:'c',l:"Toxique par contact cutané"},
    H312:{t:'S',cd:3,v:'c',l:"Nocif par contact cutané"},
    H314:{t:'S',cd:4,v:'co',l:"Provoque de graves brûlures de la peau et de graves lésions des yeux"},
    H315:{t:'S',cd:2,v:'c',l:"Provoque une irritation cutanée"},
    H317:{t:'S',cd:4,v:'c',l:"Peut provoquer une allergie cutanée"},
    H318:{t:'S',cd:3,v:'o',l:"Provoque de graves lésions des yeux"},
    H319:{t:'S',cd:2,v:'o',l:"Provoque une sévère irritation des yeux"},
    H330:{t:'S',cd:5,v:'i',l:"Mortel par inhalation"},
    H331:{t:'S',cd:4,v:'i',l:"Toxique par inhalation"},
    H332:{t:'S',cd:3,v:'i',l:"Nocif par inhalation"},
    H334:{t:'S',cd:5,v:'i',l:"Peut provoquer des symptômes allergiques ou d'asthme ou des difficultés respiratoires par inhalation"},
    H335:{t:'S',cd:3,v:'i',l:"Peut irriter les voies respiratoires"},
    H336:{t:'S',cd:3,v:'i',l:"Peut provoquer somnolence ou vertiges"},
    H340:{t:'S',cd:5,cmr:'M1',l:"Peut induire des anomalies génétiques"},
    H341:{t:'S',cd:4,cmr:'M2',l:"Susceptible d'induire des anomalies génétiques"},
    H350:{t:'S',cd:5,cmr:'C1',l:"Peut provoquer le cancer"},
    H350i:{t:'S',cd:5,cmr:'C1',v:'i',l:"Peut provoquer le cancer par inhalation"},
    H351:{t:'S',cd:4,cmr:'C2',l:"Susceptible de provoquer le cancer"},
    H360:{t:'S',cd:5,cmr:'R1',l:"Peut nuire à la fertilité ou au fœtus"},
    H360F:{t:'S',cd:5,cmr:'R1',l:"Peut nuire à la fertilité"},
    H360D:{t:'S',cd:5,cmr:'R1',l:"Peut nuire au fœtus"},
    H360FD:{t:'S',cd:5,cmr:'R1',l:"Peut nuire à la fertilité. Peut nuire au fœtus"},
    H360Fd:{t:'S',cd:5,cmr:'R1',l:"Peut nuire à la fertilité. Susceptible de nuire au fœtus"},
    H360Df:{t:'S',cd:5,cmr:'R1',l:"Peut nuire au fœtus. Susceptible de nuire à la fertilité"},
    H361:{t:'S',cd:4,cmr:'R2',l:"Susceptible de nuire à la fertilité ou au fœtus"},
    H361f:{t:'S',cd:4,cmr:'R2',l:"Susceptible de nuire à la fertilité"},
    H361d:{t:'S',cd:4,cmr:'R2',l:"Susceptible de nuire au fœtus"},
    H361fd:{t:'S',cd:4,cmr:'R2',l:"Susceptible de nuire à la fertilité. Susceptible de nuire au fœtus"},
    H362:{t:'S',cd:4,l:"Peut être nocif pour les bébés nourris au lait maternel"},
    H370:{t:'S',cd:5,l:"Risque avéré d'effets graves pour les organes"},
    H371:{t:'S',cd:4,l:"Risque présumé d'effets graves pour les organes"},
    H372:{t:'S',cd:5,l:"Risque avéré d'effets graves pour les organes (expositions répétées ou prolongées)"},
    H373:{t:'S',cd:4,l:"Risque présumé d'effets graves pour les organes (expositions répétées ou prolongées)"},
    H400:{t:'E',l:"Très toxique pour les organismes aquatiques"},
    H410:{t:'E',l:"Très toxique pour les organismes aquatiques, entraîne des effets néfastes à long terme"},
    H411:{t:'E',l:"Toxique pour les organismes aquatiques, entraîne des effets néfastes à long terme"},
    H412:{t:'E',l:"Nocif pour les organismes aquatiques, entraîne des effets néfastes à long terme"},
    H413:{t:'E',l:"Peut être nocif à long terme pour les organismes aquatiques"},
    H420:{t:'E',l:"Nuit à la santé publique et à l'environnement en détruisant l'ozone"},
    EUH014:{t:'P',l:"Réagit violemment au contact de l'eau"},
    EUH029:{t:'S',cd:3,v:'i',l:"Au contact de l'eau, dégage des gaz toxiques"},
    EUH031:{t:'S',cd:3,v:'i',l:"Au contact d'un acide, dégage un gaz toxique"},
    EUH032:{t:'S',cd:4,v:'i',l:"Au contact d'un acide, dégage un gaz très toxique"},
    EUH066:{t:'S',cd:2,v:'c',l:"L'exposition répétée peut provoquer dessèchement ou gerçures de la peau"},
    EUH070:{t:'S',cd:4,v:'o',l:"Toxique par contact oculaire"},
    EUH071:{t:'S',cd:4,v:'i',l:"Corrosif pour les voies respiratoires"},
    EUH208:{t:'S',cd:2,v:'c',l:"Contient une substance sensibilisante. Peut produire une réaction allergique"}
  };

  /* ── 3. Conseils de prudence P (sélection des plus fréquents) ──── */
  const P = {
    P101:"En cas de consultation d'un médecin, garder à disposition le récipient ou l'étiquette",
    P102:"Tenir hors de portée des enfants",
    P201:"Se procurer les instructions spéciales avant utilisation",
    P202:"Ne pas manipuler avant d'avoir lu et compris toutes les précautions de sécurité",
    P210:"Tenir à l'écart de la chaleur, des surfaces chaudes, des étincelles, des flammes nues et de toute autre source d'inflammation. Ne pas fumer",
    P220:"Tenir à l'écart des vêtements et d'autres matières combustibles",
    P233:"Maintenir le récipient fermé de manière étanche",
    P234:"Conserver uniquement dans l'emballage d'origine",
    P240:"Mise à la terre et liaison équipotentielle du récipient et du matériel de réception",
    P241:"Utiliser du matériel électrique, de ventilation et d'éclairage antidéflagrant",
    P242:"Utiliser des outils ne produisant pas d'étincelles",
    P243:"Prendre des mesures contre les décharges électrostatiques",
    P260:"Ne pas respirer les poussières, fumées, gaz, brouillards, vapeurs ou aérosols",
    P261:"Éviter de respirer les poussières, fumées, gaz, brouillards, vapeurs ou aérosols",
    P264:"Se laver soigneusement après manipulation",
    P270:"Ne pas manger, boire ou fumer en manipulant ce produit",
    P271:"Utiliser seulement en plein air ou dans un endroit bien ventilé",
    P272:"Les vêtements de travail contaminés ne devraient pas sortir du lieu de travail",
    P273:"Éviter le rejet dans l'environnement",
    P280:"Porter des gants, des vêtements de protection et un équipement de protection des yeux et du visage",
    P284:"Lorsque la ventilation du local est insuffisante, porter un équipement de protection respiratoire",
    P301_P310:"EN CAS D'INGESTION : appeler immédiatement un CENTRE ANTIPOISON ou un médecin",
    P301_P312:"EN CAS D'INGESTION : appeler un CENTRE ANTIPOISON ou un médecin en cas de malaise",
    P301_P330_P331:"EN CAS D'INGESTION : rincer la bouche. NE PAS faire vomir",
    P302_P352:"EN CAS DE CONTACT AVEC LA PEAU : laver abondamment à l'eau",
    P303_P361_P353:"EN CAS DE CONTACT AVEC LA PEAU (ou les cheveux) : enlever immédiatement tous les vêtements contaminés. Rincer la peau à l'eau ou se doucher",
    P304_P340:"EN CAS D'INHALATION : transporter la personne à l'extérieur et la maintenir dans une position où elle peut confortablement respirer",
    P305_P351_P338:"EN CAS DE CONTACT AVEC LES YEUX : rincer avec précaution à l'eau pendant plusieurs minutes. Enlever les lentilles de contact si possible. Continuer à rincer",
    P308_P313:"EN CAS d'exposition prouvée ou suspectée : consulter un médecin",
    P310:"Appeler immédiatement un CENTRE ANTIPOISON ou un médecin",
    P312:"Appeler un CENTRE ANTIPOISON ou un médecin en cas de malaise",
    P333_P313:"En cas d'irritation ou d'éruption cutanée : consulter un médecin",
    P337_P313:"Si l'irritation oculaire persiste : consulter un médecin",
    P342_P311:"En cas de symptômes respiratoires : appeler un CENTRE ANTIPOISON ou un médecin",
    P363:"Laver les vêtements contaminés avant réutilisation",
    P370_P378:"En cas d'incendie : utiliser le moyen d'extinction indiqué par la FDS",
    P391:"Recueillir le produit répandu",
    P403_P233:"Stocker dans un endroit bien ventilé. Maintenir le récipient fermé de manière étanche",
    P403_P235:"Stocker dans un endroit bien ventilé. Tenir au frais",
    P405:"Garder sous clef",
    P410_P403:"Protéger du rayonnement solaire. Stocker dans un endroit bien ventilé",
    P501:"Éliminer le contenu et le récipient dans une filière de déchets dangereux agréée"
  };
  /* « P305+P351+P338 » ⇄ clé « P305_P351_P338 » */
  const pKey = c => String(c).toUpperCase().replace(/\s/g, '').replace(/\+/g, '_');
  const pCode = k => k.replace(/_/g, '+');

  /* ── 4. Familles chimiques (réactions entre produits) ─────────── */
  const FAMILLES = {
    none:        "— Non précisée —",
    acide_fort:  "Acide fort (HCl, H₂SO₄, HNO₃…)",
    acide_faible:"Acide faible / organique (acétique, citrique…)",
    base_forte:  "Base forte (soude, potasse…)",
    base_faible: "Base faible (carbonates…)",
    comburant:   "Comburant / oxydant (permanganate, chlorates…)",
    inflammable: "Inflammable / solvant organique",
    reducteur:   "Réducteur (métaux en poudre, hydrures, sulfites…)",
    solvant_chl: "Solvant chloré (dichlorométhane, perchloréthylène…)",
    metal_alc:   "Métal alcalin / réactif à l'eau (Na, K, Ca…)",
    cyanure:     "Cyanure",
    hypochlorite:"Hypochlorite (eau de Javel)",
    sulfure:     "Sulfure",
    amine:       "Amine / ammoniaque",
    peroxyde:    "Peroxyde (organique ou H₂O₂ concentré)",
    nitrate:     "Nitrate / sel oxydant",
    aqueux:      "Produit aqueux peu réactif (détergent neutre…)",
    autre:       "Autre / non classé"
  };

  /* Réactions dangereuses entre familles : niveau 1 PR, 2 INT, 3 INT critique */
  const REACTIONS = {
    'acide_fort|base_forte':[3,"Réaction acide-base violente : chaleur extrême, projections"],
    'acide_fort|base_faible':[2,"Réaction exothermique, dégagement possible de vapeurs"],
    'acide_faible|base_forte':[2,"Réaction exothermique"],
    'acide_faible|base_faible':[1,"Neutralisation lente possible"],
    'acide_fort|cyanure':[3,"Dégage du cyanure d'hydrogène (HCN), gaz mortel"],
    'acide_faible|cyanure':[3,"Dégage du cyanure d'hydrogène (HCN), gaz mortel"],
    'acide_fort|hypochlorite':[3,"Dégage du dichlore (Cl₂), gaz toxique"],
    'acide_faible|hypochlorite':[3,"Dégage du dichlore (Cl₂), gaz toxique"],
    'acide_fort|sulfure':[3,"Dégage du sulfure d'hydrogène (H₂S), gaz mortel"],
    'acide_faible|sulfure':[3,"Dégage du sulfure d'hydrogène (H₂S), gaz mortel"],
    'amine|hypochlorite':[3,"Formation de chloramines toxiques"],
    'comburant|inflammable':[3,"Inflammation, voire explosion"],
    'comburant|reducteur':[3,"Oxydo-réduction violente, feu possible"],
    'comburant|solvant_chl':[2,"Oxydation possible : séparer"],
    'comburant|metal_alc':[3,"Réaction violente, feu ou explosion"],
    'comburant|sulfure':[3,"Oxydation violente"],
    'comburant|cyanure':[3,"Oxydation violente, vapeurs toxiques"],
    'comburant|amine':[2,"Oxydation des amines, échauffement"],
    'inflammable|peroxyde':[3,"Risque d'explosion (peroxydes instables)"],
    'peroxyde|reducteur':[3,"Réaction explosive possible"],
    'metal_alc|peroxyde':[3,"Explosion possible"],
    'amine|peroxyde':[3,"Décomposition violente du peroxyde"],
    'inflammable|nitrate':[2,"Les nitrates oxydants favorisent l'inflammation"],
    'nitrate|reducteur':[3,"Réaction explosive avec les réducteurs"],
    'metal_alc|nitrate':[3,"Réaction très violente"],
    'acide_fort|metal_alc':[3,"Dégagement d'hydrogène : feu, explosion"],
    'acide_faible|metal_alc':[2,"Dégagement d'hydrogène"],
    'aqueux|metal_alc':[3,"Réaction avec l'eau : hydrogène, feu"],
    'metal_alc|solvant_chl':[3,"Réaction explosive"],
    'hypochlorite|metal_alc':[2,"Réaction possible"],
    'amine|solvant_chl':[2,"Réaction possible, vapeurs irritantes"],
    'base_forte|solvant_chl':[2,"Décomposition possible, vapeurs"],
    'acide_fort|amine':[2,"Réaction exothermique"],
    'acide_faible|amine':[1,"Neutralisation, léger échauffement"],
    'acide_fort|reducteur':[2,"Dégagement possible d'hydrogène ou de gaz toxiques"],
    'acide_fort|inflammable':[1,"Acides oxydants (nitrique, sulfurique conc.) : risque avec les organiques"],
    'acide_fort|peroxyde':[2,"Décomposition accélérée du peroxyde"],
    'hypochlorite|peroxyde':[2,"Décomposition avec dégagement d'oxygène"],
    'hypochlorite|reducteur':[2,"Réaction d'oxydo-réduction"]
  };

  /* Compatibilité de stockage selon les pictogrammes (affiche « Règles de stockage »)
     1 = PR (prudence), 2 = INT (séparation obligatoire)                       */
  const STOCK_PICTOS = {
    'SGH01|*':[2,"Explosif : stockage isolé, local dédié"],
    'SGH02|SGH03':[2,"Inflammable et comburant : séparation obligatoire"],
    'SGH04|*':[1,"Gaz sous pression : bouteilles debout, arrimées, à l'écart de la chaleur"],
    'SGH02|SGH05':[1,"Inflammable et corrosif : rétentions séparées"],
    'SGH02|SGH06':[1,"Inflammable et toxique : armoires distinctes conseillées"],
    'SGH03|SGH05':[1,"Comburant et corrosif : rétentions séparées"],
    'SGH03|SGH06':[1,"Comburant et toxique : rétentions séparées"],
    'SGH05|SGH06':[1,"Corrosif et toxique : rétentions séparées"]
  };

  /* ── 5. Groupes de stockage ───────────────────────────────────── */
  const GROUPES = {
    explosif:   { l:'Explosifs',            ic:'💥', c:'oklch(55% .2 30)',  regle:"Local ou armoire dédiés, isolés de tout autre produit" },
    gaz:        { l:'Gaz sous pression',    ic:'🧯', c:'oklch(55% .12 150)', regle:"Bouteilles debout, arrimées, à l'extérieur ou local ventilé, loin de la chaleur" },
    comburant:  { l:'Comburants',           ic:'🔥', c:'oklch(70% .16 75)', regle:"Séparés des inflammables, des réducteurs et des matières organiques" },
    peroxyde:   { l:'Peroxydes',            ic:'⚗️', c:'oklch(62% .17 55)', regle:"Au frais, à l'abri de la lumière, isolés ; surveiller les dates" },
    inflammable:{ l:'Inflammables',         ic:'🔥', c:'oklch(58% .2 30)',  regle:"Armoire ventilée coupe-feu (EN 14470-1), loin des sources d'ignition" },
    acide:      { l:'Acides',               ic:'🧪', c:'oklch(55% .19 25)', regle:"Armoire anticorrosion ventilée, rétention dédiée, séparés des bases" },
    base:       { l:'Bases',                ic:'🧪', c:'oklch(52% .14 250)', regle:"Rétention dédiée, séparées des acides et de l'aluminium" },
    toxique:    { l:'Toxiques / CMR',       ic:'☠️', c:'oklch(45% .16 320)', regle:"Armoire fermée à clé (P405), ventilée, accès restreint" },
    corrosif:   { l:'Autres corrosifs',     ic:'🧪', c:'oklch(55% .12 25)', regle:"Rétention, armoire anticorrosion" },
    reactif_eau:{ l:'Réactifs à l\'eau',    ic:'💧', c:'oklch(55% .14 230)', regle:"Au sec, loin de toute canalisation d'eau et des sprinklers" },
    courant:    { l:'Nocifs / courants',    ic:'📦', c:'oklch(55% .03 250)', regle:"Rayonnage avec rétention, emballage d'origine" }
  };

  /* ── 6. Coefficients d'évaluation (inspirés INRS ND 2233) ─────── */
  const EVAL = {
    scoreDanger: [0, 1, 10, 100, 1000, 10000],             // CD 1→5
    /* Exposition potentielle : ligne = classe de quantité 1→5, colonne = fréquence 1→4 */
    expoPot: [null, [1,1,2,2], [1,2,2,3], [2,3,3,4], [3,3,4,5], [3,4,5,5]],
    scoreExpo: [0, 1, 3, 10, 30, 100],
    seuilsPotentiel: { fort: 30000, moyen: 3000 },
    frequences: [
      ['0',"Non utilisé depuis plus d'un an"],
      ['1',"Occasionnelle (< 30 min/j ou quelques fois/an)"],
      ['2',"Intermittente (30 min – 2 h/j)"],
      ['3',"Fréquente (2 – 6 h/j)"],
      ['4',"Permanente (> 6 h/j)"]
    ],
    volatilite: { 1:['Faible',1], 2:['Moyenne',10], 3:['Forte',100] },
    procedes: {
      clos:      ["Clos (système étanche)", 0.001],
      clos_ouv:  ["Clos ouvert régulièrement", 0.05],
      ouvert:    ["Ouvert (bac, transvasement manuel)", 0.5],
      dispersif: ["Dispersif (pulvérisation, soufflage, brossage)", 1]
    },
    protections: {
      enveloppant:["Captage enveloppant (sorbonne, cabine, boîte à gants)", 0.001],
      captage:    ["Captage localisé à la source", 0.1],
      vmg:        ["Ventilation mécanique générale", 0.7],
      exterieur:  ["Travail en extérieur", 0.5],
      aucune:     ["Aucune / ventilation naturelle", 1]
    },
    surfaces: {
      main:   ["Une main", 1],
      mains:  ["Deux mains", 2],
      avbras: ["Mains + avant-bras", 3],
      corps:  ["Bras + tronc ou jambes", 10]
    },
    freqCutanee: {
      occ:  ["Occasionnelle", 1],
      inter:["Intermittente", 2],
      freq: ["Fréquente", 5],
      perm: ["Permanente", 10]
    },
    seuilsExpo: { eleve: 1000, modere: 100 }
  };

  /* ── 7. Liens utiles pour retrouver une FDS ───────────────────── */
  const SOURCES_FDS = nom => {
    const q = encodeURIComponent(nom || '');
    return [
      ['🔎 Google — FDS en PDF', `https://www.google.com/search?q=FDS+${q}+fiche+de+donn%C3%A9es+de+s%C3%A9curit%C3%A9+filetype%3Apdf`],
      ['📚 QuickFDS (base de FDS)', 'https://www.quickfds.com/'],
      ['🧬 PubChem (substance, n° CAS)', `https://pubchem.ncbi.nlm.nih.gov/#query=${q}`],
      ['🇪🇺 ECHA — classification harmonisée', `https://www.google.com/search?q=site%3Aecha.europa.eu+${q}`],
      ['📕 INRS — fiches toxicologiques', `https://www.google.com/search?q=site%3Ainrs.fr+fiche+toxicologique+${q}`]
    ];
  };

  /* ── 8. Produits de démonstration ─────────────────────────────── */
  const DEMO = [
    { nom:'Acétone technique', fournisseur:'Fournisseur démo', molecule:'Propan-2-one (acétone)', cas:'67-64-1', usage:'Dégraissage de pièces', lieu:'Atelier maintenance', etat:'liquide', conditionnement:'Bidon 5 L', quantite:120, unite:'L', exposes:3,
      fds_date:'2023-02-10', fds_version:'4.0', pictos:['SGH02','SGH07'], mention:'Danger',
      h:['H225','H319','H336','EUH066'], p:['P210','P233','P240','P241','P305_P351_P338','P403_P235'], famille:'inflammable',
      cmr:'', vlep:{ vme_mg:1210, vme_ppm:500, vlct_mg:2420 }, teb:56, pe:-17,
      usageCond:{ freq:'3', vol:3, procede:'ouvert', protection:'aucune', surface:'mains', freqCut:'inter' } },
    { nom:'Acide chlorhydrique 33 %', fournisseur:'Fournisseur démo', molecule:'Chlorure d\'hydrogène en solution', cas:'7647-01-0', usage:'Détartrage', lieu:'Local produits', etat:'liquide', conditionnement:'Bidon 20 L', quantite:60, unite:'L', exposes:2,
      fds_date:'2021-05-04', fds_version:'2.1', pictos:['SGH05','SGH07'], mention:'Danger',
      h:['H290','H314','H335'], p:['P260','P280','P303_P361_P353','P305_P351_P338','P310'], famille:'acide_fort',
      cmr:'', vlep:{ vlct_mg:7.6, vlct_ppm:5 }, teb:85, pe:null,
      usageCond:{ freq:'2', vol:2, procede:'ouvert', protection:'vmg', surface:'mains', freqCut:'occ' } },
    { nom:'Formol 30 %', fournisseur:'Fournisseur démo', molecule:'Formaldéhyde', cas:'50-00-0', usage:'Conservation d\'échantillons', lieu:'Laboratoire', etat:'liquide', conditionnement:'Flacon 1 L', quantite:8, unite:'L', exposes:2,
      fds_date:'2019-09-01', fds_version:'1.3', pictos:['SGH05','SGH06','SGH08'], mention:'Danger',
      h:['H301','H311','H331','H314','H317','H341','H350'], p:['P201','P260','P280','P301_P310','P303_P361_P353','P308_P313','P405'], famille:'autre',
      cmr:'1B', vlep:{ vme_mg:0.37, vme_ppm:0.3, vlct_mg:0.74, vlct_ppm:0.6 }, teb:98, pe:64,
      usageCond:{ freq:'2', vol:3, procede:'ouvert', protection:'captage', surface:'mains', freqCut:'inter' } },
    { nom:'Eau de Javel 9,6 %', fournisseur:'Fournisseur démo', molecule:'Hypochlorite de sodium', cas:'7681-52-9', usage:'Désinfection des sols', lieu:'Local produits', etat:'liquide', conditionnement:'Bidon 5 L', quantite:200, unite:'L', exposes:6,
      fds_date:'2024-01-15', fds_version:'3.0', pictos:['SGH05','SGH09'], mention:'Danger',
      h:['H290','H314','H400','EUH031'], p:['P260','P273','P280','P305_P351_P338','P501'], famille:'hypochlorite',
      cmr:'', vlep:{}, teb:null, pe:null,
      usageCond:{ freq:'3', vol:1, procede:'ouvert', protection:'aucune', surface:'mains', freqCut:'freq' } }
  ];

  return { PICTOS, H, P, pKey, pCode, FAMILLES, REACTIONS, STOCK_PICTOS, GROUPES, EVAL, SOURCES_FDS, DEMO };
})();
