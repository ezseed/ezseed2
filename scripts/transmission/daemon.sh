#!/bin/bash
opt=$1
username=$2

if [ ! -z $(ps -ef | grep transmission-daemon-$username | grep -v grep) && $opt eq 'start' ];
then
	echo "Transmission is already running"
	exit 1
else if [ $opt eq 'start' ];
	/etc/init.d/transmission-daemon-$username $opt

else
	/etc/init.d/transmission-daemon-$username $opt
fi

exit 0
