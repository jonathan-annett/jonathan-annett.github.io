mkdir -p /root/timer
cd /root/timer
wget  https://jonathan-annett.github.io/timer/timer.html
wget  https://jonathan-annett.github.io/timer/timer.js
wget  https://jonathan-annett.github.io/timer/timer.css
wget  https://jonathan-annett.github.io/timer/fsapi.js
wget  https://jonathan-annett.github.io/timer/index.js
wget  https://jonathan-annett.github.io/timer/index.html
wget  https://jonathan-annett.github.io/timer/keyhelp.js
wget  https://jonathan-annett.github.io/timer/keyhelp.css
cd /www
test -e ./timer && rm ,/timer
ln -s /root/timer .
cd /root
