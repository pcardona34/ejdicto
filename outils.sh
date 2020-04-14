#!/bin/sh

echo "Outils de ejDicto : $0"

if [[ "$1" != "" ]];then
  TACHE=$1 && echo "Tâche : $TACHE";
  SCRIPT=$0;
else
  echo "Erreur dans $0 : aucun argment."
  exit 1
fi

# Fonctions

build() {

if [[ -f index.html ]];then
  rm --verbose index.html
fi
cp --verbose index_pwa.html index.html

echo "Building main bundle to app..."
browserify src/main.js -t hbsfy -o build/app.js;
echo "Done."
echo "Cleaning and minifying CSS : lib"
echo "1) ejdicto.css" && cleancss -o public/lib/styles/ejdicto.min.css src/lib/styles/ejdicto.css;
echo "Minifying JS..."
echo "1) ejDicto lib" && jsmin -o public/lib/scripts/ejdicto.min.js src/lib/scripts/ejdicto.js;
echo "2) main app bundle..." && jsmin -o public/app.min.js build/app.js;
echo "All is done !";

}

clean() {

### Clearing
# Test : is the python http server alive...?
ps -T|grep python3
if [[ $? = 0 ]];then
HTTP=$(ps -C python3 -o pid=)
echo "Stopping Python http server / Arrêt du serveur Http Python..."
kill -9 $HTTP
echo "Done / Fini."
fi

### Other cleaning task ?
if [[ -f build/app.js ]];then
  rm --verbose build/app.js
fi

}

deploy() {

. ./VERSION
echo "Publishing on the gh-pages..."

git add *
git commit -m "Mise à jour : version $VERSION"
git push

}

dev() {

if [[ -f index.html ]];then
  rm --verbose index.html
fi
cp --verbose index_dev.html index.html

echo "Serveur de développement..." && budo src/main.js --live --serve build/app.js -- -t hbsfy
}


testing() {

echo "Test before publishing..."

echo "Serveur Web local (Python http)..."

python3 -m http.server

}

vendors() {

echo "Cleaning and minifying CSS : vendors..."
echo "1) w3.css" && cleancss -o vendor/w3school/styles/w3.min.css vendor/w3school/styles/w3.css;
echo "2) IcoMoon icons..." && cleancss -o vendor/icomoon/style.min.css vendor/icomoon/style.css;
echo "Minifying JS..."
echo "1) w3.js" && jsmin -o vendor/w3school/scripts/w3.min.js vendor/w3school/scripts/w3.js;
echo "All is done !";

}

# On exécute la tâche

case $TACHE in
  "build")
  build;;
  "clean")
  clean;;
  "deploy")
  deploy;;
  "dev")
  dev;;
  "test")
  testing;;
  "vendors")
  vendors;;
  *)
  echo "Argument $TACHE : tâche inconnue dans $SCRIPT";
  exit 1;
esac
