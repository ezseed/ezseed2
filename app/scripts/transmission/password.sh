#!/bin/bash

username = $1
password = $2

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../../ && pwd)"

usermod -p $(mkpasswd -H md5 "$password") $username

exit 1
