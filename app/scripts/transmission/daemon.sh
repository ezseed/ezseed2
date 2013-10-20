#!/bin/bash
username=$2
opt=$1

service transmission-daemon-$username $opt

exit 1
