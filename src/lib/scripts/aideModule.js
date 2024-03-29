/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* ===========================================
 *      A i d e    g é n é r a l e
 *      dans ejDicto
 * ===========================================
 */

/* Masquer / afficher l'aide dans son ensemble */

exports.masquer_aide = function () {
  $("#aide").hide();
};

exports.afficher_aide = function () {
  $("#aide").show();
};

/* Affichage / masquage des sections de l'aide en accordéon */
exports.alterner_section_aide = function (id) {
  let section = document.getElementById(id);
  if (section.className.indexOf("w3-show") == -1) {
    section.className += " w3-show";
  } else {
    section.className = section.className.replace(" w3-show", "");
  }
};