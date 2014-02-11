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


       /* socket.on('update', function(uid) {*/

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

       // });

        socket.on('archive', function(id) {
            
            var tmpFolder = pathInfo.join(global.config.path, '.tmp');

            if(!fs.existsSync(tmpFolder))
                fs.mkdirSync(tmpFolder);

            db.files.byId(id, function(err, doc) {

                if(!doc || err) {
                    if(err)
                        global.log('error', err);

                    socket.emit('archive:error', 'Aucun fichier trouvé');
                } else {
                    
                    var dest = pathInfo.join(tmpFolder, id +'.zip');

                    fs.exists(dest, function (exists) {
                        if(exists) {
                            socket.emit('archive:complete', '/download/archive/'+id);
                        } else {
                            var filePaths = []
                              , sizes = []
                              , docs = doc.videos || doc.songs || doc.files, l = docs.length;

                            while(l--) {
                                sizes.push(docs[l].size);
                                filePaths.push(docs[l].path);
                            }

                            var total = 0;

                            for(var i in sizes)
                                total += sizes[i];

                            var cmd = 'zip -jr "'+dest+'"';

                            for(var i in filePaths)
                                cmd += ' "'+filePaths[i]+'"';

                            var child = spawn(cmd);

                            child.stdout.on('data', function (data) {
                                var d = new Buffer(data).toString();
                                d = pathInfo.basename('/'+ d.replace('adding: ', '').replace(' (deflated [0-9]%)', ''));
                                global.log(d);

                                socket.emit('archive:progress', {el: d, size: sizes.shift(), total: total}):

                            });

                            child.on('exit', function (exitCode) {
                                socket.emit('archive:complete', '/download/archive/'+id);
                            });
                        }
                        
                    });
                }
            });

            /*var chokidar = require('chokidar');

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

            watcher.close();*/
        });

   });

  return io;
}
