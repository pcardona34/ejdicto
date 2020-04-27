/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* ===========================================
 *      a s s i s t a n t
 *      de la saisie : dictée aménagée
 * ===========================================
 */

/* Nécessaire pour afficher le 
message d'erreur popup */
const Popup = require('./messageModule.js').Popup;
const popup = new Popup();

/* Insère le mot sélectionné dans la dictée aménagée */
exports.inserer_mot = function (inputName){
    try {
      let choix = document.querySelector('input[name="'+inputName +'"]:checked').value;
      let num = inputName.slice(7);
      substituer_etiquette(choix, num) &&  $("#form_" + num).hide()
      && sessionStorage.setItem("ejdicto_form" + num, true);
      return true;
    }
    catch (erreur) {
      popup.afficherMessage(1);
    }

};

function substituer_etiquette(motChoisi,num){
  let maSaisie = document.getElementById("ma_saisie");
  let saisie = maSaisie.value;
  sortie = saisie.replace("_("+num+")_", motChoisi.trim());
  maSaisie.value = sortie;
  sessionStorage.setItem("dictee", sortie);
  actualiser_assistant(false);
  return true;
}

exports.actualiser_assistant = function(messageTerminer = false) {
  let nombre = 0;
  let dictee;
  if (sessionStorage.getItem("dictee")){
    dictee = sessionStorage.getItem("dictee");
  }else{
    dictee = $("#ma_saisie").val();
  }
  let indice;
  let nMots = 10;
  let motif = ""
  for (indice = 0;indice < nMots; indice++){
    motif = "_(" +((indice + 1))+ ")_";
    if (dictee.indexOf(motif) !== -1){
      nombre++;
      $("#form_"+(indice + 1)).show();
    }else{
      $("#form_"+(indice + 1)).hide();
    }
  }
  if ( nombre > 0 ) {
    $("#assistant").show();
    $(".autres_boutons").hide();
    if ( messageTerminer === true ){
      popup.afficherMessage(6);
      return true;
    }
  }else{
    if (messageTerminer === false){
      messageAssistantIndisponible();
      }
      $(".autres_boutons").show();
      $("#assistant").hide();
  }
  return false;
};

function messageAssistantIndisponible() {
  /* Est-ce une dictée aménagée ? */
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === 'true' ){
    popup.afficherMessage(7);
  }
}
