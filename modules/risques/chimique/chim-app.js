/* ════════════════════════════════════════════════════════════════
   PréventIA Protect · Risque chimique — LOGIQUE DE L'ÉCRAN
   Lit les référentiels dans chim-data.js (window.CHIM)
   et les pictogrammes dans chim-pictos.js (window.PICTOS_SGH).

   Plan du fichier
     1. État + sauvegarde (localStorage)
     2. Outils (échappement, dates, quantités)
     3. Calculs : classe de danger, évaluation, stockage, compatibilité
     4. Fiche synthétique (règles EPI / EPC / conduite à tenir)
     5. IA : recherche par nom, analyse FDS PDF, photo d'étiquette
     6. Affichage des 4 onglets
     7. Éditeur de produit
     8. Exports, impression, démarrage
   ════════════════════════════════════════════════════════════════ */
(function () {
  const C = window.CHIM;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ═══ 1. ÉTAT + SAUVEGARDE ═══════════════════════════════════════ */
  const CLE = 'preventia_chimique_v2';
  const CLE_ANCIENNE = 'preventia_chimique_products';   // ancien évaluateur
  let produits = [];
  let ongletActif = 'inventaire';
  let ficheActive = null;
  let IA_ON = false;
  try { IA_ON = localStorage.getItem('preventia_ai_mode') === 'true'; } catch (_) {}

  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(produits)); } catch (_) { toast("Sauvegarde locale impossible (navigation privée ?)", 'bad'); }
  }
  function charger() {
    try {
      const raw = localStorage.getItem(CLE);
      if (raw) { produits = JSON.parse(raw) || []; return; }
      /* Migration depuis l'ancien évaluateur : on récupère ce qui existe */
      const old = JSON.parse(localStorage.getItem(CLE_ANCIENNE) || '[]');
      if (Array.isArray(old) && old.length) {
        produits = old.map(o => normaliser({
          nom: o.nom, pictos: o.pictos || [], famille: o.famille || 'none', etat: o.etat || '',
          lieu: o.localisation || '', fds_date: o.fds_date || '', conditionnement: o.consommation || '',
          h: (o.fds_meta?.mentions_h || []).map(x => String(x).split(/[\s–-]/)[0]),
          cmr: o.fds_meta?.cmr ? (o.fds_meta.cmr_cat || '1B') : '',
          vlep: { vme_ppm: o.fds_meta?.vlep_ppm ?? null }, molecule: o.fds_meta?.composition || '', cas: o.fds_meta?.cas || ''
        }));
        sauver();
        toast(`${produits.length} produit(s) repris de l'ancien évaluateur`, 'ok');
      }
    } catch (_) { produits = []; }
  }

  const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function normaliser(p) {
    return Object.assign({
      id: uid(), nom: '', fournisseur: '', molecule: '', cas: '', substances: [], usage: '', lieu: '',
      etat: 'liquide', conditionnement: '', quantite: '', unite: 'L', exposes: '',
      fds_date: '', fds_version: '', fds_lien: '',
      pictos: [], mention: '', h: [], p: [], libelles: {}, famille: 'none', cmr: '',
      vlep: {}, teb: null, pe: null, ph: null,
      usageCond: { freq: '2', vol: '', procede: 'ouvert', protection: 'aucune', surface: 'mains', freqCut: 'inter' },
      fiche: {}, ia: null
    }, p, {
      usageCond: Object.assign({ freq: '2', vol: '', procede: 'ouvert', protection: 'aucune', surface: 'mains', freqCut: 'inter' }, p.usageCond || {}),
      vlep: Object.assign({}, p.vlep || {}), fiche: Object.assign({}, p.fiche || {})
    });
  }

  /* ═══ 2. OUTILS ═══════════════════════════════════════════════════ */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => (v === '' || v === null || v === undefined || isNaN(+v)) ? null : +v;
  const pictoImg = (code, taille = 34) => window.PICTOS_SGH?.[code]
    ? `<img class="picto" src="${PICTOS_SGH[code]}" alt="${esc(C.PICTOS[code]?.label || code)}" title="${esc(code + ' — ' + (C.PICTOS[code]?.label || ''))}" width="${taille}" height="${taille}">` : '';
  const libH = (p, code) => C.H[code]?.l || p.libelles?.[code] || '';
  const libP = (p, k) => C.P[k] || p.libelles?.[k] || '';

  function ageFDS(p) {
    if (!p.fds_date) return null;
    const d = new Date(p.fds_date); if (isNaN(d)) return null;
    return (Date.now() - d) / (365.25 * 864e5);
  }
  function etatFDS(p) {
    const a = ageFDS(p);
    if (a === null) return { cls: 'bad', txt: 'FDS absente' };
    if (a > 3) return { cls: 'warn', txt: `FDS ${Math.floor(a)} ans` };
    return { cls: 'ok', txt: 'FDS à jour' };
  }
  /* Quantité ramenée en L ou kg (densité ≈ 1, ordre de grandeur suffisant) */
  function qteNorm(p) {
    const q = num(p.quantite); if (q === null) return 0;
    return ({ mL: q / 1000, g: q / 1000, 'unités': q * 0.5 })[p.unite] ?? q;
  }

  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  /* ═══ 3. CALCULS ══════════════════════════════════════════════════ */
  const estCMR = p => !!p.cmr || p.h.some(c => C.H[c]?.cmr && /1/.test(C.H[c].cmr));
  const cmrCat = p => p.cmr || (p.h.map(c => C.H[c]?.cmr).filter(Boolean).some(x => /1/.test(x)) ? '1A/1B' : (p.h.some(c => C.H[c]?.cmr) ? '2' : ''));

  /* Classe de danger santé 1→5 : la mention H la plus sévère l'emporte */
  function classeDanger(p) {
    let cd = 1;
    p.h.forEach(c => { if (C.H[c]?.cd > cd) cd = C.H[c].cd; });
    if (p.cmr === '1A' || p.cmr === '1B') cd = 5;
    else if (p.cmr === '2') cd = Math.max(cd, 4);
    const vme = num(p.vlep?.vme_mg);
    if (vme !== null) cd = Math.max(cd, vme <= 0.1 ? 5 : vme <= 1 ? 4 : vme <= 10 ? 3 : vme <= 100 ? 2 : 1);
    if (!p.h.length) {  /* pas de mentions H saisies : on se rabat sur les pictogrammes */
      const parPicto = { SGH05: 4, SGH06: 5, SGH07: 2, SGH08: 4 };
      p.pictos.forEach(x => { if (parPicto[x] > cd) cd = parPicto[x]; });
    }
    return cd;
  }
  function classeQuantite(p) {
    const max = Math.max(...produits.map(qteNorm), 0);
    if (!max) return 1;
    const r = qteNorm(p) / max;
    return r >= 0.33 ? 5 : r >= 0.12 ? 4 : r >= 0.05 ? 3 : r >= 0.01 ? 2 : 1;
  }
  function volatiliteAuto(p) {
    if (p.etat === 'gaz' || p.etat === 'aerosol') return 3;
    if (p.etat === 'poudre') return 3;
    if (p.etat === 'solide' || p.etat === 'pate') return 1;
    const t = num(p.teb);
    if (t === null) return 2;
    return t < 50 ? 3 : t <= 150 ? 2 : 1;
  }
  const niveau = (s, seuils) => s >= seuils.eleve ? { cls: 'bad', txt: 'Élevé', n: 3 } : s >= seuils.modere ? { cls: 'warn', txt: 'Modéré', n: 2 } : { cls: 'ok', txt: 'Faible', n: 1 };

  function evaluer(p) {
    const E = C.EVAL, u = p.usageCond;
    const cd = classeDanger(p), cq = classeQuantite(p), cf = +u.freq || 0;
    const ep = cf ? E.expoPot[cq][cf - 1] : 0;
    const pot = cf ? E.scoreDanger[cd] * E.scoreExpo[ep] : 0;
    const prio = cf === 0 ? { cls: 'na', txt: 'Non utilisé', n: 0 }
      : pot >= E.seuilsPotentiel.fort ? { cls: 'bad', txt: 'Forte', n: 3 }
      : pot >= E.seuilsPotentiel.moyen ? { cls: 'warn', txt: 'Moyenne', n: 2 } : { cls: 'ok', txt: 'Faible', n: 1 };
    const vol = +u.vol || volatiliteAuto(p);
    const sInh = E.scoreDanger[cd] * E.volatilite[vol][1] * (E.procedes[u.procede]?.[1] ?? 1) * (E.protections[u.protection]?.[1] ?? 1);
    const sCut = E.scoreDanger[cd] * (E.surfaces[u.surface]?.[1] ?? 1) * (E.freqCutanee[u.freqCut]?.[1] ?? 1);
    const inh = cf ? niveau(sInh, E.seuilsExpo) : { cls: 'na', txt: '—', n: 0 };
    const cut = cf ? niveau(sCut, E.seuilsExpo) : { cls: 'na', txt: '—', n: 0 };
    return { cd, cq, cf, ep, pot, prio, vol, sInh, sCut, inh, cut };
  }

  /* Groupe de stockage (ordre = du plus contraignant au plus courant) */
  function groupe(p) {
    const has = x => p.pictos.includes(x), f = p.famille;
    if (has('SGH01')) return 'explosif';
    if (has('SGH04') || p.etat === 'gaz') return 'gaz';
    if (f === 'peroxyde') return 'peroxyde';
    if (has('SGH03') || f === 'comburant' || f === 'nitrate') return 'comburant';
    if (f === 'metal_alc' || p.h.some(c => ['H260', 'H261', 'EUH014'].includes(c))) return 'reactif_eau';
    if (has('SGH02') || f === 'inflammable') return 'inflammable';
    if (f === 'acide_fort' || f === 'acide_faible') return 'acide';
    if (f === 'base_forte' || f === 'base_faible' || f === 'amine') return 'base';
    if (has('SGH06') || estCMR(p)) return 'toxique';
    if (has('SGH05')) return 'corrosif';
    return 'courant';
  }

  /* Compatibilité entre 2 produits : 0 OK · 1 PR · 2 INT · 3 INT critique */
  const REAC = {};
  Object.entries(C.REACTIONS).forEach(([k, v]) => { REAC[k.split('|').sort().join('|')] = v; });
  function compat(a, b) {
    const raisons = []; let niv = 0;
    const r = REAC[[a.famille, b.famille].sort().join('|')];
    if (r) { niv = Math.max(niv, r[0]); raisons.push(r[1]); }
    for (const [k, v] of Object.entries(C.STOCK_PICTOS)) {
      const [x, y] = k.split('|');
      const ok = y === '*'
        ? ((a.pictos.includes(x) && !b.pictos.includes(x)) || (b.pictos.includes(x) && !a.pictos.includes(x)))
        : ((a.pictos.includes(x) && b.pictos.includes(y)) || (a.pictos.includes(y) && b.pictos.includes(x)));
      if (ok && !(a.pictos.includes(x) && a.pictos.includes(y)) && !(b.pictos.includes(x) && b.pictos.includes(y))) {
        niv = Math.max(niv, v[0]); raisons.push(v[1]);
      }
    }
    if ((a.famille === 'none' || b.famille === 'none') && niv === 0 && (a.pictos.length && b.pictos.length)) {
      return { niv: -1, raisons: ["Famille chimique non précisée : se référer à la rubrique 10 de la FDS"] };
    }
    return { niv, raisons };
  }
  const NIV = { '-1': ['info', 'INFO'], 0: ['ok', 'OK'], 1: ['warn', 'PR'], 2: ['bad', 'INT'], 3: ['crit', 'INT ⚠'] };

  function incompatibilites(memeLieu = true) {
    const out = [];
    for (let i = 0; i < produits.length; i++) for (let j = i + 1; j < produits.length; j++) {
      const a = produits[i], b = produits[j];
      if (memeLieu && (a.lieu || '').trim().toLowerCase() !== (b.lieu || '').trim().toLowerCase()) continue;
      const c = compat(a, b);
      if (c.niv >= 2) out.push({ a, b, ...c });
    }
    return out.sort((x, y) => y.niv - x.niv);
  }

  /* ═══ 4. FICHE SYNTHÉTIQUE (règles locales, complétées/écrasées par l'IA ou la saisie) ═══ */
  function ficheRegles(p) {
    const h = c => p.h.includes(c), any = (...cs) => cs.some(h);
    const pic = x => p.pictos.includes(x);
    const corrosif = any('H314') || pic('SGH05') && !p.h.length;
    const oeilGrave = corrosif || any('H318', 'EUH070');
    const cutane = corrosif || any('H310', 'H311', 'H312', 'H315', 'H317', 'EUH066', 'EUH208');
    const inhal = any('H330', 'H331', 'H332', 'H334', 'H335', 'H336', 'EUH071', 'H350i', 'EUH029', 'EUH031', 'EUH032') || estCMR(p);
    const inflammable = pic('SGH02') || p.famille === 'inflammable';
    const reactifEau = p.famille === 'metal_alc' || any('H260', 'H261', 'EUH014');
    const f = p.famille;
    const filtre = p.etat === 'poudre' || p.etat === 'solide' ? 'P3 (poussières)'
      : f === 'amine' ? 'K (ammoniac/amines)' : (f === 'acide_fort' || f === 'hypochlorite') ? 'E ou B (gaz acides / inorganiques)'
      : (f === 'inflammable' || f === 'solvant_chl') ? 'A (vapeurs organiques, Téb > 65 °C) ou AX si Téb ≤ 65 °C' : 'adapté selon la FDS rubrique 8';
    const epi = [];
    if (cutane || pic('SGH05')) epi.push(`🧤 Gants de protection chimique (EN ISO 374-1) — matériau et temps de passage selon FDS rubrique 8`);
    if (oeilGrave) epi.push('🥽 Lunettes-masque étanches (EN 166) + écran facial en cas de risque de projection');
    else if (any('H319') || pic('SGH07')) epi.push('🥽 Lunettes de sécurité à protections latérales (EN 166)');
    if (inhal) epi.push(`😷 Appareil de protection respiratoire si les protections collectives sont insuffisantes — filtre ${filtre}`);
    if (corrosif || any('H310', 'H311')) epi.push('🥼 Tablier ou combinaison de protection chimique (type 3, 4 ou 6 selon l\'exposition), bottes si risque d\'éclaboussures');
    else epi.push('🥼 Vêtement de travail à manches longues, à laver séparément');
    if (!epi.length) epi.push('Pas d\'EPI spécifique identifié : vérifier la FDS rubrique 8');

    const epc = [];
    if (inhal || (p.etat !== 'solide' && evaluer(p).vol >= 2)) epc.push('Captage à la source (sorbonne, table aspirante, bras articulé) ou travail en vase clos');
    if (estCMR(p)) epc.push('Système clos si techniquement possible (art. R4412-68), zone de travail délimitée et signalée');
    if (inflammable) epc.push('Matériel ATEX adapté, mise à la terre, armoire de sécurité ventilée coupe-feu (EN 14470-1)');
    if (corrosif || oeilGrave || any('H319')) epc.push('Douche de sécurité et lave-œil à proximité immédiate, testés régulièrement');
    if (p.etat === 'liquide') epc.push('Bacs de rétention (≥ 100 % du plus grand contenant, ≥ 50 % du volume total)');
    epc.push('Distributeur, doseur ou pompe de transvasement plutôt que versement manuel');

    const cat = {
      inhalation: any('H330', 'H331', 'H334', 'EUH071') || estCMR(p)
        ? "Soustraire immédiatement à l'exposition (sans s'exposer), mettre à l'air frais, au repos, en position demi-assise. Appeler le 15 ou le 112. Surveiller la respiration."
        : "Sortir à l'air frais. Si malaise, toux persistante ou gêne respiratoire : appeler le 15 ou un centre antipoison.",
      peau: corrosif
        ? "Retirer immédiatement les vêtements contaminés (gants !). Rincer abondamment à l'eau tiède pendant au moins 15 minutes (douche de sécurité). Appeler le 15."
        : any('H310', 'H311') ? "Retirer les vêtements contaminés, laver immédiatement et abondamment à l'eau et au savon. Appeler le centre antipoison ou le 15."
        : any('H317') ? "Laver à l'eau et au savon. En cas de rougeur, démangeaisons ou eczéma : consulter et informer le médecin du travail (sensibilisant)."
        : "Laver à l'eau et au savon. Consulter si une irritation persiste.",
      yeux: oeilGrave
        ? "Rincer IMMÉDIATEMENT au lave-œil pendant au moins 15 minutes, paupières bien écartées, retirer les lentilles. Avis ophtalmologique en urgence (15)."
        : "Rincer à l'eau pendant plusieurs minutes, retirer les lentilles. Consulter si l'irritation persiste.",
      ingestion: corrosif || any('H304')
        ? "NE PAS faire vomir (risque de nouvelles lésions ou de fausse route). Rincer la bouche, ne rien faire boire. Appeler immédiatement le 15 ou un centre antipoison."
        : "Rincer la bouche. Ne pas faire vomir sans avis médical. Appeler un centre antipoison en indiquant le nom du produit (garder l'étiquette).",
      incendie: reactifEau ? "NE PAS UTILISER D'EAU. Sable sec, poudre spéciale classe D. Évacuer et alerter le 18."
        : pic('SGH04') ? "Évacuer, refroidir les bouteilles à l'eau à distance, alerter le 18. Ne pas intervenir sur une bouteille en feu."
        : pic('SGH03') ? "Comburant : éloigner les combustibles, eau en grande quantité. Alerter le 18."
        : inflammable ? "Extincteur CO₂, poudre ABC ou mousse. Ne pas utiliser de jet d'eau bâton. Couper les sources d'ignition, alerter le 18."
        : "Moyens d'extinction adaptés à l'environnement (FDS rubrique 5). Fumées potentiellement toxiques : ne pas les respirer.",
      deversement: [
        'Baliser la zone, aérer, éloigner les personnes non protégées',
        'Porter les EPI de la fiche avant d\'intervenir',
        inflammable ? 'Supprimer toute source d\'ignition' : '',
        f === 'acide_fort' || f === 'acide_faible' ? 'Absorbant ou neutralisant pour acides' : f === 'base_forte' || f === 'base_faible' ? 'Absorbant ou neutralisant pour bases' : pic('SGH03') ? 'Absorbant INERTE et non combustible (pas de sciure)' : 'Absorbant inerte (vermiculite, absorbant universel)',
        'Récupérer en fût étiqueté « déchet dangereux », ne jamais rejeter à l\'égout',
        p.h.some(c => /^H4/.test(c)) ? 'Dangereux pour l\'environnement : protéger les regards et canalisations' : ''
      ].filter(Boolean).join(' · ')
    };
    const g = C.GROUPES[groupe(p)];
    const stockage = `${g.l} — ${g.regle}.` + (p.h.includes('H290') ? ' Pas de contenant ni d\'étagère métallique.' : '') + (any('H350', 'H340', 'H360', 'H350i', 'H360F', 'H360D', 'H360FD') || p.pictos.includes('SGH06') ? ' Sous clé (P405).' : '');
    return { epi, epc, ...cat, stockage };
  }
  /* Fiche finale : ce que l'IA ou l'utilisatrice a saisi prime sur les règles */
  function fiche(p) {
    const r = ficheRegles(p), f = p.fiche || {};
    const liste = v => Array.isArray(v) ? v.filter(Boolean) : String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
    return {
      epi: liste(f.epi).length ? liste(f.epi) : r.epi,
      epc: liste(f.epc).length ? liste(f.epc) : r.epc,
      inhalation: f.inhalation || r.inhalation, peau: f.peau || r.peau, yeux: f.yeux || r.yeux,
      ingestion: f.ingestion || r.ingestion, incendie: f.incendie || r.incendie,
      deversement: f.deversement || r.deversement, stockage: f.stockage || r.stockage,
      incompat: f.incompat || '',
      sourceIA: !!(liste(f.epi).length || f.peau)
    };
  }

  /* Mention d'avertissement si non saisie */
  function mention(p) {
    if (p.mention) return p.mention;
    const danger = ['H200', 'H201', 'H202', 'H203', 'H220', 'H222', 'H224', 'H225', 'H230', 'H240', 'H241', 'H250', 'H260', 'H271', 'H300', 'H301', 'H310', 'H311', 'H314', 'H318', 'H330', 'H331', 'H334', 'H340', 'H350', 'H350i', 'H360', 'H370', 'H372'];
    if (p.h.some(c => danger.includes(c) || /^H360/.test(c))) return 'Danger';
    return p.pictos.length || p.h.length ? 'Attention' : '';
  }

  /* Recommandations hiérarchisées (S substitution · T technique · O organisation · P protection individuelle) */
  function recommandations(p, ev) {
    const r = [], add = (n, t) => r.push({ n, t });
    const cat = cmrCat(p);
    if (ev.cf === 0) add('S', "Produit non utilisé depuis plus d'un an : l'éliminer via une filière de déchets dangereux pour réduire le stock.");
    if (estCMR(p)) {
      add('S', "CMR 1A/1B : substitution obligatoire dès que techniquement possible (art. R4412-66). Tracer la recherche de substitution dans le DUERP.");
      add('T', "Travail en système clos si la substitution est impossible (art. R4412-68).");
      add('O', "Liste des travailleurs exposés, information et formation renforcées, suivi individuel renforcé : à organiser avec le médecin du travail.");
    } else if (cat === '2' || ev.cd >= 4) add('S', "Danger élevé : étudier la substitution par un produit ou un procédé moins dangereux.");
    if (ev.inh.n === 3) add('T', p.usageCond.protection === 'aucune' || p.usageCond.protection === 'vmg'
      ? "Risque inhalation élevé : installer un captage à la source (ou capoter le procédé)." : "Risque inhalation élevé malgré la ventilation : vérifier son efficacité (contrôle annuel) et réduire les quantités ouvertes.");
    else if (ev.inh.n === 2) add('T', "Risque inhalation modéré : refermer les contenants, limiter les surfaces d'évaporation, vérifier la ventilation.");
    if ((num(p.vlep?.vme_mg) !== null || num(p.vlep?.vlct_mg) !== null) && ev.inh.n >= 2) add('O', "Une VLEP existe : prévoir des mesurages d'exposition (organisme accrédité si VLEP contraignante).");
    if (ev.cut.n === 3) add('O', "Risque cutané élevé : supprimer le contact direct (outils, pinces, distributeurs) et réduire la surface exposée.");
    if (ev.cut.n >= 2) add('P', "Gants de protection chimique adaptés au produit (FDS rubrique 8), renouvelés selon leur temps de passage.");
    if (p.h.some(c => ['H317', 'H334', 'EUH208'].includes(c))) add('O', "Produit sensibilisant : informer le médecin du travail, éviter tout contact cutané et respiratoire.");
    if (p.pictos.includes('SGH02')) add('T', "Inflammable : supprimer les sources d'ignition, mise à la terre, évaluer le risque ATEX.");
    const e = etatFDS(p);
    if (e.cls !== 'ok') add('O', e.cls === 'bad' ? "Demander la FDS au fournisseur (obligation de fourniture, REACH art. 31)." : "FDS de plus de 3 ans : vérifier auprès du fournisseur qu'il s'agit de la dernière version.");
    incompatibilites().filter(x => x.a === p || x.b === p).forEach(x => {
      const autre = x.a === p ? x.b : x.a;
      add('T', `Séparer de « ${autre.nom} » (${x.raisons[0] || 'incompatibilité'}).`);
    });
    return r;
  }

  /* ═══ 5. IA ═══════════════════════════════════════════════════════ */
  const SCHEMA = `{
  "nom_commercial": "", "fournisseur": "", "date_fds": "AAAA-MM-JJ ou null", "version_fds": "",
  "molecule_principale": "nom de la substance principale", "cas": "n° CAS de la substance principale ou null",
  "substances": [{"nom": "", "cas": "", "concentration": ""}],
  "etat_physique": "liquide|solide|poudre|gaz|aerosol|pate",
  "pictogrammes": ["SGH02"], "mention_avertissement": "Danger|Attention|null",
  "mentions_h": [{"code": "H225", "libelle": "..."}], "mentions_p": [{"code": "P210", "libelle": "..."}],
  "famille_chimique": "${Object.keys(C.FAMILLES).join('|')}",
  "cmr_categorie": "1A|1B|2|null",
  "vlep": {"vme_mg": null, "vme_ppm": null, "vlct_mg": null, "vlct_ppm": null},
  "temperature_ebullition_c": null, "point_eclair_c": null, "ph": null,
  "epi": ["Gants nitrile 0,4 mm (temps de passage > 480 min)", "..."],
  "epc": ["..."],
  "premiers_secours": {"inhalation": "", "peau": "", "yeux": "", "ingestion": ""},
  "incendie": "moyens d'extinction appropriés et interdits", "deversement": "", "stockage": "", "incompatibilites": "",
  "confiance": "high|medium|low", "remarques": "points à vérifier, rubriques manquantes"
}`;
  const REGLES_IA = `Règles : réponds UNIQUEMENT par l'objet JSON (aucun texte autour, pas de \`\`\`). Codes pictogrammes uniquement SGH01 à SGH09. Mentions EUH dans "mentions_h". Code P combinés avec "+" (ex. "P305+P351+P338"). Valeurs numériques en nombres. Textes de conduite à tenir : courts, concrets, en français, destinés à une fiche de poste. N'invente rien : mets null ou une liste vide si l'information est absente.`;

  function extraireJSON(t) {
    const s = String(t || '').replace(/```json|```/g, '');
    const i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i < 0 || j < 0) throw new Error("Réponse de l'IA illisible");
    return JSON.parse(s.slice(i, j + 1));
  }
  async function appelIA(body) {
    if (!IA_ON) throw new Error("Mode IA désactivé : activez-le en haut de la page.");
    if (!window.PIA) throw new Error("Passerelle IA introuvable (core/preventia-ia.js).");
    return extraireJSON(await PIA.texte(body));
  }
  const iaParNom = nom => appelIA({
    max_tokens: 3000,
    system: `Tu es expert en sécurité chimique (CLP, REACH, INRS, ECHA). À partir de tes connaissances des FDS publiques et classifications harmonisées, décris le produit demandé selon ce schéma JSON :\n${SCHEMA}\n${REGLES_IA} "confiance" = "low" si le produit est un mélange commercial dont la formulation peut varier.`,
    messages: [{ role: 'user', content: `Produit : « ${nom} »` }]
  });
  const iaTexteFDS = texte => appelIA({
    max_tokens: 3500,
    system: `Tu es expert en sécurité chimique. On te donne le texte d'une fiche de données de sécurité (FDS). Extrais les informations UNIQUEMENT depuis ce document, selon ce schéma JSON :\n${SCHEMA}\n${REGLES_IA} EPI : reprendre la rubrique 8 (matériau des gants, filtre). Premiers secours : rubrique 4. Incendie : rubrique 5. Déversement : rubrique 6. Stockage : rubrique 7. Incompatibilités : rubrique 10. VLEP : rubrique 8.`,
    messages: [{ role: 'user', content: 'Texte de la FDS :\n\n' + texte }]
  });
  const iaImages = (images, consigne) => appelIA({
    max_tokens: 3500,
    system: `Tu es expert en sécurité chimique. Analyse les images (FDS scannée ou étiquette CLP) et extrais les informations visibles selon ce schéma JSON :\n${SCHEMA}\n${REGLES_IA} Pour une étiquette, complète les pictogrammes depuis les mentions H si besoin et mets "confiance": "medium" au maximum.`,
    messages: [{ role: 'user', content: [...images.map(d => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: d } })), { type: 'text', text: consigne }] }]
  });

  /* pdf.js chargé à la demande (uniquement si on analyse un PDF) */
  let pdfjsPret = null;
  function chargerPdfJs() {
    if (pdfjsPret) return pdfjsPret;
    pdfjsPret = new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(pdfjsLib); };
      s.onerror = () => { pdfjsPret = null; ko(new Error('Lecteur PDF indisponible (connexion ?)')); };
      document.head.appendChild(s);
    });
    return pdfjsPret;
  }
  async function lirePDF(file) {
    const lib = await chargerPdfJs();
    const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    let texte = '';
    for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      texte += c.items.map(x => x.str).join(' ') + '\n';
    }
    texte = texte.replace(/[ \t]+/g, ' ').trim();
    /* Rubriques 12 à 16 inutiles ici : on coupe pour réduire le coût */
    const coupe = texte.search(/RUBRIQUE\s*12|SECTION\s*12|12\s*[.:]\s*Informations\s+[ée]cologiques/i);
    if (coupe > 3000) texte = texte.slice(0, coupe);
    if (texte.length > 800) return { texte: texte.slice(0, 45000) };
    /* PDF scanné : on envoie les 3 premières pages en image */
    const imgs = [];
    for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
      const page = await doc.getPage(i), vp = page.getViewport({ scale: 1.6 });
      const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      imgs.push(cv.toDataURL('image/jpeg', 0.72).split(',')[1]);
    }
    return { images: imgs };
  }
  function compresserImage(file, maxPx = 1600) {
    return new Promise((ok, ko) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, maxPx / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = img.width * k; cv.height = img.height * k;
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        ok(cv.toDataURL('image/jpeg', 0.75).split(',')[1]);
      };
      img.onerror = () => ko(new Error('Image illisible'));
      img.src = url;
    });
  }

  /* JSON de l'IA → champs du produit */
  function depuisIA(j, base = {}) {
    const h = [], p = [], libelles = {};
    (j.mentions_h || []).forEach(x => {
      const code = normCodeH(typeof x === 'string' ? x : x.code); if (!code) return;
      h.push(code); if (!C.H[code] && x.libelle) libelles[code] = x.libelle;
    });
    (j.mentions_p || []).forEach(x => {
      const k = C.pKey(typeof x === 'string' ? x.split(/\s/)[0] : x.code); if (!/^P\d/.test(k)) return;
      p.push(k); if (!C.P[k] && x.libelle) libelles[k] = x.libelle;
    });
    const etats = ['liquide', 'solide', 'poudre', 'gaz', 'aerosol', 'pate'];
    const v = j.vlep || {};
    const prem = j.premiers_secours || {};
    return normaliser(Object.assign({}, base, {
      nom: base.nom || j.nom_commercial || j.molecule_principale || '',
      fournisseur: j.fournisseur || base.fournisseur || '',
      molecule: j.molecule_principale || '', cas: j.cas || '',
      substances: Array.isArray(j.substances) ? j.substances.filter(s => s && s.nom) : [],
      etat: etats.includes(j.etat_physique) ? j.etat_physique : (base.etat || 'liquide'),
      fds_date: /^\d{4}-\d{2}-\d{2}$/.test(j.date_fds || '') ? j.date_fds : (base.fds_date || ''),
      fds_version: j.version_fds || base.fds_version || '',
      pictos: (j.pictogrammes || []).map(s => String(s).toUpperCase().replace('GHS', 'SGH')).filter(s => C.PICTOS[s]),
      mention: ['Danger', 'Attention'].includes(j.mention_avertissement) ? j.mention_avertissement : '',
      h: [...new Set(h)], p: [...new Set(p)], libelles,
      famille: C.FAMILLES[j.famille_chimique] ? j.famille_chimique : 'none',
      cmr: ['1A', '1B', '2'].includes(j.cmr_categorie) ? j.cmr_categorie : '',
      vlep: { vme_mg: num(v.vme_mg), vme_ppm: num(v.vme_ppm), vlct_mg: num(v.vlct_mg), vlct_ppm: num(v.vlct_ppm) },
      teb: num(j.temperature_ebullition_c), pe: num(j.point_eclair_c), ph: num(j.ph),
      fiche: {
        epi: j.epi || [], epc: j.epc || [], inhalation: prem.inhalation || '', peau: prem.peau || '',
        yeux: prem.yeux || '', ingestion: prem.ingestion || '', incendie: j.incendie || '',
        deversement: j.deversement || '', stockage: j.stockage || '', incompat: j.incompatibilites || ''
      },
      ia: { confiance: j.confiance || 'medium', remarques: j.remarques || '', date: new Date().toISOString().slice(0, 10) }
    }));
  }
  function normCodeH(s) {
    const m = String(s || '').trim().match(/^(EUH\s?\d{3}|H\s?\d{3}[A-Za-z]{0,2})/i);
    if (!m) return '';
    const brut = m[1].replace(/\s/g, '');
    const connu = Object.keys(C.H).find(k => k.toLowerCase() === brut.toLowerCase());
    return connu || brut.toUpperCase();
  }

  /* ═══ 6. AFFICHAGE ════════════════════════════════════════════════ */
  function rendre() {
    rendreKPI();
    ({ inventaire: rendreInventaire, evaluation: rendreEvaluation, stockage: rendreStockage, fiches: rendreFiches })[ongletActif]();
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === ongletActif));
    $$('main > .panel').forEach(s => s.hidden = s.id !== 'tab-' + ongletActif);
    majIA();
  }
  function rendreKPI() {
    const evs = produits.map(evaluer);
    const k = [
      [produits.length, 'produits', ''],
      [produits.filter(estCMR).length, 'CMR 1A / 1B', produits.some(estCMR) ? 'bad' : ''],
      [produits.filter(p => etatFDS(p).cls !== 'ok').length, 'FDS à demander / vérifier', produits.some(p => etatFDS(p).cls !== 'ok') ? 'warn' : ''],
      [incompatibilites().length, 'incompatibilités de stockage', incompatibilites().length ? 'bad' : ''],
      [evs.filter(e => e.prio.n === 3).length, 'priorités fortes', evs.some(e => e.prio.n === 3) ? 'bad' : '']
    ];
    $('#kpis').innerHTML = k.map(([v, l, c]) => `<div class="kpi ${c}"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  /* --- Onglet 1 : inventaire --- */
  function rendreInventaire() {
    const q = ($('#f-q').value || '').toLowerCase(), lieu = $('#f-lieu').value, filtre = $('#f-type').value;
    const lieux = [...new Set(produits.map(p => p.lieu).filter(Boolean))].sort();
    $('#f-lieu').innerHTML = '<option value="">Tous les lieux</option>' + lieux.map(l => `<option ${l === lieu ? 'selected' : ''}>${esc(l)}</option>`).join('');
    $('#dl-lieux').innerHTML = lieux.map(l => `<option value="${esc(l)}">`).join('');
    const liste = produits.filter(p =>
      (!q || [p.nom, p.molecule, p.cas, p.fournisseur, p.usage].join(' ').toLowerCase().includes(q)) &&
      (!lieu || p.lieu === lieu) &&
      (!filtre || (filtre === 'cmr' && estCMR(p)) || (filtre === 'fds' && etatFDS(p).cls !== 'ok') || (filtre === 'prio' && evaluer(p).prio.n === 3)));
    if (!produits.length) {
      $('#inv-liste').innerHTML = `<div class="vide"><div class="vide-ic">🧪</div><h3>Inventaire vide</h3>
        <p>Ajoutez vos produits un par un : déposez la FDS (PDF) ou une photo de l'étiquette et l'IA pré-remplit la fiche, ou saisissez-les à la main.</p>
        <div class="row"><button class="btn primary" data-act="ajouter">＋ Ajouter un produit</button><button class="btn" data-act="demo">Charger 4 produits d'exemple</button></div></div>`;
      return;
    }
    $('#inv-liste').innerHTML = `<div class="table-wrap"><table class="inv">
      <thead><tr><th>Produit</th><th>Lieu · usage</th><th>Pictogrammes</th><th>Mentions de danger</th><th class="num">Qté / an</th><th>FDS</th><th>Priorité</th><th></th></tr></thead>
      <tbody>${liste.map(p => {
        const ev = evaluer(p), fds = etatFDS(p);
        return `<tr>
          <td><button class="lien-prod" data-act="editer" data-id="${p.id}"><b>${esc(p.nom || 'Sans nom')}</b></button>
            <small>${esc(p.molecule || '')}${p.cas ? ' · CAS ' + esc(p.cas) : ''}</small>
            ${estCMR(p) ? '<span class="tag bad">CMR ' + esc(cmrCat(p)) + '</span>' : ''}${p.ia ? '<span class="tag ia" title="Données pré-remplies par IA — à vérifier sur la FDS">IA</span>' : ''}</td>
          <td>${esc(p.lieu || '—')}<small>${esc(p.usage || '')}</small></td>
          <td><div class="pictos">${p.pictos.map(c => pictoImg(c, 30)).join('') || '<span class="muted">—</span>'}</div></td>
          <td><div class="hs">${p.h.slice(0, 6).map(c => `<span class="h ${C.H[c]?.t || ''}" title="${esc(libH(p, c))}">${esc(c)}</span>`).join('')}${p.h.length > 6 ? `<span class="h">+${p.h.length - 6}</span>` : ''}</div></td>
          <td class="num">${p.quantite !== '' && p.quantite !== null ? esc(p.quantite) + ' ' + esc(p.unite) : '—'}</td>
          <td><span class="pill ${fds.cls}">${fds.txt}</span></td>
          <td><span class="pill ${ev.prio.cls}">${ev.prio.txt}</span></td>
          <td class="acts"><button class="ico" data-act="fiche" data-id="${p.id}" title="Fiche synthétique">📋</button><button class="ico" data-act="editer" data-id="${p.id}" title="Modifier">✏️</button><button class="ico" data-act="dupliquer" data-id="${p.id}" title="Dupliquer">⧉</button><button class="ico" data-act="suppr" data-id="${p.id}" title="Supprimer">🗑</button></td>
        </tr>`;
      }).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">Aucun produit ne correspond au filtre.</td></tr>'}</tbody></table></div>`;
  }

  /* --- Onglet 2 : évaluation --- */
  function rendreEvaluation() {
    if (!produits.length) { $('#eval-zone').innerHTML = '<div class="vide"><p>Ajoutez des produits à l\'inventaire pour lancer l\'évaluation.</p></div>'; return; }
    const lignes = produits.map(p => ({ p, ev: evaluer(p) })).sort((a, b) => b.ev.pot - a.ev.pot);
    const E = C.EVAL;
    const cmr = produits.filter(estCMR);
    const ordre = { S: 0, T: 1, O: 2, P: 3 };
    const plans = lignes.map(({ p, ev }) => ({ p, ev, actions: recommandations(p, ev).sort((a, b) => ordre[a.n] - ordre[b.n]) }))
      .filter(x => x.actions.length).sort((a, b) => b.ev.prio.n - a.ev.prio.n || b.ev.pot - a.ev.pot);
    const NOMS = { S: 'Supprimer / substituer', T: 'Technique', O: 'Organisation', P: 'Protection individuelle' };

    $('#eval-zone').innerHTML = `
    <section class="card">
      <div class="card-h"><span class="step">1</span><div><h3>Hiérarchisation des risques potentiels</h3><p class="muted">Danger × quantité × fréquence : quels produits regarder en premier ?</p></div></div>
      <div class="table-wrap"><table class="inv eval">
        <thead><tr><th>Produit</th><th title="Classe de danger 1→5 (mentions H, CMR, VLEP)">Danger</th><th title="Quantité relative au plus gros consommateur">Qté</th><th>Fréq.</th><th title="Exposition potentielle">Expo. pot.</th><th>Priorité</th><th>Inhalation</th><th>Cutané</th><th></th></tr></thead>
        <tbody>${lignes.map(({ p, ev }) => `<tr>
          <td><b>${esc(p.nom)}</b><small>${esc(p.lieu || '')}</small></td>
          <td><span class="cd cd${ev.cd}">${ev.cd}</span></td><td>${ev.cq}</td><td>${ev.cf}</td><td>${ev.ep || '—'}</td>
          <td><span class="pill ${ev.prio.cls}">${ev.prio.txt}</span></td>
          <td><span class="pill ${ev.inh.cls}" title="Score ${Math.round(ev.sInh)}">${ev.inh.txt}</span></td>
          <td><span class="pill ${ev.cut.cls}" title="Score ${Math.round(ev.sCut)}">${ev.cut.txt}</span></td>
          <td><button class="btn sm" data-act="editer" data-id="${p.id}" data-sec="usage">Conditions</button></td></tr>`).join('')}</tbody>
      </table></div>
      <details class="methode"><summary>Comment sont calculés ces niveaux ?</summary>
        <div class="grid2">
          <div><b>Risque potentiel</b> = score danger (classe 1→5 : 1 · 10 · 100 · 1 000 · 10 000) × score d'exposition potentielle (1 · 3 · 10 · 30 · 100, croisement de la quantité relative et de la fréquence).
          Priorité forte ≥ ${E.seuilsPotentiel.fort.toLocaleString('fr')}, moyenne ≥ ${E.seuilsPotentiel.moyen.toLocaleString('fr')}.</div>
          <div><b>Inhalation</b> = danger × volatilité (1 · 10 · 100) × procédé (clos 0,001 → dispersif 1) × protection collective (enveloppant 0,001 → aucune 1).
          <b>Cutané</b> = danger × surface exposée × fréquence. Élevé ≥ 1 000, modéré ≥ 100. Les EPI ne sont pas comptés : ils sont la dernière barrière.</div>
        </div>
        <p class="muted">Méthode inspirée de la hiérarchisation INRS ND 2233, qui sert de base à Seirich. Coefficients simplifiés : première approche, pas une évaluation réglementaire.</p>
      </details>
    </section>

    ${cmr.length ? `<section class="card cmr-card">
      <div class="card-h"><span class="step">☣</span><div><h3>Agents CMR présents</h3><p class="muted">À signaler au médecin du travail · suivi individuel renforcé · substitution prioritaire</p></div></div>
      <ul class="cmr-list">${cmr.map(p => `<li><b>${esc(p.nom)}</b> — ${esc(p.molecule || '')} <span class="tag bad">CMR ${esc(cmrCat(p))}</span> · ${esc(p.lieu || 'lieu ?')} · <b>${esc(p.exposes || '?')}</b> salarié(s) exposé(s)</li>`).join('')}</ul>
    </section>` : ''}

    <section class="card">
      <div class="card-h"><span class="step">2</span><div><h3>Plan d'actions proposé</h3><p class="muted">Dans l'ordre des principes de prévention : supprimer, protéger collectivement, organiser, puis protéger individuellement.</p></div></div>
      ${plans.length ? `<div class="plans">${plans.map(({ p, ev, actions }) => `<div class="plan-prod">
        <header><b>${esc(p.nom)}</b><span class="pill ${ev.prio.cls}">Priorité ${ev.prio.txt.toLowerCase()}</span><small>${esc(p.lieu || '')}</small></header>
        <ol class="plan">${actions.map(a => `<li><span class="niv n${a.n}" title="${NOMS[a.n]}">${a.n}</span><span>${esc(a.t)}</span></li>`).join('')}</ol></div>`).join('')}</div>` : '<p class="muted">Aucune action particulière proposée.</p>'}
      <div class="legend-stop">${Object.entries(NOMS).map(([k, v]) => `<span><span class="niv n${k}">${k}</span>${v}</span>`).join('')}</div>
    </section>`;
  }

  /* --- Onglet 3 : stockage --- */
  function rendreStockage() {
    const lieux = [...new Set(produits.map(p => p.lieu || 'Lieu non précisé'))].sort();
    const choix = $('#s-lieu').value;
    $('#s-lieu').innerHTML = '<option value="">Tous les lieux</option>' + lieux.map(l => `<option ${l === choix ? 'selected' : ''}>${esc(l)}</option>`).join('');
    const sel = produits.filter(p => !choix || (p.lieu || 'Lieu non précisé') === choix);
    const inc = incompatibilites().filter(x => !choix || (x.a.lieu || 'Lieu non précisé') === choix);

    const parLieu = {};
    sel.forEach(p => { const l = p.lieu || 'Lieu non précisé'; (parLieu[l] ||= {}); (parLieu[l][groupe(p)] ||= []).push(p); });

    $('#stock-zone').innerHTML = !produits.length ? '<div class="vide"><p>Ajoutez des produits (avec leur lieu de stockage) pour voir les compatibilités.</p></div>' : `
    <section class="card">
      <div class="card-h"><span class="step">1</span><div><h3>Incompatibilités dans un même lieu</h3><p class="muted">Paires de produits stockés ensemble qui doivent être séparés</p></div></div>
      ${inc.length ? `<ul class="inc-list">${inc.map(x => `<li class="${NIV[x.niv][0]}"><span class="badge ${NIV[x.niv][0]}">${NIV[x.niv][1]}</span>
        <div><b>${esc(x.a.nom)}</b> <span class="muted">×</span> <b>${esc(x.b.nom)}</b> <small>${esc(x.a.lieu || '')}</small><br>${x.raisons.map(esc).join(' · ')}</div></li>`).join('')}</ul>`
        : '<p class="okmsg">✓ Aucune incompatibilité détectée entre produits d\'un même lieu (sous réserve que les familles chimiques soient renseignées).</p>'}
    </section>

    <section class="card">
      <div class="card-h"><span class="step">2</span><div><h3>Rangement conseillé par lieu</h3><p class="muted">Un bloc = une zone, une armoire ou une rétention distincte</p></div></div>
      ${Object.entries(parLieu).map(([l, gs]) => `<div class="lieu"><h4>📍 ${esc(l)}</h4><div class="groupes">${Object.entries(gs).map(([g, ps]) => `
        <div class="grp" style="--g:${C.GROUPES[g].c}"><div class="grp-h">${C.GROUPES[g].ic} ${esc(C.GROUPES[g].l)}</div>
        <ul>${ps.map(p => `<li>${p.pictos.map(c => pictoImg(c, 20)).join('')} ${esc(p.nom)}</li>`).join('')}</ul>
        <p>${esc(C.GROUPES[g].regle)}</p></div>`).join('')}</div></div>`).join('')}
    </section>

    <section class="card">
      <div class="card-h"><span class="step">3</span><div><h3>Matrice de compatibilité</h3><p class="muted">Survolez une case pour la raison · <span class="badge ok">OK</span> compatible <span class="badge warn">PR</span> prudence <span class="badge bad">INT</span> séparation obligatoire <span class="badge info">INFO</span> voir FDS</p></div></div>
      ${sel.length > 1 ? `<div class="table-wrap"><table class="matrix"><thead><tr><th></th>${sel.map((p, i) => `<th title="${esc(p.nom)}"><span>${i + 1}</span></th>`).join('')}</tr></thead>
      <tbody>${sel.map((a, i) => `<tr><th><span class="mi">${i + 1}</span> ${esc(a.nom)}</th>${sel.map((b, j) => {
        if (i === j) return '<td class="diag"></td>';
        const c = compat(a, b);
        return `<td class="${NIV[c.niv][0]}" title="${esc(c.raisons.join(' · ') || 'Pas d\'incompatibilité majeure identifiée')}">${NIV[c.niv][1]}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="muted">Au moins deux produits sont nécessaires.</p>'}
    </section>`;
  }

  /* --- Onglet 4 : fiches synthétiques --- */
  function rendreFiches() {
    if (!produits.length) { $('#fiches-zone').innerHTML = '<div class="vide"><p>Les fiches synthétiques apparaîtront ici dès qu\'un produit sera ajouté.</p></div>'; return; }
    if (!ficheActive || !produits.find(p => p.id === ficheActive)) ficheActive = produits[0].id;
    $('#fiches-zone').innerHTML = `<div class="fiches-layout">
      <nav class="fiches-nav">${produits.map(p => `<button class="${p.id === ficheActive ? 'on' : ''}" data-act="fiche" data-id="${p.id}">
        <span class="pictos">${p.pictos.slice(0, 3).map(c => pictoImg(c, 22)).join('')}</span><span>${esc(p.nom || 'Sans nom')}</span></button>`).join('')}</nav>
      <div>${ficheHTML(produits.find(p => p.id === ficheActive))}</div></div>`;
  }
  function ficheHTML(p) {
    const f = fiche(p), m = mention(p), ev = evaluer(p);
    const hs = p.h;
    const grp = C.GROUPES[groupe(p)];
    const voisins = incompatibilites().filter(x => x.a === p || x.b === p).map(x => (x.a === p ? x.b : x.a).nom);
    const v = p.vlep || {};
    const vlep = [v.vme_mg != null || v.vme_ppm != null ? `VLEP 8 h : ${[v.vme_mg != null ? v.vme_mg + ' mg/m³' : '', v.vme_ppm != null ? v.vme_ppm + ' ppm' : ''].filter(Boolean).join(' · ')}` : '',
      v.vlct_mg != null || v.vlct_ppm != null ? `VLCT 15 min : ${[v.vlct_mg != null ? v.vlct_mg + ' mg/m³' : '', v.vlct_ppm != null ? v.vlct_ppm + ' ppm' : ''].filter(Boolean).join(' · ')}` : ''].filter(Boolean);
    return `<article class="fiche" data-id="${p.id}">
      <header class="fiche-h ${m === 'Danger' ? 'danger' : m ? 'attention' : ''}">
        <div><p class="eyebrow">Fiche synthétique produit · ${esc(p.lieu || '')}</p>
          <h2>${esc(p.nom || 'Sans nom')}</h2>
          <p class="mol">${esc(p.molecule || '')}${p.cas ? ` · <b>CAS ${esc(p.cas)}</b>` : ''}${p.fournisseur ? ' · ' + esc(p.fournisseur) : ''}</p></div>
        <div class="fiche-pictos">${p.pictos.map(c => pictoImg(c, 64)).join('')}${m ? `<span class="mention">${esc(m)}</span>` : ''}</div>
      </header>
      ${estCMR(p) ? `<div class="bandeau-cmr">☣ Agent CMR catégorie ${esc(cmrCat(p))} — substitution prioritaire, exposition à réduire au niveau le plus bas possible, suivi médical renforcé.</div>` : ''}
      <div class="fiche-grid">
        <section class="bloc"><h4>⚠️ Dangers</h4>
          <ul class="hlist">${hs.map(c => `<li><b>${esc(c)}</b> ${esc(libH(p, c))}</li>`).join('') || '<li class="muted">Aucune mention H renseignée</li>'}</ul>
          ${vlep.length || p.pe != null ? `<p class="small">${vlep.map(esc).join('<br>')}${p.pe != null ? `<br>Point éclair : ${esc(p.pe)} °C` : ''}</p>` : ''}
          <p class="small muted">État : ${esc(p.etat)} · Classe de danger ${ev.cd}/5</p></section>
        <section class="bloc"><h4>🛡️ Protections collectives (EPC)</h4><ul>${f.epc.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="bloc"><h4>🧤 Équipements de protection individuelle (EPI)</h4><ul class="epi">${f.epi.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="bloc"><h4>📦 Stockage</h4><p>${esc(f.stockage)}</p>
          ${voisins.length ? `<p class="alerte">Ne pas stocker avec : ${voisins.map(esc).join(', ')}</p>` : ''}
          ${f.incompat ? `<p class="small"><b>Incompatibilités (FDS) :</b> ${esc(f.incompat)}</p>` : ''}</section>
      </div>
      <section class="urgence"><h4>🚑 En cas d'exposition accidentelle</h4>
        <div class="urg-grid">
          <div><b>👃 Inhalation</b><p>${esc(f.inhalation)}</p></div>
          <div><b>✋ Peau</b><p>${esc(f.peau)}</p></div>
          <div><b>👁️ Yeux</b><p>${esc(f.yeux)}</p></div>
          <div><b>👄 Ingestion</b><p>${esc(f.ingestion)}</p></div>
          <div><b>🔥 Incendie</b><p>${esc(f.incendie)}</p></div>
          <div><b>🧽 Déversement</b><p>${esc(f.deversement)}</p></div>
        </div>
        <div class="numeros"><span><b>15</b> SAMU</span><span><b>18</b> Pompiers</span><span><b>112</b> Urgences</span><span><b>Centre antipoison</b> Bordeaux 05 56 96 40 80</span></div>
        <p class="small">Après tout incident : prévenir l'encadrement, déclarer l'accident (registre ou AT) et informer le médecin du travail.</p>
      </section>
      ${p.p.length ? `<details class="bloc pdetails"><summary>Conseils de prudence (P) — ${p.p.length}</summary><ul>${p.p.map(k => `<li><b>${esc(C.pCode(k))}</b> ${esc(libP(p, k))}</li>`).join('')}</ul></details>` : ''}
      <footer class="fiche-f">
        <span>FDS ${p.fds_version ? 'v' + esc(p.fds_version) + ' ' : ''}${p.fds_date ? 'du ' + new Date(p.fds_date).toLocaleDateString('fr-FR') : 'non renseignée'}${p.ia ? ` · pré-remplie par IA (${esc(p.ia.confiance)}) le ${esc(p.ia.date)}` : ''}${f.sourceIA ? '' : ' · conduites à tenir générées par règles'}</span>
        <span>Document de travail — la FDS du fournisseur fait foi. À valider par le médecin du travail.</span>
      </footer>
      <div class="fiche-acts no-print"><button class="btn" data-act="editer" data-id="${p.id}" data-sec="fiche">✏️ Ajuster la fiche</button><button class="btn primary" data-act="imprimer-fiche" data-id="${p.id}">🖨 Imprimer / PDF</button></div>
    </article>`;
  }

  /* ═══ 7. ÉDITEUR DE PRODUIT ══════════════════════════════════════ */
  let brouillon = null;
  const opts = (obj, val) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === String(val) ? 'selected' : ''}>${esc(Array.isArray(v) ? v[0] : v)}</option>`).join('');

  function ouvrirEditeur(p, section, bannerIA) {
    brouillon = JSON.parse(JSON.stringify(normaliser(p || {})));
    const b = brouillon, u = b.usageCond, f = b.fiche, R = ficheRegles(b), E = C.EVAL;
    const lignes = v => Array.isArray(v) ? v.join('\n') : (v || '');
    $('#ed-titre').textContent = p && produits.find(x => x.id === p.id) ? 'Modifier le produit' : 'Nouveau produit';
    $('#ed-corps').innerHTML = `
      ${bannerIA ? `<div class="ia-banner ${esc(b.ia?.confiance)}">🤖 <div><b>Données pré-remplies par l'IA — fiabilité ${({ high: 'élevée', medium: 'moyenne', low: 'faible' })[b.ia?.confiance] || '?'}</b><br>Vérifiez chaque champ sur la FDS du fournisseur avant d'enregistrer.${b.ia?.remarques ? '<br><i>' + esc(b.ia.remarques) + '</i>' : ''}</div></div>` : ''}
      <nav class="ed-nav">${[['ident', 'Identification'], ['dangers', 'Dangers'], ['usage', 'Utilisation'], ['fiche', 'Fiche & urgence']].map(([k, l]) => `<a href="#ed-${k}" data-sec="${k}">${l}</a>`).join('')}</nav>

      <fieldset id="ed-ident"><legend>Identification</legend><div class="fgrid">
        <label class="span2">Nom commercial *<input data-k="nom" value="${esc(b.nom)}" required placeholder="ex. Dégraissant X-Clean"></label>
        <label>Fournisseur<input data-k="fournisseur" value="${esc(b.fournisseur)}"></label>
        <label>Substance / molécule principale<input data-k="molecule" value="${esc(b.molecule)}" placeholder="ex. Acétone"></label>
        <label>N° CAS<input data-k="cas" value="${esc(b.cas)}" placeholder="67-64-1"></label>
        <label>Usage / tâche<input data-k="usage" value="${esc(b.usage)}" placeholder="ex. Nettoyage des pièces"></label>
        <label>Lieu de stockage / unité de travail<input data-k="lieu" value="${esc(b.lieu)}" list="dl-lieux" placeholder="ex. Local produits"></label>
        <label>État physique<select data-k="etat">${opts({ liquide: 'Liquide', solide: 'Solide (bloc, granulés)', poudre: 'Poudre', gaz: 'Gaz', aerosol: 'Aérosol', pate: 'Pâte / gel' }, b.etat)}</select></label>
        <label>Conditionnement<input data-k="conditionnement" value="${esc(b.conditionnement)}" placeholder="Bidon 5 L"></label>
        <label>Quantité utilisée par an<span class="inline"><input data-k="quantite" type="number" min="0" step="any" value="${esc(b.quantite)}"><select data-k="unite">${opts({ L: 'L', kg: 'kg', mL: 'mL', g: 'g', 'unités': 'unités' }, b.unite)}</select></span></label>
        <label>Salariés exposés<input data-k="exposes" type="number" min="0" value="${esc(b.exposes)}"></label>
        ${b.substances?.length ? `<div class="span2 subst"><b>Composition (FDS rubrique 3)</b><ul>${b.substances.map(s => `<li>${esc(s.nom)} ${s.cas ? '· CAS ' + esc(s.cas) : ''} ${s.concentration ? '· ' + esc(s.concentration) : ''}</li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="fds-box"><div class="fgrid">
        <label>Date de la FDS<input data-k="fds_date" type="date" value="${esc(b.fds_date)}"></label>
        <label>Version<input data-k="fds_version" value="${esc(b.fds_version)}"></label>
        <label class="span2">Lien vers la FDS (intranet, site fournisseur)<input data-k="fds_lien" value="${esc(b.fds_lien)}" placeholder="https://…"></label>
      </div>
      <p class="small"><b>Pas de FDS sous la main ?</b> Le fournisseur est tenu de la fournir gratuitement (REACH art. 31). Pour la retrouver :</p>
      <div class="liens-fds">${C.SOURCES_FDS(b.nom || b.molecule).map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`).join('')}</div>
      <div class="row"><label class="btn sm">📄 Analyser une FDS (PDF)<input type="file" accept="application/pdf" data-ia="pdf-ed" hidden></label>
        <label class="btn sm">📷 Photo de l'étiquette<input type="file" accept="image/*" capture="environment" data-ia="photo-ed" hidden></label>
        <button class="btn sm" data-act="ia-nom-ed">🔎 Rechercher par nom (IA)</button><span id="ed-ia-statut" class="small"></span></div></div>
      </fieldset>

      <fieldset id="ed-dangers"><legend>Dangers (FDS rubriques 2, 3, 8, 9)</legend>
        <p class="small muted">Pictogrammes — cliquez pour sélectionner</p>
        <div class="picto-pick">${Object.keys(C.PICTOS).map(c => `<button type="button" class="pp ${b.pictos.includes(c) ? 'on' : ''}" data-picto="${c}" title="${esc(C.PICTOS[c].label)}">${pictoImg(c, 46)}<span>${esc(C.PICTOS[c].court)}</span></button>`).join('')}</div>
        <div class="fgrid">
          <label>Mention d'avertissement<select data-k="mention">${opts({ '': 'Automatique', Danger: 'Danger', Attention: 'Attention' }, b.mention)}</select></label>
          <label>Famille chimique (réactions)<select data-k="famille">${opts(C.FAMILLES, b.famille)}</select></label>
          <label>CMR (catégorie CLP)<select data-k="cmr">${opts({ '': 'Non / auto (mentions H)', '1A': '1A', '1B': '1B', '2': '2' }, b.cmr)}</select></label>
          <label>Température d'ébullition (°C)<input data-k="teb" type="number" step="any" value="${b.teb ?? ''}"></label>
          <label>Point éclair (°C)<input data-k="pe" type="number" step="any" value="${b.pe ?? ''}"></label>
          <label>pH<input data-k="ph" type="number" step="any" value="${b.ph ?? ''}"></label>
          <label>VLEP 8 h (mg/m³)<input data-k="vlep.vme_mg" type="number" step="any" value="${b.vlep.vme_mg ?? ''}"></label>
          <label>VLEP 8 h (ppm)<input data-k="vlep.vme_ppm" type="number" step="any" value="${b.vlep.vme_ppm ?? ''}"></label>
          <label>VLCT 15 min (mg/m³)<input data-k="vlep.vlct_mg" type="number" step="any" value="${b.vlep.vlct_mg ?? ''}"></label>
          <label>VLCT 15 min (ppm)<input data-k="vlep.vlct_ppm" type="number" step="any" value="${b.vlep.vlct_ppm ?? ''}"></label>
        </div>
        <div class="codes"><b>Mentions de danger H / EUH</b><div class="chips" id="chips-h"></div>
          <input id="add-h" list="dl-h" placeholder="Tapez un code ou un mot (ex. H225, inflammable) puis Entrée"></div>
        <div class="codes"><b>Conseils de prudence P</b><div class="chips" id="chips-p"></div>
          <input id="add-p" list="dl-p" placeholder="ex. P280 puis Entrée"></div>
      </fieldset>

      <fieldset id="ed-usage"><legend>Conditions d'utilisation (évaluation)</legend><div class="fgrid">
        <label class="span2">Fréquence d'utilisation<select data-k="usageCond.freq">${E.frequences.map(([k, l]) => `<option value="${k}" ${k === String(u.freq) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        <label>Volatilité / pulvérulence<select data-k="usageCond.vol"><option value="">Automatique (${E.volatilite[volatiliteAuto(b)][0].toLowerCase()})</option>${[1, 2, 3].map(k => `<option value="${k}" ${String(k) === String(u.vol) ? 'selected' : ''}>${E.volatilite[k][0]}</option>`).join('')}</select></label>
        <label>Procédé<select data-k="usageCond.procede">${opts(E.procedes, u.procede)}</select></label>
        <label>Protection collective<select data-k="usageCond.protection">${opts(E.protections, u.protection)}</select></label>
        <label>Surface de peau exposée<select data-k="usageCond.surface">${opts(E.surfaces, u.surface)}</select></label>
        <label>Fréquence du contact cutané<select data-k="usageCond.freqCut">${opts(E.freqCutanee, u.freqCut)}</select></label>
      </div></fieldset>

      <fieldset id="ed-fiche"><legend>Fiche synthétique — EPI, EPC et conduite à tenir</legend>
        <p class="small muted">Laissez vide pour utiliser la proposition automatique (affichée en grisé). Une ligne = un élément pour les listes.</p>
        <button type="button" class="btn sm" data-act="prefill">↧ Recopier les propositions pour les modifier</button>
        <div class="fgrid">
          <label class="span2">EPI<textarea data-k="fiche.epi" rows="3" placeholder="${esc(R.epi.join('\n'))}">${esc(lignes(f.epi))}</textarea></label>
          <label class="span2">EPC<textarea data-k="fiche.epc" rows="3" placeholder="${esc(R.epc.join('\n'))}">${esc(lignes(f.epc))}</textarea></label>
          ${[['inhalation', 'Inhalation'], ['peau', 'Contact cutané'], ['yeux', 'Projection oculaire'], ['ingestion', 'Ingestion'], ['incendie', 'Incendie'], ['deversement', 'Déversement accidentel'], ['stockage', 'Stockage']].map(([k, l]) =>
            `<label>${l}<textarea data-k="fiche.${k}" rows="3" placeholder="${esc(R[k])}">${esc(f[k] || '')}</textarea></label>`).join('')}
          <label>Incompatibilités (FDS rubrique 10)<textarea data-k="fiche.incompat" rows="3">${esc(f.incompat || '')}</textarea></label>
        </div>
      </fieldset>`;
    rendreChips();
    $('#editeur').showModal();
    if (section) setTimeout(() => $('#ed-' + section)?.scrollIntoView({ block: 'start' }), 60);
  }
  function rendreChips() {
    const b = brouillon;
    $('#chips-h').innerHTML = b.h.map(c => `<span class="chip ${C.H[c]?.t || ''}" title="${esc(libH(b, c))}"><b>${esc(c)}</b> ${esc(libH(b, c)).slice(0, 60)}<button type="button" data-rm-h="${esc(c)}" aria-label="Retirer">×</button></span>`).join('') || '<span class="muted small">Aucune</span>';
    $('#chips-p').innerHTML = b.p.map(k => `<span class="chip"><b>${esc(C.pCode(k))}</b> ${esc(libP(b, k)).slice(0, 50)}<button type="button" data-rm-p="${esc(k)}" aria-label="Retirer">×</button></span>`).join('') || '<span class="muted small">Aucun</span>';
  }
  /* Lit le formulaire → brouillon */
  function lireFormulaire() {
    $$('#ed-corps [data-k]').forEach(el => {
      const chemin = el.dataset.k.split('.');
      let v = el.value;
      if (el.type === 'number') v = el.value === '' ? (chemin[0] === 'quantite' || chemin[0] === 'exposes' ? '' : null) : +el.value;
      if (chemin[0] === 'fiche' && (chemin[1] === 'epi' || chemin[1] === 'epc')) v = el.value.split('\n').map(s => s.trim()).filter(Boolean);
      let o = brouillon; chemin.slice(0, -1).forEach(k => { o = (o[k] ||= {}); });
      o[chemin.at(-1)] = v;
    });
  }
  function enregistrer() {
    lireFormulaire();
    if (!brouillon.nom.trim()) { toast('Le nom du produit est obligatoire', 'bad'); $('[data-k="nom"]').focus(); return; }
    const i = produits.findIndex(p => p.id === brouillon.id);
    if (i >= 0) produits[i] = brouillon; else produits.push(brouillon);
    sauver(); $('#editeur').close(); ficheActive = brouillon.id; rendre();
    toast('Produit enregistré', 'ok');
  }
  function ajouterCode(type, saisie) {
    const s = String(saisie || '').trim(); if (!s) return;
    if (type === 'h') {
      let code = normCodeH(s);
      if (!code) { /* recherche par mot dans les libellés */
        const k = Object.keys(C.H).find(k => C.H[k].l.toLowerCase().includes(s.toLowerCase()));
        if (!k) return toast('Mention inconnue : tapez le code (ex. H315)', 'bad');
        code = k;
      }
      if (!brouillon.h.includes(code)) brouillon.h.push(code);
    } else {
      const k = C.pKey(s.split(/\s/)[0]);
      if (!/^P\d{3}/.test(k)) return toast('Code P invalide (ex. P280)', 'bad');
      if (!brouillon.p.includes(k)) brouillon.p.push(k);
    }
    rendreChips();
  }

  /* --- Ajout via IA (fenêtre « Ajouter ») et depuis l'éditeur --- */
  async function lancerIA(mode, fichier, statutEl, base) {
    const st = m => { if (statutEl) statutEl.innerHTML = m; };
    try {
      if (!IA_ON) throw new Error("Activez le mode IA (en haut de la page) pour utiliser l'analyse automatique.");
      let j;
      if (mode === 'nom') {
        const nom = (base?.nom || '').trim();
        if (!nom) throw new Error('Saisissez un nom de produit.');
        st(`<span class="spin"></span> Recherche des données de « ${esc(nom)} »…`);
        j = await iaParNom(nom);
      } else if (mode === 'pdf') {
        st('<span class="spin"></span> Lecture du PDF…');
        const r = await lirePDF(fichier);
        st(`<span class="spin"></span> Analyse de la FDS par l'IA${r.images ? ' (document scanné)' : ''}… 20 à 60 s`);
        j = r.texte ? await iaTexteFDS(r.texte) : await iaImages(r.images, 'Voici les premières pages de la FDS.');
      } else {
        st('<span class="spin"></span> Préparation de la photo…');
        const img = await compresserImage(fichier);
        st('<span class="spin"></span> Lecture de l\'étiquette par l\'IA…');
        j = await iaImages([img], "Voici la photo d'une étiquette ou d'une page de FDS.");
      }
      st('');
      const garder = base ? { id: base.id, nom: base.nom, lieu: base.lieu, usage: base.usage, quantite: base.quantite, unite: base.unite, exposes: base.exposes, conditionnement: base.conditionnement, usageCond: base.usageCond, fds_lien: base.fds_lien } : {};
      return depuisIA(j, garder);
    } catch (e) {
      st(`<span class="err">⚠ ${esc(e.message || e)}</span>`);
      return null;
    }
  }

  /* ═══ 8. EXPORTS, IMPRESSION, ÉVÉNEMENTS ═════════════════════════ */
  function exporterCSV() {
    const col = ['Produit', 'Fournisseur', 'Substance', 'CAS', 'Usage', 'Lieu', 'État', 'Conditionnement', 'Quantité/an', 'Unité', 'Salariés exposés', 'Date FDS', 'Version FDS',
      'Pictogrammes', 'Mention', 'Mentions H', 'Conseils P', 'Famille', 'CMR', 'VLEP 8h mg/m3', 'VLCT mg/m3', 'Classe danger', 'Priorité', 'Inhalation', 'Cutané', 'Groupe de stockage'];
    const cel = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lignes = produits.map(p => {
      const ev = evaluer(p);
      return [p.nom, p.fournisseur, p.molecule, p.cas, p.usage, p.lieu, p.etat, p.conditionnement, p.quantite, p.unite, p.exposes, p.fds_date, p.fds_version,
        p.pictos.join(' '), mention(p), p.h.join(' '), p.p.map(C.pCode).join(' '), C.FAMILLES[p.famille], cmrCat(p), p.vlep.vme_mg, p.vlep.vlct_mg,
        ev.cd, ev.prio.txt, ev.inh.txt, ev.cut.txt, C.GROUPES[groupe(p)].l].map(cel).join(';');
    });
    telecharger('﻿' + [col.map(cel).join(';'), ...lignes].join('\r\n'), `inventaire-chimique-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  }
  function telecharger(contenu, nom, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenu], { type }));
    a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function imprimer(html, titre) {
    $('#print-zone').innerHTML = html;
    document.body.classList.add('printing');
    const t = document.title; document.title = titre || t;
    setTimeout(() => { window.print(); document.title = t; document.body.classList.remove('printing'); }, 120);
  }

  function majIA() {
    $('#ia-toggle').checked = IA_ON;
    $('#ia-etat').textContent = IA_ON ? 'IA activée' : 'IA désactivée';
    $('#ia-bar').classList.toggle('on', IA_ON);
    $$('.need-ia').forEach(el => el.classList.toggle('off', !IA_ON));
  }

  function brancher() {
    $$('.tabs button').forEach(b => b.onclick = () => { ongletActif = b.dataset.tab; rendre(); history.replaceState(null, '', '#' + ongletActif); });
    ['#f-q', '#f-lieu', '#f-type'].forEach(s => $(s).addEventListener('input', rendreInventaire));
    $('#s-lieu').addEventListener('change', rendreStockage);
    $('#ia-toggle').onchange = e => { IA_ON = e.target.checked; try { localStorage.setItem('preventia_ai_mode', IA_ON); } catch (_) {} majIA(); };

    /* Délégation de clics */
    document.addEventListener('click', async e => {
      const el = e.target.closest('[data-act]'); if (!el) return;
      const id = el.dataset.id, p = produits.find(x => x.id === id), act = el.dataset.act;
      if (act === 'ajouter') { $('#ajout-statut').innerHTML = ''; $('#ajout').showModal(); }
      else if (act === 'manuel') { $('#ajout').close(); ouvrirEditeur({ nom: $('#ajout-nom').value.trim() }); }
      else if (act === 'ia-nom') {
        const r = await lancerIA('nom', null, $('#ajout-statut'), normaliser({ nom: $('#ajout-nom').value }));
        if (r) { $('#ajout').close(); ouvrirEditeur(r, null, true); }
      }
      else if (act === 'editer' && p) ouvrirEditeur(p, el.dataset.sec);
      else if (act === 'dupliquer' && p) { const c = normaliser(JSON.parse(JSON.stringify(p))); c.id = uid(); c.nom += ' (copie)'; produits.push(c); sauver(); rendre(); }
      else if (act === 'suppr' && p) { if (confirm(`Supprimer « ${p.nom} » de l'inventaire ?`)) { produits = produits.filter(x => x !== p); sauver(); rendre(); } }
      else if (act === 'fiche' && p) { ficheActive = id; ongletActif = 'fiches'; rendre(); window.scrollTo({ top: $('.toolbar').offsetTop - 8, behavior: 'smooth' }); }
      else if (act === 'imprimer-fiche' && p) imprimer(ficheHTML(p), 'Fiche ' + p.nom);
      else if (act === 'imprimer-fiches') { if (produits.length) imprimer(produits.map(ficheHTML).join(''), 'Fiches synthétiques produits chimiques'); }
      else if (act === 'imprimer-eval') { rendreEvaluation(); imprimer(`<h1 class="print-title">Évaluation du risque chimique — ${new Date().toLocaleDateString('fr-FR')}</h1>` + $('#eval-zone').innerHTML, 'Évaluation risque chimique'); }
      else if (act === 'imprimer-stock') { rendreStockage(); imprimer(`<h1 class="print-title">Stockage des produits chimiques — ${new Date().toLocaleDateString('fr-FR')}</h1>` + $('#stock-zone').innerHTML, 'Stockage produits chimiques'); }
      else if (act === 'demo') { C.DEMO.forEach(d => produits.push(normaliser(JSON.parse(JSON.stringify(d))))); sauver(); rendre(); toast('4 produits d\'exemple ajoutés', 'ok'); }
      else if (act === 'csv') exporterCSV();
      else if (act === 'json') telecharger(JSON.stringify({ version: 2, date: new Date().toISOString(), produits }, null, 1), `inventaire-chimique-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      else if (act === 'vider') { if (confirm('Effacer tout l\'inventaire de ce navigateur ? (pensez à exporter une sauvegarde JSON)')) { produits = []; sauver(); rendre(); } }
      else if (act === 'enregistrer') enregistrer();
      else if (act === 'fermer') e.target.closest('dialog').close();
      else if (act === 'prefill') {
        lireFormulaire(); const R = ficheRegles(brouillon);
        $$('#ed-fiche textarea').forEach(t => { const k = t.dataset.k.split('.')[1]; if (!t.value.trim() && R[k]) t.value = Array.isArray(R[k]) ? R[k].join('\n') : R[k]; });
      }
      else if (act === 'ia-nom-ed') {
        lireFormulaire();
        const r = await lancerIA('nom', null, $('#ed-ia-statut'), brouillon);
        if (r) ouvrirEditeur(r, 'ident', true);
      }
    });
    /* Éditeur : pictos, chips */
    $('#editeur').addEventListener('click', e => {
      const pp = e.target.closest('[data-picto]');
      if (pp) { const c = pp.dataset.picto; brouillon.pictos = brouillon.pictos.includes(c) ? brouillon.pictos.filter(x => x !== c) : [...brouillon.pictos, c]; pp.classList.toggle('on'); }
      const rh = e.target.closest('[data-rm-h]'); if (rh) { brouillon.h = brouillon.h.filter(x => x !== rh.dataset.rmH); rendreChips(); }
      const rp = e.target.closest('[data-rm-p]'); if (rp) { brouillon.p = brouillon.p.filter(x => x !== rp.dataset.rmP); rendreChips(); }
      const nav = e.target.closest('.ed-nav a'); if (nav) { e.preventDefault(); $('#ed-' + nav.dataset.sec).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    $('#editeur').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.target.id === 'add-h' || e.target.id === 'add-p')) { e.preventDefault(); ajouterCode(e.target.id === 'add-h' ? 'h' : 'p', e.target.value); e.target.value = ''; }
    });
    $('#editeur').addEventListener('change', async e => {
      if (e.target.id === 'add-h' || e.target.id === 'add-p') { if (e.target.value.match(/^(EUH|H|P)\d/i)) { ajouterCode(e.target.id === 'add-h' ? 'h' : 'p', e.target.value); e.target.value = ''; } }
      const ia = e.target.dataset?.ia;
      if (ia && e.target.files[0]) {
        lireFormulaire();
        const r = await lancerIA(ia.startsWith('pdf') ? 'pdf' : 'photo', e.target.files[0], $('#ed-ia-statut'), brouillon);
        if (r) ouvrirEditeur(r, 'ident', true);
      }
    });
    /* Fenêtre « Ajouter » : fichiers */
    $('#ajout').addEventListener('change', async e => {
      const ia = e.target.dataset?.ia; if (!ia || !e.target.files[0]) return;
      const r = await lancerIA(ia, e.target.files[0], $('#ajout-statut'), normaliser({ nom: $('#ajout-nom').value.trim() }));
      e.target.value = '';
      if (r) { $('#ajout').close(); ouvrirEditeur(r, null, true); }
    });
    /* Glisser-déposer d'une FDS dans la fenêtre d'ajout */
    const dz = $('#dropzone');
    ['dragover', 'dragenter'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.remove('over'); }));
    dz.addEventListener('drop', async e => {
      const f = e.dataTransfer.files[0]; if (!f) return;
      const r = await lancerIA(f.type === 'application/pdf' ? 'pdf' : 'photo', f, $('#ajout-statut'), normaliser({ nom: $('#ajout-nom').value.trim() }));
      if (r) { $('#ajout').close(); ouvrirEditeur(r, null, true); }
    });
    /* Import d'une sauvegarde JSON */
    $('#import-json').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text()); const liste = Array.isArray(j) ? j : j.produits;
        if (!Array.isArray(liste)) throw 0;
        const remplacer = produits.length && confirm('Remplacer l\'inventaire actuel ? (Annuler = ajouter à la suite)');
        const neufs = liste.map(x => normaliser(Object.assign({}, x, { id: remplacer ? x.id || uid() : uid() })));
        produits = remplacer ? neufs : produits.concat(neufs);
        sauver(); rendre(); toast(`${neufs.length} produit(s) importé(s)`, 'ok');
      } catch (_) { toast('Fichier de sauvegarde illisible', 'bad'); }
      e.target.value = '';
    });

    /* Listes de suggestions H / P */
    $('#dl-h').innerHTML = Object.entries(C.H).map(([k, v]) => `<option value="${k} — ${esc(v.l)}">`).join('');
    $('#dl-p').innerHTML = Object.entries(C.P).map(([k, v]) => `<option value="${C.pCode(k)} — ${esc(v)}">`).join('');
  }

  /* Démarrage */
  charger();
  const h = location.hash.slice(1);
  if (['inventaire', 'evaluation', 'stockage', 'fiches'].includes(h)) ongletActif = h;
  brancher();
  rendre();

  /* Pour déboguer dans la console : PCHIM.produits, PCHIM.evaluer(p)… */
  window.PCHIM = { get produits() { return produits; }, evaluer, fiche, groupe, compat, classeDanger };
})();
