#!/bin/bash
############
#Ajout auto#
#Gaaa - LND#
#Mods by soyuka for ezssed2#
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
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOME="$( su $USER -c 'cd ~/ && pwd' )"

############
#Creation de l'utilisateur
python $DIR/htpasswd.py -b /usr/local/nginx/rutorrent_passwd $USER $PW
#could root it, see chroot
su $USER -c "mkdir -p $HOME/downloads $HOME/uploads $HOME/incomplete $HOME/rtorrent $HOME/rtorrent/session"
#Fin
##########

##########
#On met la conf rTorrent
su $USER -c "touch $HOME/.rtorrent.rc"
cat > $HOME/.rtorrent.rc<< EOF
execute = {sh,-c,rm -f $HOME/rtorrent/session/rpc.socket}
scgi_local = $HOME/rtorrent/session/rpc.socket
execute = {sh,-c,chmod 0666 $HOME/rtorrent/session/rpc.socket}
encoding_list = UTF-8
system.umask.set = 022
port_random = yes
check_hash = no
directory = $HOME/incomplete
session = $HOME/rtorrent/session
encryption = allow_incoming, try_outgoing, enable_retry
trackers.enable = 1
use_udp_trackers = yes
EOF

chown -R $USER $HOME

#Fin
##########

##########
#On fait la conf ruTorrent
mkdir /var/www/rutorrent/conf/users/$USER
cat > /var/www/rutorrent/conf/users/$USER/config.php<< EOF
<?php
\$scgi_port = 0;
\$scgi_host = "unix://$HOME/rtorrent/session/rpc.socket";
\$XMLRPCMountPoint = "/RPC00001";
\$pathToExternals = array(
    "php"   => '',               
    "curl"  => '/usr/bin/curl',  
    "gzip"  => '',               
    "id"    => '',               
    "stat"  => '/usr/bin/stat',  
);
\$topDirectory = "$HOME";
?>
EOF

$DIR/daemon.sh start $USER

chmod 777 /var/www/rutorrent/share
#Fin du script
##########

exit 0
