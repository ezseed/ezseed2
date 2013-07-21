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

var addToDB = {
	movie : function(params, single) {		
		Movies.findById(params.key, function(err, doc) {

    		//if doc is founded
    		if(doc && !single) {
    			//simply call addtoSet, it won't be unique
    			doc.files.addToSet(params.file);
    			//save it
    			doc.save();
    		} else if(!doc) {
    			//see release.js
    			release.parseVideoName(params.file, function(err, movie, file) {

    				var movie = new Movies(movie);
    				movie._id = params.key;

    				movie.files.push(file);
		        	
    				movie.save(function(err, obj) {
    					if(err) console.log(err);
    					//update the path
    					Pathes.findOneAndUpdate(
    						{ folderKey : params.pathKey }, 
    						{ $addToSet : {'movies': params.key } },
    						function(err) { 
    							if(err) console.log(err); 


    						});
    				});
	        	});
    		}
    	});
	},
	album : function(params, single) {

	},
	other : function(params, single) {

	}
};

/*
* Watcher method
* watching with chokidar and saving the new files to DB
* TODO : Remove files
* @param pathsToWatch Array paths
* @param pathsKeys Array paths hex
*/
exports.watcher = function(pathsToWatch, pathsKeys) {
	

	//Starts watching by omitting invisible files 
	//(see https://github.com/paulmillr/chokidar/issues/47)	
	var watcher = chokidar.watch(pathsToWatch,
		{ 
			ignored: function(p) {
	    		return /^\./.test(path.basename(p));
	    	}
  		}
  	);

	//File is added
	watcher.on('add', function(f, stat) {
    	
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

          	
	        var type = file.mime.split('/') ,//speed type from mime
	            prevDir = f.replace(path.basename(f), ''), //previous directory
	          	prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
	          	fileKey = new Buffer(f).toString('hex'); //file hex path

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
		        	/*
		        	Movies.findById(prevDirKey, function(err, doc) {

		        		//if doc is founded
		        		if(doc) {
		        			//simply call addtoSet, it won't be unique
		        			doc.files.addToSet(file);
		        			//save it
		        			doc.save();
		        		} else {
		        			//see release.js
		        			release.parseVideoName(file, function(err, movie, file) {

		        				var movie = new Movies(movie);
		        				movie._id = prevDirKey;

		        				movie.files.push(file);
					        	
		        				movie.save(function(err, obj) {
		        					if(err) console.log(err);
		        					//update the path
		        					Pathes.findOneAndUpdate({folderKey : pathKey}, { $addToSet : {'movies': prevDirKey } }, function(err) { if(err) console.log(err); });
		        				});
				        	});
		        		}
		        	});
					*/

					addToDB.movie({'key' : prevDirKey, 'pathKey' : pathKey, 'file': file}, false);
		        
		        } else if (type[0] == 'audio') {
					
					var tags = id3(fs.readFileSync(f)); 
					
					file.title = tags.title;

        			Albums.findById(prevDirKey, function(err, doc) {
        				if(err) console.log(err);

        				if(doc) {
        					doc.files.addToSet(file);
        					doc.save();
        				} else {
        					var album = new Albums({
		        				_id : prevDirKey,
		        				path : prevDir,
		        				artist : tags.artist,
		        				album : tags.album,
		        				year : tags.year,
		        				genre : tags.genre,
		        				cover : release.findCover(prevDir),
		        				files : [
		        					file
		        				]
		        			});

		        			album.save(function(err, obj) {
		        				Pathes.findOneAndUpdate({folderKey : pathKey}, { $addToSet : {'albums': prevDirKey } }, function(err) { if(err) console.log(err); });
		        			});
        				}
        			});

				} else {
					//Here we need to check in the movies and DB if the file (image, nfo)
					//is part of them or if it's really a new file

					//Checks the movies
					Movies.findById(prevDirKey, function(err, doc) {
						if(err) console.log(err);

						//not founded, go on
						if(!doc) {
							//Checking the albums
							Albums.findById(prevDirKey, function(err, doc) {
								if(err) console.log(err);

								//same
								if(!doc) {
									//Check in the others, same logic as before
									Others.findById(prevDirKey, function(err, doc) {
										if(err) console.log(err);

										if(doc) {
											doc.files.addToSet(file);
					 						doc.save();
										} else {

											var other = new Others({
												_id : prevDirKey,
												path : prevDir,
												files : [
													file
												]
											});

											other.save(function(err, obj) {
						        				Pathes.findOneAndUpdate({folderKey : pathKey}, { $addToSet : {'others': prevDirKey } }, function(err) { if(err) console.log(err); });
											});
										}
									})
								}
							});
						}
					});
				}
			//We founded a file in the watch dir, it seems to be alone
			} else {				
				if(type[0] == 'video') {
					/*Movies.findById(fileKey, function(err, doc) {
						if(!doc) {
		        			release.parseVideoName(file, function(err, movie, file) {

		        				var movie = new Movies(movie);
		        				movie._id = fileKey;

		        				movie.files.push(file);
					        	
		        				movie.save(function(err, obj) {
		        					if(err) console.log(err);

		        					Pathes.findOneAndUpdate({folderKey : prevDirKey}, { $addToSet : {'movies': fileKey } }, function(err) { if(err) console.log(err); });
		        				});
				        	});
		        		}
		        	});*/
					addToDB.movie({'key' : fileKey, 'pathKey' : prevDirKey, 'file': file}, true);

				} else if(type[0] == 'audio') {

					var tags = id3(fs.readFileSync(f)); 
					
					file.title = tags.title;

        			Albums.findById(fileKey, function(err, doc) {
        				if(err) console.log(err);

        				if(!doc) {
							var album = new Albums({
								_id : fileKey,
								path : prevDir,
								artist : tags.artist,
								album : tags.album,
								year : tags.year,
								genre : tags.genre,
								cover : null,
								files : [
									file
								]
							});

							album.save(function(err, obj) {
								Pathes.findOneAndUpdate({folderKey : prevDirKey}, { $addToSet : {'albums': fileKey } }, function(err) { if(err) console.log(err); });
							});
						}
					});	
				} else {
					//Other file is alone, checking the albums/movies folders is not needed
					Others.findById(fileKey, function(err,doc) {
						if(err) console.log(err);

						if(!doc) {
							var other = new Others({
								_id : fileKey,
								path : prevDir,
								files : [
									file
								]
							});

							other.save(function(err, obj) {
		        				Pathes.findOneAndUpdate({folderKey : pathKey}, { $addToSet : {'others': fileKey } }, function(err) { if(err) console.log(err); });
							});
						}
					});
				}
			}
		
		} //end if dir

	}).on('unlink', function(f) {

	});

	//watcher.close();
}