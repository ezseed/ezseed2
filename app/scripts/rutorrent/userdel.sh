#!/bin/bash
############
#Gaaa - LND#
############
#DEL SCIRPT#
############

###
#Vérification du root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi

if [ -z "$1" ]; then
exit 1
fi
###

###
#On variable l'user
USER=$1
###

./daemon.sh stop $USER

###
#On tue tout ce que possede l'user#
killall -9 -u $USER
###

###
#On supprime tout de l'user
rm -rf /home/$USER
userdel $USER
###

###
#On change son mdp d'accès ruTorrent
python ../utils/htpasswd.py -b /usr/local/nginx/rutorrent_passwd $USER tVTAq18s
###
