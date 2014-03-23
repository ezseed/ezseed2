
var console = require(global.conf.root + '/core/logger');

var _ = require('underscore')
  , explorer = require('explorer')
  , pathInfos = require('path')
  , mime = require('mime')
  , async = require('async')
  , db = require('../core/database')
  , parser = require('./parser.js')
  , remove = require('./remove.js')
  , fs = require('fs');


exports.explore = function(params, cb) {

	var explorePath = function(pathToWatch, pathCallback) {
		console.log('info', 'exploring', pathToWatch);
	
		if(process.env.NODE_ENV != 'production')
			global.console.time('paths');
		
		//Get db files first
		var id_path = _.findWhere(params.docs.paths, {path : pathToWatch})._id;

		db.paths.find(id_path, function(err, existing) {
			
			//compare existing in parser after removing the files who doesn't exists			
			remove(existing, id_path, function(err, existing) {
				
				//Getting each files
				explorer.getFiles(pathToWatch, function(err, filePaths) {
					if(err) {
						console.log('error', err);
						if(err.code == 'ENOENT')
							db.paths.removeByPath(err.path, pathCallback);
					} else {

						//reject hidden files
						filePaths = _.reject(filePaths, function(p){ return /^\./.test(pathInfos.basename(p)); });

						if(filePaths.length) {

							var i = filePaths.length - 1, files = [i];

							//Getting types from mime (by extension)
							do {
								var mimetype = mime.lookup(filePaths[i]).split('/');

								files[i] = {
									name : pathInfos.basename(filePaths[i]),
									path : filePaths[i],
									prevDir : pathInfos.dirname(filePaths[i]),
									prevDirRelative : pathInfos.dirname(filePaths[i]).replace(root.rootPath, ''),
									type : mimetype[0],
									ext : mimetype[1],
									size : fs.existsSync(filePaths[i]) ? fs.statSync(filePaths[i]).size : 0
								}
							} while(i--)

							var audios = _.where(files, {type : 'audio'})
							  , videos = _.where(files, {type: 'video'})
							  , others = _.reject(files, function(f) { return f.type == 'audio' || f.type == 'video' });

							//add each db finded files
							async.parallel({
							    albums : function(callback) {
							    	// console.time('albums');
							    	parser.processAlbums({pathToWatch : pathToWatch, audios: audios, existing: existing.albums}, function(err, albums) {

							    		db.files.albums.save({albums : albums, id_path : id_path}, function(err) {
						    				// console.timeEnd('albums');
											callback(err, albums);
										});

							    	});
							    },
							    movies : function(callback) {
							    	// console.time('movies');
							    	parser.processMovies({pathToWatch : pathToWatch, videos: videos, existing: existing.movies}, function(err, movies) {
							    		
							    		db.files.movies.save({movies : movies, id_path : id_path}, function(err) {
							    			// console.timeEnd('movies');
							    			callback(err, movies);
										});

							    	});
							    },
							    others : function(callback) {
							    	// console.time('others');
							    	parser.processOthers({pathToWatch : pathToWatch, others: others, existing: existing.others}, function(err, others) {

							    		db.files.others.save({others : others, id_path : id_path}, function(err) {
							    			// console.timeEnd('others');
							    			callback(err, others);
										});
							    		
							    	})
							    }
							}, function(err, results) {
								//console.log('Parallels', results);
								pathCallback(err, results);
							});
						} else
							pathCallback(null, []);
						
					}
				});


			});

			
		});

	}
	
	async.mapSeries(params.paths, explorePath, function(err, results){


		console.log('info', 'Each paths done.' );
	
		if(process.env.NODE_ENV != 'production')
			global.console.timeEnd('paths');
	
		console.log('-------------------------------------------------'.rainbow);
		cb(err, results);
	});
}