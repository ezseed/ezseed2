var socketio = require('socket.io'),
    explorer = require('./explorer'),
    users = require('../models/helpers/users.js'),
    watcher = require('./watcher'),
    _ = require('underscore');


module.exports.listen = function(app) {

    var lastUpdate = Date.now();

    io = socketio.listen(app);
    io.set('log level', 1);

    io.sockets.on('connection', function (socket) {
        
        socket.on('update', function(uid) {
            console.log('Socket is ready : ' + socket.id);

            users.paths(uid, function(err, paths) {

                explorer.explore(paths, function(err, update) {

                    update = update === false ? 0 : lastUpdate;

                    users.files(uid, update, function(datas) {
                        console.log('Updating client');

                        //Broadcast only to client !
                        io.sockets.socket(socket.id).emit('files', JSON.stringify(datas));

                        users.usedSize(paths, function(size) {

                            io.sockets.socket(socket.id).emit('size', size);
                            
                            //Files sent we save the date
                            lastUpdate = Date.now();

                            var watcherParams = _.extend(paths, {sid: socket.id, io: io, lastUpdate : lastUpdate});

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
