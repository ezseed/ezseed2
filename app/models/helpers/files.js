//Requires all the modedl database
var mongoose = require('mongoose')
	, models = require('../')
	, Pathes = mongoose.model('Pathes')
	, Movies = mongoose.model('Movies')
	, Albums = mongoose.model('Albums')
	, Others = mongoose.model('Others')
	, Users = mongoose.model('Users')
	, F = mongoose.model('File')
    , release = require('../../utils/release.js')
	, fs = require('fs')
	, cache = require('memory-cache');

	//todo add cb
module.exports.addToDB = {
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
				var tags = release.getTags(fs.readFileSync(params.file.path)); 

				if(doc.cover === undefined && tags.picture !== undefined)
					doc.cover = tags.picture;

				params.file.title = tags.title;	

				doc.files.addToSet(params.file);
				doc.save(function(err, doc) {
					return cb();	
				});
				
			} else if(!doc) {				
				var tags = release.getTags(fs.readFileSync(params.file.path), true);

				var title;

				if(tags.album === undefined && tags.artist === undefined) {
					title = params.prevDir.split("/");
					title = title[title.length - 2]; //2 cause / at the end
				} else 
					title = tags.album + ' - ' + tags.artist;

				params.file.title = tags.title;	

				var coverFile = null; 

				if(tags.picture !== undefined)
					coverFile = tags.picture;
				else if(!single) {
					coverFile = release.findCover(params.prevDir);
					if(coverFile !== undefined)
						coverFile = params.prevDir.replace(process.cwd().replace('/app', ''), '') + coverFile;
				}


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
			
			if(doc && !single) {
				var title = params.prevDir.split("/");
				title = title[title.length - 2]; //2 cause / at the end
				
				
				doc.title = title;
				doc.files.addToSet(params.file);
				doc.save(function(err, doc) {
					if(err) console.log(err);
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
	
}



var removeFromDB = {
	byType: function(params, cb) {

		switch(params.type) {
			case 'video':
				return removeFromDB.movie(params, cb);
				break;
			case 'audio':
				return removeFromDB.album(params, cb);
				break;
			default:
				return removeFromDB.other(params, cb);
				break;
		}
	},
	movie : function(params, cb) {
		Movies.findByIdAndRemove(params.key, function(err) {
			if(err) console.log(err);
			Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
				if(err)
					console.log(err);

				doc.movies.pull(params.key);
				doc.save(function(err, doc) {
					return cb(err);	
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
					return cb(err);	
				});
			});

		});
	},
	other : function(params, cb) {
		Others.findByIdAndRemove(params.key, function(err) {
			if(err) console.log(err);

			Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
				if(err) console.log(err);

				doc.others.pull(params.key);
				doc.save(function(err, doc) {
					return cb(err);	
				});
			});

		});
	}
}

module.exports.removeFromDB = removeFromDB;
