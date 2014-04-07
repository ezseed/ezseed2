#!/bin/bash

# Vérification que les répertoires pour le vhost soient présents
if [ -d /etc/nginx/sites-available ]
then echo ""
else mkdir /etc/nginx/sites-available
fi

if [ -d /etc/nginx/sites-enabled ]
then echo ""
#include /etc/nginx/sites-enabled in the nginx.conf as a vhost include directory
else mkdir /etc/nginx/sites-enabled && sed '/http {/ a\include /etc/nginx/sites-enabled' /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp && mv -f /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf
fi

# Mise en place du vhost ezseed
if [ -f /etc/nginx/sites-enabled/ezseed ]
then rm /etc/nginx/sites-enabled/ezseed
fi

if [ -f /etc/nginx/sites-available/ezseed ]
then rm /etc/nginx/sites-available/ezseed
fi

if [ -f /etc/nginx/sites-enabled/default ]
then rm /etc/nginx/sites-enabled/default
fi

cp /var/www/ezseed2/scripts/nginx/ezseed /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/ezseed /etc/nginx/sites-enabled/



# Mise en place du vhost ezseedSSL
if [ -f /etc/nginx/sites-enabled/ezseedSSL ]
then rm /etc/nginx/sites-enabled/ezseedSSL
fi

if [ -f /etc/nginx/sites-available/ezseedSSL ]
then rm /etc/nginx/sites-available/ezseedSSL
fi

cp /var/www/ezseed2/scripts/nginx/ezseedSSL /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/ezseedSSL /etc/nginx/sites-enabled/



# Redémarrage de nginx
service nginx restart