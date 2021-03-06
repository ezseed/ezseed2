var console = require('./logger');
var socketio = require('socket.io')
  , fs = require('fs')
  , spawn = require('spawn-command')
  , path = require('path')
  , db = require('./database')
  , _ = require('underscore')
  , _s = require('underscore.string');


module.exports.listen = function(server) {

    io = socketio.listen(server, {secure: true});
    io.set('log level', 1); //less log

    io.sockets.on('connection', function (socket) {

        //To be improved (go through plugins)
        require('../plugins').sockets(socket, io.sockets);

        socket.on('archive', function(id) {
            
            var tmpFolder = path.join(global.conf.path, '.tmp');

            if(!fs.existsSync(tmpFolder))
                fs.mkdirSync(tmpFolder);

            db.files.byId(id, function(err, doc) {

                if(!doc || err) {
                    if(err)
                        console.log('error', err);

                    if(!doc)
                        console.log('error', doc);

                    socket.emit('archive:error', 'Aucun fichier trouvé');
                } else {
                    
                    var dest = path.join(tmpFolder, id +'.zip');

                    fs.exists(dest, function (exists) {
                        if(exists) {
                            console.log('debug', 'Archive exists');
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
                                total += parseInt(sizes[i]);
                            
                            i=0;

                            for(i in filePaths)
                                cmd += ' "'+filePaths[i]+'"';

                            var child = spawn(cmd);

                            child.stdout.on('data', function (data) {
                                var d = new Buffer(data).toString();
                                d = d.replace(/\s?\(deflated [0-9]+%\)/ig, '').replace(/\s?adding:\s?/ig, '');

                                if(_s.trim(d).length) {
                                    d = path.basename('/'+ d);

                                    socket.emit('archive:progress', {el: d, size: sizes.shift(), total: total});
                                }
                                
                            });

                            child.stderr.on('data', function(data) {
                                var d = new Buffer(data).toString();

                                console.log('error', d);
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
