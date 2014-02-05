var socketio = require('socket.io')
  , pathInfo = require('path')
  , cache = require('memory-cache')
  , users = require('./helpers/users.js')
  , db = require('./database')
  , pretty = require('prettysize')
  , _ = require('underscore');


module.exports.listen = function(server) {

    io = socketio.listen(server, {secure: true});
    io.set('log level', 1); //less log

    io.sockets.on('connection', function (socket) {

        //To be improved (go through plugins)
        require('../plugins').sockets(socket, io.sockets);


        socket.on('update', function(uid) {

            // db.paths.byUser(uid, function(err, paths) {

                // explorer.explore(paths, function(err, update) {

            // db.files.byUser(uid, 0, function(err, files) {
            //    socket.emit('files', JSON.stringify(files));

            //     cache.put('lastUpdate_'+uid, new Date);
            // });

            //     // });

            //     // db.users.count(function(err, num) {
            //     //     //Space left = disk / users
            //     //     var spaceLeft = global.config.diskSpace / num;

            //     //     users.usedSize(paths, function(size) {

            //     //         //(/helpers/users)
            //     //         var percent = size.size / 1024 / 1024;

            //     //         percent = percent / spaceLeft * 100 + '%';

            //     //         spaceLeft = pretty(spaceLeft * 1024 * 1024);

            //     //         socket.emit('size', {left : spaceLeft, percent : percent, pretty : size.pretty});

            //     //     });

            //     // });

            //     var interval = cache.get('interval_' + uid);

            //     if(interval)
            //         clearInterval(interval);

            //     cache.put(
            //         'interval_' + uid, 
            //         setInterval(function() {
            //             users.fetchDatas(_.extend(paths, {sid: socket.id, uid: uid, io: io}));
            //             users.fetchRemoved(_.extend(paths, {sid: socket.id, uid: uid, io: io}));
            //         }, global.config.fetchTime)
            //     );

            // });

        });

        //Adds a tmp watcher + socket id, watch change of specific archive
        socket.on('archive', function(id) {
            
            var chokidar = require('chokidar');

            //Starts watching by omitting invisible files 
            //(see https://github.com/paulmillr/chokidar/issues/47) 
            var watcher = chokidar.watch(pathInfo.join(global.config.root, '/public/downloads/.tmp'),
                { 
                    // ignored: function(p) {
                    //     return /^\./.test(pathInfo.basename(p));
                    // },
                    persistent:false

                }
            );

            watcher.on('change', function(p, stats) {
                var id = pathInfo.basename(p).replace('.zip', '');
                io.sockets.socket(socket.id).emit('compressing', {'done': stats.size, 'id':id});
            });

            watcher.close();
        });

   });

  return io;
}
