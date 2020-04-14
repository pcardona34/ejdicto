#!/bin/sh

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

