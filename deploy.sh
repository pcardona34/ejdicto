#!/bin/sh

. ./VERSION
echo "Publishing on the gh-pages..."

git add *
git commit -m "Mise à jour : version $VERSION"
git push
