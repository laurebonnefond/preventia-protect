/* =========================================================
   PréventIA Protect — moteur de registres (sans dépendance)
   Un module = une configuration déclarative :
     PP.app({ title, sub, icon, tabs:[ {id,label,icon, registre:{...}} | {id,label,icon, render(el)} ] })
   Chaque registre : champs, champ d'échéance, regroupement, données de démo.
   Stockage : localStorage du navigateur (aucune donnée envoyée).
   ========================================================= */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 864e5;
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const frDate = s => s ? new Date(s + 'T00:00').toLocaleDateString('fr-FR') : '';
  /* Date locale → 'AAAA-MM-JJ' (évite le décalage UTC de toISOString) */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* Date ISO + n mois (utile pour les périodicités) */
  function addMonths(s, m) {
    if (!s || !m) return '';
    const d = new Date(s + 'T00:00'); d.setMonth(d.getMonth() + Number(m));
    return iso(d);
  }

  /* Statut d'échéance : le cœur du suivi
     retard < 0 j  |  urgent ≤ 30 j  |  à prévoir ≤ 90 j  |  à jour */
  function dueStatus(iso) {
    if (!iso) return { k: 'na', l: 'Non renseigné', d: null };
    const d = Math.round((new Date(iso + 'T00:00') - today()) / DAY);
    if (d < 0) return { k: 'bad', l: 'En retard', d };
    if (d <= 30) return { k: 'urg', l: 'Urgent', d };
    if (d <= 90) return { k: 'warn', l: 'À prévoir', d };
    return { k: 'ok', l: 'À jour', d };
  }
  const relDays = d => d == null ? '' : d < 0 ? `retard ${-d} j` : d === 0 ? "aujourd'hui" : `J-${d}`;

  /* ---------------- REGISTRE ---------------- */
  function Registre(el, cfg) {
    this.el = el; this.cfg = cfg;
    this.state = { q: '', group: '', status: '', sort: cfg.due || null, dir: 1 };
    this.load(); this.render();
  }
  Registre.prototype = {
    load() {
      try { this.rows = JSON.parse(localStorage.getItem(this.cfg.key)); } catch (e) { this.rows = null; }
      if (!Array.isArray(this.rows)) { this.rows = (this.cfg.seed || []).map(r => ({ id: uid(), ...r })); this.save(); }
    },
    save() { try { localStorage.setItem(this.cfg.key, JSON.stringify(this.rows)); } catch (e) {} PP.refreshBadges(); },
    statusOf(r) {
      const c = this.cfg;
      if (c.closed && c.closed(r)) return { k: 'na', l: c.closedLabel || 'Clôturé', d: null, closed: true };
      return c.due ? dueStatus(r[c.due]) : null;
    },
    lateCount() { return this.cfg.due ? this.rows.filter(r => this.statusOf(r).k === 'bad').length : 0; },
    field(k) { return this.cfg.fields.find(f => f.k === k); },

    filtered() {
      const { q, group, status, sort, dir } = this.state, c = this.cfg;
      let rows = this.rows.filter(r => {
        if (group && r[c.groupBy] !== group) return false;
        if (status) {
          if (c.kpis) { const k = c.kpis.find(k => k.id === status); if (k && !k.test(r)) return false; }
          else if (this.statusOf(r).k !== status) return false;
        }
        if (q) return Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase());
        return true;
      });
      if (sort) rows.sort((a, b) => String(a[sort] || '￿').localeCompare(String(b[sort] || '￿'), 'fr', { numeric: true }) * dir);
      return rows;
    },

    cell(r, f) {
      const v = r[f.k];
      if (f.k === this.cfg.due) {
        const s = this.statusOf(r);
        return `<div class="due"><span class="b ${s.k}">${s.l}</span>${v ? `<small>${frDate(v)} · ${s.closed ? '' : relDays(s.d)}</small>` : ''}</div>`;
      }
      if (f.render) return f.render(v, r);
      if (f.badge && v) return `<span class="b ${f.badge[v] || 'na'}">${esc(v)}</span>`;
      if (f.type === 'date') return frDate(v);
      if (f.type === 'checkbox') return v ? '✅' : '—';
      return esc(v);
    },

    render() {
      const c = this.cfg, s = this.state;
      const cols = c.fields.filter(f => f.inTable !== false);
      const rows = this.filtered();

      /* KPI : soit statuts d'échéance, soit KPI personnalisés */
      const kpis = c.kpis || (c.due ? [
        { id: '', label: 'Total', color: 'var(--navy-2)', test: () => true },
        { id: 'ok', label: 'À jour', color: 'var(--ok)' },
        { id: 'warn', label: 'À prévoir ≤ 90 j', color: 'var(--warn)' },
        { id: 'urg', label: 'Urgent ≤ 30 j', color: 'var(--urg)' },
        { id: 'bad', label: 'En retard', color: 'var(--bad)' }
      ] : []);
      const count = k => this.rows.filter(r => k.test ? k.test(r) : this.statusOf(r).k === k.id).length;

      const groups = c.groupBy ? [...new Set(this.rows.map(r => r[c.groupBy]).filter(Boolean))] : [];

      this.el.innerHTML = `
        ${c.intro ? `<div class="pp-intro"><div><h2>${c.intro.title}</h2><p>${c.intro.text}</p></div>${c.intro.ref ? `<div class="pp-ref">${c.intro.ref}</div>` : ''}</div>` : ''}
        ${c.note ? `<div class="pp-note">${c.note}</div>` : ''}
        ${kpis.length ? `<div class="pp-kpis">${kpis.map(k => `<button class="pp-kpi ${s.status === k.id ? 'on' : ''}" data-kpi="${k.id}" style="--c:${k.color}"><div class="l"><i></i>${k.label}</div><div class="v">${count(k)}</div></button>`).join('')}</div>` : ''}
        ${groups.length > 1 ? `<div class="pp-groups"><button class="pp-chip ${!s.group ? 'on' : ''}" data-g="">Tout</button>${groups.map(g => {
          const late = c.due ? this.rows.filter(r => r[c.groupBy] === g && this.statusOf(r).k === 'bad').length : 0;
          return `<button class="pp-chip ${s.group === g ? 'on' : ''}" data-g="${esc(g)}">${esc(g)} <b>${this.rows.filter(r => r[c.groupBy] === g).length}</b>${late ? `<span class="r">${late}</span>` : ''}</button>`;
        }).join('')}</div>` : ''}
        <div class="pp-bar">
          <div class="s"><input type="search" placeholder="Rechercher…" value="${esc(s.q)}"></div>
          <button class="btn p" data-a="add">＋ ${c.addLabel || 'Ajouter'}</button>
          <button class="btn" data-a="csv" title="Export CSV (Excel)">⬇ CSV</button>
          <button class="btn" data-a="print" title="Imprimer">🖨</button>
          <button class="btn ghost" data-a="reset" title="Recharger les données de démonstration">↺ Démo</button>
        </div>
        <div class="pp-tw">${rows.length ? `
          <table class="pp-t"><thead><tr>${cols.map(f => `<th data-sort="${f.k}">${f.label}${s.sort === f.k ? (s.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}<th></th></tr></thead>
          <tbody>${rows.map(r => `<tr>${cols.map(f => `<td>${this.cell(r, f)}</td>`).join('')}
            <td class="act"><button class="btn sm ghost" data-e="${r.id}" title="Modifier">✏️</button><button class="btn sm ghost" data-d="${r.id}" title="Supprimer">🗑</button></td></tr>`).join('')}</tbody></table>`
          : `<div class="pp-empty">Aucune ligne — cliquez sur « ${c.addLabel || 'Ajouter'} ».</div>`}</div>`;

      /* événements */
      const inp = $('.pp-bar input', this.el);
      inp.oninput = e => { s.q = e.target.value; this.render(); const i = $('.pp-bar input', this.el); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
      this.el.querySelectorAll('[data-kpi]').forEach(b => b.onclick = () => { s.status = s.status === b.dataset.kpi ? '' : b.dataset.kpi; this.render(); });
      this.el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { s.group = b.dataset.g; this.render(); });
      this.el.querySelectorAll('[data-sort]').forEach(th => th.onclick = () => { const k = th.dataset.sort; s.dir = s.sort === k ? -s.dir : 1; s.sort = k; this.render(); });
      this.el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => this.edit(this.rows.find(r => r.id === b.dataset.e)));
      this.el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (confirm('Supprimer cette ligne ?')) { this.rows = this.rows.filter(r => r.id !== b.dataset.d); this.save(); this.render(); } });
      $('[data-a=add]', this.el).onclick = () => this.edit(null);
      $('[data-a=csv]', this.el).onclick = () => this.csv();
      $('[data-a=print]', this.el).onclick = () => window.print();
      $('[data-a=reset]', this.el).onclick = () => { if (confirm('Remplacer vos données par les données de démonstration ?')) { localStorage.removeItem(c.key); this.load(); this.render(); } };
    },

    edit(row) {
      const c = this.cfg, isNew = !row; row = row || {};
      const dlg = document.createElement('dialog'); dlg.className = 'pp-dlg';
      const input = f => {
        const v = row[f.k] ?? (isNew && f.default != null ? (typeof f.default === 'function' ? f.default() : f.default) : '');
        const req = f.required ? 'required' : '';
        if (f.type === 'select') return `<select name="${f.k}" ${req}><option value=""></option>${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
        if (f.type === 'textarea') return `<textarea name="${f.k}" rows="3" ${req}>${esc(v)}</textarea>`;
        if (f.type === 'checkbox') return `<label style="display:flex;gap:8px;align-items:center;font-weight:500;color:var(--ink)"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}> ${f.check || 'Oui'}</label>`;
        return `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" ${req} ${f.list ? `list="dl-${f.k}"` : ''}>${f.list ? `<datalist id="dl-${f.k}">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}`;
      };
      dlg.innerHTML = `<form method="dialog">
        <header>${isNew ? 'Ajouter' : 'Modifier'} — ${c.itemLabel || 'ligne'}</header>
        <div class="body">${c.fields.filter(f => !f.computed).map(f => `<div class="f ${f.w || f.type === 'textarea' ? 'w' : ''}"><label>${f.label}${f.required ? ' *' : ''}</label>${input(f)}${f.hint ? `<span class="hint">${f.hint}</span>` : ''}</div>`).join('')}</div>
        <footer><button class="btn" value="cancel" formnovalidate>Annuler</button><button class="btn p" value="ok">Enregistrer</button></footer></form>`;
      document.body.appendChild(dlg); dlg.showModal();
      dlg.addEventListener('close', () => {
        if (dlg.returnValue === 'ok') {
          const fd = new FormData($('form', dlg)), rec = { ...row, id: row.id || uid() };
          c.fields.filter(f => !f.computed).forEach(f => rec[f.k] = f.type === 'checkbox' ? fd.has(f.k) : (fd.get(f.k) || '').trim());
          if (c.autoDue && c.due && !rec[c.due]) rec[c.due] = c.autoDue(rec) || '';   /* échéance calculée si vide */
          if (isNew) this.rows.unshift(rec); else this.rows[this.rows.findIndex(r => r.id === rec.id)] = rec;
          this.save(); this.render();
        }
        dlg.remove();
      });
    },

    csv() {
      const c = this.cfg, cols = c.fields;
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [cols.map(f => q(f.label)).concat(c.due ? [q('Statut')] : []).join(';')]
        .concat(this.filtered().map(r => cols.map(f => q(f.type === 'date' ? frDate(r[f.k]) : f.type === 'checkbox' ? (r[f.k] ? 'Oui' : 'Non') : r[f.k])).concat(c.due ? [q(this.statusOf(r).l)] : []).join(';')));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = `${c.key}_${PP.iso(new Date())}.csv`; a.click();
    }
  };

  /* ---------------- APPLICATION (barre + onglets) ---------------- */
  const PP = window.PP = { registres: {}, addMonths, dueStatus, frDate, esc, today };

  PP.refreshBadges = function () {
    Object.entries(PP.registres).forEach(([id, r]) => {
      const b = document.querySelector(`.pp-tab[data-t="${id}"] .n`), n = r.lateCount();
      if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
    });
  };

  PP.app = function (cfg) {
    document.title = `${cfg.title} — PréventIA Protect`;
    document.body.insertAdjacentHTML('afterbegin', `
      <header class="pp-top"><div class="in">
        <a class="back" href="${cfg.home || '../../../index.html'}">← Plateforme</a>
        <div class="ico">${cfg.icon}</div><div><h1>${cfg.title}</h1><small>${cfg.sub}</small></div>
        <div class="sp"></div><span class="pill">🔒 Données stockées localement</span>
      </div></header>
      <nav class="pp-tabs"><div class="in">${cfg.tabs.map((t, i) => `<button class="pp-tab ${i ? '' : 'on'}" data-t="${t.id}">${t.icon || ''} ${t.label}${t.registre && t.registre.due ? '<span class="n" style="display:none"></span>' : ''}</button>`).join('')}</div></nav>
      <main class="pp">${cfg.tabs.map((t, i) => `<section class="pp-panel ${i ? '' : 'on'}" id="p-${t.id}"></section>`).join('')}</main>`);
    cfg.tabs.forEach(t => {
      const el = document.getElementById('p-' + t.id);
      if (t.registre) PP.registres[t.id] = new Registre(el, t.registre); else t.render(el);
    });
    document.querySelectorAll('.pp-tab').forEach(b => b.onclick = () => {
      document.querySelectorAll('.pp-tab,.pp-panel').forEach(e => e.classList.remove('on'));
      b.classList.add('on'); document.getElementById('p-' + b.dataset.t).classList.add('on');
      history.replaceState(null, '', '#' + b.dataset.t);
    });
    const h = location.hash.slice(1); if (h) document.querySelector(`.pp-tab[data-t="${h}"]`)?.click();
    PP.refreshBadges();
  };

  /* Dates de démo relatives à aujourd'hui (les alertes restent parlantes) */
  PP.d = n => { const d = today(); d.setDate(d.getDate() + n); return iso(d); };
  PP.iso = iso;
})();
