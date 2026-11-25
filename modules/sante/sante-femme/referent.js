/* PréventIA Protect · Santé de la femme — RÉFÉRENT·E À JOINDRE
   Côté infirmier·e : saisi une fois dans la carte « proposer aux salariées » (gardé dans ce navigateur),
   puis ajouté au lien envoyé aux salariées : ?app=1&ref=…&mail=…&tel=…
   Côté salariée : l'assistant droits le propose quand sa réponse ne suffit pas.
   Rien n'est envoyé à un serveur : le message part de la messagerie de la salariée. */
window.REFERENT = (function () {
  const K = 'pp-sf-referent';
  const CH = [['ref', 'Nom ou fonction', 'ex. Infirmière du travail, Mme Martin'],
              ['mail', 'E-mail', 'ex. infirmerie@entreprise.fr'],
              ['tel', 'Téléphone', 'ex. 05 55 00 00 00']];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const get = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } };
  const set = o => { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} };
  const propre = {
    ref: v => v.slice(0, 120),
    mail: v => /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(v) ? v : '',
    tel: v => /^[+\d][\d .-]{5,20}$/.test(v) ? v : ''
  };

  /* Lien salariée : base + référent enregistré */
  function lien(base) {
    const u = new URL(base, location.href), r = get();
    CH.forEach(([k]) => { const v = propre[k](String(r[k] || '').trim()); if (v) u.searchParams.set(k, v); });
    return u.href;
  }
  /* Référent reçu dans l'adresse (côté salariée), valeurs contrôlées */
  function recu() {
    const p = new URLSearchParams(location.search), r = {};
    CH.forEach(([k]) => { const v = propre[k](String(p.get(k) || '').trim()); if (v) r[k] = v; });
    return r;
  }
  /* Champs de saisie (côté infirmier·e) */
  function champs() {
    const r = get(), ok = r.ref || r.mail || r.tel;
    return `<details class="ref-form"><summary>Référent·e à joindre ${ok ? '✓' : '(facultatif)'}</summary>
      <p class="small muted" style="margin:6px 0">Ajouté au lien : si la réponse de l'assistant ne suffit pas, la salariée peut vous écrire ou vous appeler. Gardé dans ce navigateur uniquement.</p>
      <div class="grid" style="gap:6px">${CH.map(([k, l, ph]) => `<label class="f">${l}<input class="i" data-referent="${k}" value="${esc(r[k] || '')}" placeholder="${esc(ph)}" maxlength="120"></label>`).join('')}</div></details>`;
  }
  function brancher(root, maj) {
    root.querySelectorAll('[data-referent]').forEach(i => i.oninput = () => {
      const r = get(); r[i.dataset.referent] = i.value.trim(); set(r); if (maj) maj();
    });
  }
  return { lien, recu, champs, brancher };
})();
