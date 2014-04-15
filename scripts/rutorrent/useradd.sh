#!/bin/bash
############
#Ajout auto#
#Gaaa - LND#
#Mods by soyuka for ezssed2#
############
###############################################################################
######################    DECLARATION DES VARIABLES    ########################
###############################################################################
USER=$1
PW=$2
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CHEMIN=$(sudo -i -u $USER env | grep HOME | sed 's/\HOME=//')
WEBUSER=$(ps aux | grep $(netstat -tulpn | grep :80 | awk -F/ '{print $2}' | sed -e "s/ *$//" | sort -u) | cut -d ' ' -f 1 | sed '/root/d' | sort -u)

###############################################################################
###############################    SCRIPT    ##################################
###############################################################################
# Vérification du root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi

# Création de l'utilisateur
python $DIR/htpasswd.py -b /usr/local/nginx/rutorrent_passwd $USER $PW

# Création des répertoires
chown -R $USER:$USER $CHEMIN
su $USER -c 'mkdir -p ~/downloads ~/uploads ~/incomplete ~/rtorrent ~/rtorrent/session'

# On met la conf rtorrent
su $USER -c "touch $CHEMIN/.rtorrent.rc"
cat > $CHEMIN/.rtorrent.rc<< EOF
execute = {sh,-c,rm -f $CHEMIN/rtorrent/session/rpc.socket}
scgi_local = $CHEMIN/rtorrent/session/rpc.socket
execute = {sh,-c,chmod 0666 $CHEMIN/rtorrent/session/rpc.socket}
encoding_list = UTF-8
system.umask.set = 022
port_range = 45000-65000
port_random = yes
check_hash = no
directory = $CHEMIN/incomplete
session = $CHEMIN/rtorrent/session
encryption = allow_incoming, try_outgoing, enable_retry
trackers.enable = 1
use_udp_trackers = yes
EOF

# On fait la conf rutorrent
mkdir -p /var/www/rutorrent/conf/users/$USER
cat > /var/www/rutorrent/conf/users/$USER/config.php<< EOF
<?php
\$scgi_port = 0;
\$scgi_host = "unix://$CHEMIN/rtorrent/session/rpc.socket";
\$XMLRPCMountPoint = "/RPC00001";
\$pathToExternals = array(
    "php"   => '',               
    "curl"  => '/usr/bin/curl',  
    "gzip"  => '',               
    "id"    => '',               
    "stat"  => '/usr/bin/stat',  
);
\$topDirectory = "$CHEMIN";
?>
EOF

chown -R $WEBUSER:$WEBUSER /var/www/rutorrent
chmod -R 777 /var/www/rutorrent/share/users

$DIR/daemon.sh start $USER

exit 0
