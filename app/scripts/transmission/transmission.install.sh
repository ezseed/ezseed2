#!/bin/bash

if [ -n "$1" ]
then
	dir=$1
else
	exit 0
fi

if [ -f /etc/init.d/transmission-daemon ]
then
    echo "Stopping transmission-daemon"
	/etc/init.d/transmission-daemon stop
else
	apt-get install transmission-daemon -y
	echo "Stopping transmission-daemon"
	/etc/init.d/transmission-daemon stop
fi

#Copier les settings initial + 
cp /etc/transmission-daemon/settings.json $dir/scripts/transmission/config/settings.bak.json
