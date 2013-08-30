var _ = require('underscore')
  , chokidar = require('chokidar')
  , mime = require('mime')
  , release = require('./release.js')
  , id3 = require('id3') //to move
  , fs = require('fs')
  , path = require('path');

//Requires all the modedl database
var mongoose = require('mongoose')
	, models = require('../models')
	, Pathes = mongoose.model('Pathes')
	, Movies = mongoose.model('Movies')
	, Albums = mongoose.model('Albums')
	, Others = mongoose.model('Others')
	, Users = mongoose.model('Users')
	, F = mongoose.model('File');

//Cache
var NodeCache = require( "node-cache" );
var cache = new NodeCache( { stdTTL: 0, checkperiod: 0 } );

/*
* Get an object by the string
* Example :
* var file.type = "movie";
* var x = {movie:[0,1,2,3]}
* Object.byString(x, file.type);
* Output [0,1,2,3 ]
*/
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
    s = s.replace(/^\./, ''); // strip leading dot
    var a = s.split('.');
    while (a.length) {
        var n = a.shift();
        if (n in o) {
            o = o[n];
        } else {
            return;
        }
    }
    return o;
}

//todo add cb
var addToDB = {
	movie : function(params, single, cb) {
		Movies.findById(params.key, function(err, doc) {

    		//if doc is founded
    		if(doc && !single) {
    			//simply call addtoSet, it won't be unique
    			doc.files.addToSet(params.file);
    			//save it
    			doc.save(function(err, doc) {
					return cb();	
				});
    		} else if(!doc) {

    			//see release.js
    			release.parseVideoName(params.file, function(err, movie, file) {

    				console.log(movie);

    				if(err) console.log('Release parse video err ', err);

    				var movie = new Movies(movie);
    				movie._id = params.key;

    				movie.files.push(file);
		        	
    				movie.save(function(err, obj) {
    					if(err) console.log(err);
    					//update the path
    					Pathes.findOneAndUpdate(
    						{ folderKey : params.pathKey }, 
    						{ $addToSet : {'movies': params.key }, 'dateUpdated': Date.now() },
    						function(err) { 
    							if(err) console.log(err); 

    							return cb();
    						});
    				});
	        	});
    		} else {
    			return cb();
    		}
    	});
	},
	album : function(params, single, cb) {

		Albums.findById(params.key, function(err, doc) {
			if(err) console.log(err);

			if(doc && !single) {
				var tags = id3(fs.readFileSync(params.file.path)); 
				params.file.title = tags.title;	

				doc.files.addToSet(params.file);
				doc.save(function(err, doc) {
					return cb();	
				});
				
			} else if(!doc) {				
				var tags = id3(fs.readFileSync(params.file.path));

				var title;

				if(tags.title == undefined) {
					title = params.prevDir.split("/");
					title = title[title.length - 2]; //2 cause / at the end
				} else 
					title = tags.album + ' - ' + tags.artist;

				params.file.title = tags.title;	

				var coverFile = single ? null : release.findCover(params.prevDir);

				var album = new Albums({
    				_id : params.key,
    				path : params.prevDir,
    				title : title,
    				artist : tags.artist,
    				album : tags.album,
    				year : tags.year,
    				genre : tags.genre,
    				cover : coverFile,
    				files : [
    					params.file
    				]
    			});

    			album.save(function(err, obj) {
    				Pathes.findOneAndUpdate(
    					{folderKey : params.pathKey}, 
    					{ $addToSet : {'albums': params.key }, 'dateUpdated': Date.now() }, 
    					function(err) { 
    						if(err) console.log(err); 
    						return cb();
    					}
    				);
    			});
			} else {
    			return cb();
    		}
		});

	},
	/*
	* Here we need to check in the movies and DB if the file (image, nfo)
	* is part of them or if it's really a new file
	* It's a bit odd but if it finds something, we delete it, because async is
	* throwing files to fast while the db isn't filled
	*/
	other : function(params, single, cb) {
		//Other file is alone, checking the albums/movies folders is not needed
		Others.findById(params.key, function(err,doc) {
			if(err) console.log(err);

			if(doc && single) {
				var title = params.prevDir.split("/");
				title = title[title.length - 2]; //2 cause / at the end

				doc.title = title;
				doc.files.addToSet(params.file);
				doc.save(function(err, doc) {
					return cb();	
				});
			} else if(!doc) {

				var other = new Others({
					_id : params.key,
					path : params.prevDir,
					title : params.file.name,
					files : [
						params.file
					]
				});

				other.save(function(err, obj) {
    				Pathes.findOneAndUpdate({folderKey : params.pathKey}, 
    					{ $addToSet : {'others': params.key }, 'dateUpdated': Date.now() }, 
    					function(err) { 
    						if(err) console.log(err); 
    						return cb();
    					}
    				);
				});
			} else {
    			return cb();
    		}
		});
	
	}
};


var removeFromDB = {
	movie : function(params, cb) {
		Movies.findByIdAndRemove(params.key, function(err) {
			Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
				if(err)
					console.log(err);

				doc.movies.pull(params.key);
				doc.save(function(err, doc) {
					return cb();	
				});
			});

		});
	},
	album : function(params, cb) {
		Albums.findByIdAndRemove(params.key, function(err) {
			Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
				if(err)
					console.log(err);

				doc.albums.pull(params.key);
				doc.save(function(err, doc) {
					return cb();	
				});
			});

		});
	},
	other : function(params, cb) {
		Others.findByIdAndRemove(params.key, function(err) {
			Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
				if(err)
					console.log(err);

				doc.others.pull(params.key);
				doc.save(function(err, doc) {
					return cb();	
				});
			});

		});
	}
};

var closeTimeout,
	allFiles = true;


/*
* Watcher method
* watching with chokidar and saving the new files to DB
* TODO : Remove files
* @param pathsToWatch Array paths
* @param pathsKeys Array paths hex
*/
exports.watcher = function(params) {
	
	console.log('Watcher : ', params);

	var pathsToWatch = params.paths
		, pathsKeys = params.pathsKeys
		, firstWatch = params.firstWatch
		, uid = params.uid
		, sid = params.sid
		, lastUpdate = Date.now();
    var io = require('../app.js').io;

	
	allFiles = params.allFiles == undefined ? allFiles : params.allFiles;

	//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	var watcher = chokidar.watch(pathsToWatch,
		{ 
			ignored: function(p) {
	    		return /^\./.test(path.basename(p));
	    	},
	    	persistent:false
  		}
  	);
  

  	function closeWatcher() {
  		//to do remove this crap
  		//firstwatch we close the watcher instance to prevent the Others bug see addToDB.other
  		//It will be reset by the socket anyway
  		if(firstWatch)
	  		watcher.close();
	  	else {

	  		//TODO tvseries together
	  		//sends all files once
	  		if(allFiles) {
		  		Users.findById(uid).lean(true).populate('pathes').exec(function(err, docs) {
			      Pathes.populate(docs, 
			        [
			          { path : 'pathes.movies', model: Movies},
			          { path : 'pathes.albums', model: Albums},
			          { path : 'pathes.others', model: Others}
			        ],
			        function(err, docs) {
			          console.log('Updating client');
			          //Broadcast only to client !
			          io.sockets.socket(sid).emit('files', JSON.stringify(docs));
			          //Files sent we save the date
			          lastUpdate = Date.now();
			          allFiles = false;
			        }
			      );
			    });
			}
			//then we send each added file
			else {
				Users.findById(uid).lean(true).populate('pathes').exec(function(err, docs) {
			      Pathes.populate(docs, 
			        [
			          { path: 'pathes.movies', model: Movies, match: { dateAdded: {$gt:lastUpdate} } },
			          { path: 'pathes.albums', model: Albums, match: { dateAdded: {$gt:lastUpdate} } },
			          { path: 'pathes.others', model: Others, match: { dateAdded: {$gt:lastUpdate} } }
			        ],
			        function(err, docs) {
			          console.log('Updating client');
			          //Broadcast only to client !
			          io.sockets.socket(sid).emit('files', JSON.stringify(docs));
			          //Files sent we save the date
			          lastUpdate = Date.now();
			        }
			      );
			    });
			}
	  	}
  	}

	//File is added
	watcher.on('add', function(f, stat) {
		
		console.log('Watcher adds', f);

		var prevDir = f.replace(path.basename(f), ''), //previous directory
          	prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
          	fileKey = new Buffer(f).toString('hex'); //file hex path

		cache.get( [ prevDirKey, fileKey ], function( err, value ){
			
			if( err ){
				console.log( err );
			}

			if(_.isEmpty(value)) {
				//No dir
		        if(!stat.isDirectory()) {

		        	//Sets the file infos
		          	var file = {
		          		mime : mime.lookup(f),
		          		size : stat.size,
		          		path : f,
		          		name : path.basename(f),
		          		ext : path.extname(f)
		          	};

			        var type = file.mime.split('/');//speed type from mime

			        file._id = fileKey;

			        //If it isn't the path we're watching
			        //it's a folder having content
			        if(_.indexOf(pathsKeys, prevDirKey) == -1) {

			        	//Retrieving the current watched folder
			        	var pathKey,
			        	 	l = prevDirKey.length; //check the prevdir length

			        	pathsKeys.forEach(function(e, i) {
			        		var tmp = prevDirKey.replace(e, ''); //by replacing it in the pathKey

			        		if(l != tmp.length) //If something has been replaced, it's the one
			        			pathKey = e;
			        	});


				        if(type[0] == 'video') {

							addToDB.movie({'key' : prevDirKey, 'pathKey' : pathKey, 'file': file}, false,
								function() {
									cache.set( prevDirKey, 'video', function( err, success ){
										if(err) console.log(err);
											
									  	clearTimeout(closeTimeout);
										closeTimeout = setTimeout(closeWatcher, 450);
									});
								});
				        
				        } else if (type[0] == 'audio') {
							
							addToDB.album(
								{'key' : prevDirKey, 
								'pathKey' : pathKey, 
								'prevDir' : prevDir, 
								'file' : file}, false,
								function() {
									cache.set( prevDirKey, 'audio', function( err, success ){
										if(err) console.log(err);
											
									  	clearTimeout(closeTimeout);
										closeTimeout = setTimeout(closeWatcher, 450);
									});
								});

						} else {

							var prevFiles = fs.readdirSync(prevDir);

							function isOther (files, i) {
								var i = i == undefined ? 0 : i;
								
								if( i < files.length ) {
									//no hidden files
									if(!/^\./.test(path.basename(files[i]))) {
										
										var m = mime.lookup(files[i]), t = m.split('/');

 										if( (t[0] == 'audio' || t[0]== 'video') && isOther)
										{
											return false;
										} else
											return isOther(files, i + 1);
						
									} else
										return isOther(files,i + 1);
								} else 
									return true;
							
							}

							var isOther = isOther(prevFiles);


							if (isOther) {
								addToDB.other({'key':prevDirKey,'pathKey': pathKey,'prevDir':prevDir,'file':file},false,
									function() {
										cache.set( prevDirKey, 'other', function( err, success ){
											if(err) console.log(err);
												
										  	clearTimeout(closeTimeout);
											closeTimeout = setTimeout(closeWatcher, 450);
										});
									}
								);
							}


						}
					//We founded a file in the watch dir, it seems to be alone
					} else {				
						if(type[0] == 'video') {
							
							addToDB.movie({'key' : fileKey, 'pathKey' : prevDirKey, 'file': file}, true,
								function() {
									cache.set( fileKey, 'video', function( err, success ){
										if(err) console.log(err);
											
									  	clearTimeout(closeTimeout);
										closeTimeout = setTimeout(closeWatcher, 450);
									});
								});

						} else if(type[0] == 'audio') {

							addToDB.album(
								{'key' : fileKey, 
								'pathKey' : prevDirKey, 
								'prevDir' : prevDir, 
								'file' : file}, true,
								function() {
									cache.set( fileKey, 'audio', function( err, success ){
										if(err) console.log(err);
											
									  	clearTimeout(closeTimeout);
										closeTimeout = setTimeout(closeWatcher, 450);
									});
								});

						} else {
							addToDB.other({'key':fileKey,'pathKey':prevDirKey,'prevDir':prevDir,'file':file}, true,
								function() {
									cache.set( fileKey, 'other', function( err, success ){
										if(err) console.log(err);
											
									  	clearTimeout(closeTimeout);
										closeTimeout = setTimeout(closeWatcher, 450);
									});
								});
						}
					}
				
				} //end if dir
			} else {
				clearTimeout(closeTimeout);
				closeTimeout = setTimeout(closeWatcher, 450);
			}
		});

    	

	}).on('unlink', function(f) {
		var file = {
          		mime : mime.lookup(f),
          		path : f,
          	};

        var type = file.mime.split('/') ,//speed type from mime
		prevDir = f.replace(path.basename(f), ''), //previous directory
      	prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
      	fileKey = new Buffer(f).toString('hex');

      	if(_.indexOf(pathsKeys, prevDirKey) == -1) {


        	//Retrieving the current watched folder
        	var pathKey,
        	 	l = prevDirKey.length; //check the prevdir length

        	pathsKeys.forEach(function(e, i) {
        		var tmp = prevDirKey.replace(e, ''); //by replacing it in the pathKey

        		if(l != tmp.length) //If something has been replaced, it's the one
        			pathKey = e;
        	});

        	if(type[0] == 'video') {
				removeFromDB.movie({'key' : prevDirKey, 'pathKey' : pathKey}, function () {
					cache.del(prevDirKey, function(err, count) {
						if(err) console.log(err);
						io.sockets.socket(sid).emit('remove', prevDirKey);
					});
					
				});
			} else if (type[0] == 'audio') {
				removeFromDB.album({'key' : prevDirKey, 'pathKey' : pathKey}, function () {
					cache.del(prevDirKey, function(err, count) {
						if(err) console.log(err);
						io.sockets.socket(sid).emit('remove', prevDirKey);
					});
					
				});
			} else {
				removeFromDB.other({'key' : prevDirKey, 'pathKey' : pathKey}, function () {
					cache.del(prevDirKey, function(err, count) {
						if(err) console.log(err);
						io.sockets.socket(sid).emit('remove', prevDirKey);
					});
					
				});
			}
        } else {
        	
			if(type[0] == 'video') {
				removeFromDB.movie({'key' : fileKey, 'pathKey' : prevDirKey}, function () {
					cache.del(fileKey, function(err, count) {
						if(err) console.log(err);
						io.sockets.socket(sid).emit('remove', fileKey);
					});
				});
			} else if (type[0] == 'audio') {
				removeFromDB.album({'key' : fileKey, 'pathKey' : prevDirKey}, function () {
					cache.del(fileKey, function(err, count) {
						if(err) console.log(err);
						io.sockets.socket(sid).emit('remove', fileKey);
					});
				});
			} else {
				removeFromDB.other({'key' : fileKey, 'pathKey' : prevDirKey}, function () {
					cache.del(fileKey, function(err, count) {
						if(err) console.log(err);
						io.sockets.socket(sid).emit('remove', fileKey);
					});
				});
			}
        }
		
	});

	//watcher.close();
}

exports.tmpWatcher = function(params) {
    var io = require('../app.js').io, id;

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