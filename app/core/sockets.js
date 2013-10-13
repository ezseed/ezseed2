var socketio = require('socket.io'),
    explorer = require('./explorer'),
    users = require('../models/helpers/users.js'),
    watcher = require('./watcher'),
    db = require('../core/database.js'),
    _ = require('underscore');


module.exports.listen = function(app) {

    io = socketio.listen(app);
    io.set('log level', 1);

    io.sockets.on('connection', function (socket) {
        
        socket.on('update', function(uid) {
            console.log('Socket is ready : ' + socket.id);

            db.paths.byUser(uid, function(err, paths) {

                explorer.explore(paths, function(err, update) {

                    db.files.byUser(uid, 0, function(err, files) {
                        console.log('Sockets Updating client');

                        io.sockets.socket(socket.id).emit('files', JSON.stringify(files));

                        users.usedSize(paths, function(size) {

                            io.sockets.socket(socket.id).emit('size', size);
                            
                            var watcherParams = _.extend(paths, {sid: socket.id, uid: uid, io: io, lastUpdate : new Date});

                            //Now we might watch !
                            watcher.watch(watcherParams);

                        });
                    });
                });
            });
        });

        //Adds a tmp watcher + socket id, watch change of specific archive
        socket.on('archive', function(id) {
            watcher.tmpWatcher({
                'archive' : { 'path' : process.cwd() + '/public/tmp/'},
                'sid' : socket.id,
                io : io
            });
        });

   });

  return io;
}
