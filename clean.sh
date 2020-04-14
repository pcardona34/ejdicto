#!/bin/sh

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