# script to download timer app to openwrt router
mkdir -p /root/timer
cd /root/timer
wget  https://jonathan-annett.github.io/timer/timer.html  -O ./timer.html
wget  https://jonathan-annett.github.io/timer/timer.js    -O ./timer.js
wget  https://jonathan-annett.github.io/timer/timer.css   -O ./timer.css
wget  https://jonathan-annett.github.io/timer/fsapi.js    -O ./fsapi.js
wget  https://jonathan-annett.github.io/timer/index.js    -O ./index.js
wget  https://jonathan-annett.github.io/timer/index.html  -O ./index.html
wget  https://jonathan-annett.github.io/timer/keyhelp.js  -O ./keyhelp.js
wget  https://jonathan-annett.github.io/timer/keyhelp.css -O ./keyhelp.css
cd /www
test -e ./timer && rm ./timer
ln -s /root/timer ./timer
cd /root
