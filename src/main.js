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
const axios = require('axios'); // Requête dynamique de fichiers externes : JSON, etc.


// Menus :
const menuTemplate = require("./menus/menuTemplate.hbs"); // Modèle des menus
const menuDicteeTemplate = require("./menus/menuDicteeTemplate.hbs"); // Modèle menu de la page Dictee


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
const mentionsTemplate = require("./pages/mentionsTemplate.hbs"); // Sous-Page dans le contexte Dictee : affichage des mentions légales
const conseilsTemplate = require("./pages/conseilsTemplate.hbs"); // Page de conseils au moment de la saisie

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
    'icone': 'home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'list',
    'legende': 'Liste des dictées',
    'lien': '#!liste',
    'droite': false
    },
    {
    'icone': 'info',
    'legende': 'Licence',
    'lien': '#!licence/1',
    'droite': false
    },
    {
    'icone': 'help',
    'legende': 'À propos',
    'lien': '#!apropos',
    'droite': true
    },
]}
);


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
	menu.html('');
	app.html(html);
	},

 // Page du contexte Dictee : une dictée a été choisie => id
    'dictee/:id': function (params) {
	let contenu = {
		'did': params.id
	}
	let html = dicteeTemplate(contenu);
	let menuD = menuDicteeTemplate(contenu);
	menu.html(menuD);
	app.html(html);
	},

 // Page avec un lecteur audio : écoute de la dictée
    'ecouter/:id': function (params) {
	let contenu = {
		'did': params.id
	};
	let html = ecouterTemplate(contenu);
	let menuD = menuDicteeTemplate(contenu);
	menu.html(menuD);
	app.html(html);
	},

 // Page de saisie et de correction de la dictée : c'est le coeur de l'application
'saisir/:id': function (params) {
	/* On récupère les données de la dictée sélectionnée
	 Au format JSon et on complète ce contenu pour 
	 Initialiser le template 'saisir...' et afficher son contenu... */

	axios.get("./static/data/dictee" + params.id + ".json")
		.then((response) => {
		    // On prépare le contenu du template 'saisir...'
			let contenu = {};
		    // On prépare le contenu du Partial 'barre'
			contenu.caracteres = [{car: '«'},{car: '—'},{car: '»'},{car: '…'},{car: 'œ'},{car: 'Œ'},{car: 'É'},{car: 'À'}];
		    // On ajoute les autres données :
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.texte = response.data.texte;
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
	let contenu = { did: params.id }; 
	let menuD = menuDicteeTemplate(contenu);
	menu.html(menuD);

	}, // Fin du routage vers la page de saisie de la dictée...

 // ---------------------------------
 // Page des mentions de la dictée
 // ---------------------------------
    'mentions/:id': function (params) {
    
  /* On récupère les données de la dictée sélectionnée
	 Au format JSon et on complète ce contenu pour 
	 Initialiser le template 'saisir...' et afficher son contenu... */

	axios.get("./static/data/dictee" + params.id + ".json")
		.then((response) => {
		    // On prépare le contenu du template 'mentions...'
			let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.auteur = response.data.auteur;
			contenu.titre = response.data.titre;
			contenu.prof = response.data.prof;
            contenu.ouvrage = response.data.ouvrage;
		    // On crée le contenu de la zone de mentions
		    let html = mentionsTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Dictée
	let contenu = { did: params.id }; 
	let menuD = menuDicteeTemplate(contenu);
	menu.html(menuD);
	},


	// Page de conseils
	'conseils/:id': function(params){
		let contenu = {
		'did': params.id
	  };
	let html = conseilsTemplate(contenu);
	let menuD = menuDicteeTemplate(contenu);
	menu.html(menuD);
	app.html(html);
  },
  
  '*': function() {
  let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement à la dictée"});
  app.html(html);
  menu.html(menuAccueil);
  menu.show();
  sessionStorage.clear();
  }

}).resolve();


 // Page d'accueil
 router.on(function () {
 let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement à la dictée"});
 app.html(html);
 menu.html(menuAccueil);
 
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

