#!/bin/sh

if [[ -f index.html ]];then
  rm --verbose index.html
fi
cp --verbose index_dev.html index.html

echo "Serveur de développement..." && budo src/main.js --live --serve build/app.js -- -t hbsfy
