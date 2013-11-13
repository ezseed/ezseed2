#!/bin/bash

username = $1
password = $2

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../../ && pwd)"

usermod -p $(mkpasswd -H md5 "$password") $username
python $DIR/htpasswd.py -b /usr/local/nginx/rutorrent_passwd $username $password

exit 1

