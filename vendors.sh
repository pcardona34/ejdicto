#!/bin/sh

echo "Cleaning and minifying CSS : vendors..."
echo "1) w3.css" && cleancss -o vendor/w3school/styles/w3.min.css vendor/w3school/styles/w3.css;
echo "2) IcoMoon icons..." && cleancss -o vendor/icomoon/style.min.css vendor/icomoon/style.css;
echo "Minifying JS..."
echo "1) w3.js" && jsmin -o vendor/w3school/scripts/w3.min.js vendor/w3school/scripts/w3.js;
echo "All is done !";

