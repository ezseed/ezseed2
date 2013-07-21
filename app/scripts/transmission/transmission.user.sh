#!/bin/bash

username=$1
password=$2
userdir=$3

# if [ -f /etc/init.d/transmission-daemon ]
# then
#     echo "Stopping transmission-daemon"
# 	/etc/init.d/transmission-daemon stop
# else
# 	apt-get install transmission-daemon
# 	echo "Stopping transmission-daemon"
# 	/etc/init.d/transmission-daemon stop
# fi

echo "Adding user"
useradd $username -p $(mkpasswd -H md5 $pass) -G debian-transmission -d $userdir/$username -m

chown -R $username:debian-transmission $userdir
chmod 775 $userdir

#echo "Adding tmp folder"
#cd $userdir/tmp
#mkdir $username
#chmod 777 $username

echo "Set new transmission-daemon-$username"
cp /usr/bin/transmission-daemon /usr/bin/transmission-daemon-$username
cp /etc/init.d/transmission-daemon /etc/init.d/transmission-daemon-$username
cp -a /var/lib/transmission-daemon /var/lib/transmission-daemon-$username
cp -a /etc/transmission-daemon /etc/transmission-daemon-$username
cp /etc/default/transmission-daemon /etc/default/transmission-daemon-$username

sed s/NAME=transmission-daemon/NAME=transmission-daemon-$username/ </etc/init.d/transmission-daemon-$username >/etc/init.d/transmission-daemon-$username.new

mv /etc/init.d/transmission-daemon-$username.new /etc/init.d/transmission-daemon-$username

sed 's/CONFIG_DIR="\/var\/lib\/transmission-daemon\/info"/CONFIG_DIR="\/var\/lib\/transmission-daemon-'$username'\/info"/' </etc/default/transmission-daemon-$username >/etc/default/transmission-daemon-$username.new

mv /etc/default/transmission-daemon-$username.new /etc/default/transmission-daemon-$username

#Useful ?
chmod 755 /usr/bin/transmission-daemon-$username
chmod 755 /etc/init.d/transmission-daemon-$username
chmod -R 755 /var/lib/transmission-daemon-$username
chmod -R 755 /etc/transmission-daemon-$username
chmod 755 /etc/default/transmission-daemon

echo "Editing settings"

#cp $userdir/config/settings.default.json $userdir/config/settings.json

# sed -i -e 's/"download-dir": ""/"download-dir": "\/home\/seedbox\/users\/'$username'\/downloads"/g' $userdir/config/settings.json
# sed -i -e 's/"peer-port": /"peer-port": '$peerport'/g' $userdir/config/settings.json
# sed -i -e 's/"rpc-password": ""/"rpc-password": "'$pass'"/g' $userdir/config/settings.json
# sed -i -e 's/"rpc-port": /"rpc-port": '$rpcport'/g' $userdir/config/settings.json
# sed -i -e 's/"rpc-username": ""/"rpc-username": "'$username'"/g' $userdir/config/settings.json

#mv $userdir/config/settings.json /etc/transmission-daemon-$username/settings.json

ln -sf /etc/transmission-daemon-$username/settings.json /var/lib/transmission-daemon-$username/info/settings.json
chmod -R 755 /etc/transmission-daemon-$username

#echo "Adding user config username/peerport/rpcport/daysleft"
#echo -e "$username;$peerport;$rpcport;30"  >> $userdir/config/users

#echo "Reloading apache"
#/etc/init.d/apache2 reload

echo "Starting Transmission"
/etc/init.d/transmission-daemon-$username start

echo "Done"

exit 1
