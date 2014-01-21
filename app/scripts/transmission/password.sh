#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../../ && pwd)"

usermod -p $(mkpasswd -H md5 "$2") $1

exit 1
