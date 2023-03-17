# script to download timer app to openwrt router
# assuming you have admin rights to the router (ie know it's root password)
# from a linux box connected to the router - for example at 192.168.1.1
# use:

# curl https://jonathan-annett.github.io/timer/install.sh | ssh root@192.168.1.1

# you will be asked for the router password

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
