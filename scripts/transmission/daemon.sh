#!/bin/bash
opt=$1
username=$2

/etc/init.d/transmission-daemon-$username $opt

exit 0
