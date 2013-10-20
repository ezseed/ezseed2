#!/bin/bash

#Deleting user + transmission
username=$1

killall -9 -u $username

rm /usr/bin/transmission-daemon-$username
rm /etc/init.d/transmission-daemon-$username
rm -r /var/lib/transmission-daemon-$username
rm -r /etc/transmission-daemon-$username
rm /etc/default/transmission-daemon-$username

userdel -r $username