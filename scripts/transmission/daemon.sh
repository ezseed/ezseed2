#!/bin/bash
opt=$1
username=$2

d_start() {
 
	if [ ! -z $(ps -ef | grep transmission-daemon-$username | grep -v grep) ];
	then
		echo "Transmission is already running"
		return
	else
		/etc/init.d/transmission-daemon-$username $opt
	fi

}

d_stop() {
  	/etc/init.d/transmission-daemon-$username $opt
}

d_restart() {
	/etc/init.d/transmission-daemon-$username $opt
}

case "$1" in
  start)
    echo -n "Starting : $username"
    d_start
    ;;
  stop)
    echo -n "Stopping : $username"
    d_stop
    ;;
  restart|force-reload)
    echo -n "Restarting : $username"
    d_restart
    ;;
  *)
    echo "Usage: $SCRIPTNAME {start|stop|restart|force-reload} user" >&2
    exit 1
    ;;
esac

exit 0
