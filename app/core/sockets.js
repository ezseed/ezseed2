var socketio = require('socket.io')
  , fs = require('fs')
  , spawn = require('spawn-command')
  , path = require('path')
  , db = require('./database')
  , _ = require('underscore');


module.exports.listen = function(server) {

    io = socketio.listen(server, {secure: true});
    io.set('log level', 1); //less log

    io.sockets.on('connection', function (socket) {

        //To be improved (go through plugins)
        require('../plugins').sockets(socket, io.sockets);

        socket.on('archive', function(id) {
            
            var tmpFolder = path.join(global.config.path, '.tmp');

            if(!fs.existsSync(tmpFolder))
                fs.mkdirSync(tmpFolder);

            db.files.byId(id, function(err, doc) {

                if(!doc || err) {
                    if(err)
                        global.log('error', err);

                    socket.emit('archive:error', 'Aucun fichier trouvé');
                } else {
                    
                    var dest = path.join(tmpFolder, id +'.zip');

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

                            var total = 0, i = 0
                              , cmd = 'zip -jr "'+dest+'"';

                            for(i in sizes)
                                total += sizes[i];
                            
                            i=0;

                            for(i in filePaths)
                                cmd += ' "'+filePaths[i]+'"';

                            var child = spawn(cmd);

                            child.stdout.on('data', function (data) {
                                var d = new Buffer(data).toString();
                                d = d.replace('/\s?\(deflated [0-9]+%\)/ig', '').replace('/\s?adding:\s?/ig');

                                if(d.length) {
                                    d = path.basename('/'+ d);
                                    global.log(d);

                                    socket.emit('archive:progress', {el: d, size: sizes.shift(), total: total});
                                }
                                
                            });

                            child.on('exit', function (exitCode) {
                                socket.emit('archive:complete', '/download/archive/'+id);
                            });
                        }
                        
                    });
                }
            });
        });

   });

  return io;
}
