/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* ===========================================
 *      c a r s p e c
 *      utilities
 * ===========================================
 */

/* Insertion de caractères spéciaux dans le champ de formulaire textarea */ 

/* Insertion de caractères spéciaux
 * Fonction liée au composant : barreCaracteresSpeciauxTemplate.hbs
 */

/*
* args[0] : car : type string, the typo selected.
* args[1] : cible : type id du DOM, identifie la zone textarea où insérer le caractère
*/

exports.inserer = function () {
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

