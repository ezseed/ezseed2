##!/bin/bash
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

# Vérification de l'éxistance et création des dossiers si nécessaire
if [ -d /usr/local/nginx ]
then echo "Le répertoire existe"
else mkdir /usr/local/nginx
fi

if [ -f /usr/local/nginx/rutorrent_passwd ]
then echo "Le fichier gérant les accès existe déjà"
else touch /usr/local/nginx/rutorrent_passwd
fi

#ajout de l'environnement
echo "include /usr/local/bin" >> /etc/ld.so.conf

# Suppression des lignes include en doublon
(cat /etc/ld.so.conf | sort | uniq > /etc/ld.so.conf.tmp) &&  mv -f /etc/ld.so.conf.tmp /etc/ld.so.conf
ldconfig

# Vérification de l'existance de l'utilisateur pour le pool et création si nécessaire
test=
test=$(grep -e ezseedtorrent /etc/passwd)
if [ ${test} ]
then echo "Cet utilisateur est deja créé"
else useradd -M -p `openssl passwd ezseed` ezseedtorrent &&adduser www-data ezseedtorrent
fi

# Vérification de l'existance du fichier de config du pool et création si besoin
if [ -f /etc/php5/fpm/pool.d/ezseedtorrent.conf ]
then echo "Le fichier de configuration du pool existe déjà"
else echo "
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

if [ -d /etc/phpcgi ]
then echo "Le repertoire existe"
else mkdir /etc/phpcgi
fi

service php5-fpm restart
service nginx restart

exit 0
