#!/bin/bash

if [ -f /etc/init.d/transmission-daemon ]
then
    echo "Stopping transmission-daemon"
	/etc/init.d/transmission-daemon stop
else
	apt-get install transmission-daemon -y
	echo "Stopping transmission-daemon"
	/etc/init.d/transmission-daemon stop
fi