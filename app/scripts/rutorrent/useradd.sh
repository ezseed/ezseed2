#!/bin/bash
############
#Ajout auto#
#Gaaa - LND#
############

###
#Vérification du root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi
###

#On initialise les variables
#Utilisateur - password

USER=$1
PW=$2

############
#Creation de l'utilisateur
python htpasswd.py -b /usr/local/nginx/rutorrent_passwd $USER $PW
mkdir /home/$USER
useradd --home-dir /home/$USER --groups users --password broken $USER
chown -R $USER /home/$USER/
su $USER -c 'mkdir -p ~/downloads ~/uploads'
usermod -p $(mkpasswd -H md5 "$PW") $USER
#Fin
##########

##########
#On met la conf rTorrent
cat > /home/$USER/.rtorrent.rc<< EOF
execute = {sh,-c,rm -f /home/$USER/rtorrent/session/rpc.socket}
scgi_local = /home/$USER/rtorrent/session/rpc.socket
execute = {sh,-c,chmod 0666 /home/$USER/rtorrent/session/rpc.socket}
encoding_list = UTF-8
system.umask.set = 022
port_random = yes
check_hash = no
directory = /home/$USER/downloads
session = /home/$USER/rtorrent/session
encryption = allow_incoming, try_outgoing, enable_retry
trackers.enable = 1
use_udp_trackers = yes
EOF
chown -R $USER /home/$USER
#Fin
##########

##########
#On fait la conf ruTorrent
mkdir /var/www/rutorrent/conf/users/$USER
cat > /var/www/rutorrent/conf/users/$USER/config.php<< EOF
<?php
\$scgi_port = 0;
\$scgi_host = "unix:///home/$USER/rtorrent/session/rpc.socket";
\$XMLRPCMountPoint = "/RPC00001";
\$pathToExternals = array(
    "php"   => '',               
    "curl"  => '/usr/bin/curl',  
    "gzip"  => '',               
    "id"    => '',               
    "stat"  => '/usr/bin/stat',  
);
?>
EOF
chmod -R 777 /var/www/rutorrent/

./daemon.sh start $USER

#Fin du script
##########

