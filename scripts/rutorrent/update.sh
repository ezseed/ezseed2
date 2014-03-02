#!/bin/bash

#root
if [ "$(id -u)" != "0" ]; then
        echo "This bash script needs a root account" 1>&2
        exit 1
fi
###

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 9.2 dependecies
apt-get install -y libsigc++-2.0-dev

#clone rtorrent et libtorrent
wget --no-check-certificate http://libtorrent.rakshasa.no/downloads/libtorrent-0.13.2.tar.gz
tar -xf libtorrent-0.13.2.tar.gz
rm libtorrent-0.13.2.tar.gz

wget --no-check-certificate http://libtorrent.rakshasa.no/downloads/rtorrent-0.9.2.tar.gz
tar -xzf rtorrent-0.9.2.tar.gz
rm rtorrent-0.9.2.tar.gz


#compilation libtorrent
cd libtorrent-0.13.2
./autogen.sh
./configure
make
make install

#compilation rtorrent
cd ../rtorrent-0.9.2
./autogen.sh
./configure --with-xmlrpc-c
make
make install

#that.
ldconfig

#back from rtorrent

cd ../

rm -R rtorrent-0.9.2 libtorrent-0.13.2

