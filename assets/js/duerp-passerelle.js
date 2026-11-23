/* =========================================================
   PréventIA Protect — passerelle des modules vers le DUERP
   ---------------------------------------------------------
   Les modules d'évaluation (RPS, chimique, cartographie…) ne
   modifient JAMAIS le DUERP directement : ils déposent des
   PROPOSITIONS de risques dans une boîte « À valider ».
   L'évaluateur les accepte (choix de l'unité de travail),
   les modifie ou les ignore dans le module DUERP.

   Format d'une proposition (cotation sur la grille du DUERP) :
     ref        identifiant stable dans le module source (ex. « f1 »)
     categorie  catégorie DUERP (ex. « Risque psychosocial (RPS) »)
     danger, situation, dommage   textes
     gravite 1-4 · frequence 1-4 · maitrise 1 bonne / 2 partielle / 3 insuffisante
     actions    [{description, type, echeance}]
     ut         nom d'unité de travail suggéré (facultatif)

   Stockage : localStorage de ce navigateur, rien n'est transmis.
   Aucune donnée individuelle : seulement des résultats collectifs.
   ========================================================= */
(function () {
  const KEY = 'pp_duerp_inbox';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } };

  window.PPDuerp = {
    KEY,
    /* Dépose ou remplace les propositions d'un module.
       source : { id:'rps', label:'Évaluation RPS', entreprise:'…', url:'…' }
       Une proposition déjà en attente pour la même référence est remplacée.
       Si le risque a déjà été ajouté au DUERP, la nouvelle proposition est
       marquée comme mise à jour de ce risque (maj = id du risque). */
    propose(source, items) {
      const all = read(), now = new Date().toISOString();
      let n = 0;
      items.forEach(it => {
        const key = source.id + '|' + it.ref;
        const old = all.filter(p => p.key === key);
        const accepted = old.filter(p => p.statut === 'acceptee').pop();
        for (let i = all.length - 1; i >= 0; i--) if (all[i].key === key && all[i].statut === 'attente') all.splice(i, 1);
        all.push({
          id: uid(), key, date: now, statut: 'attente',
          source: { id: source.id, label: source.label, entreprise: source.entreprise || '', url: source.url || '' },
          maj: accepted ? accepted.risqueId : null,
          ref: it.ref, ut: it.ut || '', categorie: it.categorie, danger: it.danger,
          situation: it.situation || '', dommage: it.dommage || '',
          gravite: it.gravite, frequence: it.frequence, maitrise: it.maitrise,
          actions: (it.actions || []).map(a => ({ description: a.description, type: a.type || 'Prévention', echeance: a.echeance || '' }))
        });
        n++;
      });
      write(all);
      return n;
    },
    list: read,
    pending() { return read().filter(p => p.statut === 'attente'); },
    /* statut : 'acceptee' (avec l'id du risque créé ou mis à jour) ou 'rejetee' */
    resolve(id, statut, risqueId) {
      const all = read(), p = all.find(x => x.id === id);
      if (!p) return false;
      p.statut = statut; p.risqueId = risqueId || p.maj || null; p.traite = new Date().toISOString();
      return write(all);
    },
    /* Oublie les propositions déjà traitées (garde celles en attente) */
    purge() { return write(read().filter(p => p.statut === 'attente')); }
  };
})();
