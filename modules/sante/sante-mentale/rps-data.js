/* ════════════════════════════════════════════════════════════════
   PréventIA Protect · Diagnostic RPS — QUESTIONNAIRES ANONYMES
   Source unique des questions, partagée par :
     • rps.html          (saisie sur place en mode kiosque + tableau de bord)
     • enquete-rps.html  (réponse à distance par lien / QR code, Supabase UE)
     • indicateurs-rps.html (indicateurs RH pré-remplis par l'entreprise)
   Ne pas changer l'ordre des items : les réponses sont enregistrées par position.
   ════════════════════════════════════════════════════════════════ */
window.RPSQ=(function(){
// Baromètre : 24 items (4 par facteur), échelle 0-3. inv = item positif (risque = 3 - réponse)
const ITEMS=[
 {f:'f1',t:"Je dois travailler très vite."},
 {f:'f1',t:"Je manque de temps pour faire correctement mon travail."},
 {f:'f7',t:"Je dépasse mes horaires ou je travaille sur mon temps de repos."},
 {f:'f1',t:"Je suis souvent interrompu·e dans mon travail."},
 {f:'f2',t:"Je suis confronté·e à des situations difficiles sur le plan émotionnel (détresse, colère, souffrance)."},
 {f:'f2',t:"Je dois cacher mes émotions ou faire semblant d'être de bonne humeur."},
 {f:'f2',t:"Je subis des tensions ou de l'agressivité de la part du public, des clients ou des usagers."},
 {f:'f2',t:"J'ai peur pendant mon travail (accident, agression, erreur grave)."},
 {f:'f3',t:"Je peux organiser mon travail comme je l'entends.",inv:1},
 {f:'f3',t:"J'ai la possibilité d'apprendre et de développer mes compétences.",inv:1},
 {f:'f3',t:"Je peux donner mon avis sur les décisions qui concernent mon travail.",inv:1},
 {f:'f3',t:"Mon travail est répétitif et monotone."},
 {f:'f4',t:"Je peux compter sur l'aide de mes collègues.",inv:1},
 {f:'f4',t:"Mon ou ma responsable m'aide à mener à bien mon travail.",inv:1},
 {f:'f4',t:"Mon travail est reconnu à sa juste valeur.",inv:1},
 {f:'f4',t:"Je subis des comportements hostiles, méprisants ou humiliants au travail."},
 {f:'f5',t:"Je dois faire des choses que je désapprouve."},
 {f:'f5',t:"Je n'ai pas les moyens de faire un travail de qualité."},
 {f:'f5',t:"J'ai le sentiment que mon travail est inutile."},
 {f:'f5',t:"On me demande des choses contradictoires."},
 {f:'f6',t:"Je crains de perdre mon emploi."},
 {f:'f6',t:"Mon travail a changé sans que j'aie été informé·e ou consulté·e."},
 {f:'f6',t:"Je ne sais pas comment mon travail va évoluer dans les prochains mois."},
 {f:'f6',t:"Je crains de ne pas pouvoir tenir dans ce travail jusqu'à ma retraite."},
 {f:'f7',t:"Mes horaires (nuit, décalés, changements de planning) sont difficiles à concilier avec ma vie personnelle."}
];
const HEALTH=[
 {k:'h1',t:"Ces dernières semaines, je me suis senti·e épuisé·e par mon travail."},
 {k:'h2',t:"Mon travail a des effets négatifs sur mon sommeil ou ma santé."}
];
const LIK=['Jamais','Parfois','Souvent','Toujours'];

// COPSOQ — version courte française V3 : 46 items, 24 échelles, 6 domaines (Dupret, Bocéréan et al., Santé Publique 2012 ; fiche INRS FRPS 36).
// ⚠ LIBELLÉS DE TRAVAIL : la structure, les échelles de réponse et la cotation suivent la version validée, mais les formulations
// ci-dessous doivent être remplacées par les libellés officiels (annexe 2 de l'article, disponible sur copsoq-network.org) avant tout usage.
// Passer COPSOQ_OFFICIEL à true une fois les libellés vérifiés.
const COPSOQ_OFFICIEL=false;
// Modalités listées de la plus haute à la plus basse : valeur = (nb modalités - 1) - rang. Score d'échelle = moyenne ramenée sur 0-100.
const COP_SETS={
 freq:['Toujours','Souvent','Parfois','Rarement','Jamais ou presque'],
 mesure:['Dans une très grande mesure','Dans une grande mesure','Dans une certaine mesure','Dans une faible mesure','Dans une très faible mesure'],
 abs:['Tout le temps','Une bonne partie du temps','Une partie du temps','Une petite partie du temps','Jamais'],
 fam:['Oui, certainement','Oui, dans une certaine mesure','Oui, mais très peu','Non, pas du tout'],
 sante:['Excellente','Très bonne','Bonne','Passable','Mauvaise'],
 satis:['Très satisfait·e','Satisfait·e','Insatisfait·e','Très insatisfait·e']
};
// risk : true = un score élevé est défavorable. f = facteur Gollac alimenté (null = indicateur de santé / vécu).
const COP=[
 {k:'charge',l:'Charge de travail',dom:'Contraintes quantitatives',set:'freq',risk:1,f:'f1',items:[{t:"Êtes-vous en retard dans votre travail ?"},{t:"Avez-vous suffisamment de temps pour accomplir toutes vos tâches ?",rev:1}]},
 {k:'rythme',l:'Rythme de travail',dom:'Contraintes quantitatives',set:'freq',risk:1,f:'f1',items:[{t:"Devez-vous travailler très vite ?"},{t:"Travaillez-vous à un rythme élevé tout au long de la journée ?"}]},
 {k:'cognitif',l:'Exigences cognitives',dom:'Contraintes quantitatives',set:'freq',risk:1,f:'f1',items:[{t:"Votre travail exige-t-il que vous restiez constamment attentif·ve ?"},{t:"Votre travail exige-t-il de vous souvenir de beaucoup de choses ?"}]},
 {k:'emotion',l:'Exigences émotionnelles',dom:'Santé et bien-être',set:'freq',risk:1,f:'f2',items:[{t:"Votre travail vous place-t-il dans des situations émotionnellement perturbantes ?"},{t:"Votre travail est-il éprouvant sur le plan émotionnel ?"}]},
 {k:'confiance_col',l:'Confiance entre collègues',dom:'Relations horizontales',set:'mesure',f:'f4',items:[{t:"Les collègues coopèrent-ils bien entre eux ?"},{t:"Les collègues se font-ils confiance les uns aux autres ?"}]},
 {k:'soutien_col',l:'Soutien des collègues',dom:'Relations horizontales',set:'freq',f:'f4',items:[{t:"Vos collègues sont-ils à l'écoute de vos problèmes au travail ?"},{t:"Recevez-vous de l'aide et du soutien de vos collègues ?"}]},
 {k:'marge',l:'Marge de manœuvre',dom:'Autonomie',set:'mesure',f:'f3',items:[{t:"Avez-vous une influence importante sur les décisions qui concernent votre travail ?"},{t:"Avez-vous une influence sur la quantité de travail qui vous est confiée ?"}]},
 {k:'developpement',l:'Possibilités de développement',dom:'Autonomie',set:'mesure',f:'f3',items:[{t:"Votre travail vous permet-il de prendre des initiatives ?"},{t:"Votre travail vous permet-il d'apprendre de nouvelles choses ?"}]},
 {k:'previsibilite',l:'Prévisibilité',dom:'Organisation et leadership',set:'mesure',f:'f6',items:[{t:"Êtes-vous informé·e suffisamment à l'avance des décisions importantes, des changements ou des projets ?"},{t:"Recevez-vous toutes les informations dont vous avez besoin pour bien faire votre travail ?"}]},
 {k:'reconnaissance',l:'Reconnaissance',dom:'Organisation et leadership',set:'mesure',f:'f4',items:[{t:"Votre travail est-il reconnu et apprécié par la direction ?"},{t:"Êtes-vous traité·e équitablement dans votre travail ?"}]},
 {k:'equite',l:'Équité',dom:'Organisation et leadership',set:'mesure',f:'f4',items:[{t:"Les conflits sont-ils résolus de façon équitable ?"},{t:"Le travail est-il réparti équitablement ?"}]},
 {k:'clarte',l:'Clarté des rôles',dom:'Organisation et leadership',set:'mesure',f:'f5',items:[{t:"Votre travail a-t-il des objectifs clairs ?"},{t:"Savez-vous exactement ce que l'on attend de vous au travail ?"}]},
 {k:'conflit_roles',l:'Conflits de rôles',dom:'Organisation et leadership',set:'mesure',risk:1,f:'f5',items:[{t:"Vous impose-t-on des exigences contradictoires au travail ?"},{t:"Devez-vous parfois faire des choses qui devraient être faites autrement ?"}]},
 {k:'leadership',l:'Qualité du leadership',dom:'Organisation et leadership',set:'mesure',f:'f4',items:[{t:"Votre supérieur·e accorde-t-il·elle une grande importance au bien-être au travail des salariés ?"},{t:"Votre supérieur·e est-il·elle compétent·e pour planifier le travail ?"}]},
 {k:'soutien_sup',l:'Soutien du supérieur',dom:'Organisation et leadership',set:'freq',f:'f4',items:[{t:"Votre supérieur·e est-il·elle à l'écoute de vos problèmes au travail ?"},{t:"Recevez-vous de l'aide et du soutien de votre supérieur·e ?"}]},
 {k:'confiance_dir',l:'Confiance salariés / direction',dom:'Organisation et leadership',set:'mesure',f:'f4',items:[{t:"La direction fait-elle confiance aux salariés pour bien faire leur travail ?"},{t:"Pouvez-vous faire confiance aux informations qui viennent de la direction ?"}]},
 {k:'sante',l:'Santé auto-évaluée',dom:'Santé et bien-être',set:'sante',f:null,items:[{t:"De manière générale, diriez-vous que votre santé est :"}]},
 {k:'stress',l:'Stress',dom:'Santé et bien-être',set:'abs',risk:1,f:null,items:[{t:"Au cours des 4 dernières semaines, à quelle fréquence vous êtes-vous senti·e stressé·e ?"},{t:"Au cours des 4 dernières semaines, à quelle fréquence vous êtes-vous senti·e irritable ?"}]},
 {k:'epuisement',l:'Épuisement',dom:'Santé et bien-être',set:'abs',risk:1,f:null,items:[{t:"Au cours des 4 dernières semaines, à quelle fréquence vous êtes-vous senti·e physiquement épuisé·e ?"},{t:"Au cours des 4 dernières semaines, à quelle fréquence vous êtes-vous senti·e émotionnellement épuisé·e ?"}]},
 {k:'famille',l:'Conflit travail / vie privée',dom:'Santé et bien-être',set:'fam',risk:1,f:'f7',items:[{t:"Sentez-vous que votre travail vous prend tellement d'énergie que cela a des répercussions négatives sur votre vie privée ?"},{t:"Sentez-vous que votre travail vous prend tellement de temps que cela a des répercussions négatives sur votre vie privée ?"}]},
 {k:'insecurite',l:'Insécurité de l\'emploi',dom:'Santé et bien-être',set:'mesure',risk:1,f:'f6',items:[{t:"Êtes-vous inquiet·e de perdre votre emploi ?"},{t:"Êtes-vous inquiet·e d'être muté·e contre votre volonté ?"}]},
 {k:'sens',l:'Sens du travail',dom:'Vécu professionnel',set:'mesure',f:'f5',items:[{t:"Votre travail a-t-il du sens pour vous ?"},{t:"Avez-vous le sentiment que le travail que vous faites est important ?"}]},
 {k:'engagement',l:'Engagement dans l\'entreprise',dom:'Vécu professionnel',set:'mesure',f:null,items:[{t:"Recommanderiez-vous à un·e ami·e de postuler dans votre entreprise ?"},{t:"Avez-vous le sentiment que votre entreprise a une grande importance pour vous ?"}]},
 {k:'satisfaction',l:'Satisfaction au travail',dom:'Vécu professionnel',set:'satis',f:null,items:[{t:"Dans l'ensemble, êtes-vous satisfait·e de votre travail ?"}]}
];
const COP_ITEMS=COP.flatMap(s=>s.items.map(it=>({...it,s:s.k,set:s.set})));
// Indicateurs (d'après INRS ED 6012 « Dépister les RPS – des indicateurs pour vous guider »)
const IND=[
 {k:'abs',g:'Fonctionnement de l\'entreprise',l:'Taux d\'absentéisme',u:'%',thr:5,f:['f1','f4']},
 {k:'arrets_courts',g:'Fonctionnement de l\'entreprise',l:'Arrêts courts (moins de 3 jours)',u:'nb',f:['f1','f4']},
 {k:'turnover',g:'Fonctionnement de l\'entreprise',l:'Taux de rotation du personnel',u:'%',thr:15,f:['f4','f6']},
 {k:'demissions',g:'Fonctionnement de l\'entreprise',l:'Démissions et ruptures conventionnelles',u:'nb',f:['f4','f5']},
 {k:'mobilite',g:'Fonctionnement de l\'entreprise',l:'Demandes de mobilité interne',u:'nb',f:['f4']},
 {k:'hsup',g:'Fonctionnement de l\'entreprise',l:'Heures supplémentaires par salarié et par an',u:'h',thr:220,f:['f1','f7']},
 {k:'conges',g:'Fonctionnement de l\'entreprise',l:'Jours de congés non pris par salarié',u:'j',f:['f1','f7']},
 {k:'postes_vacants',g:'Fonctionnement de l\'entreprise',l:'Postes vacants ou difficiles à pourvoir',u:'nb',f:['f1','f6']},
 {k:'reorg',g:'Fonctionnement de l\'entreprise',l:'Réorganisations, déménagements ou changements d\'outils dans l\'année',u:'nb',thr:2,f:['f6','f1']},
 {k:'entretiens',g:'Fonctionnement de l\'entreprise',l:'Entretiens annuels ou professionnels non réalisés',u:'%',thr:20,f:['f3','f4']},
 {k:'plaintes',g:'Fonctionnement de l\'entreprise',l:'Plaintes et réclamations des clients ou usagers',u:'nb',f:['f2','f5']},
 {k:'isoles',g:'Fonctionnement de l\'entreprise',l:'Postes en travail isolé',u:'nb',f:['f2','f4']},
 {k:'precaires',g:'Fonctionnement de l\'entreprise',l:'Part d\'intérim et de CDD',u:'%',thr:15,f:['f6']},
 {k:'conflits',g:'Fonctionnement de l\'entreprise',l:'Conflits collectifs, grèves, débrayages',u:'nb',thr:1,f:['f4','f6']},
 {k:'sanctions',g:'Fonctionnement de l\'entreprise',l:'Procédures disciplinaires',u:'nb',f:['f4']},
 {k:'at',g:'Santé et sécurité',l:'Accidents du travail avec arrêt',u:'nb',f:['f1']},
 {k:'tf',g:'Santé et sécurité',l:'Taux de fréquence des AT (TF)',u:'',f:['f1'],calc:'AT avec arrêt × 1 000 000 ÷ heures travaillées'},
 {k:'tg',g:'Santé et sécurité',l:'Taux de gravité des AT (TG)',u:'',f:['f1'],calc:'Jours d\'arrêt × 1 000 ÷ heures travaillées'},
 {k:'vad',g:'Santé et sécurité',l:'Visites à la demande du salarié (SPST)',u:'nb',f:['f1','f4']},
 {k:'inf',g:'Santé et sécurité',l:'Passages infirmerie pour stress ou mal-être',u:'nb',f:['f1','f2','f4']},
 {k:'inapt',g:'Santé et sécurité',l:'Inaptitudes et restrictions d\'aptitude',u:'nb',f:['f1']},
 {k:'arrets_longs',g:'Santé et sécurité',l:'Arrêts maladie de plus de 30 jours',u:'nb',f:['f1','f4']},
 {k:'amenag',g:'Santé et sécurité',l:'Demandes d\'aménagement de poste',u:'nb',f:['f1','f3']},
 {k:'violences_ext',g:'Santé et sécurité',l:'Agressions et incivilités du public déclarées',u:'nb',thr:1,f:['f2']},
 {k:'harc',g:'Santé et sécurité',l:'Signalements de harcèlement ou de violences internes',u:'nb',thr:1,crit:1,f:['f4']},
 {k:'psy',g:'Santé et sécurité',l:'Affections psychiques déclarées en AT ou MP',u:'nb',thr:1,crit:1,f:['f1','f4']},
 {k:'grave',g:'Santé et sécurité',l:'Événements graves (tentative de suicide, décompensation au travail)',u:'nb',thr:1,crit:1,f:['f1','f2','f4','f5','f6']}
];

// Indicateurs suivis PAR ÉQUIPE (comparés à la valeur de l'entreprise)
const EQ_IND=[
 {k:'abs',l:'Absentéisme',u:'%',taux:1},{k:'turnover',l:'Départs',u:'%',taux:1},{k:'hsup',l:'Heures sup. / salarié',u:'h',taux:1},
 {k:'arrets_courts',l:'Arrêts courts',u:'nb'},{k:'inf',l:'Passages infirmerie (stress, mal-être)',u:'nb'},{k:'violences_ext',l:'Agressions du public',u:'nb'}
];
// Indicateurs propres au service de santé au travail : non demandés aux RH (page indicateurs-rps.html)
const IND_SPST=['vad','inf'];

return {ITEMS,HEALTH,LIK,COPSOQ_OFFICIEL,COP_SETS,COP,COP_ITEMS,IND,EQ_IND,IND_SPST};
})();
