/* =====================================================================
   PréventIA — Passerelle IA commune (Make.com → API Claude)
   ---------------------------------------------------------------------
   UN SEUL fichier à modifier pour tous les modules qui utilisent l'IA.

   Chemin d'un appel :
     Module → PIA.fetch(body)
        1. FILTRE  : masque les données personnelles dans le texte envoyé
        2. ROUTAGE : webhook "texte" ou "vision" (détecté automatiquement)
        3. EMBALLAGE "Solution C" : { token, payload: JSON.stringify(body) }
     → Make.com (vérifie le token, ajoute la clé API cachée)
     → API Claude → réponse renvoyée au module, inchangée

   La clé API Anthropic n'est JAMAIS ici : elle reste dans Make.com.
   ===================================================================== */
(function () {
  /* ------------------ RÉGLAGES (modifiez ici seulement) ------------------ */
  const CONFIG = {
    webhookTexte:  'https://hook.eu1.make.com/qhvt4lylqgbykqljwd1sdybpdaoapedu',
    webhookVision: 'https://hook.eu1.make.com/y91ilwbt4jpfgt4m42gzurbbmolkxj2x',
    tokenTexte:    'previa_text_2026_xxx',    // = valeur du filtre « Verif token » du scénario texte
    tokenVision:   'previa_vision_2026_xxx',  // = valeur du filtre du scénario vision
    modele:        'claude-sonnet-4-5',       // imposé à tous les modules
    maxTokensMax:  4000,                      // plafond de longueur de réponse (coût)
    delaiMs:       90000,                     // abandon après 90 s
    filtrer:       true                       // false = désactiver le masquage
  };

  /* ------------------ FILTRE : données personnelles ---------------------- */
  /* Chaque règle : [nom affiché, motif, remplacement]. Ajoutez-en au besoin. */
  const REGLES = [
    ['e-mail',      /[\w.+-]+@[\w-]+\.[\w.-]+/g,                                                     '[e-mail]'],
    ['n° sécu',     /\b[12][\s.]?\d{2}[\s.]?(0[1-9]|1[0-2]|[2-9]\d)[\s.]?(\d{2}|2[AB])[\s.]?\d{3}[\s.]?\d{3}(?:[\s.]?\d{2})?\b/gi, '[n° sécu]'],
    ['IBAN',        /\bFR\d{2}(?:\s?[0-9A-Z]{4}){5}\s?[0-9A-Z]{3}\b/gi,                                '[IBAN]'],
    ['téléphone',   /(?:(?:\+|00)33[\s.-]?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g,                            '[téléphone]'],
    ['date de naissance', /\b(n[ée]e?\s+le|date de naissance\s*:?)\s*\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/gi, '$1 [date]']
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

  /* ------------------ Appel principal ------------------------------------ */
  async function piaFetch(body, options = {}) {
    const bilan = {};
    const corps = filtrerCorps(body, bilan);
    corps.model = CONFIG.modele;
    corps.max_tokens = Math.min(corps.max_tokens || 1500, CONFIG.maxTokensMax);

    const vision = options.vision ?? aUneImage(corps);
    const url   = vision ? CONFIG.webhookVision : CONFIG.webhookTexte;
    const token = vision ? CONFIG.tokenVision   : CONFIG.tokenTexte;

    const masques = Object.entries(bilan).map(([k, n]) => `${n} ${k}`).join(', ');
    if (masques) toast(`🔒 Masqué avant envoi à l'IA : ${masques}`, '#0f766e');

    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), CONFIG.delaiMs);
    let r;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },   // évite le pré-contrôle CORS
        body: JSON.stringify({ token, payload: JSON.stringify(corps) }),
        signal: ctrl.signal
      });
    } catch (e) {
      const msg = e.name === 'AbortError' ? "L'IA met trop de temps à répondre. Réessayez." : 'IA injoignable : vérifiez la connexion internet.';
      toast('⚠️ ' + msg, '#b91c1c'); throw new Error(msg);
    } finally { clearTimeout(minuteur); }

    if (!r.ok) {
      const msg = r.status === 429 ? "Trop de demandes à l'IA, patientez une minute."
                : r.status >= 500 ? "Le service IA (Make) est indisponible pour l'instant."
                : `Requête IA refusée (code ${r.status}).`;
      toast('⚠️ ' + msg, '#b91c1c'); throw new Error(msg);
    }
    return r;   /* même objet qu'un fetch classique : r.text(), r.json() */
  }

  /* Raccourci : renvoie directement le texte de Claude */
  async function piaTexte(body, options) {
    const t = await (await piaFetch(body, options)).text();
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j?.content)) return j.content.map(b => b.text || '').join('\n').trim();
      return j?.text || j?.response || j?.output || t;
    } catch { return t; }
  }

  window.PIA = { fetch: piaFetch, texte: piaTexte, filtrerTexte: t => filtrerTexte(t, {}), config: CONFIG };
})();
