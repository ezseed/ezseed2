#!/bin/bash
#################
# ___  ___  ___  ___  ___  ___     _  _  ___ 
#(  _)(_  )/ __)(  _)(  _)(   \   ( )( )(__ \
# ) _) / / \__ \ ) _) ) _) ) ) )   \\// / __/
#(___)(___)(___/(___)(___)(___/    (__) \___)
#
################
#
# Adding mongodb source
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/debian-sysvinit dist 10gen' | tee /etc/apt/sources.list.d/10gen.list

apt-get update
apt-get upgrade -y

# Dependecies
# whois = mkpasswd
apt-get install mongodb-10gen git-core curl build-essential openssl libssl-dev whois python inotify-tools -y

mkdir /data
mkdir /data/db

#Install node js
git clone https://github.com/joyent/node.git
cd node
 
# 'git tag' shows all available versions: select the latest stable.
git checkout v0.10.20
 
# Configure seems not to find libssl by default so we give it an explicit pointer.
# Optionally: you can isolate node by adding --prefix=/opt/node
./configure --openssl-libpath=/usr/lib/ssl
make
make test

make install

# it's alive ?
if [ -z $(node -v) && -z $(npm -v) ]
then
	exit 0
else
	npm install pm2 -g
fi


