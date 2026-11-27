/* =====================================================================
   PréventIA — Passerelle IA commune (fonction serveur sécurisée)
   ---------------------------------------------------------------------
   UN SEUL fichier à modifier pour tous les modules qui utilisent l'IA.

   Chemin d'un appel :
     Module → PIA.fetch(body)
        1. FILTRE   : masque les données personnelles dans le texte envoyé
        2. IDENTITÉ : session PréventIA (compte commun avec PréventIA Réseau)
     → fonction serveur Supabase « ia » (UE) : vérifie l'origine, le compte,
       les quotas, masque à nouveau, journalise SANS le contenu
        → modules santé (salariés)  : Mistral, traitement dans l'UE
        → modules professionnels    : Claude (Anthropic)
     → réponse renvoyée au module, au format habituel

   Aucune clé ni aucun jeton ici : les clés des IA restent sur le serveur.
   Modules professionnels : connexion obligatoire (👤 Se connecter).
   Modules santé (modules/sante/…) : utilisables sans compte, limites strictes.
   ===================================================================== */
(function () {
  const ICI = document.currentScript ? document.currentScript.src : '';
  /* ------------------ RÉGLAGES (modifiez ici seulement) ------------------ */
  const CONFIG = {
    fonction:     'https://vjiryvqyijfljzsaekee.supabase.co/functions/v1/ia',
    cle:          'sb_publishable_I7Ao0-YCve34t6qTrhGc7A_M5Fduxg1',   // clé publique Supabase (pas une clé d'IA)
    maxTokensMax: 4000,                      // plafond de longueur de réponse (le serveur plafonne aussi)
    delaiMs:      90000,                     // abandon après 90 s
    filtrer:      true                       // false = désactiver le masquage côté navigateur
  };

  /* Module appelant, déduit de l'adresse : « sante/sante-mentale/reprendre-pied », « risques/chimique/index »… */
  const usage = () => {
    const m = location.pathname.match(/\/modules\/(.+?)(?:\.html?)?$/);
    return m ? m[1].replace(/\/$/, '/index') : 'accueil';
  };
  const estSante = () => usage().startsWith('sante/');

  /* Session PréventIA : charge pp-auth.js si besoin (pas sur les pages santé utilisées par les salariés) */
  let chargement = null;
  function auth() {
    if (window.PPAuth) return Promise.resolve(window.PPAuth);
    if (estSante() || !ICI) return Promise.resolve(null);
    if (!chargement) chargement = new Promise(ok => {
      const s = document.createElement('script');
      s.src = new URL('../assets/js/pp-auth.js', ICI).href; s.dataset.ppAuth = '1';
      s.onload = () => ok(window.PPAuth || null); s.onerror = () => ok(null);
      document.head.appendChild(s);
    });
    return chargement;
  }
  async function jeton() {
    const A = await auth(); if (!A) return '';
    try { await A.pret; const c = A.client(); if (!c) return ''; const { data } = await c.auth.getSession(); return data.session?.access_token || ''; }
    catch (e) { return ''; }
  }

  /* ------------------ FILTRE : données personnelles ---------------------- */
  /* Prénoms courants repérés par le filtre « prénom » (à compléter au besoin) */
  const PRENOMS = ('Adrien Agathe Agnès Alain Alexandra Alexandre Alexis Alice Aline Amandine Amélie Anaïs André Andrée Angélique Anne Annie Antoine Arnaud Arthur Audrey Aurélie Aurélien Axel Baptiste Benjamin Benoît Bernadette Bernard Brigitte Bruno Camille Carole Caroline Catherine Cécile Céline Chantal Charles Charlotte Christelle Christian Christiane Christine Christophe Claire Claude Claudine Clément Clémence Colette Corinne Cyril Damien Daniel Danielle David Delphine Denis Denise Didier Dominique Dylan Éléonore Élise Élodie Émilie Emma Enzo Éric Estelle Étienne Eva Fabien Fabienne Fabrice Fanny Fatima Florence Florian Francis Franck François Françoise Frédéric Gabriel Gaëlle Geneviève Georges Gérard Ghislaine Gilles Grégory Guillaume Guy Hélène Henri Hervé Hugo Inès Isabelle Jacqueline Jacques Jean Jeanne Jérémy Jérôme Jessica Joël Johanna Jonathan Jordan Joseph Josiane Julie Julien Juliette Justine Karim Karine Kevin Laëtitia Laura Laure Laurence Laurent Léa Léo Lionel Louis Louise Luc Lucas Lucie Ludovic Lydie Madeleine Magali Manon Marc Marcel Margaux Marie Marine Marion Marthe Martin Martine Mathieu Mathilde Maxime Mélanie Michel Michèle Mickaël Mohamed Monique Muriel Mylène Nadia Nadine Nathalie Nicolas Nicole Noémie Océane Odile Olivier Pascal Pascale Patrice Patricia Patrick Paul Pauline Philippe Pierre Quentin Rachel Raphaël Raymond Régine Rémi Renée René Richard Robert Romain Sabine Samir Sandra Sandrine Sarah Sébastien Serge Simone Sophie Stéphane Stéphanie Suzanne Sylvain Sylvie Thierry Thomas Tony Valérie Vanessa Véronique Victor Vincent Virginie Xavier Yannick Yasmine Yves Yvette Yvonne Zoé').split(' ').join('|');
  /* Chaque règle : [nom affiché, motif, remplacement]. Ajoutez-en au besoin. */
  const REGLES = [
    ['e-mail',      /[\w.+-]+@[\w-]+\.[\w.-]+/g,                                                     '[e-mail]'],
    ['n° sécu',     /\b[12][\s.]?\d{2}[\s.]?(0[1-9]|1[0-2]|[2-9]\d)[\s.]?(\d{2}|2[AB])[\s.]?\d{3}[\s.]?\d{3}(?:[\s.]?\d{2})?\b/gi, '[n° sécu]'],
    ['IBAN',        /\bFR\d{2}(?:\s?[0-9A-Z]{4}){5}\s?[0-9A-Z]{3}\b/gi,                                '[IBAN]'],
    ['téléphone',   /(?:(?:\+|00)33[\s.-]?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g,                            '[téléphone]'],
    ['date de naissance', /\b(n[ée]e?\s+le|date de naissance\s*:?)\s*\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/gi, '$1 [date]'],
    /* Noms de personnes : civilité ou titre suivi d'un nom (« Mme Durand », « M. D. », « Dr Martin ») */
    ['nom',         /\b(?:M\.|Mme|Mlle|Mr|Monsieur|Madame|Mademoiselle|Dr|Docteur|Pr|Professeur|Me|Maître)\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]*\.?(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]*\.?)?/g, '[personne]'],
    /* Prénoms courants (avec majuscule), suivis ou non d'un nom ou d'une initiale (« Julie », « Karim B. », « Sophie Martin ») */
    ['prénom',      new RegExp('\\b(?:' + PRENOMS + ')\\b(?:\\s+[A-ZÀ-Ý](?:[A-Za-zÀ-ÿ\'’-]+|\\.))?', 'g'),          '[personne]']
  ];

  function filtrerTexte(txt, bilan) {
    if (typeof txt !== 'string' || !CONFIG.filtrer) return txt;
    return REGLES.reduce((t, [nom, re, rep]) => t.replace(re, (...m) => {
      bilan[nom] = (bilan[nom] || 0) + 1;
      return rep.replace('$1', m[1] || '');
    }), txt);
  }

  /* Parcourt system + messages ; ne touche jamais aux images */
  function filtrerCorps(body, bilan) {
    const b = JSON.parse(JSON.stringify(body));
    if (typeof b.system === 'string') b.system = filtrerTexte(b.system, bilan);
    (b.messages || []).forEach(m => {
      if (typeof m.content === 'string') m.content = filtrerTexte(m.content, bilan);
      else if (Array.isArray(m.content)) m.content.forEach(c => { if (c.type === 'text') c.text = filtrerTexte(c.text, bilan); });
    });
    return b;
  }

  const aUneImage = body => (body.messages || []).some(m =>
    Array.isArray(m.content) && m.content.some(c => c.type === 'image' || c.type === 'document'));

  /* ------------------ Petite notification à l'écran ---------------------- */
  function toast(msg, couleur) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;
      background:${couleur};color:#fff;padding:10px 16px;border-radius:12px;font:600 13px 'DM Sans',system-ui,sans-serif;
      box-shadow:0 10px 30px -10px rgb(0 0 0/.4);max-width:92vw;text-align:center`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  /* ------------------ Appel principal ------------------------------------
     options.sensibilite : 'sensible' → Mistral (UE) même hors modules santé
     (parole de salariés, situation d'entreprise). Par défaut : modules santé
     → Mistral, autres modules → Claude. Exemple :
       PIA.texte({ messages:[…] }, { sensibilite: 'sensible' })
     ----------------------------------------------------------------------- */
  async function piaFetch(body, options = {}) {
    const bilan = {};
    const corps = filtrerCorps(body, bilan);
    corps.max_tokens = Math.min(corps.max_tokens || 1500, CONFIG.maxTokensMax);

    const masques = Object.entries(bilan).map(([k, n]) => `${n} ${k}`).join(', ');
    if (masques) toast(`🔒 Masqué avant envoi à l'IA : ${masques}`, '#0f766e');

    const tok = await jeton();
    if (!tok && !estSante()) {
      const msg = "Connectez-vous avec votre compte PréventIA (👤 Se connecter) pour utiliser l'IA.";
      toast('🔒 ' + msg, '#b45309'); if (window.PPAuth) PPAuth.ouvrir(); throw new Error(msg);
    }

    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), CONFIG.delaiMs);
    let r;
    try {
      r = await fetch(CONFIG.fonction, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.cle, ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
        body: JSON.stringify({ usage: usage(), body: corps, ...(options.sensibilite === 'sensible' ? { sensibilite: 'sensible' } : {}) }),
        signal: ctrl.signal
      });
    } catch (e) {
      const msg = e.name === 'AbortError' ? "L'IA met trop de temps à répondre. Réessayez." : 'IA injoignable : vérifiez la connexion internet.';
      toast('⚠️ ' + msg, '#b91c1c'); throw new Error(msg);
    } finally { clearTimeout(minuteur); }

    if (!r.ok) {
      let msg = '';
      try { msg = (await r.clone().json())?.error?.message || ''; } catch (e) {}
      msg = msg || (r.status === 429 ? "Trop de demandes à l'IA, patientez." : r.status >= 500 ? "Le service IA est indisponible pour l'instant." : `Requête IA refusée (code ${r.status}).`);
      if (r.status === 401 && window.PPAuth) PPAuth.ouvrir();
      toast('⚠️ ' + msg, '#b91c1c'); throw new Error(msg);
    }
    return r;   /* même objet qu'un fetch classique : r.text(), r.json() */
  }

  /* Raccourci : renvoie directement le texte de la réponse */
  async function piaTexte(body, options) {
    const t = await (await piaFetch(body, options)).text();
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j?.content)) return j.content.map(b => b.text || '').join('\n').trim();
      return j?.text || j?.response || j?.output || t;
    } catch { return t; }
  }

  window.PIA = { fetch: piaFetch, texte: piaTexte, filtrerTexte: (t, bilan) => filtrerTexte(t, bilan || {}), config: CONFIG };
})();
