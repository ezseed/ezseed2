//Watch for files and than launch watcher (in real time)
//use ObjectID in urls

var _ = require('underscore')
  , explorer = require('explorer')
  , pathInfos = require('path')
  , mime = require('mime')
  , async = require('async')
  , db = require('../core/database.js')
  , parser = require('./parser')
  , fs = require('fs');


exports.explore = function(params, cb) {
	
	var explorePath = function(pathToWatch, pathCallback) {

		//Get db files first
		var id_path = _.findWhere(params.docs, {path : pathToWatch})._id;

		db.paths.find(id_path, function(err, existing) {
			
			// require('eyes').inspect(existing);
			//compare in parser then

			//Getting each files
			explorer.getFiles(pathToWatch, function(err, filePaths) {

				if(filePaths.length) {

					//reject hidden files
					filePaths = _.reject(filePaths, function(p){ return /^\./.test(pathInfos.basename(p)); });

					var i = filePaths.length - 1, files = [i];

					//Getting types from mime (by extension)
					do {
						files[i] = {
							name : pathInfos.basename(filePaths[i]),
							path : filePaths[i],
							prevDir : pathInfos.dirname(filePaths[i]),
							prevDirRelative : pathInfos.dirname(filePaths[i]).replace(root.rootPath, ''),
							type : mime.lookup(filePaths[i]).split('/')[0],
							size : fs.statSync(filePaths[i]).size
						}
					} while(i--)

					var audios = _.where(files, {type : 'audio'})
					  , videos = _.where(files, {type: 'video'})
					  , others = _.reject(files, function(f) { return f.type == 'audio' || f.type == 'video' });

					//add each db finded files
					async.parallel({
					    albums : function(callback) {
					    	console.time('albums');
					    	parser.processAlbums({pathToWatch : pathToWatch, audios: audios, existing: existing.albums}, function(err, albums) {

					    		db.files.albums.save({albums : albums, id_path : id_path}, function(err) {
					    				console.timeEnd('albums');
										callback(err, albums);
								});

					    	});
					    },
					    movies : function(callback) {
					    	console.time('movies');
					    	parser.processMovies({pathToWatch : pathToWatch, videos: videos, existing: existing.movies}, function(err, movies) {
					    		
					    		db.files.movies.save({movies : movies, id_path : id_path}, function(err) {
					    			console.timeEnd('movies');
					    			callback(err, movies);
								});

					    	});
					    },
					    others : function(callback) {
					    	console.time('others');
					    	parser.processOthers({pathToWatch : pathToWatch, others: others, existing: existing.others}, function(err, others) {

					    		db.files.others.save({others : others, id_path : id_path}, function(err) {
					    			console.timeEnd('others');
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
				
			});
		});

	}

	async.map(params.paths, explorePath, function(err, results){

		console.log('Each paths done.');

		cb(err, results);
	});
}