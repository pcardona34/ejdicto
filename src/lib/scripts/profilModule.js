/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* Gestion du PROFIL de l'utilisateur */

/* Objet profil */

var profil = {};

/* Méthodes de l'objet Profil */

profil.retourne = function(cle, defaut){
   if (localStorage.getItem(cle)){
    valeur = localStorage.getItem(cle);
    }else{
    valeur = defaut;
    }
    return valeur;
};


profil.changeNiveau = function() {
      let niveau = $("#niveau_choisi").val();
      localStorage.setItem("ejdictoProfilNiveau", niveau);
};

profil.changeAmenagement = function() {
      let amenagement = $("#amenagement_choisi").checked();
      localStorage.setItem("ejdictoProfilAmenagement", amenagement);
};


/* On expose l'objet profil */
exports.profil = profil;