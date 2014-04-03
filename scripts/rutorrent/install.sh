#!/bin/bash
#su $user -c 'screen -dmS rtorrent rtorrent' lancer
###
#Vérification du root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi
###

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"


##building tools##
apt-get -y install libncurses5-dev libxmlrpc-c3-dev libcurl3-dev automake libncurses5 libcppunit-dev libtool pkg-config subversion php5-cli unzip ffmpeg curl php5-curl mediainfo screen unrar-free libsigc++-2.0-dev

#comerr-dev libcurl3-openssl-dev libidn11-dev libkadm55 libkrb5-dev libssl-dev zlib1g-dev libncurses5 libncurses5-dev

#Téléchargement + déplacement de rutorrent (web)
svn checkout http://rutorrent.googlecode.com/svn/trunk/rutorrent/
svn checkout http://rutorrent.googlecode.com/svn/trunk/plugins/
mv ./plugins/* ./rutorrent/plugins/
rm -R ./plugins
mv rutorrent/ /var/www


# get xmlrpc from svn
svn checkout http://svn.code.sf.net/p/xmlrpc-c/code/stable xmlrpc-c
cd xmlrpc-c
./configure --disable-cplusplus
make
make install
cd ..
rm -rv xmlrpc-c


mkdir rtorrent
cd rtorrent

# get libtorrent from source
git clone https://github.com/rakshasa/libtorrent
cd libtorrent
./autogen.sh
./configure
make
make install
cd ..

#get rtorrent
git clone https://github.com/rakshasa/rtorrent
cd rtorrent
./autogen.sh
./configure --with-xmlrpc-c
make
make install
cd ../..
rm -rv rtorrent

ldconfig

# back from rtorrent

cd ../

rm -R rtorrent-0.9.2 libtorrent-0.13.2

#Création des dossiers
mkdir /usr/local/nginx
touch /usr/local/nginx/rutorrent_passwd

#ajout de l'environnement
echo "include /usr/local/bin" >> /etc/ld.so.conf
ldconfig

#Ajout de la config dans php-fpm.conf
echo "
[www]
listen = /etc/phpcgi/php-cgi.socket
user = www-data
group = www-data
pm.max_children = 4096
pm.start_servers = 4
pm.min_spare_servers = 4
pm.max_spare_servers = 128
pm.max_requests = 4096
" >> /etc/php5/fpm/php-fpm.conf

mkdir /etc/phpcgi

service php5-fpm restart
service nginx restart

exit 0
