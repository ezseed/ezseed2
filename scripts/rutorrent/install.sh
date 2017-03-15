#!/bin/bash
#su $user -c 'screen -dmS rtorrent rtorrent' lancer
###
# Mise en place des variables modifiables
TMP="/tmp" 						# Répertoire temporaire
WEB="/var/www" 					# Répertoire web
RUTORRENT="/var/www/rutorrent" 	# Répertoire de rutorrent
POOLUSER="ezseedpool"			# Nom de l'utilisateur qui lance le pool php
LIBTORRENT="http://libtorrent.rakshasa.no/downloads/libtorrent-0.13.2.tar.gz" 	# Adresse de DL pour libtorrent
RTORRENT="http://libtorrent.rakshasa.no/downloads/rtorrent-0.9.2.tar.gz" 		# Adresse de DL pour rtorrent


###############################################################################
###############################################################################
###############################    SCRIPT    ##################################
#########################    NE RIEN MODIFIER    ##############################
###############################################################################
###############################################################################

# Mise en place des variables fixes
PLUGINS=($RUTORRENT/plugins)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEBUSER=$(ps aux | grep $(netstat -tulpn | grep :80 | awk -F/ '{print $2}' | sed -e "s/ *$//" | sort -u) | cut -d ' ' -f 1 | sed '/root/d' | sort -u)

# Vérification du root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi

# building tools
apt-get install -y apache2-utils automake build-essential buildtorrent curl ffmpeg git htop libcppunit-dev libcurl3 libcurl3-dev libcurl4-openssl-dev libncurses5 libncurses5-dev libsigc++-2.0-dev libterm-readline-gnu-perl libtool libxmlrpc-c3-dev php5-cgi php5-cli php5-curl php5-geoip pkg-config screen subversion unrar-free unzip


###############################################################################
#############################    RUTOPRRENT    ################################
###############################################################################
# Téléchargement de rutorrent (web)
if [ ! -d $WEB ]; then
	mkdir -p $WEB
fi
svn checkout http://rutorrent.googlecode.com/svn/trunk/rutorrent/ $RUTORRENT

# Installation des plugins
# Plugins de bases
rm -R $PLUGINS
svn checkout http://rutorrent.googlecode.com/svn/trunk/plugins/ $PLUGINS
# Plugins logoff
svn co http://rutorrent-logoff.googlecode.com/svn/trunk/ $PLUGINS/logoff
# Plugins tadd-labels
wget -O $TMP/lbll-suite.tar.gz http://rutorrent-tadd-labels.googlecode.com/files/lbll-suite_0.8.1.tar.gz
tar -xzf $TMP/lbll-suite.tar.gz
rm $TMP/lbll-suite.tar.gz
mv $TMP/lbll* $PLUGINS
# Plugins mediainfo
wget -O $TMP/libzen.deb http://mediaarea.net/download/binary/libzen0/0.4.29/libzen0_0.4.29-1_amd64.Debian_7.0.deb
wget -O $TMP/libmediainfo.deb http://mediaarea.net/download/binary/libmediainfo0/0.7.65/libmediainfo0_0.7.65-1_amd64.Debian_7.0.deb
wget -O $TMP/mediainfo.deb http://mediaarea.net/download/binary/mediainfo/0.7.65/mediainfo_0.7.65-1_amd64.Debian_7.0.deb
dpkg -i $TMP/libzen.deb $TMP/libmediainfo.deb $TMP/mediainfo.deb
# Configuration de buildtorrent
sed -i ":useExternal: s:false:'buildtorrent':" $PLUGINS/create/conf.php
sed -i ":pathToCreatetorrent: s:= ':= '/usr/bin/buildtorrent:" $PLUGINS/create/conf.php

# Donner le répertoire rutorrent à l'utilisateur web
chown -R $WEBUSER:$WEBUSER $RUTORRENT


###############################################################################
##############################    RTORRENT    #################################
###############################################################################
# Téléchargement des sources de rtorrent et libtorrent
cd $TMP
wget --no-check-certificate $LIBTORRENT
tar -xzf libtorrent*
wget --no-check-certificate $RTORRENT
tar -xzf rtorrent*

# libtorrent compilation
cd $TMP/libtorrent*
./autogen.sh
./configure
make && make install

# rtorrent compilation
cd $TMP/rtorrent*
./autogen.sh
./configure --with-xmlrpc-c
make && make install

# that.
ldconfig
# Nettoyage du répertoire tmp
rm -R $TMP/*

# Vérification de l'éxistance et création du fichier passwd
if [ ! -d /usr/local/nginx ]; then
	mkdir -p /usr/local/nginx
fi
if [ ! -f /usr/local/nginx/rutorrent_passwd ]; then
	touch /usr/local/nginx/rutorrent_passwd
fi

#ajout de l'environnement
echo "include /usr/local/bin" >> /etc/ld.so.conf
# Suppression des lignes include en doublon
(cat /etc/ld.so.conf | sort | uniq > /etc/ld.so.conf.tmp) &&  mv -f /etc/ld.so.conf.tmp /etc/ld.so.conf
ldconfig


###############################################################################
##############################    POOL PHP    #################################
###############################################################################
# Vérification de l'existance de l'utilisateur pour le pool et création si nécessaire
if [ "$(grep -e $POOLUSER /etc/passwd)" = "" ]; then
	useradd -M -p `openssl passwd ezseed` $POOLUSER && adduser $WEBUSER $POOLUSER
fi
# Vérification de l'existance du fichier de config du pool et création si besoin
if [ ! -f /etc/php5/fpm/pool.d/$POOLUSER.conf ]; then
	echo "# Nom du pool
[ezseed]

# Utilisateur et socket du pool
user = $POOLUSER
group = $POOLUSER
listen = /etc/phpcgi/php-cgi-ezseed.socket

# Paramètres du pool
pm = dynamic
pm.max_children = 4096
pm.start_servers = 4
pm.min_spare_servers = 4
pm.max_spare_servers = 128
pm.max_requests = 4096
chdir = /
" >> /etc/php5/fpm/pool.d/$POOLUSER.conf
fi

if [ ! -d /etc/phpcgi ]; then
	mkdir /etc/phpcgi
fi

# Redémarrage de php5
service php5-fpm restart


exit 0
