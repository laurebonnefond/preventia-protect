/* =========================================================
   PréventIA Protect — compte commun avec PréventIA Réseau
   ---------------------------------------------------------
   Mêmes comptes, même base Supabase, même session : les deux
   sites sont servis depuis laurebonnefond.github.io, donc une
   personne connectée sur PréventIA Réseau l'est aussi ici (et
   inversement). Le SPSTI choisi est partagé (clé « pr-org »).

   Sert à : enregistrer et retrouver les FDS partagées du SPSTI.
   Ne sert pas à : envoyer les données des modules (DUERP, RPS,
   inventaires…), qui restent dans le navigateur.

   API :  PPAuth.pret            promesse résolue une fois le contexte chargé
          PPAuth.etat()          { user, profil, orgs:[{id, nom, role}], org }
          PPAuth.client()        client Supabase (null si indisponible)
          PPAuth.choisirOrg(id)  change de SPSTI (aussi pour PréventIA Réseau)
          PPAuth.surChangement(fn)
   La sécurité repose sur les règles RLS de la base, pas sur ce script.
   ========================================================= */
(function () {
  if (window.PPAuth) return;
  const CFG = {
    url: 'https://vjiryvqyijfljzsaekee.supabase.co',
    key: 'sb_publishable_I7Ao0-YCve34t6qTrhGc7A_M5Fduxg1',          // clé publique (comme PréventIA Réseau)
    reseau: 'https://laurebonnefond.github.io/laurebonnefond-preventia-reseau/',
    sdk: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js',
    sri: 'sha384-gnyZit14c5lnGcarmA166QQjjJXpucw25ogZXuwH3HxxY904zHkBqmxVpelsPorb'
  };
  const ORG_KEY = 'pr-org';
  const S = { user: null, profil: null, orgs: [], org: null, charge: false, erreur: '' };
  const abonnes = [];
  let sb = null;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const notifier = () => { rendre(); abonnes.forEach(f => { try { f(etat()); } catch (e) {} }); };
  const etat = () => ({ user: S.user, profil: S.profil, orgs: S.orgs.slice(), org: S.org, charge: S.charge, erreur: S.erreur });

  function chargerSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = CFG.sdk; s.integrity = CFG.sri; s.crossOrigin = 'anonymous';
      s.onload = ok; s.onerror = () => ko(new Error('Bibliothèque Supabase indisponible (hors ligne ?)'));
      document.head.appendChild(s);
    });
  }

  async function contexte() {
    const { data: { session } } = await sb.auth.getSession();
    S.user = session ? session.user : null;
    S.profil = null; S.orgs = []; S.org = null;
    if (S.user) {
      const [prof, mems, orgs] = await Promise.all([
        sb.from('profiles').select('id, full_name, job').eq('id', S.user.id).maybeSingle(),
        sb.from('memberships').select('org_id, role').eq('user_id', S.user.id),
        sb.from('organizations').select('id, name, short_name')
      ]);
      S.profil = prof.data || null;
      const noms = Object.fromEntries((orgs.data || []).map(o => [o.id, o.short_name || o.name]));
      S.orgs = (mems.data || []).map(m => ({ id: m.org_id, nom: noms[m.org_id] || 'SPSTI', role: m.role }));
      let garde = null; try { garde = localStorage.getItem(ORG_KEY); } catch (e) {}
      S.org = (S.orgs.find(o => o.id === garde) || S.orgs[0] || {}).id || null;
    }
    S.charge = true; S.erreur = '';
  }

  async function demarrer() {
    try {
      await chargerSdk();
      sb = window.supabase.createClient(CFG.url, CFG.key);
      await contexte();
      sb.auth.onAuthStateChange((evt) => {
        if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT' || evt === 'USER_UPDATED') contexte().then(notifier, () => notifier());
      });
    } catch (e) {
      S.charge = true; S.erreur = e.message || String(e);
    }
    notifier();
    return etat();
  }

  async function connexion(email, mdp) {
    if (!sb) throw new Error(S.erreur || 'Connexion indisponible');
    const { error } = await sb.auth.signInWithPassword({ email, password: mdp });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'E-mail ou mot de passe incorrect.' : error.message);
    await contexte(); notifier();
  }
  async function deconnexion() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
    await contexte().catch(() => {}); notifier();
  }
  function choisirOrg(id) {
    if (!S.orgs.some(o => o.id === id)) return;
    S.org = id; try { localStorage.setItem(ORG_KEY, id); } catch (e) {}
    notifier();
  }

  /* ---------- Affichage : pastille dans la barre « Dossier entreprise » ---------- */
  function styles() {
    if (document.getElementById('pp-auth-css')) return;
    const c = document.createElement('style'); c.id = 'pp-auth-css';
    c.textContent = `#pp-auth{display:flex;gap:6px;align-items:center;border-left:1px solid #2c4a7a;padding-left:10px;margin-left:2px}
#pp-auth .nom{font-weight:600;white-space:nowrap;flex-shrink:0;max-width:220px;overflow:hidden;text-overflow:ellipsis}
#pp-auth select{max-width:170px}
#pp-auth-dlg{position:fixed;inset:0;margin:auto;height:fit-content;border:0;border-radius:14px;padding:0;max-width:380px;width:calc(100% - 32px);box-shadow:0 20px 60px rgb(0 0 0/.35);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0c1e3c}
#pp-auth-dlg::backdrop{background:rgb(8 20 40/.55)}
#pp-auth-dlg form{display:flex;flex-direction:column;gap:10px;padding:20px 22px}
#pp-auth-dlg h2{margin:0;font-size:17px}#pp-auth-dlg p{margin:0;color:#475569;font-size:12.5px}
#pp-auth-dlg label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:#334155}
#pp-auth-dlg input{font:inherit;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px}
#pp-auth-dlg .err{color:#b91c1c;font-size:12.5px;min-height:1em}
#pp-auth-dlg .row{display:flex;gap:8px;justify-content:flex-end;align-items:center;flex-wrap:wrap}
#pp-auth-dlg button{font:600 13px system-ui,sans-serif;border-radius:8px;padding:8px 14px;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#0c1e3c}
#pp-auth-dlg button[type=submit]{background:#0f766e;border-color:#0f766e;color:#fff}
#pp-auth-dlg a{color:#0f766e;font-size:12.5px}`;
    document.head.appendChild(c);
  }
  function rendre() {
    const bar = document.getElementById('pp-ent-bar'); if (!bar) return;
    styles();
    let z = document.getElementById('pp-auth');
    if (!z) { z = document.createElement('div'); z.id = 'pp-auth'; bar.appendChild(z); }
    if (!S.charge) { z.innerHTML = '<small>Compte…</small>'; return; }
    if (S.erreur) { z.innerHTML = `<small title="${esc(S.erreur)}">Compte indisponible</small>`; return; }
    if (!S.user) {
      z.innerHTML = `<button type="button" data-auth="in" title="Avec votre compte PréventIA Réseau">👤 Se connecter</button>`;
    } else if (!S.orgs.length) {
      z.innerHTML = `<span class="nom">👤 ${esc(S.profil && S.profil.full_name || S.user.email)}</span>
        <a href="${CFG.reseau}#/rejoindre" style="color:#fbbf24">Rejoindre un SPSTI</a><button type="button" data-auth="out">Déconnexion</button>`;
    } else {
      const choix = S.orgs.length > 1
        ? `<select id="pp-auth-org" aria-label="SPSTI">${S.orgs.map(o => `<option value="${esc(o.id)}" ${o.id === S.org ? 'selected' : ''}>${esc(o.nom)}</option>`).join('')}</select>`
        : `<small>${esc(S.orgs[0].nom)}</small>`;
      z.innerHTML = `<span class="nom" title="${esc(S.user.email)}">👤 ${esc(S.profil && S.profil.full_name || S.user.email)}</span>${choix}
        <button type="button" data-auth="out">Déconnexion</button>`;
      const sel = z.querySelector('#pp-auth-org'); if (sel) sel.onchange = e => choisirOrg(e.target.value);
    }
    z.onclick = e => {
      const a = e.target.closest('button') && e.target.closest('button').dataset.auth;
      if (a === 'in') ouvrir(); else if (a === 'out') deconnexion();
    };
  }
  function ouvrir() {
    styles();
    let d = document.getElementById('pp-auth-dlg');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'pp-auth-dlg';
      d.innerHTML = `<form method="dialog" novalidate>
        <h2>Se connecter</h2>
        <p>Avec votre compte <b>PréventIA Réseau</b>. Vous serez aussi connecté·e sur PréventIA Réseau.</p>
        <label>E-mail<input type="email" name="email" autocomplete="username" required></label>
        <label>Mot de passe<input type="password" name="mdp" autocomplete="current-password" required></label>
        <div class="err" role="alert"></div>
        <div class="row"><a href="${CFG.reseau}#/connexion" target="_blank" rel="noopener">Créer un compte / mot de passe oublié</a></div>
        <div class="row"><button type="button" data-x>Annuler</button><button type="submit">Se connecter</button></div>
      </form>`;
      document.body.appendChild(d);
      const f = d.querySelector('form'), err = d.querySelector('.err');
      d.querySelector('[data-x]').onclick = () => d.close();
      f.onsubmit = async ev => {
        ev.preventDefault(); err.textContent = '';
        const email = f.email.value.trim(), mdp = f.mdp.value;
        if (!email || !mdp) { err.textContent = 'Renseignez l’e-mail et le mot de passe.'; return; }
        const b = f.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Connexion…';
        try { await connexion(email, mdp); f.mdp.value = ''; d.close(); }
        catch (e) { err.textContent = e.message; }
        finally { b.disabled = false; b.textContent = 'Se connecter'; }
      };
    }
    d.querySelector('.err').textContent = '';
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    setTimeout(() => d.querySelector('input[name=email]').focus(), 30);
  }

  const pret = demarrer();
  window.PPAuth = { pret, etat, client: () => sb, choisirOrg, connexion, deconnexion, ouvrir, surChangement: f => abonnes.push(f) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rendre); else rendre();
})();
