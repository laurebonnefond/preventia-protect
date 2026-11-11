/* =========================================================
   Protocoles d'urgence — infirmier·e en entreprise
   -----------------------------------------------------------
   Repris de l'application « Protocoles urgences » et adapté
   à l'exercice en entreprise : l'infirmier·e agit sur rôle
   propre et, en l'absence de médecin, selon des protocoles de
   soins d'urgence écrits, datés et signés par le médecin du
   travail (art. R4311-14 du Code de la santé publique).

   Pour ajouter un protocole : copier un objet et l'adapter.
   Champ "categorie" : sert aux filtres en haut de la liste.
   Champ "statut" : "non_valide" tant que le médecin du travail
   n'a pas validé et signé. Une bannière s'affiche dans ce cas.

   AVERTISSEMENT : contenu illustratif, à revoir, compléter et
   faire valider par le médecin du travail avant tout usage.
   ========================================================= */

const VERSION_CORPUS = "2026-11-11";

const PROTOCOLES = [

  {
    id: "proto-acr",
    titre: "Arrêt cardio-respiratoire",
    motif: "Victime inconsciente qui ne respire pas",
    synonymes: ["ACR", "arret cardiaque", "inconscient ne respire pas", "massage cardiaque", "RCP", "DAE", "defibrillateur", "mort subite"],
    categorie: "Urgence vitale",
    specialite: "Réanimation",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Débuter la réanimation sans délai et défibriller le plus tôt possible : chaque minute sans massage réduit fortement les chances de survie.",
    duree_cle: "Massage et alerte immédiats",
    etapes: [
      { ordre: 1, action: "Vérifier la conscience et la respiration (10 secondes maximum)", type: "bilan", delai_cible_min: 1, criticite: "critique",
        details: "Pas de réponse, pas de respiration normale (ou gasps) : arrêt cardiaque jusqu'à preuve du contraire." },
      { ordre: 2, action: "Alerter le 15 (ou 112) et faire apporter le DAE", type: "alerte", delai_cible_min: 1, criticite: "critique",
        details: "Faire alerter par un témoin si possible, haut-parleur activé. Désigner une personne pour guider les secours sur le site." },
      { ordre: 3, action: "Compressions thoraciques", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Milieu du thorax, 5 à 6 cm de profondeur, 100 à 120 par minute. Insufflations 30:2 si formé et équipé, sinon massage seul en continu." },
      { ordre: 4, action: "Mettre en œuvre le DAE dès son arrivée", type: "geste", delai_cible_min: 3, criticite: "critique",
        details: "Suivre les instructions vocales. Interrompre le massage le moins possible." },
      { ordre: 5, action: "Poursuivre jusqu'au relais des secours", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Relais du massage toutes les 2 minutes si plusieurs sauveteurs. Noter les heures (arrêt, début du massage, chocs)." }
    ],
    criteres_alerte: [
      { libelle: "Toute victime inconsciente qui ne respire pas normalement", conduite: "Massage cardiaque immédiat et appel du 15. Ne pas attendre le DAE pour masser." }
    ],
    scores_associes: ["Chaîne de survie"],
    references: ["Recommandations ERC 2021 — réanimation de base", "INRS — Sauvetage secourisme du travail (SST)", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-malaise",
    titre: "Malaise, perte de connaissance",
    motif: "Malaise ou victime inconsciente qui respire",
    synonymes: ["malaise", "syncope", "lipothymie", "perte de connaissance", "PLS", "evanouissement", "inconscient respire"],
    categorie: "Urgence vitale",
    specialite: "Médecine générale",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Mettre la victime en sécurité, rechercher des signes de gravité et une cause simple (hypoglycémie, chaleur), puis orienter.",
    duree_cle: "Bilan et alerte < 5 min",
    etapes: [
      { ordre: 1, action: "Installer la victime : allongée si consciente, PLS si inconsciente qui respire", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Libérer les voies aériennes. Ne rien donner à boire à une victime inconsciente." },
      { ordre: 2, action: "Prendre les constantes et une glycémie capillaire", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Pouls, pression artérielle, SpO2, fréquence respiratoire, température, conscience. Rechercher un traumatisme associé à la chute." },
      { ordre: 3, action: "Interroger la victime ou les témoins", type: "bilan", delai_cible_min: null, criticite: "moyenne",
        details: "Circonstances, douleur thoracique, palpitations, traitements, antécédents, durée de la perte de connaissance, poste et ambiance (chaleur, produits)." },
      { ordre: 4, action: "Appeler le 15 et transmettre le bilan", type: "alerte", delai_cible_min: 5, criticite: "haute",
        details: "Systématique en cas de perte de connaissance, de signe de gravité ou de doute. Appliquer les consignes du médecin régulateur." },
      { ordre: 5, action: "Surveiller jusqu'à la prise en charge", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Ne pas laisser la victime seule ni la laisser reprendre son poste ou conduire. Tracer au registre de l'infirmerie." }
    ],
    criteres_alerte: [
      { libelle: "Perte de connaissance, même brève", conduite: "Appel du 15. Pas de reprise du poste sans avis médical." },
      { libelle: "Douleur thoracique, palpitations, essoufflement", conduite: "Appliquer le protocole douleur thoracique. Alerte du 15 sans délai." },
      { libelle: "Malaise pendant l'effort ou en ambiance chaude", conduite: "Évoquer un coup de chaleur ou une cause cardiaque. Alerte du 15." }
    ],
    scores_associes: ["Score de Glasgow"],
    references: ["INRS — Sauvetage secourisme du travail (SST)", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-douleur-thoracique",
    titre: "Douleur thoracique",
    motif: "Douleur ou oppression dans la poitrine",
    synonymes: ["douleur thoracique", "DT", "douleur poitrine", "oppression thoracique", "infarctus", "SCA", "angine de poitrine"],
    categorie: "Urgence vitale",
    specialite: "Cardiologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Considérer toute douleur thoracique comme un syndrome coronarien aigu jusqu'à preuve du contraire et déclencher le 15 sans attendre.",
    duree_cle: "Appel du 15 immédiat",
    etapes: [
      { ordre: 1, action: "Mettre au repos strict en position de confort", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Assis ou demi-assis. Arrêter toute activité, ne pas faire marcher la victime." },
      { ordre: 2, action: "Appeler le 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Heure de début de la douleur, caractéristiques, irradiation, sueurs, antécédents et traitements." },
      { ordre: 3, action: "Constantes et monitorage disponible", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Pouls, PA aux deux bras, SpO2, fréquence respiratoire. ECG uniquement si l'infirmerie en est équipée et selon protocole." },
      { ordre: 4, action: "Traitement uniquement sur avis du médecin régulateur ou selon protocole signé", type: "geste", delai_cible_min: null, criticite: "haute",
        details: "Oxygène seulement si SpO2 < 90 %. Faire préparer le DAE à proximité." },
      { ordre: 5, action: "Surveillance continue jusqu'à l'arrivée des secours", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Réévaluer conscience, respiration et douleur. Prêt à débuter une RCP." }
    ],
    criteres_alerte: [
      { libelle: "Perte de connaissance, arrêt respiratoire", conduite: "Protocole arrêt cardio-respiratoire : massage et DAE." },
      { libelle: "Douleur brutale et déchirante, asymétrie tensionnelle", conduite: "Évoquer une dissection aortique. Le signaler au 15." }
    ],
    scores_associes: [],
    references: ["Recommandations SFMU — douleur thoracique", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-avc",
    titre: "Suspicion d'AVC",
    motif: "Déficit neurologique brutal",
    synonymes: ["AVC", "accident vasculaire cerebral", "paralysie", "bouche de travers", "trouble de la parole", "FAST", "hemiplegie", "aphasie"],
    categorie: "Urgence vitale",
    specialite: "Neurologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Reconnaître un AVC, dater précisément le début et alerter immédiatement pour préserver l'accès à la revascularisation.",
    duree_cle: "Chaque minute compte",
    etapes: [
      { ordre: 1, action: "Repérer les signes avec FAST", type: "bilan", delai_cible_min: 2, criticite: "critique",
        details: "Face : bouche déviée. Arm : faiblesse d'un bras. Speech : trouble de la parole. Time : noter l'heure." },
      { ordre: 2, action: "Noter l'heure de début ou de la dernière fois vue normale", type: "bilan", delai_cible_min: 2, criticite: "critique",
        details: "Donnée déterminante pour la filière neurovasculaire. Interroger les collègues." },
      { ordre: 3, action: "Appeler le 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Annoncer une suspicion d'AVC et l'heure de début." },
      { ordre: 4, action: "Glycémie capillaire et constantes", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Écarter une hypoglycémie qui peut imiter un AVC. PA, pouls, SpO2." },
      { ordre: 5, action: "Laisser à jeun, allongé·e, et surveiller", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Rien à boire ni à manger (risque de fausse route). PLS si troubles de conscience." }
    ],
    criteres_alerte: [
      { libelle: "Déficit qui régresse en quelques minutes", conduite: "Accident ischémique transitoire possible : appel du 15 quand même, urgence identique." },
      { libelle: "Céphalée brutale et intense, vomissements", conduite: "Évoquer une hémorragie cérébrale. Alerte du 15 immédiate." }
    ],
    scores_associes: ["FAST"],
    references: ["HAS — AVC, prise en charge précoce", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-hemorragie",
    titre: "Hémorragie externe",
    motif: "Saignement abondant",
    synonymes: ["hemorragie", "saignement", "plaie qui saigne", "garrot", "compression", "coupure profonde"],
    categorie: "Traumatologie",
    specialite: "Traumatologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Arrêter le saignement le plus vite possible et prévenir la détresse circulatoire.",
    duree_cle: "Compression immédiate",
    etapes: [
      { ordre: 1, action: "Se protéger et comprimer directement la plaie", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Gants. Compression manuelle ferme, puis pansement compressif." },
      { ordre: 2, action: "Allonger la victime", type: "geste", delai_cible_min: 1, criticite: "haute",
        details: "Prévenir la détresse circulatoire, couvrir pour éviter le refroidissement." },
      { ordre: 3, action: "Garrot si la compression est inefficace ou impossible (membre)", type: "geste", delai_cible_min: 3, criticite: "critique",
        details: "Au-dessus de la plaie, noter l'heure de pose. Ne jamais le desserrer." },
      { ordre: 4, action: "Appeler le 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Localisation, abondance, mécanisme (machine, outil), heure de pose du garrot." },
      { ordre: 5, action: "Surveiller pouls, PA, conscience, coloration", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Signes de choc : pouls rapide, pâleur, sueurs, agitation." }
    ],
    criteres_alerte: [
      { libelle: "Section ou amputation d'un segment de membre", conduite: "Conserver le segment dans un sac propre, posé sur de la glace sans contact direct. Le confier aux secours." },
      { libelle: "Signes de choc", conduite: "Allonger, jambes surélevées si pas de traumatisme, alerte immédiate." }
    ],
    scores_associes: [],
    references: ["INRS — Sauvetage secourisme du travail (SST)", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-brulure-thermique",
    titre: "Brûlure thermique",
    motif: "Brûlure par la chaleur",
    synonymes: ["brulure", "brule", "chaleur", "flamme", "liquide brulant", "vapeur", "four", "soudure"],
    categorie: "Brûlures et produits chimiques",
    specialite: "Brûlures",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Refroidir tôt pour limiter la profondeur de la brûlure, évaluer la gravité et orienter.",
    duree_cle: "Refroidir dans la minute",
    etapes: [
      { ordre: 1, action: "Refroidir à l'eau courante tempérée (15 à 25 °C) au moins 15 minutes", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Le plus tôt possible. Ne pas utiliser d'eau glacée. Éviter l'hypothermie sur les grandes surfaces." },
      { ordre: 2, action: "Retirer vêtements et bijoux non collés", type: "geste", delai_cible_min: 2, criticite: "haute",
        details: "Avant l'apparition de l'œdème. Ne jamais arracher ce qui adhère à la peau." },
      { ordre: 3, action: "Évaluer la gravité", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Surface (paume de la victime = 1 %), profondeur (cloques, peau blanche ou cartonnée), localisation (visage, mains, plis, organes génitaux)." },
      { ordre: 4, action: "Brûlure grave : appeler le 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Voir les critères d'alerte." },
      { ordre: 5, action: "Brûlure simple : pansement selon protocole et orientation", type: "geste", delai_cible_min: null, criticite: "moyenne",
        details: "Ne pas percer les cloques. Vérifier la vaccination antitétanique. Déclaration d'AT." }
    ],
    criteres_alerte: [
      { libelle: "Surface supérieure à la moitié de la paume, cloque ou peau carbonisée", conduite: "Brûlure grave : appel du 15." },
      { libelle: "Visage, cou, mains, pieds, articulations, organes génitaux", conduite: "Avis médical systématique, appel du 15." },
      { libelle: "Toux, voix rauque, suie dans le nez ou la bouche", conduite: "Brûlure des voies respiratoires possible : urgence vitale." }
    ],
    scores_associes: ["Règle de la paume (1 %)"],
    references: ["INRS — Sauvetage secourisme du travail (SST)", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-chimique-peau",
    titre: "Projection chimique sur la peau",
    motif: "Contact cutané avec un produit chimique",
    synonymes: ["produit chimique", "acide", "base", "soude", "projection", "brulure chimique", "corrosif", "FDS"],
    categorie: "Brûlures et produits chimiques",
    specialite: "Toxicologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Éliminer le produit par un rinçage abondant et immédiat, identifier le produit et suivre la fiche de données de sécurité.",
    duree_cle: "Rinçage immédiat ≥ 15 min",
    etapes: [
      { ordre: 1, action: "Se protéger (gants, lunettes) avant d'approcher", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Ne pas devenir une seconde victime." },
      { ordre: 2, action: "Retirer les vêtements contaminés et rincer abondamment à l'eau au moins 15 minutes", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Douche de sécurité si disponible. Rincer de haut en bas, sans frotter." },
      { ordre: 3, action: "Identifier le produit et consulter la FDS (section 4)", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Certains produits imposent une conduite spécifique (acide fluorhydrique : gel de gluconate de calcium selon protocole)." },
      { ordre: 4, action: "Appeler le 15 ou le centre antipoison selon la gravité", type: "alerte", delai_cible_min: 10, criticite: "haute",
        details: "Transmettre le nom du produit, la FDS, la surface atteinte, la durée de contact." },
      { ordre: 5, action: "Tracer et déclarer", type: "suivi", delai_cible_min: null, criticite: "moyenne",
        details: "Déclaration d'AT. Signaler au médecin du travail pour la mise à jour de l'évaluation du risque chimique." }
    ],
    criteres_alerte: [
      { libelle: "Acide fluorhydrique, même petite surface", conduite: "Urgence spécifique : protocole dédié, appel du 15." },
      { libelle: "Grande surface, signes généraux, malaise", conduite: "Appel du 15 en poursuivant le rinçage." }
    ],
    scores_associes: [],
    references: ["INRS — Risque chimique, conduite en cas d'accident", "Fiche de données de sécurité du produit", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-chimique-oeil",
    titre: "Projection dans l'œil",
    motif: "Produit, poussière ou corps étranger dans l'œil",
    synonymes: ["oeil", "yeux", "projection oculaire", "corps etranger", "rince-oeil", "lentilles", "brulure oculaire"],
    categorie: "Brûlures et produits chimiques",
    specialite: "Ophtalmologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Rincer immédiatement et longuement pour limiter les lésions de la cornée, puis faire examiner.",
    duree_cle: "Rinçage immédiat ≥ 15 min",
    etapes: [
      { ordre: 1, action: "Rincer immédiatement à l'eau ou au sérum physiologique au moins 15 minutes", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Douche oculaire ou rince-œil. Paupières maintenues écartées, de l'angle interne vers l'extérieur, œil sain protégé." },
      { ordre: 2, action: "Retirer les lentilles de contact si possible", type: "geste", delai_cible_min: 2, criticite: "haute",
        details: "Sans retarder le rinçage." },
      { ordre: 3, action: "Ne pas frotter, ne pas chercher à retirer un corps étranger fiché", type: "geste", delai_cible_min: null, criticite: "haute",
        details: "Pansement oculaire non compressif sur les deux yeux si corps étranger fiché." },
      { ordre: 4, action: "Identifier le produit (FDS) et alerter", type: "alerte", delai_cible_min: 10, criticite: "haute",
        details: "Produit chimique : 15 ou centre antipoison. Orientation ophtalmologique en urgence." }
    ],
    criteres_alerte: [
      { libelle: "Produit basique ou corrosif (soude, chaux, ciment)", conduite: "Lésions graves possibles : rinçage prolongé et ophtalmologie en urgence." },
      { libelle: "Baisse de vision, douleur intense, corps étranger métallique projeté", conduite: "Urgence ophtalmologique." }
    ],
    scores_associes: [],
    references: ["INRS — Projections oculaires", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-electrisation",
    titre: "Électrisation",
    motif: "Contact avec le courant électrique",
    synonymes: ["electrisation", "electrocution", "courant", "electrique", "arc electrique", "decharge"],
    categorie: "Traumatologie",
    specialite: "Traumatologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Supprimer le danger avant tout contact, traiter la détresse vitale et faire surveiller toute victime, même sans symptôme.",
    duree_cle: "Couper le courant d'abord",
    etapes: [
      { ordre: 1, action: "Couper le courant ou faire couper par une personne habilitée", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Ne jamais toucher la victime tant qu'elle est en contact avec la source. Haute tension : ne pas approcher." },
      { ordre: 2, action: "Bilan vital", type: "bilan", delai_cible_min: 2, criticite: "critique",
        details: "Arrêt cardiaque : protocole ACR et DAE. Inconscient qui respire : PLS." },
      { ordre: 3, action: "Appeler le 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Systématique, même si la victime semble aller bien : risque de trouble du rythme retardé." },
      { ordre: 4, action: "Rechercher les points d'entrée et de sortie, les brûlures et un traumatisme associé", type: "bilan", delai_cible_min: null, criticite: "haute",
        details: "Chute de hauteur possible : immobiliser si doute." }
    ],
    criteres_alerte: [
      { libelle: "Toute électrisation", conduite: "Avis médical et surveillance cardiaque, même sans symptôme." }
    ],
    scores_associes: [],
    references: ["INRS — Risque électrique", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-trauma",
    titre: "Chute, traumatisme grave",
    motif: "Chute de hauteur, choc violent, écrasement",
    synonymes: ["chute", "chute de hauteur", "traumatisme", "fracture", "rachis", "colonne", "ecrasement", "trauma cranien"],
    categorie: "Traumatologie",
    specialite: "Traumatologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Ne pas aggraver une lésion de la colonne vertébrale, rechercher les détresses et alerter.",
    duree_cle: "Ne pas mobiliser",
    etapes: [
      { ordre: 1, action: "Sécuriser la zone et ne pas déplacer la victime", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Sauf danger immédiat (incendie, effondrement)." },
      { ordre: 2, action: "Maintenir la tête dans l'axe", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Mains de chaque côté de la tête, sans traction." },
      { ordre: 3, action: "Bilan vital et appel du 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Hauteur de chute, mécanisme, conscience, respiration, douleurs, sensibilité et motricité des membres." },
      { ordre: 4, action: "Couvrir, rassurer, surveiller", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Ne rien donner à boire. Noter toute évolution de la conscience." }
    ],
    criteres_alerte: [
      { libelle: "Perte de connaissance, vomissements, confusion après un choc à la tête", conduite: "Traumatisme crânien grave possible : 15." },
      { libelle: "Fourmillements ou paralysie des membres", conduite: "Lésion de la moelle possible : immobilité stricte, 15." }
    ],
    scores_associes: ["Score de Glasgow"],
    references: ["INRS — Sauvetage secourisme du travail (SST)", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-chaleur",
    titre: "Coup de chaleur",
    motif: "Malaise en ambiance chaude",
    synonymes: ["chaleur", "coup de chaleur", "canicule", "hyperthermie", "deshydratation", "insolation", "fonderie", "four"],
    categorie: "Environnement de travail",
    specialite: "Médecine du travail",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Refroidir activement et rapidement : le coup de chaleur est une urgence vitale.",
    duree_cle: "Refroidir sans attendre",
    etapes: [
      { ordre: 1, action: "Installer dans un endroit frais et ombragé, retirer les vêtements de travail", type: "geste", delai_cible_min: 2, criticite: "critique",
        details: "Arrêt immédiat de l'activité." },
      { ordre: 2, action: "Prendre la température et la conscience", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Confusion, propos incohérents, peau chaude : coup de chaleur." },
      { ordre: 3, action: "Refroidir activement", type: "geste", delai_cible_min: 5, criticite: "critique",
        details: "Brumiser ou mouiller la peau et ventiler, linges humides, poches de froid aux plis (aisselles, aine)." },
      { ordre: 4, action: "Faire boire de l'eau par petites gorgées si la victime est consciente", type: "geste", delai_cible_min: null, criticite: "moyenne",
        details: "Jamais si troubles de conscience." },
      { ordre: 5, action: "Appeler le 15 en cas de signe de gravité", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Voir les critères d'alerte." }
    ],
    criteres_alerte: [
      { libelle: "Confusion, agitation, convulsions, perte de connaissance", conduite: "Coup de chaleur : 15 immédiat et refroidissement continu." },
      { libelle: "Température élevée qui ne baisse pas", conduite: "Appel du 15." }
    ],
    scores_associes: [],
    references: ["INRS — Travail à la chaleur", "Plan canicule de l'entreprise", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-inhalation",
    titre: "Intoxication par inhalation",
    motif: "Gaz, fumées, monoxyde de carbone, espace confiné",
    synonymes: ["intoxication", "gaz", "fumees", "monoxyde de carbone", "CO", "H2S", "espace confine", "cuve", "inhalation"],
    categorie: "Environnement de travail",
    specialite: "Toxicologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Ne pas multiplier les victimes, soustraire la victime à l'atmosphère toxique par des moyens adaptés et alerter.",
    duree_cle: "Protection des sauveteurs d'abord",
    etapes: [
      { ordre: 1, action: "Ne pas entrer sans appareil respiratoire isolant ni formation", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "En espace confiné, plus de la moitié des victimes sont des sauveteurs. Appliquer la procédure de sauvetage prévue." },
      { ordre: 2, action: "Alerter le 15 et le 18", type: "alerte", delai_cible_min: 2, criticite: "critique",
        details: "Nature du gaz ou du produit, nombre de victimes, accès." },
      { ordre: 3, action: "Aérer et extraire la victime si cela peut se faire sans risque", type: "geste", delai_cible_min: null, criticite: "critique",
        details: "Couper la source si possible (moteur, appareil de chauffage)." },
      { ordre: 4, action: "Bilan vital, oxygène selon protocole", type: "geste", delai_cible_min: 5, criticite: "haute",
        details: "Monoxyde de carbone : oxygène à haut débit selon protocole signé. La SpO2 peut être faussement normale." },
      { ordre: 5, action: "Contacter le centre antipoison si produit identifié", type: "suivi", delai_cible_min: null, criticite: "moyenne",
        details: "Transmettre la FDS. Déclaration d'AT et signalement au médecin du travail." }
    ],
    criteres_alerte: [
      { libelle: "Plusieurs personnes avec maux de tête, nausées, malaise dans un même local", conduite: "Évoquer le monoxyde de carbone : évacuer, aérer, 15 et 18." }
    ],
    scores_associes: [],
    references: ["INRS ED 6184 — Interventions en espaces confinés", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-hypoglycemie",
    titre: "Hypoglycémie",
    motif: "Malaise chez une personne diabétique",
    synonymes: ["hypoglycemie", "diabete", "diabetique", "sucre", "glycemie", "insuline", "resucrage"],
    categorie: "Médical",
    specialite: "Endocrinologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Confirmer et corriger rapidement l'hypoglycémie, puis éviter la récidive.",
    duree_cle: "Resucrer < 5 min",
    etapes: [
      { ordre: 1, action: "Glycémie capillaire", type: "bilan", delai_cible_min: 2, criticite: "haute",
        details: "Hypoglycémie si inférieure à 0,70 g/L chez la personne diabétique traitée. Ne pas retarder le resucrage si le test est impossible." },
      { ordre: 2, action: "Personne consciente : resucrage oral (15 g de sucre)", type: "geste", delai_cible_min: 3, criticite: "critique",
        details: "Par exemple 3 morceaux de sucre ou un verre de jus de fruits." },
      { ordre: 3, action: "Personne inconsciente : PLS, rien par la bouche, 15", type: "alerte", delai_cible_min: 2, criticite: "critique",
        details: "Glucagon uniquement selon protocole signé ou trousse personnelle de la personne." },
      { ordre: 4, action: "Contrôler la glycémie 15 minutes après", type: "surveillance", delai_cible_min: 15, criticite: "haute",
        details: "Renouveler le resucrage si besoin, puis proposer une collation avec sucres lents." },
      { ordre: 5, action: "Pas de reprise d'un poste à risque ni de conduite avant normalisation", type: "suivi", delai_cible_min: null, criticite: "haute",
        details: "Informer le médecin du travail si les malaises se répètent (aménagement de poste)." }
    ],
    criteres_alerte: [
      { libelle: "Troubles de conscience, convulsions", conduite: "PLS, appel du 15, rien par la bouche." }
    ],
    scores_associes: [],
    references: ["Société francophone du diabète — hypoglycémie", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-convulsions",
    titre: "Crise convulsive",
    motif: "Mouvements convulsifs, crise d'épilepsie",
    synonymes: ["convulsion", "crise", "epilepsie", "comitiale", "spasmes"],
    categorie: "Médical",
    specialite: "Neurologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Protéger la personne pendant la crise, surveiller sa durée et la respiration.",
    duree_cle: "Chronométrer la crise",
    etapes: [
      { ordre: 1, action: "Protéger sans contenir", type: "geste", delai_cible_min: 1, criticite: "critique",
        details: "Éloigner les objets dangereux, protéger la tête. Ne rien mettre dans la bouche." },
      { ordre: 2, action: "Noter l'heure de début", type: "bilan", delai_cible_min: 1, criticite: "haute",
        details: "La durée oriente la conduite." },
      { ordre: 3, action: "Après la crise : PLS et surveillance de la respiration", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Phase de confusion et de somnolence habituelle. Glycémie capillaire." },
      { ordre: 4, action: "Appeler le 15 selon les critères d'alerte", type: "alerte", delai_cible_min: 5, criticite: "haute",
        details: "Traitement d'urgence uniquement selon protocole signé ou prescription personnelle." }
    ],
    criteres_alerte: [
      { libelle: "Crise de plus de 5 minutes ou crises successives", conduite: "Appel du 15 immédiat." },
      { libelle: "Première crise, traumatisme, grossesse, réveil anormal", conduite: "Appel du 15." }
    ],
    scores_associes: [],
    references: ["Ligue française contre l'épilepsie — conduite à tenir", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-anaphylaxie",
    titre: "Réaction allergique grave",
    motif: "Anaphylaxie, œdème, gêne respiratoire",
    synonymes: ["allergie", "anaphylaxie", "oedeme", "quincke", "piqure", "guepe", "urticaire", "adrenaline", "stylo"],
    categorie: "Médical",
    specialite: "Allergologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Reconnaître l'anaphylaxie et injecter l'adrénaline sans délai selon le protocole ou le stylo prescrit.",
    duree_cle: "Adrénaline sans délai",
    etapes: [
      { ordre: 1, action: "Reconnaître les signes", type: "bilan", delai_cible_min: 1, criticite: "critique",
        details: "Gonflement du visage ou de la gorge, gêne respiratoire, malaise, après piqûre, aliment ou médicament." },
      { ordre: 2, action: "Adrénaline intramusculaire (face externe de la cuisse)", type: "geste", delai_cible_min: 2, criticite: "critique",
        details: "Stylo auto-injecteur de la personne ou selon protocole signé par le médecin du travail." },
      { ordre: 3, action: "Appeler le 15", type: "alerte", delai_cible_min: 2, criticite: "critique",
        details: "Signaler l'injection et son heure." },
      { ordre: 4, action: "Position adaptée et surveillance", type: "surveillance", delai_cible_min: null, criticite: "haute",
        details: "Allongé·e jambes surélevées, ou assis·e si gêne respiratoire. Deuxième injection selon protocole si pas d'amélioration." }
    ],
    criteres_alerte: [
      { libelle: "Gêne respiratoire, voix modifiée, malaise", conduite: "Anaphylaxie : adrénaline et 15 sans attendre." }
    ],
    scores_associes: [],
    references: ["SFMU / Société française d'allergologie — anaphylaxie", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-asthme",
    titre: "Crise d'asthme",
    motif: "Gêne respiratoire sifflante",
    synonymes: ["asthme", "crise d'asthme", "sifflement", "bronchospasme", "ventoline", "dyspnee", "essoufflement"],
    categorie: "Médical",
    specialite: "Pneumologie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Soulager la crise avec le traitement de la personne et repérer une crise grave.",
    duree_cle: "Traitement inhalé immédiat",
    etapes: [
      { ordre: 1, action: "Installer en position assise, au calme, loin de l'agent déclenchant", type: "geste", delai_cible_min: 1, criticite: "haute",
        details: "Penser aux expositions professionnelles (farines, isocyanates, poussières)." },
      { ordre: 2, action: "Aider à prendre son bronchodilatateur", type: "geste", delai_cible_min: 2, criticite: "haute",
        details: "Traitement personnel de la personne, ou selon protocole signé." },
      { ordre: 3, action: "Constantes : SpO2, fréquence respiratoire, capacité à parler", type: "bilan", delai_cible_min: 5, criticite: "haute",
        details: "Réévaluer après 10 à 20 minutes." },
      { ordre: 4, action: "Appeler le 15 si pas d'amélioration ou signe de gravité", type: "alerte", delai_cible_min: 10, criticite: "critique",
        details: "Voir les critères d'alerte." },
      { ordre: 5, action: "Signaler au médecin du travail", type: "suivi", delai_cible_min: null, criticite: "moyenne",
        details: "Rechercher un asthme professionnel ou aggravé par le travail." }
    ],
    criteres_alerte: [
      { libelle: "Ne peut plus parler, lèvres bleues, épuisement, SpO2 basse", conduite: "Crise grave : 15 immédiat." }
    ],
    scores_associes: [],
    references: ["HAS — prise en charge de l'asthme", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-aes",
    titre: "Accident d'exposition au sang",
    motif: "Piqûre, coupure ou projection de sang ou liquide biologique",
    synonymes: ["AES", "piqure", "aiguille", "sang", "exposition", "coupure", "projection", "VIH", "hepatite"],
    categorie: "Infectieux",
    specialite: "Maladies infectieuses",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Réduire le risque de transmission virale par les premiers soins et un avis médical rapide pour un éventuel traitement post-exposition.",
    duree_cle: "Avis médical idéalement < 4 h",
    etapes: [
      { ordre: 1, action: "Ne pas faire saigner, nettoyer à l'eau et au savon puis rincer", type: "geste", delai_cible_min: 2, criticite: "critique",
        details: "Piqûre ou coupure." },
      { ordre: 2, action: "Antisepsie au moins 5 minutes", type: "geste", delai_cible_min: 5, criticite: "critique",
        details: "Dakin, ou à défaut alcool à 70°, ou polyvidone iodée dermique." },
      { ordre: 3, action: "Projection sur les muqueuses : rinçage abondant au moins 5 minutes", type: "geste", delai_cible_min: 2, criticite: "critique",
        details: "Eau ou sérum physiologique." },
      { ordre: 4, action: "Avis urgent du référent AES ou des urgences", type: "alerte", delai_cible_min: 240, criticite: "critique",
        details: "Évaluation du risque et traitement post-exposition éventuel : idéalement dans les 4 heures, au plus tard 48 heures." },
      { ordre: 5, action: "Déclarer l'accident du travail et organiser le suivi", type: "suivi", delai_cible_min: null, criticite: "haute",
        details: "Statut sérologique de la personne source si possible, avec son accord. Suivi sérologique selon le protocole." }
    ],
    criteres_alerte: [
      { libelle: "Piqûre profonde, aiguille creuse, sang visible", conduite: "Risque élevé : avis médical sans délai." }
    ],
    scores_associes: [],
    references: ["INRS — Accidents d'exposition au sang", "GERES — conduite à tenir", "Protocole signé du service — à compléter"]
  },

  {
    id: "proto-detresse-psy",
    titre: "Détresse psychique, crise suicidaire",
    motif: "Personne en crise, idées suicidaires, choc émotionnel",
    synonymes: ["suicide", "idees suicidaires", "detresse", "crise", "angoisse", "panique", "choc emotionnel", "psychique", "3114"],
    categorie: "Psychique",
    specialite: "Psychiatrie",
    version: "0.1", date_maj: "2026-11-11", statut: "non_valide", valide_par: null,
    objectif: "Accueillir, évaluer le danger, ne pas laisser seule une personne en crise suicidaire et organiser une prise en charge.",
    duree_cle: "Ne pas laisser seul·e",
    etapes: [
      { ordre: 1, action: "Accueillir dans un lieu calme et écouter sans juger", type: "geste", delai_cible_min: null, criticite: "haute",
        details: "Poser la question directement (« Pensez-vous au suicide ? ») n'augmente pas le risque." },
      { ordre: 2, action: "Évaluer le risque, l'urgence et la dangerosité", type: "bilan", delai_cible_min: null, criticite: "critique",
        details: "Projet, moyen accessible, date envisagée, isolement, facteurs de protection." },
      { ordre: 3, action: "Danger imminent : ne pas laisser seul·e et appeler le 15", type: "alerte", delai_cible_min: 5, criticite: "critique",
        details: "Éloigner les moyens létaux accessibles. Le 3114 peut aussi conseiller les professionnels." },
      { ordre: 4, action: "Sans danger imminent : orientation accompagnée", type: "suivi", delai_cible_min: null, criticite: "haute",
        details: "Médecin du travail, médecin traitant, 3114. Convenir d'un rappel. Tracer sans détail superflu." },
      { ordre: 5, action: "Après un événement traumatisant au travail : soutien de l'équipe", type: "suivi", delai_cible_min: null, criticite: "moyenne",
        details: "Informer le médecin du travail, proposer un soutien psychologique, cellule d'écoute si elle existe." }
    ],
    criteres_alerte: [
      { libelle: "Projet précis, moyen à disposition, passage à l'acte imminent", conduite: "Urgence : présence constante et appel du 15." }
    ],
    scores_associes: ["Évaluation RUD (risque, urgence, dangerosité)"],
    references: ["HAS — crise suicidaire", "3114 — Numéro national de prévention du suicide", "Protocole signé du service — à compléter"]
  }

];
