#!/bin/bash
username=$1
opt=$2

service transmission-daemon-$username $opt

exit 1
