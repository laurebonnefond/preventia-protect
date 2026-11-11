/* =========================================================
   Protocoles d'urgence — logique de l'application
   Reprise de « Protocoles urgences ». Les ajouts pour la
   version entreprise sont marqués « NOUVEAU ».
   -----------------------------------------------------------
   Aucune dependance externe. Les ecrans sont generes a partir
   du tableau PROTOCOLES defini dans protocoles.js.
   ========================================================= */

"use strict";

/* ----- Icones SVG inline (fonctionnent hors-ligne) ----- */

function svg(contenu, classe = "ic") {
  return '<svg class="' + classe + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">' + contenu + '</svg>';
}

const ICONS = {
  recherche: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  chevron:   svg('<path d="M9 6l6 6-6 6"/>'),
  retour:    svg('<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>'),
  horloge:   svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', "ic ic--sm"),
  triangle:  svg('<path d="M12 4L22 20H2z"/><path d="M12 10v4"/>' +
                 '<circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none"/>'),
  cercle:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/>' +
                 '<circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none"/>')
};

function etoileSVG(actif) {
  const remplissage = actif ? 'fill="currentColor"' : 'fill="none"';
  return '<svg class="ic" viewBox="0 0 24 24" ' + remplissage + ' stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21.4l1.1-6.5L2.6 9.8l6.5-.9z"/></svg>';
}

/* ----- Etat de l'application ----- */

/* NOUVEAU : les favoris sont gardes dans le navigateur (localStorage)
   pour retrouver les memes protocoles a la prochaine ouverture. */
const CLE_FAVORIS = "pp_proto_favoris";

function chargerFavoris() {
  try { return new Set(JSON.parse(localStorage.getItem(CLE_FAVORIS)) || []); }
  catch (e) { return new Set(); }
}
function sauverFavoris() {
  try { localStorage.setItem(CLE_FAVORIS, JSON.stringify([...etat.favoris])); }
  catch (e) { /* stockage indisponible : les favoris restent valables pour la session */ }
}

const etat = {
  recherche: "",
  categorie: "Toutes",      // NOUVEAU : filtre par categorie
  favoris: chargerFavoris()
};

/* ----- Outils ----- */

/* Met le texte en minuscules et retire les accents,
   pour que "dyspnee" trouve "dyspnée". */
function normaliser(texte) {
  return texte.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* Echappe le texte avant insertion dans le HTML. */
function echap(texte) {
  const d = document.createElement("div");
  d.textContent = texte;
  return d.innerHTML;
}

function protocoleParId(id) {
  return PROTOCOLES.find(function (p) { return p.id === id; });
}

/* ----- Recuperation des elements du DOM ----- */

const vueListe   = document.getElementById("vue-liste");
const vueDetail  = document.getElementById("vue-detail");
const champRech  = document.getElementById("champ-recherche");
const listeEl    = document.getElementById("liste-motifs");
const aucunEl    = document.getElementById("aucun-resultat");
const labelListe = document.getElementById("label-liste");
const detailEl   = document.getElementById("detail-contenu");
const filtresEl  = document.getElementById("filtres");      // NOUVEAU

/* NOUVEAU : un delai de 240 min s'affiche « < 4 h » */
function formatDelai(min) {
  return min >= 60 ? (min / 60) + " h" : min + " min";
}

/* ----- Ecran 1 : liste des motifs ----- */

function protocolesFiltres() {
  const q = normaliser(etat.recherche.trim());

  let liste = PROTOCOLES.filter(function (p) {
    // NOUVEAU : filtre par categorie
    if (etat.categorie !== "Toutes" && p.categorie !== etat.categorie) return false;
    if (!q) return true;
    const champs = normaliser(p.titre + " " + p.motif + " " + p.synonymes.join(" "));
    return champs.includes(q);
  });

  // Favoris en tete, puis ordre alphabetique.
  liste.sort(function (a, b) {
    const favA = etat.favoris.has(a.id) ? 0 : 1;
    const favB = etat.favoris.has(b.id) ? 0 : 1;
    if (favA !== favB) return favA - favB;
    return a.titre.localeCompare(b.titre, "fr");
  });

  return liste;
}

function carteHTML(p) {
  const estFavori = etat.favoris.has(p.id);
  return '' +
    '<div class="carte">' +
      '<button type="button" class="carte__fav' + (estFavori ? ' actif' : '') + '" ' +
        'data-fav="' + p.id + '" ' +
        'aria-pressed="' + estFavori + '" ' +
        'aria-label="' + (estFavori ? "Retirer des favoris" : "Ajouter aux favoris") + '">' +
        etoileSVG(estFavori) +
      '</button>' +
      '<button type="button" class="carte__ouvrir" data-ouvrir="' + p.id + '">' +
        '<span class="carte__texte">' +
          '<span class="carte__titre">' + echap(p.titre) + '</span>' +
          '<span class="carte__meta">' + echap(p.motif) + '</span>' +
          '<span class="carte__meta">' + p.etapes.length + ' étapes &middot; ' +
            echap(p.categorie) + '</span>' +
        '</span>' +
        '<span class="carte__chevron">' + ICONS.chevron + '</span>' +
      '</button>' +
    '</div>';
}

/* NOUVEAU : boutons de filtre generes a partir des categories du corpus */
function rendreFiltres() {
  const categories = ["Toutes"].concat(
    PROTOCOLES.map(function (p) { return p.categorie; })
      .filter(function (c, i, tab) { return tab.indexOf(c) === i; })
  );
  filtresEl.innerHTML = categories.map(function (c) {
    return '<button type="button" class="filtre" data-cat="' + echap(c) + '" aria-pressed="' +
      (etat.categorie === c) + '">' + echap(c) + '</button>';
  }).join("");
}

function rendreListe() {
  const liste = protocolesFiltres();

  labelListe.textContent = etat.recherche.trim()
    ? "Résultats (" + liste.length + ")"
    : (etat.categorie === "Toutes" ? "Motifs" : etat.categorie) + " (" + liste.length + ")";

  if (liste.length === 0) {
    listeEl.innerHTML = "";
    aucunEl.hidden = false;
    return;
  }

  aucunEl.hidden = true;
  listeEl.innerHTML = liste.map(carteHTML).join("");
}

/* ----- Ecran 2 : detail d'un protocole ----- */

function banniereHTML(p) {
  if (p.statut === "valide") {
    return '<div class="banniere banniere--valide">' + ICONS.cercle +
      '<span>Protocole valide' + (p.valide_par ? " par " + echap(p.valide_par) : "") +
      '.</span></div>';
  }
  return '<div class="banniere banniere--attention">' + ICONS.triangle +
    '<span>Protocole non validé : à faire valider, dater et signer par le médecin ' +
    'du travail avant tout usage (art. R4311-14 CSP).</span></div>';
}

function etapeHTML(e) {
  let tags = '<span class="tag">' + echap(e.type) + '</span>';
  if (e.delai_cible_min !== null && e.delai_cible_min !== undefined) {
    tags += '<span class="tag tag--delai" data-criticite="' + e.criticite + '">' +
      ICONS.horloge + '&lt; ' + formatDelai(e.delai_cible_min) + '</span>';
  }

  const details = e.details
    ? '<p class="etape__details">' + echap(e.details) + '</p>' : '';

  return '' +
    '<li class="etape" data-criticite="' + e.criticite + '">' +
      '<span class="etape__num">' + e.ordre + '</span>' +
      '<div class="etape__corps">' +
        '<p class="etape__action">' + echap(e.action) + '</p>' +
        details +
        '<div class="etape__tags">' + tags + '</div>' +
      '</div>' +
    '</li>';
}

function alerteHTML(a) {
  return '' +
    '<div class="alerte">' +
      '<span class="alerte__icone">' + ICONS.cercle + '</span>' +
      '<div>' +
        '<p class="alerte__libelle">' + echap(a.libelle) + '</p>' +
        '<p class="alerte__conduite">' + echap(a.conduite) + '</p>' +
      '</div>' +
    '</div>';
}

function rendreDetail(p) {
  const etapes  = p.etapes.map(etapeHTML).join("");
  const alertes = p.criteres_alerte.map(alerteHTML).join("");
  // NOUVEAU : la rubrique « Scores » n'apparait que si elle contient quelque chose
  const scores  = p.scores_associes
    .map(function (s) { return '<span class="puce">' + echap(s) + '</span>'; })
    .join("");
  const refs = p.references
    .map(function (r) { return '<li>' + echap(r) + '</li>'; })
    .join("");

  detailEl.innerHTML = '' +
    '<h2 class="detail-titre">' + echap(p.titre) + '</h2>' +
    '<p class="detail-specialite">' + echap(p.specialite) +
      ' &middot; version ' + echap(p.version) + ' du ' + echap(p.date_maj) + '</p>' +
    '<span class="detail-duree">' + ICONS.horloge + echap(p.duree_cle) + '</span>' +
    banniereHTML(p) +
    '<p class="detail-objectif">' + echap(p.objectif) + '</p>' +

    '<p class="label-section">Conduite à tenir</p>' +
    '<ol class="etapes">' + etapes + '</ol>' +

    '<p class="label-section label-section--danger">Critères d\'alerte</p>' +
    alertes +

    (scores ? '<p class="label-section">Repères associés</p>' +
      '<div class="puces">' + scores + '</div>' : '') +

    '<p class="label-section">Références</p>' +
    '<ul class="references">' + refs + '</ul>' +

    '<p class="detail-avertissement">Contenu illustratif. ' +
      'À revoir, compléter et faire valider par le médecin du travail.</p>';
}

/* ----- Navigation entre les deux ecrans ----- */

function ouvrirDetail(id) {
  const p = protocoleParId(id);
  if (!p) return;
  rendreDetail(p);
  vueListe.hidden = true;
  vueDetail.hidden = false;
  window.scrollTo(0, 0);
  document.getElementById("btn-retour").focus();
}

function revenirListe() {
  vueDetail.hidden = true;
  vueListe.hidden = false;
  window.scrollTo(0, 0);
  champRech.focus();
}

/* ----- Branchement des evenements ----- */

champRech.addEventListener("input", function () {
  etat.recherche = champRech.value;
  rendreListe();
});

/* Delegation : un seul ecouteur pour toutes les cartes. */
listeEl.addEventListener("click", function (evenement) {
  const ouvrir = evenement.target.closest("[data-ouvrir]");
  if (ouvrir) {
    ouvrirDetail(ouvrir.getAttribute("data-ouvrir"));
    return;
  }
  const fav = evenement.target.closest("[data-fav]");
  if (fav) {
    const id = fav.getAttribute("data-fav");
    if (etat.favoris.has(id)) {
      etat.favoris.delete(id);
    } else {
      etat.favoris.add(id);
    }
    sauverFavoris();   // NOUVEAU
    rendreListe();
  }
});

document.getElementById("btn-retour").addEventListener("click", revenirListe);

/* NOUVEAU : clic sur un filtre de categorie */
filtresEl.addEventListener("click", function (evenement) {
  const bouton = evenement.target.closest("[data-cat]");
  if (!bouton) return;
  etat.categorie = bouton.getAttribute("data-cat");
  rendreFiltres();
  rendreListe();
});

/* NOUVEAU : imprimer le protocole affiche (affichage au poste de secours) */
document.getElementById("btn-imprimer").addEventListener("click", function () {
  window.print();
});

/* ----- Initialisation ----- */

document.getElementById("icone-recherche").innerHTML = ICONS.recherche;
document.getElementById("icone-retour").innerHTML = ICONS.retour;
rendreFiltres();   // NOUVEAU
rendreListe();
