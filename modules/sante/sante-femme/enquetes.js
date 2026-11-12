/* ════════════════════════════════════════════════════════════════
   PréventIA Protect · Santé de la femme — ENQUÊTES COLLECTIVES ANONYMES
   Partagé par EndoPrév (et, plus tard, MénoPrév / SeinPrév).

   Deux circuits, un même tableau de bord :
     ⓐ Supabase (UE) : lien + QR code → les salariées répondent sur leur téléphone
        → l'infirmier·e lit les résultats avec un code secret, à partir de 5 réponses.
     ⓑ Microsoft Forms / Google Forms : export CSV ou Excel → import ici.

   Schéma SQL : docs/supabase-enquetes.sql
   La clé ci-dessous est la clé PUBLIQUE de Supabase (faite pour être dans une page web) :
   elle ne permet QUE d'appeler les 5 fonctions enq_*, jamais de lire les tables.
   ════════════════════════════════════════════════════════════════ */
window.ENQ = (function () {
  const CONFIG = {
    url: 'https://vjiryvqyijfljzsaekee.supabase.co',
    cle: 'sb_publishable_I7Ao0-YCve34t6qTrhGc7A_M5Fduxg1',
    seuil: 5
  };

  /* Appel d'une fonction Supabase (RPC) sans bibliothèque : un simple fetch */
  async function rpc(nom, args) {
    let r;
    try {
      r = await fetch(`${CONFIG.url}/rest/v1/rpc/${nom}`, {
        method: 'POST',
        headers: { apikey: CONFIG.cle, 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {})
      });
    } catch (_) { throw new Error('Connexion impossible : vérifiez le réseau.'); }
    const t = await r.text();
    let j = null; try { j = t ? JSON.parse(t) : null; } catch (_) {}
    if (!r.ok) throw new Error(j?.message || `Erreur ${r.status}`);
    return j;
  }

  const creer = async (outil, entreprise, fin) => (await rpc('enq_creer', { p_outil: outil, p_entreprise: entreprise || null, p_fin: fin || null }))[0];
  const info = async code => (await rpc('enq_info', { p_code: code }))[0] || null;
  const repondre = (code, reponses) => rpc('enq_repondre', { p_code: code, p_reponses: reponses });
  const resultats = codeLecture => rpc('enq_resultats', { p_code_lecture: codeLecture });
  const ouvrir = (codeLecture, ouverte) => rpc('enq_ouvrir', { p_code_lecture: codeLecture, p_ouverte: ouverte });

  /* Lien à envoyer aux salariées (même dossier que la page appelante) */
  const lienReponse = code => new URL(`enquete.html?c=${encodeURIComponent(code)}`, location.href).href;

  /* QR code (bibliothèque chargée à la demande) */
  let qrLib = null;
  function chargerScript(src) {
    return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('Bibliothèque indisponible (connexion ?)')); document.head.appendChild(s); });
  }
  async function qr(el, texte, taille = 180) {
    qrLib ||= chargerScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    await qrLib;
    el.innerHTML = '';
    new QRCode(el, { text: texte, width: taille, height: taille, correctLevel: QRCode.CorrectLevel.M });
  }

  /* Lecture d'un export Forms : CSV (Google) ou Excel (Microsoft) → tableau d'objets {entête: valeur} */
  let xlsxLib = null;
  async function lireFichier(file) {
    if (/\.xlsx?$/i.test(file.name)) {
      xlsxLib ||= chargerScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      await xlsxLib;
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    }
    return lireCSV(await file.text());
  }
  function lireCSV(txt) {
    txt = txt.replace(/^﻿/, '');
    const sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const lignes = []; let ligne = [], champ = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { champ += '"'; i++; } else q = false; } else champ += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { ligne.push(champ); champ = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; ligne.push(champ); lignes.push(ligne); ligne = []; champ = ''; }
      else champ += ch;
    }
    if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
    const [ent, ...rows] = lignes.filter(l => l.some(c => c.trim()));
    return rows.map(r => Object.fromEntries(ent.map((h, i) => [h.trim(), (r[i] || '').trim()])));
  }
  /* Comparaison souple d'intitulés (accents, casse, ponctuation) */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  /* Questionnaires déclarés par chaque outil (voir endo-data.js) */
  const QUESTIONNAIRES = {};

  return { CONFIG, rpc, creer, info, repondre, resultats, ouvrir, lienReponse, qr, lireFichier, norm, QUESTIONNAIRES };
})();
