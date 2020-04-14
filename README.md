# ejDicto

Version améliorée des exerciseurs en orthographe (jDicto et jEcho)
(c) 2012-2020 - Patrick Cardona

+ Cette version améliore l'expérience utilisateur de l'exerciseur de dictée, 
et intègre aussi l'exerciseur de réécriture.
+ Elle propose une liste filtrée des dictées et de même, une liste filtrée des réécritures. L'usage mobile 
 a été mis en œuvre : voir la section suivante.

## Usages mobiles

+ Cette version de l'exerciseur de dictée est capable de s'adapter aux usages mobiles.
+ L'installation et le fonctionnement de l'application Web progressive (PWA) ont été testés avec succès 
 dans un environnement *Androïd*. Cette version est notamment adaptative et intègre des fonctionnalités 
 propres à l'usage mobile comme le partage.
+ Son installation est automatiquement proposée quand on affiche la page d'accueil du site dans le 
navigateur *Chrome* pour *Androïd*. Elle disposera alors d'une icône et 
sera vue comme une application à part entière.

## Pour adapter le logiciel à vos besoins

### Prérequis

+ Vous devez disposer d'un environnement de développement approprié 
(station de travail GNU/linux, Mac OS ou Windows avec les 
outils de développement activés : notamment l'interpréteur de commandes 
(shell) Bash. Vérifiez la présence de ces outils en ouvrant une console 
et en affichant leur version, sinon il faudra les installer.

    `bash --version;`
    `node --version;`
    `npm --version;`
    `git --version`

+ Pour les installer : Bash est présent sur GNU/Linux et Mac OS. 
[bash: sous Windows 10](https://korben.info/installer-shell-bash-linux-windows-10.html), 
[node](https://nodejs.dev/how-to-install-nodejs), 
[npm](https://www.npmjs.com/get-npm), 
[git](https://git-scm.com).

+ Pour automatiser la conversion des enregistrements audio, il est 
aussi conseillé d'installer [ffmpeg](https://ffmpeg.org). Vérifiez sa présence :

    `ffmpeg -version`

+ Parfait ! Vous pouvez passer à l'installation de la fabrique.

### Première installation de la fabrique

    `git clone https://github.com/pcardona34/ejdicto/`
    `cd ejdicto`
    `npm install`

### Pour exécuter le serveur de développement
    `npm run dev`

+ Affichez l'application en phase de développement à l'URL :

    `http://127.0.0.1:9966/`

+ Pour une personnalisation avancée, le code à adapter à vos besoins se situe dans les dossiers  
`src` et `src/lib`.
+ Pour modifier les listes de dictées ou de réécritures, le code au 
format JSON se situe dans `static/config`.


+ Pour arrêter le serveur de développement : `Ctrl + C`

### Pour ajouter de nouveaux exercices

+ Pour ajouter de nouvelles dictées ou réécritures : respectez les 
modèles au format JSON `dicteex.json` (dictée x) et `jechox.json` (exercice 
x de réécriture) puis déposez ces nouvelles données dans `static/data`.
+ Pour ajouter un nouvel enregistrement, `dicteex.mp3` 
(enregistrement de la dictée x) : copiez-le dans `static/audio`, puis 
exécutez la commande suivante afin de cloner cet enregistrement dans 
les autres formats (nécessite la présence de la commande `ffmpeg` dans 
votre système) :

    `npm run audio`

+ Alternative : vous pouvez aussi convertir votre enregistrement mp3
manuellement aux formats alternatifs `ogg` (Vorbis) et `aac` au moyen du logiciel 
 *Audacity*, par exemple. La présence des trois formats est nécessaire 
afin de garantir le fonctionnement de ejDicto sur toutes les 
plates-formes.

## Pour préparer une version de production

+ La publication des scripts et des feuilles de style est effectuée dans le dossier `public`.

### La première fois seulement

+ Pour créer une version minifiée des bibliothèques css et javascript 
externes. Il s'agit notamment des scripts et styles fournis par 
w3school, ainsi que la police d'icones IcoMoon.

    `npm run vendors`

### La première fois et les suivantes

    `npm run build`
    `npm run test`

+ Testez la version de pré-production dans votre navigateur à l'URL :

    `http://localhost:8000/'

+ Pour arrêter le serveur de test : `Ctrl + C`

## Pour publier vers les pages de Github (gh-pages)

+ La cible de la publication est la branche *gh-pages* qui coïncide avec la branche *master*.
+ Effectuez préalablement ce réglage dans les paramètres de votre dépôt 
Github la première fois. Puis exécutez :

    `npm run clean`
    `npm run deploy`

