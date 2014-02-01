#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

usermod -p $(mkpasswd -H md5 "$2") $1
python $DIR/htpasswd.py -b /usr/local/nginx/rutorrent_passwd $1 $2

exit 1

