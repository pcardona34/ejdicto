/*
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *  Modifications pour ejDicto : Patrick cardona, 2019-2020, under the same license
 *
 * Released under the MIT license.
 *
 * More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 */

/* CAUTION! These are very modified functions to deal under my needs within
 * the ejDicto project. 
 * Don't use those outside this project and search then the original ones
 * by John Resig. See the URL above.
 */

function escape(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    // n = n.replace(/"/g, "&quot;");

    return n;
}

// Fonction de comparaison de chaines

function diffString( o, n ) {
  let nbre = 0; // nombre de chaînes erronées
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var str = "";

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        str += "<del>" + escape(out.o[i]) + oSpace[i] + "</del>";
          nbre++;
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
        str += "<del>" + escape(out.o[n]) + oSpace[n] + "</del>";
          nbre++;
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
        str += "<ins>" + escape(out.n[i]) + nSpace[i] + "</ins>";
          nbre++;
      } else {
        var pre = "";
        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
          pre += "<del>" + escape(out.o[n]) + oSpace[n] + "</del>";
          nbre++;
        }
        str += " " + out.n[i].text + nSpace[i] + pre;
      }
    }
  }
  let bilan = "";
  if ( nbre > 0 ){
    bilan = "Vous pouvez encore améliorer votre saisie.";
  }else{
    bilan = "Parfait ! Aucune erreur.";
  }
    return {bilan: bilan, corrigee: str};
}
// Function : Diff

function diff( o, n ) {
  var ns = new Object();
  var os = new Object();
  
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }
  
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }
  
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  
  for ( var i = 0; i < n.length - 1; i++ ) {
    if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null && 
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }
  
  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null && 
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }
  
  return { o: o, n: n };
}
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* carspec.js */
/* Insertion de caractères spéciaux dans le champ de formulaire textarea */ 
"use strict";

// Insertion de caractères spéciaux
// Fonction liée au composant : barreCaracteresSpeciauxTemplate.hbs

/*
* args[0] : car : type string, the typo selected.
* args[1] : cible : type id du DOM, identifie la zone textarea où insérer le caractère
*/

var carspec = {};

carspec.inserer = function () {
		var args = arguments;
		var car = args[0];
		var cible = args[1];
		var zone = document.getElementById(cible);
		zone.focus();
		if(typeof zone.selectionStart != 'undefined')
			{
			let start = zone.selectionStart;
			let end = zone.selectionEnd;
			let insText = zone.value.substring(start, end);
			zone.value = zone.value.substr(0, start) + car + zone.value.substr(end);
			let pos;
			pos = start + car.length;
			zone.selectionStart = pos;
			zone.selectionEnd = pos;
			document.getElementById(cible).value = zone.value;
			}
};

/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* dictee.js */
/* scripts specifiques au fonctionnement de l'exerciseur de dictée */
/* Utilisation d'une instance dans le template 'saisir...' */

var dictee = {
    saisie: "",
    texte: "",
    erreurCode: 0,
    correction: "",
    message: "",
    titreMessage: ""
};


    // On initialise l'objet dictee à partir des données de l'interface : issues du fichier dictee + id + json
    // et saisies par l'utilisateur...
    // On vérifie que toutes les données utiles sont présentes : succès => true

dictee.init = function () {
	this.saisie = document.getElementById("ma_saisie").value;
	this.texte = document.getElementById("texte").textContent;
	this.erreurCode = 0;
	this.correction = "";
	this.message = "";
	this.titreMessage = "";
	if (this.saisie.length > 0) {
		if (this.texte.length > 0) {
			return true;
		}	
		else {
			this.erreurCode = 2;
			console.log(this.erreurCode);
			return false;
		}		
	}	
	else {
		this.erreurCode = 1;
		return false;
	}
}; // Fin de la méthode init()

// Méthode : corriger() 
dictee.corriger = function () {

    if ( this.init() === true ) {

	// On compare le texte saisi au texte de référence :
	// On récupère l'objet de résultat sortie
	// le bilan : sortie.bilan
	//  et le corrigé : sortie.corrigee
	var sortie = diffString(this.saisie, this.texte);
	// On remplace les retours à la ligne par le code HTML :

	// On peut afficher par dessus (popup) le bilan
	this.titreMessage = "Bilan";
	this.message = sortie.bilan;
	this.afficherMessage();
    }else{
	if (this.erreurCode === 1) {
		this.message = "Erreur "+ this.erreurCode;
		this.message += ": veuillez d'abord saisir le texte ";
		this.message += "de la dictée !";
		this.titreMessage = "Mode d'emploi";
	}else{
		this.titreMessage = "Erreur dans l'application";
		this.message = "Erreur "+ this.erreurCode;
		this.message += ": erreur interne. Le texte de la ";
		this.message += "dictée est manquant :(";
	}	
	this.afficherMessage();
    }		
}; // Fin de la méthode corriger()

// Méthode : terminer()
dictee.terminer = function () {
    if ( this.init() === true ) {
	// On compare le texte saisi au texte de référence :
	// On récupère l'objet de résultat sortie
	//  =>  le corrigé : sortie.corrigee
	var sortie = diffString(this.saisie, this.texte);
	// On remplace les retours à la ligne par le code HTML :
	this.correction = sortie.corrigee.replace(/\n/g,"<br />");
    // On propage la correction dans la zone ad hoc
    document.getElementById("corrige").innerHTML = this.correction;
    // On affiche cette zone
    document.getElementById("zone_correction").style.display = "block";
    // On masque le menu et la zone de saisie
    document.getElementById("menu").style.display = "none";
    document.getElementById("zone_saisie").style.display = "none";
    // On nettoie le magasin de la session
    if(sessionStorage.getItem("dictee")){
      sessionStorage.removeItem("dictee");
    }
	return true;
    }else{
	if (this.erreurCode === 1) {
		this.message = "Erreur "+ this.erreurCode;
		this.message += ": veuillez d'abord saisir le texte ";
		this.message += "de la dictée !";
		this.titreMessage = "Mode d'emploi";
	}else{
		this.titreMessage = "Erreur dans l'application";
		this.message = "Erreur "+ this.erreurCode;
		this.message += ": erreur interne. Le texte de la ";
		this.message += "dictée est manquant :(";
	}	
	this.afficherMessage();
    }		
}; // Fin de la méthode terminer()

// Méthode : pour masquer la correction	
dictee.masquerCorrection = function () {
	document.getElementById("zone_correction").style.display = "none";
	document.getElementById("zone_saisie").style.display = "block";
}; // Fin de la méthode masquer_correction()

// Méthode : afficher_message
dictee.afficherMessage = function () {
  document.getElementById("titre_notification").innerHTML = this.titreMessage;
  document.getElementById("message_notification").innerHTML = this.message;
  document.getElementById("notification").style.display = "block";

}; // Fin de la méthode afficher_message()

// Méthode : pour vider la zone de saisie...
dictee.recommencerSaisie = function () {
	document.getElementById("ma_saisie").value = "";
	sessionStorage.setItem("dictee", "");
}; // Fin de la méthode recommencer()

// Fin des méthodes de la classe dictée

/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* reecriture.js */
/* scripts specifiques au fonctionnement de l'exerciseur de reecriture */
/* Utilisation d'une instance dans le template 'saisirReecritureTemplate.hbs' */

var reecriture = {
    saisie: "",
    initial: "",
    attendu: "",
    erreurCode: 0,
    correction: "",
    message: "",
    titreMessage: ""
};


    // On initialise l'objet dictee à partir des données de l'interface : 
    // issues du fichier jecho + id + json
    // et saisies par l'utilisateur...
    // On vérifie que toutes les données utiles sont présentes : succès => true

reecriture.init = function () {
	this.saisie = document.getElementById("ma_saisie").value;
	this.attendu = document.getElementById("attendu").textContent;
	this.initial = document.getElementById("initial").textContent;
	this.erreurCode = 0;
	this.correction = "";
	this.message = "";
	this.titreMessage = "";
	if (this.saisie.length > 0) {
		if (this.attendu.length > 0) {
			return true;
		}	
		else {
			this.erreurCode = 2;
			console.log(this.erreurCode);
			return false;
		}		
	}	
	else {
		this.erreurCode = 1;
		return false;
	}
}; // Fin de la méthode init()

// Méthode : corriger() 
reecriture.corriger = function () {

    if ( this.init() === true ) {

	// On compare le texte saisi au texte attendu :
	// On récupère l'objet de résultat sortie
	// le bilan : sortie.bilan
	//  et le corrigé : sortie.corrigee
	var sortie = diffString(this.saisie, this.attendu);
	// On remplace les retours à la ligne par le code HTML :

	// On peut afficher par dessus (popup) le bilan
	this.titreMessage = "Bilan";
	this.message = sortie.bilan;
	this.afficherMessage();
    }else{
	if (this.erreurCode === 1) {
		this.message = "Erreur "+ this.erreurCode;
		this.message += " : veuillez d'abord saisir le texte ";
		this.message += "de la réécriture !";
		this.titreMessage = "Mode d'emploi";
	}else{
		this.titreMessage = "Erreur dans l'application";
		this.message = "Erreur "+ this.erreurCode;
		this.message += " : erreur interne. Le texte de la ";
		this.message += "réécriture est manquant :(";
	}	
	this.afficherMessage();
    }		
}; // Fin de la méthode corriger()

// Méthode : terminer()
reecriture.terminer = function () {
    if ( this.init() === true ) {
	// On compare le texte saisi au texte de référence :
	// On récupère l'objet de résultat sortie
	//  =>  le corrigé : sortie.corrigee
	var sortie = diffString(this.saisie, this.attendu);
	// On remplace les retours à la ligne par le code HTML :
	this.correction = sortie.corrigee.replace(/\n/g,"<br />");
    // On propage la correction dans la zone ad hoc
    document.getElementById("corrige").innerHTML = this.correction;
    // On affiche cette zone
    document.getElementById("zone_correction").style.display = "block";
    // On masque le menu et la zone de saisie
    document.getElementById("menu").style.display = "none";
    document.getElementById("zone_saisie").style.display = "none";
    // On nettoie le magasin de la session
    if (sessionStorage.getItem("reecriture")){
        sessionStorage.removeItem("reecriture");
        }
	return true;
    }else{
	if (this.erreurCode === 1) {
		this.message = "Erreur "+ this.erreurCode;
		this.message += " : veuillez d'abord saisir le texte ";
		this.message += "de la réécriture !";
		this.titreMessage = "Mode d'emploi";
	}else{
		this.titreMessage = "Erreur dans l'application";
		this.message = "Erreur "+ this.erreurCode;
		this.message += " : erreur interne. Le texte de la ";
		this.message += "réécriture est manquant :(";
	}	
	this.afficherMessage();
    }		
}; // Fin de la méthode terminer()

// Méthode : pour masquer la correction	
reecriture.masquerCorrection = function () {
	document.getElementById("zone_correction").style.display = "none";
	document.getElementById("zone_saisie").style.display = "block";
}; // Fin de la méthode masquer_correction()

// Méthode : afficher_message
reecriture.afficherMessage = function () {
  document.getElementById("titre_notification").innerHTML = this.titreMessage;
  document.getElementById("message_notification").innerHTML = this.message;
  document.getElementById("notification").style.display = "block";

}; // Fin de la méthode afficher_message()

// Méthode : pour vider la zone de saisie...
reecriture.recommencerSaisie = function () {
	document.getElementById("ma_saisie").value = document.getElementById("initial").textContent;
	sessionStorage.clear();
}; // Fin de la méthode recommencer()

// Fin des méthodes de la classe reecriture

