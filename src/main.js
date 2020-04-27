/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* Script majeur en phase de développement : main.js
 * Compilé, il produit app.js dans le dossier 'build'
 *  --------------------------------
 * Appels des dépendances
 * Définiton du routage
 * Compilation des templates
 * --------------------------------
*/

"use strict";
/*jslint browser: true*/
/*global window*/

/* VERSION */
const versionApp = require('../package.json').version;

/* Messages de l'interface */
const MSG = require('../static/config/messages.json').msg;

/* Modules locaux */
window.afficheRubrique = require('./lib/scripts/ongletModule.js').afficheRubrique;
window.exercice = require('./lib/scripts/exerciceModule.js').exercice;
window.inserer = require('./lib/scripts/carspecModule.js').inserer;
window.profil = require('./lib/scripts/profilModule.js').profil;
window.inserer_mot = require('./lib/scripts/assistantModule.js').inserer_mot;
window.actualiser_assistant = require('./lib/scripts/assistantModule.js').actualiser_assistant;
window.afficher_aide = require('./lib/scripts/aideModule.js').afficher_aide;
window.masquer_aide = require('./lib/scripts/aideModule.js').masquer_aide;
window.alterner_section_aide = require('./lib/scripts/aideModule.js').alterner_section_aide;
window.filtrer = require('./lib/scripts/filtre.js').filtrer;
window.derouler_navigation = require('./lib/scripts/navigation.js').derouler_navigation;
window.refermer_navigation = require('./lib/scripts/navigation.js').refermer_navigation;

/* Dépendances externes : frameworks & modules*/
/* Runtime de compilation des templates Handlebars avec le bundler Browserify */
const Handlebars = require('hbsfy/runtime');
/* Routeur : Navigo */
const Navigo = require('navigo/lib/navigo');
/* Fonctions de manipulation du DOM (un JQuery lite) */
const chibi = require('chibijs/chibi');

/* ========================================
 *          H e l p e r s
 *           Génériques
 * ========================================
 */
 
/* Passer en capitale la première lettre de la chaine */
Handlebars.registerHelper("capitalisePremiereLettre", function (sChaine) {
  if(typeof sChaine === 'string') {
    return sChaine.charAt(0).toUpperCase() + sChaine.slice(1);
    }
    return null;
});

/* Condition sur la cible (type d'exercice) */
Handlebars.registerHelper("cibleEstUneDictee", function (sCible) {
  if(sCible == 'dictee'){
    return true;
    }else{
    return false;
    }
});

/* Interprète les valeurs booléennes en paire OUI / NON */
Handlebars.registerHelper("interpreteLogique", function (bValeur) {
  if( bValeur === "true" ){
    return "Oui"
    }else{
    return "Non"
    }
});

/* Interprète les niveaux d'enseignement : chiffre => nom */
Handlebars.registerHelper("interpreteNiveau", function (sChiffre) {
    let niveau = "";
    let etalon = sChiffre;
    switch(etalon) {
  case "5":
    niveau = "Cinquième";
    break;
  case "3":
    niveau = "Troisième";
    break;
  default:
    return "Tous";
  }
  return niveau;

});

/* Helper : Filtre par niveau */
Handlebars.registerHelper("estDuNiveauRequis", function (sNiveau) {
  let niveauProfil = profil.retourne("ejdictoProfilNiveau", false);
  if ( niveauProfil !== false ){
      niveauProfil += "e";
      if ( sNiveau === niveauProfil ){
        return true;
      }else{
        return false;
      }
  }
  /* Aucun profil => aucun filtre */
  return true;
});

/* Helper : filtre établissant la disponibilité d'une version aménagée de la dictée */

Handlebars.registerHelper("existeEnVersionAmenagee", function (info_dictam){
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === "true" ){
        if ( info_dictam === true ){
            return true;
        }else{
            return false;
        }
  }else{
    return true;
  }
});


/* Helper : contexte <=> la dictée choisie est-elle aménagée ? */

Handlebars.registerHelper("cetteDicteeEstAmenagee", function (exercice){
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === "true" && exercice === "dictée" ){
    return true;
  }
  return false;
});


/* Helper : on remplace les balises _( et )_ par des tags HTML */
Handlebars.registerHelper("afficheLesEtiquettes", function (texte, lacunes){
  /* Alternatives */
  let index;
  for (index = 0; index < 10; index++){
  texte = texte.replace(((index + 1)).toString(), lacunes[index].trim());
  }
  /* Etiquettes numérotées */
  let sortie = texte.replace(new RegExp(/_\(/,'g'), "<span class='w3-tag w3-round clair'>");
  sortie = sortie.replace(new RegExp(/\)_/,'g'), "</span>");
  return sortie;
});

/* Helper : augmente l'index de 1 */
Handlebars.registerHelper("indexPlusUn", function (index){
  let indice = 0;
  if (typeof index === 'integer'){
  indice = ++index;
  }else{
  indice = parseInt(index, 10);
  indice = indice + 1;
  }
  return indice;
});

/* Helper : découpe une proposition en mots */
Handlebars.registerHelper("decoupeLaProposition", function (proposition) {
  let mots = proposition.split("|");
  return mots;
});

/* Helper : encode HTML (entitie, etc.) */
Handlebars.registerHelper('encodeChaine',function(chaine){
    return new Handlebars.SafeString(chaine);
});

/* Helper : cherche si un mot a été inséré :
 * dans ce cas, on cache le formulaire */
Handlebars.registerHelper("ceChoixEstMasque", function(indice){
  let formulaire = "_form" + (indice + 1);
  if (sessionStorage.getItem("ejdicto" + formulaire)){
    return true;
    }
  return false;
});


/* Niveaux d'enseignement */
const niveaux = require ('../static/config/niveaux.json').niveaux;


/* ========================================
 *          Templates des menus
 * ========================================
 */

/* Modèle des menus : générique */
const menuTemplate = require("./menus/menuTemplate.hbs");
/* Modèle menu : contexte Dictée */
const menuExerciceTemplate = require("./menus/menuExerciceTemplate.hbs");
/* Modèle menu : contexte Liste */
const menuListeTemplate = require("./menus/menuListeTemplate.hbs");

/* ========================================
 *           Composants (Partials)
              et sections
              de l'Aide
 * ========================================
 */

/* Bouton caractère spécial */
Handlebars.registerPartial("barre", require("./composants/barreCaracteresTemplate.hbs"));
/* Source de fichier audio */
Handlebars.registerPartial("sourceaudio", require("./composants/sourceAudioTemplate.hbs"));
/* Assistant de la saisie */
Handlebars.registerPartial("assistant",
require("./composants/assistantDeLaSaisieTemplate.hbs"));
/* Page Apropos */
Handlebars.registerPartial("apropos",
require("./composants/aproposTemplate.hbs"));
/* Licence */
Handlebars.registerPartial("licence",
require("./composants/licenceTemplate.hbs"));
/* Section de l'aide : prise en main */
Handlebars.registerPartial("prise_en_main",
require("./aides/aidePriseEnMain.hbs"));
/* Section de l'aide : amélioration de la saisie */
Handlebars.registerPartial("amelioration",
require("./aides/aideAmelioration.hbs"));
/* Section de l'aide : dictée aménagée */
Handlebars.registerPartial("dictam",
require("./aides/aideDictam.hbs"));
/* Section de l'aide : usage mobile */
Handlebars.registerPartial("usage_mobile",
require("./aides/aideUsageMobile.hbs"));

/* ========================================
 *          Templates des Pages
 * ========================================
 */


/* Gestion erreur de routage : 404 page not found */
const erreurTemplate = require("./pages/erreurTemplate.hbs");
/* Page d'accueil générale */
const accueilTemplate = require("./pages/accueilTemplate.hbs");
/* Liste des exercices */
const listeTemplate = require("./pages/listeTemplate.hbs");
/* Page d'accueil d'un exercice : dictée, etc. */
const accueilExerciceTemplate = require("./pages/accueilExerciceTemplate.hbs");
/* Sous-Page : contexte Dictee : lecteur audio */
const ecouterTemplate = require("./pages/ecouterTemplate.hbs");
/* Sous-Page : contexte exercice (dictee, etc) : saisie et correction */
const saisirTemplate = require("./pages/saisirTemplate.hbs");
/* Sous-Page : contexte exercice (dictée ou réécriture) : mentions légales */
const mentionsTemplate = require("./pages/mentionsTemplate.hbs");
/* Sommaire aide contexte dictée */
const aideTemplate = require("./pages/aideTemplate.hbs");
/* Sous-Page dans le contexte Reecriture : consigne */
const consigneReecritureTemplate = require("./pages/consigneReecritureTemplate.hbs");
/* Page de gestion du profil */
const profilTemplate = require("./pages/profilTemplate.hbs");
/* Formulaire de modification du profil */
const formProfilTemplate = require("./pages/formProfilTemplate.hbs");
/* Pied de page */
const piedDePageTemplate = require("./composants/piedTemplate.hbs");
/* Zone de notification */
const notificationTemplate = require("./composants/notificationTemplate.hbs");
const zone_notification = notificationTemplate();

/* =========================================================
 *    On charge l'interface via un événement global load
 * =========================================================
 */

window.addEventListener('load', () => {
 /* Zones cibles */
const menu = $('#menu');
const app = $('#app');

const aide = $("#aide");
const notification = $("#notification"); 
const piedDePage = piedDePageTemplate();

/* ==================================================
 *                 * MENUS *
 * ==================================================
 */

/* On importe les données du menu dans le contexte Accueil */
const dataMenuAccueil = require("../static/config/menu_accueil.json").menu;
const menuAccueil = menuTemplate(dataMenuAccueil);
/* On importe les données du menu Liste */
/* Sera réutilisé de manière dynamique dans le template de menu de liste... */
const dataMenuListe = require("../static/config/menu_liste.json").menu;
/* On importe les données du menu Aide */
const dataMenuAide = require("../static/config/menu_aide.json").menu;
const menuAide = menuTemplate(dataMenuAide);
/* On importe les données du menu Profil */
const dataMenuProfil = require("../static/config/menu_profil.json").menu;
const menuProfil = menuTemplate(dataMenuProfil);
/* On importe les données du menu Modprefs (modification du profil) */
const dataMenuModprefs = require("../static/config/menu_modprefs.json").menu;
const menuModprefs = menuTemplate(dataMenuModprefs);

/*  On importe et on conserve les items des menus 
 *  dans les contextes Dictée et Réécriture 
 *  IMPORTANT ! Du fait de l'appel avec le contexte 'did' 
 *  supplémentaire, on importe 
 *  directement le tableau des items dans ce cas.
 */
const dataMenuDictee = require("../static/config/menu_dictee.json").menu;
const dataMenuEcouter = require("../static/config/menu_ecouter.json").menu;
const dataMenuSaisirDictee = require("../static/config/menu_saisir_dictee.json").menu;
const dataMenuMentionsDictee = require("../static/config/menu_mentions_dictee.json").menu;
/* Idem pour les menus de réécriture */
const dataMenuReecriture = require("../static/config/menu_reecriture.json").menu;
const dataMenuConsigne = require("../static/config/menu_consigne.json").menu;
const dataMenuSaisirReecriture = require("../static/config/menu_saisir_reecriture.json").menu;
const dataMenuMentionsReecriture = require("../static/config/menu_mentions_reecriture.json").menu;

/* =================================================
 *                 * Formats Audio *
 * =================================================
 */

const formatAudio = require("../static/config/format_audio.json").source;

/* ================================================
 *           Table des caractères spéciaux
 * ================================================
 */
 
 const tableCaracteres = 
require("../static/config/table_caracteres.json").caracteres;




/* ===========================
 *     A I D E
 *     Initialisation
 *     du contenu
 * ===========================
 */
 
 /* Données du modèle Apropos (partial appelé dans le template Aide) */
    let moduleJSONdata = require ('../static/config/apropos.json');
    let rubriquesJSONdataApropos = require ('../static/config/rubriques_apropos.json').rubriques;
    let modeleApropos = {
	  'app_name': 'ejDicto',
	  'module': moduleJSONdata,
	  'rubs': rubriquesJSONdataApropos,
	  'version': versionApp
    };
/* Données du modèle Licence (partial appelé dans le template Aide) */
    let dataLicence = require("../static/config/licence.json").licence;
    let rubriquesJSONdataLicence = require ('../static/config/rubriques_licence.json').rubriques;
    let texte_page_1 = dataLicence.pages[0].texte;
    let texte_page_2 = dataLicence.pages[1].texte;
    let now = new Date();
	let actuel = now.getFullYear();
    let modeleLicence = {
      'debut': dataLicence.debut,
	  'actuel': actuel,
	  'auteur': dataLicence.auteur,
	  'texte_page_1': texte_page_1,
	  'texte_page_2': texte_page_2,
	  "rubs": rubriquesJSONdataLicence
    };
  let contenu = {
    'modeleApropos': modeleApropos,
    'modeleLicence': modeleLicence
  }
  const SommaireAide = aideTemplate(contenu);
  

 /*
  * ===========================
  *       *  ROUTAGE *
  * ===========================
  */

/* Déclaration du routage */
var root = "/ejdicto/";
var useHash = true;
var hash = '#!';
var router = new Navigo(root, useHash, hash);


/* Autres routes */
 router.on({

 /* === Aide === */
 'aide': function () {
  app.html(SommaireAide);
  menu.html(menuAide);
  },


 /* === Liste des dictées === */
    'liste/dictees': function () {
    let niveau = profil.retourne("ejdictoProfilNiveau",0)
	let JSONdata = require('../static/config/liste_dictees.json');
	let contenu = {
		'info': JSONdata,
		'exercice': 'dictée',
		'cible': 'dictee',
		'niveau': niveau
		}
	let html = listeTemplate(contenu);
	dataMenuListe.exercice = 'dictée';
	const menuListe = menuListeTemplate(dataMenuListe);
	menu.html(menuListe);
	app.html(html);
	},


 /* === Liste des réécritures === */
    'liste/reecritures': function () {
    let niveau = profil.retourne("ejdictoProfilNiveau",0)
	let JSONdata = require('../static/config/liste_reecritures.json');
	let contenu = {
		'info': JSONdata,
		'exercice': 'réécriture',
		'cible': 'reecriture',
		'niveau': niveau
		}
	let html = listeTemplate(contenu);
	dataMenuListe.exercice = 'réécriture';
    const menuListe = menuListeTemplate(dataMenuListe);
	menu.html(menuListe);
	app.html(html);
	},



 /* === Page du contexte Dictee === */
    /* une dictée a été choisie => id -> did */
    'dictee/:id': function (params) {
	let contenu = {
		'did': params.id,
		'exercice': 'dictée',
		'consigne': MSG.consigneDictee,
		'consigneDicteeAmenagee': MSG.consigneDicteeAmenagee,
		'lien': 'ecouter',
		'legende': 'écoute'
	};
	let html = accueilExerciceTemplate(contenu);
    dataMenuDictee.did = params.id;
    dataMenuDictee.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuDictee);
	menu.html(menuD);
	app.html(html);
	},


 /* === Page du contexte Réécriture === */
    /* une réécriture a été choisie => id -> did */
    'reecriture/:id': function (params) {
	let contenu = {
		'did': params.id,
		'exercice': 'réécriture',
		'consigne': "D'abord, lisez attentivement la consigne de la \
          réécriture. Notez au brouillon les passages à transformer",
		'lien': 'consigne',
		'legende': 'consigne'
	}
	let html = accueilExerciceTemplate(contenu);
	dataMenuReecriture.did = params.id;
	dataMenuReecriture.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuReecriture);
	menu.html(menuR);
	app.html(html);
	},


 /* === Page avec un lecteur audio === */ 
  /* écoute de la dictée choisie : id -> did */
  'ecouter/:id': function (params) {
  /* Rubriques des onglets : dictée aménagée */
  let rubriquesJSONdata = require ('../static/config/rubriques_dictam.json').rubriques;
  /* Source des données de la dictée choisie... */
  let source = "./static/data/dictee" + params.id + ".json";
  /* Est-ce une dictée aménagée ? */
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === 'true' ){
    source = "./static/data/dictam" + params.id + ".json";
  }
    /* On récupère les données de la dictée */
    fetch(source)
		.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'ecouterTemplate' */
	let contenu = {
		'did': params.id,
		'sources': formatAudio,
		'fourni': data.fourni,
		'lacunes': data.lacunes || "",
		'exercice': 'dictée',
		'rubs': rubriquesJSONdata,
		'mots' : data.consigne
	};
	let html = ecouterTemplate(contenu);
	app.html(html);
    /* Menu de la dictée avec contexte 'did' */
	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });
    /* Gestion du menu */
    dataMenuEcouter.did = params.id;
    dataMenuEcouter.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuEcouter);
	menu.html(menuD);
	},


  /* === Page de saisie et de correction de la dictée === */
  /* c'est le coeur de l'application */
  'saisir/dictee/:id': function (params) {
  /* Source des données de la dictée choisie... */
  let source = "./static/data/dictee" + params.id + ".json";
  /* Est-ce une dictée aménagée ? */
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === 'true' ){
    source = "./static/data/dictam" + params.id + ".json";
  }
    /* On récupère les données de la dictée sélectionnée
    	 Au format JSon et on complète ce contenu pour 
    	 Initialiser le template 'saisir...' et afficher son contenu... */
	fetch(source)
		.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'saisirTemplate...' */
			let contenu = {};
		    /* On prépare le contenu du Partial 'barre' */
			contenu.caracteres = tableCaracteres;
		    /* On ajoute les autres données :
		     * id de la dictée : passé en paramètre de l'URL
		     */
 			contenu.did = params.id;
			/* On passe les paramètres du type d'exercice */
			contenu.exercice = 'dictée';
			contenu.cible = 'dictee';
		    /* Les données récupérées à partir du fichier 
		     *  dictee + id + .json
             */
			contenu.attendu = data.attendu;
			contenu.fourni = data.fourni;
		    /* On récupère une éventuelle saisie... */
		    if (sessionStorage.getItem("dictee")){
		      contenu.saisie = sessionStorage.getItem("dictee");
		    }else{
		    contenu.saisie = contenu.fourni;
		    }
		    /* On passe les propositions de saisie à l'assistant
		    dans le contexte d'une dictée aménagée */
		    if ( amenagement ) {
		      contenu.propositions = data.lacunes;
		    }
		    /* On crée le contenu de la zone de saisie */
		    let html = saisirTemplate(contenu);
		    	/* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	/* On crée et on affiche le menu lié au contexte Dictée */
    dataMenuSaisirDictee.did = params.id;
    dataMenuSaisirDictee.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuSaisirDictee);
	menu.html(menuD);
    /* Notifications */
    notification.html(zone_notification);
	}, /* Fin du routage vers la page de saisie de la dictée... */


   /* =====================================================
    * Page de saisie et de correction de la réécriture... 
    * =====================================================
    */
  'saisir/reecriture/:id': function (params) {
    	/* On récupère les données de la réécriture sélectionnée
    	 * Au format JSon et on complète ce contenu pour 
    	 * Initialiser le template 'saisirr...' et afficher son contenu... 
    	 */
    fetch("./static/data/jecho" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'saisir...' */
			let contenu = {};
		    /* On prépare le contenu du Partial 'barre' */
			contenu.caracteres = tableCaracteres;
		    /* On ajoute les autres données :
		     *  id de la réécriture : passé en paramètre de l'URL
		     */
			contenu.did = params.id;
		    /* Les données récupérées à partir du fichier 
		     * jecho + id + .json :
		     */
            /* C'est le texte initial */
			contenu.fourni = data.fourni;
			/* C'est le texte transformé attendu */
			contenu.attendu = data.attendu;
		    /* On récupère une éventuelle saisie... */
		    contenu.saisie = "";
		    if (sessionStorage.getItem("reecriture")){
		      contenu.saisie = sessionStorage.getItem("reecriture");
		    }else{
		      /* Sinon, c'est le texte initial... */
		      contenu.saisie = contenu.fourni;
		    }
		    /* On passe aussi le type d'exercice */
            contenu.exercice = 'réécriture';
            contenu.cible = 'reecriture';
		    /* On crée le contenu de la zone de saisie */
		    let html = saisirTemplate(contenu);
            /* On l'intègre dans le document */
		    app.html(html);
		    /* On ajoute la zone de notification */
            notification.html(zone_notification);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	/* On crée et on affiche le menu lié au contexte : modèle Dictée */
    dataMenuSaisirReecriture.did = params.id;
    dataMenuSaisirReecriture.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuSaisirReecriture);
	menu.html(menuR);
	/* Notifications */
    notification.html(zone_notification);
	}, /* Fin du routage vers la page de saisie de la réécriture... */


 /* -------------------------------------------
  *  === Page des mentions de la dictée ===
  * -------------------------------------------
  */
    'mentions/dictee/:id': function (params) {

  /* On récupère les données de l'exercice sélectionné
   * Au format JSon et on complète ce contenu pour 
   * Initialiser le template 'saisir...' et afficher son contenu... 
   */
    fetch("./static/data/dictee" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'mentions...' */
			let contenu = {};
		    /* id de la dictée : passé en paramètre de l'URL */
			contenu.did = params.id;
		    /* Les données récupérées à partir du 
		     * fichier dictee + id + .json : 
             */
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
            contenu.exercice = 'dictée';
            contenu.cible = 'dictee';
            contenu.remarque = data.remarque || "";
            contenu.voix = data.voix || "";
            /* On ajoute une condition pour montrer 
             * le bouton de partage 
             */
            if(navigator.share){
              contenu.partage = true;
            }else{
              contenu.partage = false;
            }
		    /* On crée le contenu de la zone de mentions */
		    let html = mentionsTemplate(contenu);
		    	/* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	/* On crée et on affiche le menu lié au contexte Dictée */
	dataMenuMentionsDictee.did = params.id;
	dataMenuMentionsDictee.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuMentionsDictee);
	menu.html(menuD);
	}, /* Fin du routage vers la page des mentions de la dictée */

 /* ---------------------------------------------
  *  === Page des mentions de la réécriture ===
  *  --------------------------------------------
  */
    'mentions/reecriture/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
   *  Au format JSon et on complète ce contenu pour 
   *  Initialiser le template 'saisir_reecriture...' et afficher son contenu... 
   */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      /* On prépare le contenu du template 'mentions...' */
      let contenu = {};
		    /* id de la récriture : passé en paramètre de l'URL */
			contenu.did = params.id;
		    /* Les données récupérées à partir 
		     * du fichier dictee + id + .json :
		     */
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
            contenu.exercice = 'réécriture';
            contenu.cible = 'reecriture';
            /* On ajoute une condition pour montrer 
            le bouton de partage */
            if(navigator.share){
              contenu.partage = true;
            }else{
              contenu.partage = false;
            }
		    /* On crée le contenu de la zone de mentions */
		    let html = mentionsTemplate(contenu);
		    /* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données. */
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	/* On crée et on affiche le menu lié au contexte Réécriture 
	 * Même modèle que celui de la dictée
	 */
	dataMenuMentionsReecriture.did = params.id;
	dataMenuMentionsReecriture.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuMentionsReecriture);
	menu.html(menuR);
	},

 /* --------------------------------------------
  * === Page de la consigne de la réécriture ===
  * --------------------------------------------
  */
    'consigne/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
   *  Au format JSon et on complète ce contenu pour 
   *  Initialiser le template 'consigneReecritureTemplate' et afficher son contenu...
   */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      /* On prépare le contenu du template 'consigne...' */
      let contenu = {};
		    /* id de la réécriture : passé en paramètre de l'URL */
			contenu.did = params.id;
		    /* Les données récupérées à partir 
		     * du fichier dictee + id + .json :
		     */
			contenu.consigne = data.consigne;
			/* Texte initial */
			contenu.fourni = data.fourni;
		    /* On crée le contenu de la zone de consigne */
		    let html = consigneReecritureTemplate(contenu);
		    /* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	/* On crée et on affiche le menu lié au contexte Réécriture 
	 * Même modèle que celui de la dictée
	 */
    dataMenuConsigne.did = params.id;
    dataMenuConsigne.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuConsigne);
	menu.html(menuR);
	},

  /* =========================================================
   * === Page de gestion du profil / éventuellement modifié ===
   * =========================================================
   */
   'profil': function(){
    let niveau = profil.retourne('ejdictoProfilNiveau','tous');
    let amenagement = profil.retourne('ejdictoProfilAmenagement',false);
    let contenu = {
      'niveau': niveau,
      'amenagement': amenagement,
    };
    let html = profilTemplate(contenu);
    app.html(html);
    menu.html(menuProfil);
    },

  /* ===========================================
   * === Formulaire : modification du profil ===
   * ===========================================
   */
   'modprefs': function(){
    let checked;
    let amenagement = profil.retourne('ejdictoProfilAmenagement',false);
    if ( amenagement === "true" || amenagement === true ){
      checked = "checked";
      }else{
      checked = "";
      }
    let contenu = {
      'niveaux': niveaux,
      'checked': checked
    };
    let html = formProfilTemplate(contenu);
    app.html(html);
    menu.html(menuModprefs);
    },

  /* =========================
   * === Chemin générique ===
   * =========================
   */

  '*': function() {
  let html = accueilTemplate({"bienvenue": MSG.bienvenue});
  app.html(html);
  app.htmlAppend(piedDePage);
  menu.html(menuAccueil);
  menu.show();
  sessionStorage.clear();

  }
  /* Résolution de la toute */
}).resolve();


 /* ===========================
  * === Page d'accueil ===
  * ===========================
  */
 router.on(function () {
 let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe !"});
 app.html(html);
 menu.html(menuAccueil);
 sessionStorage.clear();
 }).resolve();



/* =============================
 * ===   Route inconnue ===
 * ============================
 */
router.notFound(function () {
 const html = erreurTemplate({
 couleur: 'yellow',
 titre: 'Erreur 404 - Page introuvable !',
 message: 'Ce chemin n\'existe pas.'
    });
 menu.html(menuAccueil)
 app.html(html);
  });

/* Fin table de routage */



}); /* Fin de event load */

