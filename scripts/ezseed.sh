#!/bin/bash
# chkconfig: 2345 98 02
#
# description: Ezseed reboot script
# processname: pm2
#
### BEGIN INIT INFO
# Provides:          ezseed
# Required-Start:    
# Required-Stop:
# Default-Start:        2 3 4 5
# Default-Stop:         0 1 6
# Short-Description: PM2 init script
# Description: PM2 is the next gen process manager for Node.js
### END INIT INFO

NAME=ezseed
PM2=/usr/local/lib/node_modules/pm2/bin/pm2
NODE=/usr/local/bin/node
USER=root

export HOME="/root"

super() {
    su -l $USER -c "$1 $2 $3"
}
 
start() {
    echo "Starting $NAME"
    super $PM2 start /var/www/ezseed2/ezseed.json
    super /var/www/ezseed2/ezseed reboot
}
 
stop() {
    echo "Stoping $NAME"
    super $PM2 stop all
}
 
restart() {
    echo "Restarting $NAME"
    super pm2 kill
    super ezseed start
}
 
status() {
    echo "Status for $NAME:"
    super $NODE $PM2 list
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
    *)
        echo "Usage: {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL
