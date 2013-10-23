var socketio = require('socket.io')
  , explorer = require('./explorer')
  , pathInfo = require('path')
  , cache = require('memory-cache')
  , users = require('../core/helpers/users.js')
  , db = require('../core/database.js')
  , _ = require('underscore');


module.exports.listen = function(app) {

    io = socketio.listen(app, {secure: true});
    io.set('log level', 1);

    io.sockets.on('connection', function (socket) {
        
        socket.on('update', function(uid) {
            console.log('Socket is ready : ' + socket.id);

            db.paths.byUser(uid, function(err, paths) {

                explorer.explore(paths, function(err, update) {

                    db.files.byUser(uid, 0, function(err, files) {
                        console.log('Sockets Updating client');

                        io.sockets.socket(socket.id).emit('files', JSON.stringify(files));

                    });

                    users.usedSize(paths, function(size) {

                        io.sockets.socket(socket.id).emit('size', size);

                    });

                    var interval = cache.get('interval_' + uid);

                    if(!interval) {
                        cache.put(
                            'interval_' + uid, 
                            setInterval(function() {
                                console.log('Fetching');
                                users.fetchDatas(_.extend(paths, {sid: socket.id, uid: uid, io: io, lastUpdate : new Date}));
                            }, global.config.fetchTime)
                        );
                    }

                });
            });
        });

        //Adds a tmp watcher + socket id, watch change of specific archive
        socket.on('archive', function(id) {
            
            var chokidar = require('chokidar');

            //Starts watching by omitting invisible files 
            //(see https://github.com/paulmillr/chokidar/issues/47) 
            var watcher = chokidar.watch(pathInfo.join(global.config.root, '/public/tmp'),
                { 
                    ignored: function(p) {
                        return /^\./.test(pathInfo.basename(p));
                    },
                    persistent:false

                }
            );

            watcher.on('change', function(p, stats) {
                var id = pathInfo.basename(p).replace('.zip', '');
                io.sockets.socket(socket.id).emit('compressing', {'done': stats.size, 'id':id});
            });


        });

   });

  return io;
}
