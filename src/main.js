/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

// Script majeur en phase de développement : main.js
// Compilé, il produit app.js dans le dossier 'dist'
// --------------------------------
// Appels des dépendances
// Définiton du routage
// Compilation des templates
// --------------------------------

"use strict";
/*jslint browser: true*/
/*global window*/

// Dépendances externes : frameworks / modules
const Handlebars = require('hbsfy/runtime'); // compilation des tempates Handlebars avec le bundler Browserify
const Navigo = require('navigo/lib/navigo'); // Routeur
const chibi = require('chibijs/chibi'); // Fonctions de manipulation du DOM (un JQuery lite)
//const axios = require('axios'); // Requête dynamique de fichiers externes : JSON, etc.


// Menus :
const menuTemplate = require("./menus/menuTemplate.hbs"); // Modèle des menus
const menuDicteeTemplate = require("./menus/menuDicteeTemplate.hbs"); // Modèle menu page Dictee
const menuListeTemplate = require("./menus/menuListeTemplate.hbs"); // Modèle menu contexte de liste

// Composants (Partials) :
Handlebars.registerPartial("barre", require("./composants/barreCaracteresTemplate.hbs")); // Bouton caractère spécial


// Pages
const popupTemplate = require("./pages/popupTemplate.hbs"); // Affiche le contenu du message de notification
const erreurTemplate = require("./pages/erreurTemplate.hbs"); // Gestion erreur 404
const accueilTemplate = require("./pages/accueilTemplate.hbs"); // Page d'accueil
const listeTemplate = require("./pages/listeTemplate.hbs"); // Liste des dictées...
const aproposTemplate = require("./pages/aproposTemplate.hbs"); // Page "à propos..."
const licence1Template = require("./pages/licence1Template.hbs"); // Licence : page 1
const licence2Template = require("./pages/licence2Template.hbs"); // Licence : page 2
const dicteeTemplate = require("./pages/dicteeTemplate.hbs"); // Page globale d'une dictée
const ecouterTemplate = require("./pages/ecouterTemplate.hbs"); // Sous-Page dans le contexte Dictee : avec lecteur audio de la dictée
const saisirTemplate = require("./pages/saisirTemplate.hbs"); // Sous-Page dans le contexte Dictee : saisie et correction de la dictée
const mentionsTemplate = require("./pages/mentionsTemplate.hbs"); // Sous-Page dans le contexte Dictee: mentions légales
const conseilsTemplate = require("./pages/conseilsTemplate.hbs"); // Page de conseils de la saisie
const conseilsRTemplate = require("./pages/conseilsRTemplate.hbs"); // Page de conseils de la saisie
const aideTemplate = require("./pages/aideTemplate.hbs"); // Sommaire aide contexte dictée
const aideRTemplate = require("./pages/aideRTemplate.hbs"); // Sommaire aide contexte réécriture
const aideIconesMobileTemplate = require("./pages/aideIconesMobileTemplate.hbs"); // Aide sur les icônes en version mobile
const aideIconesMobileRTemplate = require("./pages/aideIconesMobileRTemplate.hbs"); // Aide sur les icônes en version mobile
const listeReecrituresTemplate = require("./pages/listeReecrituresTemplate.hbs"); // Liste des réécritures
const reecritureTemplate = require("./pages/reecritureTemplate.hbs"); // Page globale d'une réécriture
const mentionsReecritureTemplate = require("./pages/mentionsReecritureTemplate.hbs"); // Sous-Page dans le contexte Reecriture: mentions légale
const consigneReecritureTemplate = require("./pages/consigneReecritureTemplate.hbs"); // Sous-Page dans le contexte Reecriture : consigne
const saisirReecritureTemplate = require("./pages/saisirReecritureTemplate.hbs"); // Sous-Page dans le contexte Reecriture : saisie
const aideMobileTemplate = require("./pages/aideMobileTemplate.hbs"); // Aide dictée en usage mobile

/* ============================================== */
// On charge l'interface via un événement global load
/* ============================================== */
window.addEventListener('load', () => {
 // Zones cibles
const menu = $('#menu');
const app = $('#app');

// On fournit les données au template du menu Accueil 
const menuAccueil = menuTemplate(
{
    item: [
    {
    'icone': 'icon-home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'icon-liste',
    'legende': 'Liste des dictées',
    'lien': '#!liste',
    'droite': false
    },
    {
    'icone': 'icon-liste',
    'legende': 'Liste des réécritures',
    'lien': '#!lister',
    'droite': false
    },
    {
    'icone': 'icon-info',
    'legende': 'Licence',
    'lien': '#!licence/1',
    'droite': false
    },
    {
    'icone': 'icon-question',
    'legende': 'À propos',
    'lien': '#!apropos',
    'droite': true
    },
]}
);

const menuDicteeItems = [
    {
    'icone': 'icon-home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'icon-ecouteurs',
    'legende': 'Écouter la dictée',
    'lien': '#!ecouter',
    'droite': false
    },
    {
    'icone': 'icon-plume',
    'legende': 'Saisir la dictée',
    'lien': '#!saisir',
    'droite': false
    },
    {
    'icone': 'icon-info',
    'legende': 'Mentions légales',
    'lien': '#!mentions',
    'droite': false
    },
    {
    'icone': 'icon-aide',
    'legende': 'Aide',
    'lien': '#!aide',
    'droite': true
    }
];

const menuReecritureItems = [
    {
    'icone': 'icon-home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'icon-bulle',
    'legende': 'Consigne',
    'lien': '#!consigne',
    'droite': false
    },
    {
    'icone': 'icon-plume',
    'legende': 'Saisir la réécriture',
    'lien': '#!saisirr',
    'droite': false
    },
    {
    'icone': 'icon-info',
    'legende': 'Mentions légales',
    'lien': '#!mentionsr',
    'droite': false
    },
    {
    'icone': 'icon-aide',
    'legende': 'Aide',
    'lien': '#!aider',
    'droite': true
    }
];



 /* 
  * ===========================
  *       *  ROUTAGE *
  * ===========================
  */

// Déclaration du routage
var root = "/ejdicto/";
var useHash = true;
var hash = '#!';
var router = new Navigo(root, useHash, hash);



// Autres routes

 router.on({
 // Page A propos
 'apropos': function () {
    let JSONdata = require ('../static/config/apropos.json');
    let contenu = {
	'app_name': 'ejDicto',
	'module': JSONdata
    }
    let html = aproposTemplate(contenu);
    app.html(html);
    menu.html(menuAccueil);
    },

 // Licence : page 1
    'licence/1': function () {
    let now = new Date();
	let actuel = now.getFullYear();
	let contenu = {
			'debut': '2012',
			'fin': actuel
		}
	let html = licence1Template(contenu);
	app.html(html);
	menu.html(menuAccueil);
    },

 // Licence : page 2
    'licence/2': function () {
	let html = licence2Template();
	app.html(html);
	menu.html(menuAccueil);
    },

 // Liste des dictées
    'liste': function () {
	let JSONdata = require('../static/config/liste_dictees.json');
	let contenu = {
		'infodictee': JSONdata
		}
	let html = listeTemplate(contenu);
	// Le contexte de liste a son propre menu de navigation
	let menuL = menuListeTemplate();
	menu.html(menuL);
	app.html(html);
	},

 // Liste des réécritures
    'lister': function () {
	let JSONdata = require('../static/config/liste_reecritures.json');
	let contenu = {
		'inforeecriture': JSONdata
		}
	let html = listeReecrituresTemplate(contenu);
	// Le contexte de liste a son propre menu de navigation
	let menuL = menuListeTemplate();
	menu.html(menuL);
	app.html(html);
	},

 // Page du contexte Dictee : une dictée a été choisie => id -> did
    'dictee/:id': function (params) {
	let contenu = {
		'did': params.id
	}
	let html = dicteeTemplate(contenu);
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
	app.html(html);
	},

 // Page du contexte Réécriture : une réécriture a été choisie => id -> did
    'reecriture/:id': function (params) {
	let contenu = {
		'did': params.id
	}
	let html = reecritureTemplate(contenu);
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
	app.html(html);
	},

 // Page avec un lecteur audio : écoute de la dictée
    'ecouter/:id': function (params) {
	let contenu = {
		'did': params.id
	};
	let html = ecouterTemplate(contenu);
  // Menu de la dictée avec contexte 'did'
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
	app.html(html);
	},

   // Page de saisie et de correction de la dictée : c'est le coeur de l'application
  'saisir/:id': function (params) {
    	/* On récupère les données de la dictée sélectionnée
    	 Au format JSon et on complète ce contenu pour 
    	 Initialiser le template 'saisir...' et afficher son contenu... */

	fetch("./static/data/dictee" + params.id + ".json")
		.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    // On prépare le contenu du template 'saisir...'
			let contenu = {};
		    // On prépare le contenu du Partial 'barre'
			contenu.caracteres = [{car: '«'},{car: '—'},{car: '»'},{car: '…'},{car: 'œ'},{car: 'Œ'},{car: 'É'},{car: 'À'}];
		    // On ajoute les autres données :
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.texte = data.texte;
		    // On récupère une éventuelle saisie...
		    contenu.saisie = "";
		    if (sessionStorage.getItem("dictee")){
		      contenu.saisie = sessionStorage.getItem("dictee");
		    }
		    // On crée le contenu de la zone de saisie
		    let html = saisirTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	// On crée et on affiche le menu lié au contexte Dictée
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);

	}, // Fin du routage vers la page de saisie de la dictée...


   // Page de saisie et de correction de la réécriture...
  'saisirr/:id': function (params) {
    	/* On récupère les données de la réécriture sélectionnée
    	 Au format JSon et on complète ce contenu pour 
    	 Initialiser le template 'saisirr...' et afficher son contenu... */
    fetch("./static/data/jecho" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    // On prépare le contenu du template 'saisir...'
			let contenu = {};
		    // On prépare le contenu du Partial 'barre'
			contenu.caracteres = [{car: '«'},{car: '—'},{car: '»'},{car: '…'},{car: 'œ'},{car: 'Œ'},{car: 'É'},{car: 'À'}];
		    // On ajoute les autres données :
		    // id de la réécriture : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier jecho + id + .json :
			contenu.initial = data.texte; // C'est le texte initial
			contenu.attendu = data.correction; // C'est le texte transformé attendu
		    // On récupère une éventuelle saisie...
		    contenu.saisie = "";
		    if (sessionStorage.getItem("reecriture")){
		      contenu.saisie = sessionStorage.getItem("reecriture");
		    }else{
		      // Sinon, c'est le texte initial...
		      contenu.saisie = contenu.initial;
		    }
		    // On crée le contenu de la zone de saisie
		    let html = saisirReecritureTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	// On crée et on affiche le menu lié au contexte : modèle Dictée
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);

	}, // Fin du routage vers la page de saisie de la réécriture...

 // ---------------------------------
 // Page des mentions de la dictée
 // ---------------------------------
    'mentions/:id': function (params) {

  /* On récupère les données de la dictée sélectionnée
	 Au format JSon et on complète ce contenu pour 
	 Initialiser le template 'saisir...' et afficher son contenu... */
    fetch("./static/data/dictee" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    // On prépare le contenu du template 'mentions...'
			let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
            // On ajoute une condition pour montrer le bouton de partage
            if(navigator.share){
              contenu.partage = true;
            }else{
              contenu.partage = false;
            }
		    // On crée le contenu de la zone de mentions
		    let html = mentionsTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Dictée
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
	}, // Fin du routage vers la page des mentions de la dictée

 // ---------------------------------
 // Page des mentions de la réécriture
 // ---------------------------------
    'mentionsr/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
    Au format JSon et on complète ce contenu pour 
    Initialiser le template 'saisir_reecriture...' et afficher son contenu... */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      // On prépare le contenu du template 'mentions...'
      let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
            // On ajoute une condition pour montrer le bouton de partage
            if(navigator.share){
              contenu.partage = true;
            }else{
              contenu.partage = false;
            }
		    // On crée le contenu de la zone de mentions
		    let html = mentionsReecritureTemplate(contenu);
		    // On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Réécriture 
	// Même modèle que celui de la dictée

	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
	},

 // ---------------------------------
 // Page de la consigne de la réécriture
 // ---------------------------------
    'consigne/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
    Au format JSon et on complète ce contenu pour 
    Initialiser le template 'consigneReecritureTemplate' et afficher son contenu... */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      // On prépare le contenu du template 'consigne...'
      let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.consigne = data.consigne;
			// Texte initial
			contenu.texte = data.texte;
		    // On crée le contenu de la zone de consigne
		    let html = consigneReecritureTemplate(contenu);
		    // On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Réécriture 
	// Même modèle que celui de la dictée

	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
	},


	// Page de conseils : contexte dictée
	'conseils/:id': function(params){
		let contenu = {
		'did': params.id
	  };
	let html = conseilsTemplate(contenu);
	app.html(html);
  // Menu de la dictée avec son contexte : 'did'
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
  },
  
	// Page de conseils : contexte réécriture
	'conseilsr/:id': function(params){
		let contenu = {
		'did': params.id
	  };
	let html = conseilsRTemplate(contenu);
	app.html(html);
  // Menu de la réécriture sur le modèle Dictée avec son contexte : 'did'
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
  },
  

  // Sommaire de l'aide : contexte dictée
  'aide/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideTemplate(contenu);
      app.html(html);
  // Menu de la dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuDicteeItems
      });
      menu.html(menuD);
  },

  // Aide : dictée en usage mobile
  'aidem/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideMobileTemplate(contenu);
      app.html(html);
  // Menu de la dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuDicteeItems
      });
      menu.html(menuD);
  },

  // Sommaire de l'aide : contexte réécriture
  'aider/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideRTemplate(contenu);
      app.html(html);
  // Menu de la réécriture sur le modèle Dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuReecritureItems
      });
      menu.html(menuD);
  },

  // Aide sur les icones en version mobile
    'boutons/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideIconesMobileTemplate(contenu);
      app.html(html);
  // Menu de la dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuDicteeItems
      });
      menu.html(menuD);
  },
  
  // Aide sur les icones en version mobile : contexte Réécriture
    'boutonsr/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideIconesMobileRTemplate(contenu);
      app.html(html);
  // Menu de la réécriture sur le modèle Dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuReecritureItems
      });
      menu.html(menuD);
  },

  // Chemin générique

  '*': function() {
  let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe !"});
  app.html(html);
  menu.html(menuAccueil);
  menu.show();
  sessionStorage.clear();
  }

}).resolve();


 // Page d'accueil
 router.on(function () {
 let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe !"});
 app.html(html);
 menu.html(menuAccueil);
 sessionStorage.clear();
 
 }).resolve();



// Route inconnue

router.notFound(function () {
 const html = erreurTemplate({
 couleur: 'yellow',
 titre: 'Erreur 404 - Page introuvable !',
 message: 'Ce chemin n\'existe pas.'
    });
 menu.html(menuAccueil)
 app.html(html);
  });



// Fin table de routage

}); // Fin de event load

