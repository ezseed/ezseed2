#!/bin/bash
clear

if [ "$(id -u)" != "0" ]; then
	echo
	echo "This script must be run as root." 1>&2
	echo
	exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#install dependances
apt-get update
apt-get install openssl git subversion apache2 apache2-utils build-essential libsigc++-2.0-dev libcurl4-openssl-dev automake libtool libcppunit-dev libncurses5-dev libapache2-mod-scgi php5 php5-curl php5-cli libapache2-mod-php5 screen unrar-free unzip


svn checkout http://svn.code.sf.net/p/xmlrpc-c/code/stable xmlrpc-c
cd xmlrpc-c
./configure --disable-cplusplus
make
make install
cd ..
rm -rv xmlrpc-c


mkdir rtorrent
cd rtorrent

git clone https://github.com/rakshasa/libtorrent
cd libtorrent
./autogen.sh
./configure
make
make install
cd ..

git clone https://github.com/rakshasa/rtorrent
cd rtorrent
./autogen.sh
./configure --with-xmlrpc-c
make
make install
cd ../..
rm -rv rtorrent

ldconfig

if [ ! -d "$homedir"/.rtorrent-session ]; then
	mkdir "$homedir"/.rtorrent-session
	chown "$user"."$user" "$homedir"/.rtorrent-session
else
	chown "$user"."$user" "$homedir"/.rtorrent-session
fi


if [ ! -d "$homedir"/Downloads ]; then
	mkdir "$homedir"/Downloads
	chown "$user"."$user" "$homedir"/Downloads
else
	chown "$user"."$user" "$homedir"/Downloads
fi

wget -O $homedir/.rtorrent.rc https://raw.github.com/Kerwood/rtorrent.auto.install/master/Files/rtorrent.rc

chown "$user"."$user" $homedir/.rtorrent.rc

sed -i "s@HOMEDIRHERE@$homedir@g" $homedir/.rtorrent.rc 


if [ -z "$(cat /etc/apache2/apache2.conf | grep 'SCGIMount /RPC2 127.0.0.1:5000')" ]; then
echo "
# rutorrent
SCGIMount /RPC2 127.0.0.1:5000" >> /etc/apache2/apache2.conf
fi

if [ ! -h /etc/apache2/mods-enabled/scgi.load ]; then

        ln -s /etc/apache2/mods-available/scgi.load /etc/apache2/mods-enabled/scgi.load
fi


if [ -d /var/www/rutorrent ]; then
	rm -rf /var/www/rutorrent
fi

#get rutorrent and plugins from source
svn checkout http://rutorrent.googlecode.com/svn/trunk/rutorrent/
svn checkout http://rutorrent.googlecode.com/svn/trunk/plugins/

mv -f ./plugins/* ./rutorrent/plugins/
mv -f rutorrent/ /var/www

#clean
if [ -d ./plugins ]; then
	rm -rf ./plugins
fi

if [ -d ./rutorrent ]; then
	rm -rf ./rutorrent
fi


# right
chown -R www-data.www-data /var/www/rutorrent
chmod -R 775 /var/www/rutorrent


echo 'AuthUserFile /var/www/rutorrent/.htpasswd
AuthName "Seedbox auth"
AuthType Basic
Require Valid-User' > /var/www/rutorrent/.htaccess

if [ ! -f /etc/apache2/sites-available/rutorrent.script.conf ]; then

echo "<VirtualHost *:80>

	ServerName *
	ServerAlias *

        DocumentRoot /var/www/

        CustomLog /var/log/apache2/rutorrent.log vhost_combined

        ErrorLog /var/log/apache2/rutorrent_error.log

        <Directory /var/www/rutorrent/>
                Options Indexes FollowSymLinks MultiViews
                AllowOverride AuthConfig
                Order allow,deny
                allow from all
        </Directory>
</VirtualHost>" > /etc/apache2/sites-available/rutorrent.script.conf

a2ensite rutorrent.script.conf

fi

if [ -z "$(ip addr | grep eth0)" ]; then
	echo "Visit rutorrent at http://IP.ADDRESS/rutorrent" 
else
	ip=$(ip addr | grep eth0 | grep inet | awk '{print $2}' | cut -d/ -f1)
	echo "Visit rutorrent at http://$ip/rutorrent"
