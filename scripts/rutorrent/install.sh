#!/bin/bash
#su $user -c 'screen -dmS rtorrent rtorrent' lancer
#
#Vérification du root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi
###

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"


##building tools##
apt-get -y install libncurses5-dev libxmlrpc-c3-dev libcurl3-dev automake libncurses5 libcppunit-dev libtool pkg-config subversion php5-cli unzip ffmpeg curl php5-curl mediainfo screen unrar-free libsigc++-2.0-dev

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
rm libtorrent-0.13.2.tar.gz
rm rtorrent-0.9.2.tar.gz

# Vérification de l'éxistance et création des dossiers si nécessaire
if [ !-d /usr/local/nginx ]
then mkdir /usr/local/nginx
fi

if [ !-f /usr/local/nginx/rutorrent_passwd ]
then touch /usr/local/nginx/rutorrent_passwd
fi

#ajout de l'environnement
echo "include /usr/local/bin" >> /etc/ld.so.conf

# Suppression des lignes include en doublon
(cat /etc/ld.so.conf | sort | uniq > /etc/ld.so.conf.tmp) &&  mv -f /etc/ld.so.conf.tmp /etc/ld.so.conf
ldconfig

# Vérification de l'existance de l'utilisateur pour le pool et création si nécessaire
test=$(grep -e ezseedtorrent /etc/passwd)
if [ !${test} ]
then useradd -M -p `openssl passwd ezseed` ezseedtorrent &&adduser www-data ezseedtorrent
fi

# Vérification de l'existance du fichier de config du pool et création si besoin
if [ !-f /etc/php5/fpm/pool.d/ezseedtorrent.conf ]
then echo "
# Nom du pool
[ezseed]

# Utilisateurs et socket du pool
user = ezseedtorrent
group = ezseedtorrent
listen = /etc/phpcgi/php-cgi-ezseed.socket

# Parametre du pool
pm = dynamic
pm.max_children = 4096
pm.start_servers = 4
pm.min_spare_servers = 4
pm.max_spare_servers = 128
pm.max_requests = 4096
chdir = /
" >> /etc/php5/fpm/pool.d/ezseedtorrent.conf
fi

if [ !-d /etc/phpcgi ]
then mkdir /etc/phpcgi
fi

service php5-fpm restart
service nginx restart

exit 0
