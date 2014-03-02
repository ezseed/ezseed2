#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../../app && pwd)"

#Deleting user + transmission
username=$1

/etc/init.d/transmission-daemon-$username stop

killall -9 -u $username

rm /usr/bin/transmission-daemon-$username
rm /etc/init.d/transmission-daemon-$username
rm -r /var/lib/transmission-daemon-$username
rm -r /etc/transmission-daemon-$username
rm /etc/default/transmission-daemon-$username

rm $appdir/../scripts/transmission/config/settings.$username.json
rm -rf /home/$username

userdel $username

exit 0