#!/bin/bash
#
# Détection du serveur web utilisé
# Paramétrage des vhost ezseed en fonction du serveur web
#
###############################################################################
######################    DECLARATION DES VARIABLES    ########################
###############################################################################
NGINX="/etc/nginx"
NGINXAVAILABLE="/etc/nginx/sites-available"
NGINXENABLED="/etc/nginx/sites-enabled"
APACHEAVAILABLE="/etc/apache2/sites-available"


###############################################################################
#####################    DECLARATION DES FONCTIONS    #########################
###############################################################################
inconnu ()
{
# Serveur web non pris en charge actuellement
echo "Désolé la configuration automatique pour $serveur n'est pas prise en charge."
echo "Veuillez faire la configuration manuellement."

# Vérification de la désactivation de nginx
if [ "$(ls -A $NGINXAVAILABLE)" != "" ]; then
	rm $NGINXAVAILABLE/*
fi

if [ "$(ls -A $NGINXENABLED)" != "" ]; then
	rm $NGINXENABLED/*
fi

exit 0
}

nginx ()
{
# Vérification que les répertoires pour le vhost soient présents
if [ ! -d $NGINXAVAILABLE ]; then
	mkdir $NGINXAVAILABLE
fi

if [ ! -d $NGINXENABLED ]; then
	mkdir $NGINXENABLED && sed -i '/http {/ a\include /etc/nginx/sites-enabled/*' $NGINX/nginx.conf
fi

# Mise en place du vhost ezseed
if [ -e $NGINXENABLED/ezseed ] || [ -e $NGINXENABLED/ezseedSSL ]; then
	rm $NGINXENABLED/ezseed*
fi

if [ -f $NGINXAVAILABLE/ezseed ] || [ -f $NGINXAVAILABLE/ezseedSSL ]; then
	rm $NGINXAVAILABLE/ezseed*
fi

if [ -f $NGINXENABLED/default ]; then
	rm $NGINXENABLED/default
fi

cp /var/www/ezseed2/scripts/vhost/nginx/ezseed* $NGINXAVAILABLE/
ln -s $NGINXAVAILABLE/ezseed* $NGINXENABLED/

# Optimisation de worker_processes
PROC=$(cat /proc/cpuinfo | grep processor | wc -l)
perl -pi -e "s|worker_processes .*;|worker_processes '$PROC';|g" $NGINX/nginx.conf

# Redémarrage de nginx
service nginx restart

exit 0
}

apache ()
{
# Mise en place des vhost apache2
if [ -f $APACHEAVAILABLE/ezseedvhost ]; then
	a2dissite ezseedvhost && rm $APACHEAVAILABLE/ezseedvhost
fi
cp /var/www/ezseed2/scripts/vhost/apache/ezseedvhost $APACHEAVAILABLE/

# Vérification de la désactivation de nginx
if [ "$(ls -A $NGINXAVAILABLE)" != "" ]; then
	rm $NGINXAVAILABLE/*
fi

if [ "$(ls -A $NGINXENABLED)" != "" ]; then
	rm $NGINXENABLED/*
fi

# Activation des vhost et des mods nécessaire
a2dissite default
a2ensite ezseedvhost
a2enmod proxy proxy_http
echo "ATTENTION SSL NON SUPPORTE ACTUELLEMENT"

# Redémarrage de apache et nginx
service apache2 restart
service nginx restart

exit 0
}


###############################################################################
###############################    SCRIPT    ##################################
###############################################################################
#Vérification du root
if [ "$(id -u)" != "0" ]; then
	echo "Ce script nécessite les droits root pour pouvoir être éxécuté." 1>&2
	exit 1
fi

# Vérification du serveur web utilisé
SERVEURWEB=$(netstat -tulpn | grep :80 | awk -F/ '{print $2}' | sed -e "s/ *$//" | sort -u)
if [ "$SERVEURWEB" = "" ]
	then SERVEURWEB=aucun && echo "Nginx va être parametré pour devenir votre serveur web."
fi

case $SERVEURWEB in
	aucun|nginx)
		nginx
		break;;
	apache2)
		apache
		break;;
	*)
		inconnu
		break;;
esac

exit 0
