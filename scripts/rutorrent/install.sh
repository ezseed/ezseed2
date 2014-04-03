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

#clone rtorrent et libtorrent
wget --no-check-certificate http://libtorrent.rakshasa.no/downloads/libtorrent-0.13.2.tar.gz
tar -xf libtorrent-0.13.2.tar.gz

wget --no-check-certificate http://libtorrent.rakshasa.no/downloads/rtorrent-0.9.2.tar.gz
tar -xzf rtorrent-0.9.2.tar.gz

# libtorrent compilation
cd libtorrent-0.13.2
./autogen.sh
./configure
make
make install

# rtorrent compilation
cd ../rtorrent-0.9.2
./autogen.sh
./configure --with-xmlrpc-c
make
make install

#that.
ldconfig

# back from rtorrent

cd ../

rm -R rtorrent-0.9.2 libtorrent-0.13.2
rm libtorrent-0.13.2.tar.gz
rm rtorrent-0.9.2.tar.gz

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
