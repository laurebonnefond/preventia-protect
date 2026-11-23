/* ════════════════════════════════════════════════════════════════
   PréventIA Protect · Risque chimique — BASE FDS PARTAGÉE
   Relie l'inventaire chimique à la base FDS de PréventIA Réseau
   (Supabase, compte commun : assets/js/pp-auth.js).

     1. Avant l'IA : la FDS est-elle déjà dans la base ?
        (même fichier PDF = même empreinte sha256, ou même nom)
     2. Enregistrer une FDS analysée → brouillon de MON SPSTI
     3. Vérifiée sur le PDF → « vérifiée » → partage possible au réseau
     4. Contrôle des substances (n° CAS) avec PubChem :
        classification harmonisée CLP si elle existe, sinon notifications ECHA
        + liens ECHA, GESTIS, INRS

   Ce qui part dans la base : uniquement le contenu de la FDS (dangers,
   composition, VLEP, EPI, conduite à tenir). Jamais le lieu, l'usage,
   les quantités ni le nombre de salariés exposés de l'entreprise.
   Les droits (qui lit, qui modifie) sont imposés par la base (RLS).
   ════════════════════════════════════════════════════════════════ */
(function () {
  const PC = 'https://pubchem.ncbi.nlm.nih.gov';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateFR = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR') : '';
  const app = () => window.PCHIM;
  const toast = (m, t) => app()?.toast ? app().toast(m, t) : alert(m);

  /* Champs de la FDS (et seulement eux) gardés dans la base */
  const CHAMPS_FDS = ['molecule', 'cas', 'substances', 'etat', 'pictos', 'mention', 'h', 'p', 'libelles', 'famille', 'cmr', 'vlep', 'teb', 'pe', 'ph', 'fiche'];
  const ETAT_BASE = { liquide: 'liquide', solide: 'solide', poudre: 'solide', gaz: 'gaz', aerosol: 'aerosol', pate: 'pateux' };
  /* Mentions qu'on signale si la substance les porte mais pas le mélange */
  const GRAVES = /^(H340|H341|H350|H351|H36[0-2]|H334|H317|H370|H372)/;

  /* ─── Connexion ─── */
  async function contexte() {
    if (!window.PPAuth) return { ok: false, msg: 'Connexion indisponible (rechargez la page).' };
    await PPAuth.pret;
    const e = PPAuth.etat(), sb = PPAuth.client();
    if (!sb || e.erreur) return { ok: false, msg: 'Base FDS injoignable (hors ligne ?).' };
    if (!e.user) return { ok: false, connexion: true, msg: 'Connectez-vous avec votre compte PréventIA Réseau pour utiliser la base FDS.' };
    if (!e.org) return { ok: false, msg: 'Rejoignez un SPSTI sur PréventIA Réseau pour enregistrer des FDS.' };
    return { ok: true, sb, e };
  }
  const nomOrg = (row, e) => (e.orgs.find(o => o.id === row.org_id) || {}).nom || row.organizations?.short_name || row.organizations?.name || 'autre SPSTI';
  const estMien = (row, e) => e.orgs.some(o => o.id === row.org_id);

  /* ─── Empreinte du PDF : reconnaît la même FDS sans relancer l'IA ─── */
  async function sha256(file) {
    const h = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  const COLS = 'id, org_id, visibilite, statut, nom_commercial, fournisseur, version, date_revision, lien_fds, verifie_par, verifie_le, extrait_par_ia, sha256, donnees, organizations(name, short_name)';

  /* Ligne de la base → champs d'un produit de l'inventaire */
  function versProduit(row, e) {
    const d = row.donnees || {}, verif = row.statut === 'verifiee';
    const p = {};
    CHAMPS_FDS.forEach(k => { if (d[k] !== undefined) p[k] = d[k]; });
    return Object.assign(p, {
      nom: row.nom_commercial, fournisseur: row.fournisseur || '', fds_version: row.version || '',
      fds_date: row.date_revision || '', fds_lien: row.lien_fds || '', fds_sha: row.sha256 || '',
      fds_base: { id: row.id, statut: row.statut, visibilite: row.visibilite },
      verif: verif ? { date: row.verifie_le, par: row.verifie_par + (estMien(row, e) ? '' : ' (' + nomOrg(row, e) + ', base réseau)') } : { date: '', par: '' },
      ia: verif ? null : { confiance: 'medium', remarques: `Repris de la base FDS (brouillon de ${nomOrg(row, e)}) : à vérifier sur la FDS.`, date: new Date().toISOString().slice(0, 10) }
    });
  }

  /* 1a. Même PDF déjà dans la base ? → { produit, sha } (produit null sinon) */
  async function dejaConnue(file) {
    const sha = await sha256(file);
    const c = await contexte(); if (!c.ok) return { produit: null, sha };
    const { data } = await c.sb.from('fds').select(COLS).eq('sha256', sha).limit(1);
    return { produit: data?.[0] ? versProduit(data[0], c.e) : null, sha, row: data?.[0] || null };
  }

  /* 1b. Recherche par nom (fenêtre « Ajouter ») */
  async function chercher(q) {
    const c = await contexte(); if (!c.ok) return c;
    const { data, error } = await c.sb.from('fds').select(COLS)
      .ilike('nom_commercial', '%' + q.replace(/[%_\\]/g, ' ').trim() + '%')
      .neq('statut', 'obsolete').order('statut', { ascending: false }).order('date_revision', { ascending: false, nullsFirst: false }).limit(8);
    if (error) return { ok: false, msg: error.message };
    return { ok: true, e: c.e, lignes: data || [] };
  }
  function badge(row, e) {
    if (row.statut === 'verifiee') return row.visibilite === 'reseau'
      ? `<span class="fb ok">✔ Vérifiée · partagée réseau${estMien(row, e) ? '' : ' par ' + esc(nomOrg(row, e))}</span>`
      : `<span class="fb ok">✔ Vérifiée · mon SPSTI</span>`;
    return `<span class="fb warn">Brouillon · ${esc(nomOrg(row, e))}</span>`;
  }
  function ageTxt(d) {
    if (!d) return '<span class="fb warn">date inconnue</span>';
    const ans = (Date.now() - new Date(d)) / 3.156e10;
    return ans > 3 ? `<span class="fb warn">FDS du ${dateFR(d)} · plus de 3 ans</span>` : `FDS du ${dateFR(d)}`;
  }

  let minuteur = null, derniere = '', suivi = false;
  function suggestions(zone, nom, choisir) {
    clearTimeout(minuteur);
    const q = String(nom || '').trim();
    if (q.length < 3) { zone.innerHTML = ''; derniere = ''; return; }
    minuteur = setTimeout(async () => {
      derniere = q;
      const r = await chercher(q);
      if (q !== derniere) return;
      if (!r.ok) { zone.innerHTML = r.connexion ? `<p class="small muted">📚 ${esc(r.msg)}</p>` : ''; return; }
      if (!r.lignes.length) { zone.innerHTML = `<p class="small muted">📚 Aucune FDS « ${esc(q)} » dans la base de votre SPSTI ni du réseau.</p>`; return; }
      zone.innerHTML = `<div class="fds-sugg"><b>📚 Déjà dans la base FDS</b>${r.lignes.map((row, i) => `
        <div class="fs-l"><div><b>${esc(row.nom_commercial)}</b> ${row.fournisseur ? '· ' + esc(row.fournisseur) : ''} ${row.version ? '· v' + esc(row.version) : ''}<br>
          <span class="small">${ageTxt(row.date_revision)} ${badge(row, r.e)}</span></div>
          <button type="button" class="btn sm primary" data-fds-i="${i}">Utiliser</button></div>`).join('')}
        <p class="small muted">Sans IA ni nouvelle saisie : les dangers, EPI et la conduite à tenir sont repris. Vous ajoutez le lieu, l'usage et les quantités.</p></div>`;
      zone.querySelectorAll('[data-fds-i]').forEach(b => b.onclick = () => choisir(versProduit(r.lignes[+b.dataset.fdsI], r.e)));
    }, 400);
  }

  /* 2. Enregistrer / mettre à jour dans la base (brouillon de mon SPSTI) */
  function conc(s) {
    const n = String(s || '').replace(',', '.').match(/\d+(\.\d+)?/g) || [];
    const v = n.map(Number).filter(x => x <= 100);
    return v.length ? { conc_min: Math.min(...v), conc_max: Math.max(...v) } : { conc_min: null, conc_max: null };
  }
  async function enregistrer(p) {
    const c = await contexte(); if (!c.ok) throw new Error(c.msg);
    if (!String(p.nom || '').trim()) throw new Error('Le nom du produit est obligatoire.');
    const donnees = {}; CHAMPS_FDS.forEach(k => { donnees[k] = p[k]; });
    const ligne = {
      nom_commercial: p.nom.trim(), fournisseur: p.fournisseur || null, version: p.fds_version || null,
      date_revision: /^\d{4}-\d{2}-\d{2}$/.test(p.fds_date || '') ? p.fds_date : null,
      format_878: !!p.fds_date && p.fds_date >= '2021-01-01',
      etat_physique: ETAT_BASE[p.etat] || null, point_eclair_c: p.pe ?? null, teb_c: p.teb ?? null, ph: p.ph ?? null,
      cmr: ['1A', '1B', '2'].includes(p.cmr) ? p.cmr : null,
      pictogrammes: p.pictos || [], mention_avert: ['Danger', 'Attention'].includes(p.mention) ? p.mention : null,
      lien_fds: /^https?:\/\//.test(p.fds_lien || '') ? p.fds_lien : null,
      extrait_par_ia: !!p.ia, donnees
    };
    let id = p.fds_base?.id;
    if (id) {
      const { data: ex } = await c.sb.from('fds').select('statut, org_id').eq('id', id).maybeSingle();
      if (!ex || !estMien(ex, c.e)) id = null;                              // FDS d'un autre SPSTI : on crée la nôtre
      else if (ex.statut === 'verifiee') throw new Error('FDS déjà vérifiée : elle ne se modifie plus. Pour une nouvelle version de la FDS, créez un nouveau produit.');
    }
    if (id) {
      const { error } = await c.sb.from('fds').update(ligne).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      Object.assign(ligne, { org_id: c.e.org, statut: 'brouillon', visibilite: 'spsti', sha256: p.fds_sha || null });
      const { data, error } = await c.sb.from('fds').insert(ligne).select('id').single();
      if (error) throw new Error(/sha256/.test(error.message) ? 'Ce même fichier PDF est déjà enregistré par un SPSTI. Il apparaîtra dans la recherche une fois vérifié et partagé.' : error.message);
      id = data.id;
    }
    /* Mentions H et composition : on remplace tout */
    await c.sb.from('fds_mentions_h').delete().eq('fds_id', id);
    const h = [...new Set((p.h || []).filter(x => /^(H|EUH)\d{3}[A-Za-z]*$/.test(x)))];
    if (h.length) { const { error } = await c.sb.from('fds_mentions_h').insert(h.map(code => ({ fds_id: id, code }))); if (error) throw new Error(error.message); }
    await c.sb.from('fds_composition').delete().eq('fds_id', id);
    const subs = (p.substances || []).filter(s => s && s.nom);
    for (const s of subs) {
      const cas = /^\d{2,7}-\d{2}-\d$/.test(String(s.cas || '').trim()) ? s.cas.trim() : null;
      if (!cas) continue;                                                  // le référentiel commun est indexé par n° CAS
      await c.sb.from('substances').upsert({ nom: s.nom, cas }, { onConflict: 'cas', ignoreDuplicates: true });
      const { data: su } = await c.sb.from('substances').select('id').eq('cas', cas).maybeSingle();
      if (su) await c.sb.from('fds_composition').upsert(Object.assign({ fds_id: id, substance_id: su.id }, conc(s.concentration)), { onConflict: 'fds_id,substance_id' });
    }
    return { id, statut: 'brouillon', visibilite: 'spsti' };
  }

  /* 3. Vérification et partage */
  async function marquerVerifiee(id, par, le) {
    const c = await contexte(); if (!c.ok) throw new Error(c.msg);
    if (!par || !le) throw new Error('Renseignez d\'abord « Données vérifiées sur la FDS le » et « Vérifié par », puis réessayez.');
    const { error } = await c.sb.from('fds').update({ statut: 'verifiee', verifie_par: par, verifie_le: le }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async function partager(id) {
    const c = await contexte(); if (!c.ok) throw new Error(c.msg);
    const { error } = await c.sb.from('fds').update({ visibilite: 'reseau' }).eq('id', id);
    if (error) throw new Error(/reseau_si_verifiee/.test(error.message) ? 'Seule une FDS vérifiée peut être partagée.' : error.message);
  }

  /* 4. Substances : PubChem (gratuit, sans compte) */
  async function pubchem(cas) {
    const j = async u => { const r = await fetch(u); if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { code: r.status }); return r.json(); };
    let cid;
    try { cid = (await j(`${PC}/rest/pug/compound/name/${encodeURIComponent(cas)}/cids/JSON`)).IdentifierList.CID[0]; }
    catch (e) { return { cas, introuvable: true }; }
    const url = `${PC}/compound/${cid}#section=GHS-Classification`;
    let d; try { d = await j(`${PC}/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`); }
    catch (e) { return { cas, cid, url, h: [], source: e.code === 404 ? 'Aucune classification SGH publiée' : 'PubChem injoignable' }; }
    const refs = Object.fromEntries((d.Record.Reference || []).map(r => [r.ReferenceNumber, r.SourceName || '']));
    /* PubChem rattache parfois une entrée de l'annexe VI à un composant (ex. NaCl ← « polyazodyestuff ») :
       on ne la garde que si son intitulé contient le nom de la substance */
    const titre = String(d.Record.RecordTitle || '').toLowerCase();
    const annexe = new Set((d.Record.Reference || []).filter(r => /1272\/2008/.test(r.SourceName || '') && titre && String(r.Name || '').toLowerCase().includes(titre)).map(r => String(r.ReferenceNumber)));
    const parRef = {};
    (function tour(s) {
      (s.Section || []).forEach(tour);
      (s.Information || []).filter(i => i.Name === 'GHS Hazard Statements').forEach(i => {
        (parRef[i.ReferenceNumber] ||= []).push(...(i.Value?.StringWithMarkup || []).map(m => m.String || ''));
      });
    })(d.Record);
    const codes = (lignes, seuil) => [...new Set(lignes.map(t => {
      const m = t.match(/^((?:EUH|H)\d{3}[A-Za-z]*)(?:\s*\((?:>\s*)?([\d.]+)%\))?/); if (!m) return null;
      return m[2] && +m[2] < seuil ? null : m[1];
    }).filter(Boolean))];
    const ref = (motif) => Object.keys(parRef).find(k => motif.test(refs[k]));
    let k = Object.keys(parRef).find(x => annexe.has(String(x))), source = 'Classification harmonisée CLP (annexe VI)', h;
    if (k) h = codes(parRef[k], 0);
    else if ((k = ref(/European Chemicals Agency/))) { source = 'Auto-classifications notifiées à l\'ECHA (≥ 50 % des déclarants)'; h = codes(parRef[k], 50); }
    else if ((k = Object.keys(parRef)[0])) { source = refs[k] || 'PubChem'; h = codes(parRef[k], 0); }
    else { source = 'Aucune classification SGH publiée'; h = []; }
    return { cas, cid, url, h, source, harmonisee: /annexe VI/.test(source) };
  }
  const liens = (cas, nom) => {
    const q = encodeURIComponent(cas || nom || '');
    return [
      ['🇪🇺 ECHA', `https://www.google.com/search?q=site%3Aecha.europa.eu+${q}`],
      ['🇩🇪 GESTIS', `https://www.google.com/search?q=site%3Agestis-database.dguv.de+${q}`],
      ['📕 INRS fiche tox', `https://www.google.com/search?q=site%3Ainrs.fr+fiche+toxicologique+${q}`]
    ];
  };
  async function controleSubstances(p, zone) {
    const subs = [...(p.substances || [])];
    if (p.cas && !subs.some(s => s.cas === p.cas)) subs.unshift({ nom: p.molecule || '', cas: p.cas });
    const avecCas = subs.filter(s => /^\d{2,7}-\d{2}-\d$/.test(String(s.cas || '').trim()));
    if (!avecCas.length) { zone.innerHTML = '<p class="small muted">Aucun n° CAS valide (rubrique 3 de la FDS) : rien à contrôler.</p>'; return; }
    zone.innerHTML = '<p class="small"><span class="spin"></span> Interrogation de PubChem…</p>';
    const res = await Promise.all(avecCas.slice(0, 12).map(s => pubchem(s.cas.trim()).then(r => Object.assign(r, { nom: s.nom, conc: s.concentration }))));
    const hp = new Set(p.h || []);
    zone.innerHTML = `<table class="pc"><thead><tr><th>Substance</th><th>Classification de la substance pure</th><th>Sources</th></tr></thead><tbody>${res.map(r => {
      const manque = (r.h || []).filter(c => GRAVES.test(c) && !hp.has(c));
      return `<tr><td><b>${esc(r.nom || r.cas)}</b><br><span class="small">CAS ${esc(r.cas)}${r.conc ? ' · ' + esc(r.conc) : ''}</span></td>
        <td>${r.introuvable ? '<span class="muted">Non trouvé dans PubChem</span>' : `${(r.h || []).map(c => `<span class="hc ${hp.has(c) ? 'in' : ''}" title="${hp.has(c) ? 'Aussi sur le produit' : 'Absente du produit'}">${esc(c)}</span>`).join(' ') || '—'}
          <br><span class="small ${r.harmonisee ? '' : 'muted'}">${esc(r.source)}</span>
          ${manque.length ? `<div class="small warn-t">⚠ ${manque.map(esc).join(', ')} : absente(s) du produit. Normal si la concentration est sous le seuil CLP ; sinon, à vérifier avec le fournisseur.</div>` : ''}`}</td>
        <td class="small">${r.url ? `<a href="${r.url}" target="_blank" rel="noopener">🧬 PubChem</a><br>` : ''}${liens(r.cas).map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`).join('<br>')}</td></tr>`;
    }).join('')}</tbody></table>
    <p class="small muted">Mentions en vert : aussi présentes sur le produit. La classification d'un mélange dépend des concentrations : un écart n'est pas forcément une erreur. La FDS du fournisseur reste la référence.</p>`;
  }

  /* ─── Encadré « Base FDS » dans l'éditeur de produit ─── */
  async function boite(zone) {
    if (!zone) return;
    styles();
    const b = () => app().brouillon;
    const p = b(), ref = p.fds_base;
    zone.innerHTML = '<p class="small muted"><span class="spin"></span> Base FDS…</p>';
    const c = await contexte();
    let row = null, etat = '';
    if (c.ok && ref?.id) {
      const { data } = await c.sb.from('fds').select(COLS).eq('id', ref.id).maybeSingle();
      row = data;
    }
    if (!c.ok) etat = `<p class="small">${esc(c.msg)} ${c.connexion ? '<button type="button" class="btn sm" data-fb="login">👤 Se connecter</button>' : ''}</p>`;
    else if (!row) etat = `<p class="small">Cette FDS n'est pas encore dans la base de votre SPSTI${ref?.id ? ' (ou elle n\'est plus accessible)' : ''}.</p>
      <div class="row"><button type="button" class="btn sm primary" data-fb="save">☁ Enregistrer dans la base FDS (brouillon)</button></div>`;
    else {
      const mien = estMien(row, c.e);
      etat = `<p class="small">${badge(row, c.e)} ${ageTxt(row.date_revision)}${row.statut === 'verifiee' ? ` · vérifiée le ${dateFR(row.verifie_le)} par ${esc(row.verifie_par)}` : ''}</p>
        <div class="row">${mien && row.statut === 'brouillon' ? `<button type="button" class="btn sm" data-fb="save">⟳ Mettre à jour dans la base</button>
          <button type="button" class="btn sm primary" data-fb="verif" title="Utilise les champs « Données vérifiées le » et « Vérifié par »">✔ Marquer vérifiée</button>` : ''}
        ${mien && row.statut === 'verifiee' && row.visibilite === 'spsti' ? `<button type="button" class="btn sm primary" data-fb="share">🌐 Partager avec le réseau</button>` : ''}
        ${!mien ? `<span class="small muted">FDS d'un autre SPSTI : lecture seule.</span>` : ''}</div>`;
    }
    zone.innerHTML = `<div class="fb-box"><b>📚 Base FDS partagée</b>${etat}
      <div class="row"><button type="button" class="btn sm" data-fb="pubchem">🧬 Contrôler les substances (PubChem)</button></div>
      <div class="fb-pc"></div>
      <p class="small muted">Seul le contenu de la FDS est enregistré : jamais le lieu, l'usage, les quantités ni les salariés exposés.</p></div>`;
    zone.onclick = async e => {
      const a = e.target.closest('[data-fb]')?.dataset.fb; if (!a) return;
      const btn = e.target.closest('button'); btn.disabled = true;
      try {
        app().lireFormulaire(); const pr = b();
        if (a === 'login') { PPAuth.ouvrir(); if (!suivi) { suivi = true; PPAuth.surChangement(() => { const z = document.getElementById('fds-base'); if (z && document.getElementById('editeur').open) boite(z); }); } }
        else if (a === 'pubchem') await controleSubstances(pr, zone.querySelector('.fb-pc'));
        else if (a === 'save') { pr.fds_base = await enregistrer(pr); toast('FDS enregistrée dans la base de votre SPSTI (brouillon). Pensez à enregistrer le produit.', 'ok'); await boite(zone); }
        else if (a === 'verif') { await marquerVerifiee(pr.fds_base.id, pr.verif.par, pr.verif.date); pr.fds_base.statut = 'verifiee'; toast('FDS marquée vérifiée.', 'ok'); await boite(zone); }
        else if (a === 'share') {
          if (!confirm('Partager cette FDS vérifiée avec tous les SPSTI du réseau ?\nSeul le contenu de la FDS est partagé.')) return;
          await partager(pr.fds_base.id); pr.fds_base.visibilite = 'reseau'; toast('FDS partagée avec le réseau.', 'ok'); await boite(zone);
        }
      } catch (err) { toast(err.message || String(err), 'bad'); }
      finally { btn.disabled = false; }
    };
  }

  function styles() {
    if (document.getElementById('chim-fds-css')) return;
    const s = document.createElement('style'); s.id = 'chim-fds-css';
    s.textContent = `.fb-box,.fds-sugg{border:1px solid var(--line,#d7dde5);border-radius:12px;padding:10px 12px;margin-top:10px;display:flex;flex-direction:column;gap:6px;background:#f8fafc}
.fb-box .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.fb{display:inline-block;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:600;background:#e2e8f0;color:#334155}
.fb.ok{background:#dcfce7;color:#166534}.fb.warn{background:#fef3c7;color:#92400e}
.fs-l{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--line,#e2e8f0);padding-top:6px}
table.pc{width:100%;border-collapse:collapse;font-size:12.5px}table.pc th,table.pc td{border-top:1px solid #e2e8f0;padding:5px 6px;text-align:left;vertical-align:top}
.hc{display:inline-block;border:1px solid #cbd5e1;border-radius:6px;padding:0 5px;margin:1px;font-weight:600;font-size:11.5px}
.hc.in{background:#dcfce7;border-color:#86efac}.warn-t{color:#92400e;margin-top:3px}`;
    document.head.appendChild(s);
  }

  /* Fenêtre « Ajouter » : suggestions de la base pendant la saisie du nom */
  function brancherAjout() {
    const nom = document.getElementById('ajout-nom'); if (!nom || !app()) return;
    styles();
    let zone = document.getElementById('ajout-base');
    if (!zone) { zone = document.createElement('div'); zone.id = 'ajout-base'; nom.closest('.fieldrow').after(zone); }
    const choisir = pr => { document.getElementById('ajout').close(); app().ouvrirEditeur(app().normaliser(pr), null, !!pr.ia); };
    nom.addEventListener('input', () => suggestions(zone, nom.value, choisir));
    document.getElementById('ajout').addEventListener('close', () => { zone.innerHTML = ''; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancherAjout); else brancherAjout();

  window.ChimFDS = { dejaConnue, chercher, enregistrer, marquerVerifiee, partager, pubchem, controleSubstances, boite, sha256 };
})();
