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


##Rutorrent and building tools##
apt-get -y install libncurses5-dev libxmlrpc-c3-dev libcurl3-dev automake libncurses5 libcppunit-dev libtool pkg-config subversion php5-cli unzip ffmpeg curl php5-curl mediainfo screen unrar-free

#Téléchargement + déplacement de rutorrent (web)
#rutorrent
#wget http://dl.bintray.com/novik65/generic/rutorrent-3.6.tar.gz
#tar -xzf rutorrent-3.6.tar.gz 
#mv rutorrent/ /var/www
#rm rutorrent-3.6.tar.gz

#plugins
#wget http://dl.bintray.com/novik65/generic/plugins-3.6.tar.gz
#tar -xzf plugins-3.6.tar.gz
#mv ./plugins/* /var/www/rutorrent/plugins/
#rm -R ./plugins

svn checkout http://rutorrent.googlecode.com/svn/trunk/rutorrent/
svn checkout http://rutorrent.googlecode.com/svn/trunk/plugins/
mv ./plugins/* ./rutorrent/plugins/
rm -R ./plugins
mv rutorrent/ /var/www

#clone rtorrent et libtorrent
git clone https://github.com/rakshasa/rtorrent/
git clone https://github.com/rakshasa/libtorrent/
#compilation libtorrent
cd libtorrent
./autogen.sh
./configure
make
make install

#compilation rtorrent
cd ../rtorrent
./autogen.sh
./configure --with-xmlrpc-c
make
make install

#back to script root
cd ../

rm -R rtorrent libtorrent

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
