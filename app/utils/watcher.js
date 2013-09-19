//Watch for files and than launch watcher (in real time)
//use ObjectID in urls

var _ = require('underscore')
  , chokidar = require('chokidar')
  , users = require('../models/helpers/users.js')
  , pathInfo = require('path')
  , mime = require('mime');

var addFile = require('./addFile.js').addFile;


//Cache
var NodeCache = require( "node-cache" );
var cache = new NodeCache( { stdTTL: 0, checkperiod: 0 } );


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
	
	var pathsToWatch = params.paths
		, pathsKeys = params.pathsKeys
		, uid = params.uid
		, sid = params.sid
		, lastUpdate = params.lastUpdate
		, io = params.io;
	
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

	//File is added
	watcher.on('add', function(f, stat) {
		addFile({f: f, pathsKeys : pathsKeys}, function(err) {
			if(err) console.log(err);

			users.files(uid, lastUpdate, function(datas) {

				countDatas(datas.pathes, function(count) {

					if(count !== 0) {
		                console.log('Updating client');
		                //Files sent we save the date
		                lastUpdate = Date.now();

		                io.sockets.socket(sid).emit('files', JSON.stringify(datas));
		            }
	            });

            });
		});

	}).on('unlink', function(f) {

		console.log('unlink', f);

//Ajouter fonction deleteFile !!!!!		

		var NodeCache = require( "node-cache" );
		var cache = new NodeCache( { stdTTL: 0, checkperiod: 0 } );

		var type = mime.lookup(f).split('/');

		if(type[0] == 'audio') {
			type = 'album';
		} else if(type[0] == 'video') {
			type = 'movie';
		} else
			type = 'other';

		var path = f;

		var params = {
			pathKey : new Buffer(path.replace(pathInfo.basename(path), '')).toString('hex'),
			key : new Buffer(f).toString('hex'),
			type : type
		};

		fileManager.removeFromDB.byType(params, function() {
			cache.del(params.key, function(err, count) {
				if(err) console.log(err);
				fs.unlink(path, function() {
					io.sockets.socket(sid).emit('remove', key);
				});
			});
		});

		// var file = {
  //         		mime : mime.lookup(f),
  //         		path : f,
  //         	};

  //       var type = file.mime.split('/') ,//speed type from mime
		// prevDir = f.replace(path.basename(f), ''), //previous directory
  //     	prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
  //     	fileKey = new Buffer(f).toString('hex');

  //     	if(_.indexOf(pathsKeys, prevDirKey) === -1) {


  //       	//Retrieving the current watched folder
  //       	var pathKey,
  //       	 	l = prevDirKey.length; //check the prevdir length

  //       	pathsKeys.forEach(function(e, i) {
  //       		var tmp = prevDirKey.replace(e, ''); //by replacing it in the pathKey

  //       		if(l != tmp.length) //If something has been replaced, it's the one
  //       			pathKey = e;
  //       	});

  //       	if(type[0] == 'video') {
		// 		removeFromDB.movie({'key' : prevDirKey, 'pathKey' : pathKey}, function () {
		// 			cache.del(prevDirKey, function(err, count) {
		// 				if(err) console.log(err);
		// 				io.sockets.socket(sid).emit('remove', prevDirKey);
		// 			});
					
		// 		});
		// 	} else if (type[0] == 'audio') {
		// 		removeFromDB.album({'key' : prevDirKey, 'pathKey' : pathKey}, function () {
		// 			cache.del(prevDirKey, function(err, count) {
		// 				if(err) console.log(err);
		// 				io.sockets.socket(sid).emit('remove', prevDirKey);
		// 			});
					
		// 		});
		// 	} else {
		// 		removeFromDB.other({'key' : prevDirKey, 'pathKey' : pathKey}, function () {
		// 			cache.del(prevDirKey, function(err, count) {
		// 				if(err) console.log(err);
		// 				io.sockets.socket(sid).emit('remove', prevDirKey);
		// 			});
					
		// 		});
		// 	}
  //       } else {
        	
		// 	if(type[0] == 'video') {
		// 		removeFromDB.movie({'key' : fileKey, 'pathKey' : prevDirKey}, function () {
		// 			cache.del(fileKey, function(err, count) {
		// 				if(err) console.log(err);
		// 				io.sockets.socket(sid).emit('remove', fileKey);
		// 			});
		// 		});
		// 	} else if (type[0] == 'audio') {
		// 		removeFromDB.album({'key' : fileKey, 'pathKey' : prevDirKey}, function () {
		// 			cache.del(fileKey, function(err, count) {
		// 				if(err) console.log(err);
		// 				io.sockets.socket(sid).emit('remove', fileKey);
		// 			});
		// 		});
		// 	} else {
		// 		removeFromDB.other({'key' : fileKey, 'pathKey' : prevDirKey}, function () {
		// 			cache.del(fileKey, function(err, count) {
		// 				if(err) console.log(err);
		// 				io.sockets.socket(sid).emit('remove', fileKey);
		// 			});
		// 		});
		// 	}
  //       }
		
	});
	
}

exports.tmpWatcher = function(params) {
    var io = params.io, id;

	//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	var watcher = chokidar.watch(params.archive.path,
		{ 
			ignored: function(p) {
	    		return /^\./.test(path.basename(p));
	    	},
	    	persistent:false

  		}
  	);

  	watcher.on('change', function(p, stats) {
  		var id = path.basename(p).replace('.zip', '');
  		io.sockets.socket(params.sid).emit('compressing', {'done': stats.size, 'id':id});
	});

	//watcher.close();
}