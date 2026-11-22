/* =========================================================
   PréventIA Protect — dossiers entreprise (sélecteur commun)
   ---------------------------------------------------------
   Une IDEST / un préventeur suit plusieurs adhérents. Chaque
   module garde ses données sous sa clé habituelle (DUERP,
   cartographie, chimique, RPS, registres…) : ce script range
   ces clés dans un DOSSIER par entreprise et les échange quand
   on change d'entreprise. Aucun module n'a besoin d'être modifié.

     pp_entreprises        { actif:id, liste:[{id, nom, cree}] }
     pp_dossier_<id>       copie des clés du dossier (hors entreprise active)

   Données de santé individuelles (suivi infirmier, soins,
   dépistages) : rangées par entreprise comme le reste, mais
   JAMAIS incluses dans le fichier d'export.
   Outils personnels du salarié (100 jours, reprise, auto-suivis…)
   et préférences : jamais concernés.
   ========================================================= */
(function () {
  const REG = 'pp_entreprises', DOS = 'pp_dossier_';
  const EXACT = ['preventia-duerp', 'preventia-carto', 'preventia_chimique_v2', 'preventia_chimique_products', 'preventia-inventaire',
    'pp_rps_v1', 'pp_atmp', 'pp_atmp_rh', 'pp_atmp_param', 'pp_suivi_global', 'pp_duerp_inbox', 'pp_sm_contacts',
    'pp_endo_campagnes', 'pp_meno_campagnes', 'pp_meno_reference', 'pp_sein_v1'];
  const PREFIXES = ['pp_inf_', 'pp_env_', 'pp_coact_', 'pp_reg_v2_', 'pp_rps_ind_'];
  const SANTE = ['pp_sein_v1', 'pp_inf_soins', 'pp_inf_depistages'];   // jamais exportées
  const estDossier = k => EXACT.includes(k) || PREFIXES.some(p => k.startsWith(p));
  const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const ls = window.localStorage;
  const lire = k => { try { return JSON.parse(ls.getItem(k)); } catch (e) { return null; } };
  const ecrire = (k, v) => { try { ls.setItem(k, JSON.stringify(v)); return true; } catch (e) { alert("Stockage du navigateur plein : exportez puis supprimez un dossier."); return false; } };
  const clesActives = () => { const r = []; for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (estDossier(k)) r.push(k); } return r; };

  /* Nom probable de l'entreprise déjà saisie dans les modules (première utilisation) */
  function nomDetecte() {
    const d = lire('preventia-duerp'), c = lire('preventia-carto'), r = lire('pp_rps_v1');
    return (d && d.entreprise && d.entreprise.nom) || (c && c.entreprise) || (r && !r.demo && r.ctx && r.ctx.entreprise) || 'Mon entreprise';
  }
  function registre() {
    let R = lire(REG);
    if (!R || !Array.isArray(R.liste) || !R.liste.length) {   // migration : les données actuelles deviennent le 1er dossier
      const id = uid(); R = { actif: id, liste: [{ id, nom: nomDetecte(), cree: new Date().toISOString() }] }; ecrire(REG, R);
    }
    if (!R.liste.some(e => e.id === R.actif)) { R.actif = R.liste[0].id; ecrire(REG, R); }
    return R;
  }
  /* Copie les clés de l'entreprise active dans son dossier */
  function ranger(id) {
    const b = {}; clesActives().forEach(k => { b[k] = ls.getItem(k); });
    try { ls.setItem(DOS + id, JSON.stringify(b)); return b; } catch (e) { alert("Stockage du navigateur plein : exportez puis supprimez un dossier."); return null; }
  }
  /* Remplace les clés actives par celles du dossier demandé */
  function sortir(id) {
    clesActives().forEach(k => ls.removeItem(k));
    const b = lire(DOS + id) || {};
    Object.entries(b).forEach(([k, v]) => { if (estDossier(k) && v != null) ls.setItem(k, v); });
    ls.removeItem(DOS + id);   // le dossier actif vit dans les clés elles-mêmes
  }
  function basculer(id) {
    const R = registre(); if (id === R.actif) return;
    if (!ranger(R.actif)) return;
    sortir(id); R.actif = id; ecrire(REG, R); location.reload();
  }
  function creer(nom, donnees) {
    const R = registre(), id = uid(), d = new Date().toISOString();
    R.liste.push({ id, nom, cree: d }); ecrire(REG, R);
    const b = donnees || {
      'preventia-duerp': JSON.stringify({ uts: [], risques: [], entreprise: { nom, siret: '', effectif: '', secteur: '', redacteur: '', date: d.slice(0, 10) } }),
      'preventia-carto': JSON.stringify({ entreprise: nom, unites: [] })
    };
    try { ls.setItem(DOS + id, JSON.stringify(b)); } catch (e) { alert("Stockage du navigateur plein."); return; }
    basculer(id);
  }
  function exporter() {
    const R = registre(), e = R.liste.find(x => x.id === R.actif), b = ranger(R.actif) || {};
    ls.removeItem(DOS + R.actif);
    const data = {}; Object.keys(b).filter(k => !SANTE.includes(k)).forEach(k => data[k] = b[k]);
    const exclues = Object.keys(b).filter(k => SANTE.includes(k));
    const fichier = { app: 'PréventIA Protect', type: 'dossier-entreprise', version: 1, exporte_le: new Date().toISOString(), entreprise: { nom: e.nom }, data,
      note: exclues.length ? 'Données de santé individuelles non exportées : ' + exclues.join(', ') : '' };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(fichier, null, 1)], { type: 'application/json' }));
    a.download = `Dossier_${e.nom.replace(/[^\wÀ-ÿ-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    if (exclues.length) setTimeout(() => alert("Export réalisé. Les données de santé individuelles (suivi infirmier, soins, dépistages) ne sont jamais incluses dans le fichier."), 300);
  }
  function importer(file) {
    file.text().then(t => {
      let j; try { j = JSON.parse(t); } catch (e) { j = null; }
      if (!j || j.type !== 'dossier-entreprise' || !j.data) { alert("Ce fichier n'est pas un dossier entreprise PréventIA Protect."); return; }
      const data = {}; Object.entries(j.data).forEach(([k, v]) => { if (estDossier(k) && !SANTE.includes(k) && typeof v === 'string') data[k] = v; });
      let nom = (j.entreprise && j.entreprise.nom) || 'Entreprise importée';
      if (registre().liste.some(e => e.nom.toLowerCase() === nom.toLowerCase())) nom += ' (import ' + new Date().toLocaleDateString('fr-FR') + ')';
      creer(nom, data);
    });
  }
  function renommer() {
    const R = registre(), e = R.liste.find(x => x.id === R.actif);
    const n = prompt("Nouveau nom du dossier :", e.nom); if (!n || !n.trim()) return;
    e.nom = n.trim(); ecrire(REG, R); location.reload();
  }
  function supprimer() {
    const R = registre();
    if (R.liste.length < 2) { alert("C'est le seul dossier : créez-en un autre avant de supprimer celui-ci."); return; }
    const e = R.liste.find(x => x.id === R.actif);
    if (!confirm(`Supprimer définitivement le dossier « ${e.nom} » et toutes ses données sur ce navigateur ?\nPensez à l'exporter avant.`)) return;
    clesActives().forEach(k => ls.removeItem(k));
    R.liste = R.liste.filter(x => x.id !== e.id); R.actif = R.liste[0].id;
    sortir(R.actif); ecrire(REG, R); location.reload();
  }

  window.PPEntreprise = { actif: () => { const R = registre(); return R.liste.find(e => e.id === R.actif); }, liste: () => registre().liste, basculer, creer, exporter };

  /* ---------- Barre « Dossier entreprise » ---------- */
  function barre() {
    if (document.getElementById('pp-ent-bar')) return;
    const R = registre();
    const css = document.createElement('style');
    css.textContent = `#pp-ent-bar{background:#081428;color:#fff;font:500 12px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;padding:5px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;position:relative;z-index:70}
#pp-ent-bar select{font:600 12px system-ui,sans-serif;background:#13284a;color:#fff;border:1px solid #2c4a7a;border-radius:6px;padding:3px 6px;max-width:240px}
#pp-ent-bar button{font:500 11.5px system-ui,sans-serif;background:transparent;color:#cfe0ff;border:1px solid #2c4a7a;border-radius:6px;padding:3px 8px;cursor:pointer}
#pp-ent-bar button:hover{background:#13284a;color:#fff}#pp-ent-bar .sp{flex:1}#pp-ent-bar small{opacity:.6}
@media print{#pp-ent-bar{display:none}}`;
    document.head.appendChild(css);
    const b = document.createElement('div'); b.id = 'pp-ent-bar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Dossier entreprise');
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    b.innerHTML = `<span aria-hidden="true">🏢</span><label for="pp-ent-sel">Dossier entreprise</label>
      <select id="pp-ent-sel">${R.liste.map(e => `<option value="${e.id}" ${e.id === R.actif ? 'selected' : ''}>${esc(e.nom)}</option>`).join('')}</select>
      <button type="button" data-a="new">+ Nouvelle</button><button type="button" data-a="ren">Renommer</button>
      <span class="sp"></span><small>Données gardées sur ce navigateur</small>
      <button type="button" data-a="exp">Exporter</button><button type="button" data-a="imp">Importer</button><button type="button" data-a="del" title="Supprimer ce dossier">Supprimer</button>
      <input type="file" accept=".json,application/json" hidden id="pp-ent-file">`;
    document.body.insertBefore(b, document.body.firstChild);
    b.querySelector('#pp-ent-sel').onchange = e => basculer(e.target.value);
    b.querySelector('#pp-ent-file').onchange = e => { if (e.target.files[0]) importer(e.target.files[0]); };
    b.onclick = e => {
      const a = e.target.closest('button') && e.target.closest('button').dataset.a; if (!a) return;
      if (a === 'new') { const n = prompt("Nom de l'entreprise ou de l'établissement :"); if (n && n.trim()) creer(n.trim()); }
      else if (a === 'ren') renommer();
      else if (a === 'exp') exporter();
      else if (a === 'imp') b.querySelector('#pp-ent-file').click();
      else if (a === 'del') supprimer();
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', barre); else barre();
})();
