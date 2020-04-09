# ejdicto

Version améliorée de l'exerciseur en orthographe (jDicto)
(c) 2012-2020 - Patrick Cardona

+ Cette version de l'exerciseur de dictée est plus robuste, mais aussi capable de s'adapter aux usages mobiles.
+ Elle propose une liste filtrée des dictées et de réécritures.

## Pour développer le logiciel

### Première installation

    `git clone https://github.com/pcardona34/ejdicto/`
    `cd ejdicto`
    `npm install`

### Pour exécuter le serveur de développement
    `npm start`

+ Le code à adapter à vos besoins se situe dans les dossiers `src` et `lib`.
+ Les données sont dans `static/config` et `static/data`.

## Pour créer une version de production

La publication est effectuée dans le dossier `docs` (cible de la publication de la branche *gh-pages*) :

### La première fois seulement

    `npm run minifycssvendor`
    `npm run minifyjsvendor`
    `npm run minifycssicones`

### La première fois et les suivantes

    `npm run build`
    `npm run minifycss`
    `npm run minifyjslib`
    `npm run minifyjsapp`

