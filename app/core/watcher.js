var _ = require('underscore')
  , chokidar = require('chokidar')
  , users = require('./helpers/users.js')
  , pathInfo = require('path')
  , mime = require('mime')
  , explorer = require('./explorer')
  , db = require('./database.js');

//Add caching ?

/**
* Similar to _.find but return the first index of the array matching the iterator
**/
var findIndex = function(arr, iterator) {
	var i = arr.length - 1, index = null;

	if(i >= 0){
		do {
			if(iterator(arr[i])) {
				index = i;
				break;
			}
		} while(i--)
	}

	return index;
}


var lastUpdate, removedFiles = [];

var countDatas = function(p, cb) {
	var count = 0;

	if(!_.isArray(p))
		p = [p];

	_.each(p, function(e, i) {
		count += e.albums.length + e.movies.length + e.others.length;
	});

	cb(count);
}


var updateFiles = function(params) {

    explorer.explore(params, function(err, update) {

        db.files.byUser(params.uid, lastUpdate, function(err, files) {

            countDatas(files.paths, function(count) {
            	if(count !== 0) {
	                //Broadcast only to client !
	                console.log('Watcher Updating client');

	                params.io.sockets.socket(params.sid).emit('files', JSON.stringify(_.extend({count : count}, files)));

	                users.usedSize(params, function(size) {
	                    params.io.sockets.socket(params.sid).emit('size', size);
	                    
	                    //Files sent we save the date
	                    lastUpdate = new Date();

	                    params.watcher.close();

	                });
	            }
            });
        });
    });

}

var removeFiles = function(params) {
	db.files.byUser(params.uid, 0, function(err, pathsFiles) {

		pathsFiles = pathsFiles.paths;
		
		var files = []
		  , i = pathsFiles.length - 1 //paths cursor
		  , j = removedFiles.length - 1 //removedFiles cursor
		  , dirnames = []
		  ;

		//All files from paths to array
		do {
			files.push(pathsFiles[i].movies, pathsFiles[i].albums, pathsFiles[i].others);
		} while(i--)

		files = _.flatten(files);

		//Get the dirname from each removed files
		do {
			dirnames.push(pathInfo.dirname(removedFiles[j]));
		} while(j--)

		dirnames = _.uniq(dirnames);

		var k = dirnames.length - 1;

		do {
			//Finds by prevDir
			var toRemove = _.where(files, {prevDir : dirnames[k]}), elements;

			//searches for the file path in an element
			_.each(toRemove, function(e) {

				if(e.songs !== undefined) {
					type = 'albums';
					elements = e.songs;
				} else if (e.videos !== undefined) {
					type = 'movies';
					elements = e.videos;
				} else {
					type = "others";
					elements = e.files;
				}

				//If we find it, we can remove safely from DB
				if( _.findWhere(elements, {path : removedFiles[k]}) !== undefined ) {

					db.files[type].delete(e._id, function(err) {
						params.io.sockets.socket(params.sid).emit('remove', e._id);
					});

					return false;
				}

			});

		} while(k--)

		//reset
		removedFiles = [];
	});
}

var removeWatcher, removeTimeout;

var initRemoveWatcher = function(params) {
		//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	removeWatcher = chokidar.watch(params.paths,
		{ 
			ignored: function(p) {
	    		return /^\./.test(pathInfo.basename(p));
	    	},
	    	binaryInterval: 100,
	    	persistent:true
  		}
  	);
console.log(params);
	removeWatcher.on('unlink', function(f) {

		removedFiles.push(f);

		if(removeTimeout !== undefined)
			clearTimeout(removeTimeout);

		removeTimeout = setTimeout(function() {
			console.log('removeFile');
			removeFiles(params);
		}, 1000);

		//TODO
		// users.paths(params.uid, function(err, paths) {
			// removeFile({pathsKeys : paths.pathsKeys, f:f, unlink:false}, function(err, key) {
			// 	if(err) console.log(err);
			// 	params.io.sockets.socket(params.sid).emit('remove', key);

			// 	users.usedSize(params, function(size) {

   //              	params.io.sockets.socket(params.sid).emit('size', size);

   //              });

			// });
		// });

	});
}

var addTimeout;

/*
* Watcher method
* watching with chokidar and saving the new files to DB
* @param pathsToWatch Array paths
* @param pathsKeys Array paths hex
*/
exports.watch = function(params) {

	lastUpdate = params.lastUpdate;

	//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	var watcher = chokidar.watch(params.paths,
		{ 
			ignored: function(p) {
	    		return /^\./.test(pathInfo.basename(p));
	    	},
	    	binaryInterval: 100,
	    	persistent:false,
	    	ignoreInitial:true
  		}
  	);

  	watcher.setMaxListeners(100);

	//File is added
	watcher.on('add', function(f, stat) {

		if(addTimeout !== undefined)
			clearTimeout(addTimeout);

		addTimeout = setTimeout(function() {
			console.log('updateFiles');
			updateFiles(_.extend({watcher: watcher,}, params));
		}, 1000);


	});

	if(removeWatcher === undefined)
		initRemoveWatcher(params);
	
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