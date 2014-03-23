#!/bin/bash
# chkconfig: 2345 98 02
#
# description: PM2 next gen process manager for Node.js
# processname: pm2
#
### BEGIN INIT INFO
# Provides:          pm2
# Required-Start: $local_fs $remote_fs
# Required-Stop: $local_fs $remote_fs
# Should-Start: $network
# Should-Stop: $network
# Default-Start:        2 3 4 5
# Default-Stop:         0 1 6
# Short-Description: PM2 init script
# Description: PM2 is the next gen process manager for Node.js
### END INIT INFO

NAME=pm2
PM2=/usr/local/lib/node_modules/pm2/bin/pm2
USER=root

export PATH=$PATH:/usr/local/bin
export HOME="/root"

super() {
    sudo -Ei -u $USER PATH=$PATH $*
}

start() {
    if [ ! -z "$(ps -ef | grep 'pm2: ezseed' | grep -v grep)" ]
    then
        echo "Ezseed is already running" >&2
    else
        echo "Starting $NAME"
        super ezseed reboot
        super $PM2 resurrect
    fi
}

stop() {
    super $PM2 dump
    super $PM2 stop ezseed
    super $PM2 stop watcher
    super $PM2 kill
}

restart() {
    echo "Restarting $NAME"
    stop
    start
}

reload() {
    echo "Reloading $NAME"
    super $PM2 gracefulReload all
}

status() {
    echo "Status for $NAME:"
    $PM2 list
    RETVAL=$?
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
    reload)
        reload
        ;;
    *)
        echo "Usage: {start|stop|status|restart|reload}"
        exit 1
        ;;
esac
exit $RETVAL
