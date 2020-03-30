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

