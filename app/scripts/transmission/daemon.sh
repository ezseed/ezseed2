#!/bin/bash
username=$2
opt=$1

/etc/init.d/transmission-daemon-$username $opt

exit 1
