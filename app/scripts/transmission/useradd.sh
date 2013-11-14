#!/bin/bash

username=$1
password=$2

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../../ && pwd)"

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
mkdir /home/$username
useradd --home-dir /home/$username --groups users,debian-transmission --password broken $username
#could root it, see chroot
chown -R $username /home/$username/
su $username -c "mkdir -p ~/downloads ~/uploads ~/incomplete"
usermod -p $(mkpasswd -H md5 "$password") $username
#Fin

#useradd $username -p $(mkpasswd -H md5 $password) -G debian-transmission -d $userdir -m

echo "Set new transmission-daemon-$username"
cp /usr/bin/transmission-daemon /usr/bin/transmission-daemon-$username
cp /etc/init.d/transmission-daemon /etc/init.d/transmission-daemon-$username
cp -a /var/lib/transmission-daemon /var/lib/transmission-daemon-$username
cp -a /etc/transmission-daemon /etc/transmission-daemon-$username
cp /etc/default/transmission-daemon /etc/default/transmission-daemon-$username


sed 's/NAME=transmission-daemon/NAME=transmission-daemon-'$username'/' </etc/init.d/transmission-daemon-$username >/etc/init.d/transmission-daemon-$username.new

mv /etc/init.d/transmission-daemon-$username.new /etc/init.d/transmission-daemon-$username

sed 's/USER=debian-transmission/USER='$username'/' </etc/init.d/transmission-daemon-$username >/etc/init.d/transmission-daemon-$username.new

mv /etc/init.d/transmission-daemon-$username.new /etc/init.d/transmission-daemon-$username

sed 's/CONFIG_DIR="\/var\/lib\/transmission-daemon\/info"/CONFIG_DIR="\/var\/lib\/transmission-daemon-'$username'\/info"/' </etc/default/transmission-daemon-$username >/etc/default/transmission-daemon-$username.new

mv /etc/default/transmission-daemon-$username.new /etc/default/transmission-daemon-$username

# Useful ?
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

#ln -sf /var/lib/transmission-daemon-$username/info/settings.json /etc/transmission-daemon-$username/settings.json 

#Symlink to node app
#ln -sf /var/lib/transmission-daemon-$username/info/settings.json $appdir/scripts/transmission/config/settings.$username.json 
#cp /etc/transmission-daemon-$username/settings.json $appdir/scripts/transmission/config/settings.$username.json

ln -sf /etc/transmission-daemon-$username/settings.json $appdir/scripts/transmission/config/settings.$username.json 
ln -sf /etc/transmission-daemon-$username/settings.json /var/lib/transmission-daemon-$username/info/settings.json 
#ln -sf /var/lib/transmission-daemon-$username/info/settings.json /etc/transmission-daemon-$username/settings.json

chown -R $username:$username /var/lib/transmission-daemon-$username
chown -R $username:$username /etc/transmission-daemon-$username

chmod 775 $appdir/scripts/transmission/config/settings.$username.json 
chmod -R 755 /etc/transmission-daemon-$username

#echo "Adding user config username/peerport/rpcport/daysleft"
#echo -e "$username;$peerport;$rpcport;30"  >> $userdir/config/users

# echo "Starting Transmission"
#/etc/init.d/transmission-daemon-$username start
#/etc/init.d/transmission-daemon-$username stop

#update-rc.d ./daemons.sh defaults

echo "Done"

exit 0
