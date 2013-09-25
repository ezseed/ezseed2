var _ = require('underscore')
  , chokidar = require('chokidar')
  , users = require('../models/helpers/users.js')
  , pathInfo = require('path')
  , mime = require('mime')
  , explorer = require('./explorer');

// var addFile = require('./addFile.js').addFile, 
var removeFile = require('./removeFile.js').removeFile;

var closeTimeout,
	allFiles = true;

/*
* Watcher method
* watching with chokidar and saving the new files to DB
* @param pathsToWatch Array paths
* @param pathsKeys Array paths hex
*/
exports.watch = function(params) {

	var countDatas = function(p, cb) {
		var count = 0;

		if(!_.isArray(p))
			p = [p];

		_.each(p, function(e, i) {
			count += e.albums.length + e.movies.length + e.others.length;
		});

		cb(count);
	}

	
	var pathsToWatch = params.paths, timeout, lastUpdate = params.lastUpdate;
		// , pathsKeys = params.pathsKeys
		// , uid = params.uid
		// , sid = params.sid
		// , lastUpdate = params.lastUpdate
		// , io = params.io;



	var updateFiles = function(params) {


		explorer.explore(params, function(err, update) {

            users.files(params.uid, lastUpdate, function(datas) {
                console.log('Updating client');

                countDatas(datas.pathes, function(count) {
                	if(count !== 0) {
		                //Broadcast only to client !
		                params.io.sockets.socket(params.sid).emit('files', JSON.stringify(datas));

		                users.usedSize(params, function(size) {
		                    io.sockets.socket(params.sid).emit('size', size);
		                    
		                    //Files sent we save the date
		                    lastUpdate = Date.now();

		                });
		            }
	            });
            });
        });

	}
	
	//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	var watcher = chokidar.watch(pathsToWatch,
		{ 
			ignored: function(p) {
	    		return /^\./.test(pathInfo.basename(p));
	    	},
	    	persistent:false
  		}
  	);

  	watcher.setMaxListeners(100);

	//File is added
	watcher.on('add', function(f, stat) {
		
		if(timeout !== undefined)
			clearTimeout(timeout);

		timeout = setTimeout(function() {
			console.log('updateFiles');
			updateFiles(params);
		}, 1000);

		// addFile({f: f, pathsKeys : pathsKeys}, function(err) {
		// 	if(err) console.log(err);

		// 	users.files(uid, lastUpdate, function(datas) {

		// 		countDatas(datas.pathes, function(count) {

		// 			if(count !== 0) {
		//                 console.log('Updating client');
		//                 //Files sent we save the date
		//                 lastUpdate = Date.now();

		//                 io.sockets.socket(sid).emit('files', JSON.stringify(datas));

		//                 users.usedSize(params, function(size) {

	 //                    	io.sockets.socket(sid).emit('size', size);

	 //                    });

		//             }
	 //            });

  //           });
		// });

	}).on('unlink', function(f) {

		users.paths(params.uid, function(err, paths) {
			removeFile({pathsKeys : paths.pathsKeys, f:f, unlink:false}, function(err, key) {
				if(err) console.log(err);
				params.io.sockets.socket(params.sid).emit('remove', key);

				users.usedSize(params, function(size) {

                	params.io.sockets.socket(params.sid).emit('size', size);

                });

			});
		});

	});
	
}

exports.tmpWatcher = function(params) {
    var io = params.io, id;

	//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	var watcher = chokidar.watch(params.archive.path,
		{ 
			ignored: function(p) {
	    		return /^\./.test(pathInfo.basename(p));
	    	},
	    	persistent:false

  		}
  	);

  	watcher.on('change', function(p, stats) {
  		var id = pathInfo.basename(p).replace('.zip', '');
  		io.sockets.socket(params.sid).emit('compressing', {'done': stats.size, 'id':id});
	});

}