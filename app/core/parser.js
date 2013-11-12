var pathInfos = require('path')
  , mime = require('mime')
  , explorer = require('explorer')
  , async = require('async')
  , _ = require('underscore')
  , _s = require('underscore.string')
  , release = require('./release.js')
  , fs = require('fs')
  ;

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

/**
* Main function to process the albums
* @param audios : list of audio files
* @param callback : the parallel callback (see async.parallel) 
* @return callback
**/
module.exports.processAlbums = function(params, callback) {
	var albums = [], indexMatch = null, infos
	  , audios = params.audios, pathToWatch = params.pathToWatch;

	_.each(audios, function(e, i) {

		var existingFile = _.where(params.existing, {prevDir : e.prevDir}), exists = false;

		if(existingFile.length) {
			for(var k in existingFile) {
				if(_.findWhere(existingFile[k].songs, {path : e.path})) {
					exists = true;
					break;
				}
			}
		}

		if(!exists) {

			if(e.prevDir != pathToWatch)
				indexMatch = findIndex(albums, function(album) { return e.prevDir == album.prevDir; });
			
			if(indexMatch !== null) {
				infos = release.getTags.audio(e.path);

				if(infos.artist !== null && albums[indexMatch].album !== null && albums[indexMatch].artist !== 'VA') { 
					var a = _s.slugify(_s.trim(albums[indexMatch].artist).toLowerCase());
					var b = _s.slugify(_s.trim(infos.artist).toLowerCase());
					
					if(a.indexOf(b) === -1)
						albums[indexMatch].artist = 'VA';
				}

				albums[indexMatch].songs.push(e);
			} else {

				infos = release.getTags.audio(e.path, true);

				//Index match artist + album or only album
				indexMatch = findIndex(albums, function(album) { 
					if(infos.artist === null && infos.album === null)
						return false;
					else if(album.artist !== null && album.artist.toLowerCase() == infos.artist.toLowerCase() && album.album.toLowerCase() == infos.album.toLowerCase())
						return true;
					else if(album.album !== null && album.album.toLowerCase() == infos.album.toLowerCase())
						return true;
					else
						return false;
				});
				
				if(indexMatch !== null) {
					albums[indexMatch].songs.push(e);
				} else {
					albums.push({
						artist : infos.artist,
						album : infos.album,
						year : infos.year,
						genre : infos.genre,
						songs : [e],
						picture : infos.picture,
						prevDir : e.prevDir,
						prevDirRelative : e.prevDir.replace(global.rootPath, '')
					});
				}

			}
		}
	});

	callback(null, albums);
}

/**
* Main function to process the movies
* @param videos : list of video files
* @param callback : the parallel callback (see async.parallel) 
* @return callback
* @call : see "parseVideo" below
**/
module.exports.processMovies = function(params, callback) {
	var videos = params.videos, pathToWatch = params.pathToWatch;

	/**
	* Declaration within the module because of "pathToWatch"
	* Process the array of movies asynchronously
	* Must be async because we might call allocine to gather some infos
	* + in serie, wait until previous has finish
	* @param arr : list of videos files
	* @param cb : callback when everything is done
	* @param i : cursor
	* @param movies : movies array spawned on the fly
	* @return callback
	**/
	var parseMovies = function(arr, cb, i, movies) {

		i = i === undefined ? 0 : i;
		movies = movies === undefined ? [] : movies;

		if(i == arr.length)
			return cb(movies);

		var indexMatch = null, e = arr[i];

		//ICI séries 
		var existingFile = _.where(params.existing, {prevDir : e.prevDir}), exists = false;

		if(existingFile.length) {
			for(var k in existingFile) {
				if(_.findWhere(existingFile[k].videos, {path : e.path})) {
					exists = true;
					break;
				}
			}
		}

		//Do the test again with video name
		var m = release.getTags.video(pathInfos.basename(e.path));
		if(m.movieType == 'tvseries') {
			existingFile = _.filter(params.existing, function(ex){ return ex.name.toLowerCase() == m.name.toLowerCase() && ex.season == m.season; });
			for(var k in existingFile) {
				if(_.findWhere(existingFile[k].videos, {path : e.path})) {
					exists = true;
					break;
				}
			}
		}

		if(!exists) {

			if(pathToWatch != e.prevDir)
				indexMatch = findIndex(movies, function(movie) {
					return movie.prevDir == e.prevDir;
				});

			if(indexMatch !== null) {
				movies[indexMatch].videos.push(e);
				i++;
				return parseMovies(arr, cb, i, movies);
			} else {
				e = _.extend(e, release.getTags.video(e.name));

				//Movies types are the same, we look after the same name | same season
				indexMatch = findIndex(movies, function(movie) { 
					if(movie.movieType == e.movieType) {
						if(movie.name.toLowerCase() == e.name.toLowerCase()) {
							if(movie.movieType == 'tvseries') {
								if(movie.season == e.season)
									return true;
							} else {
								return true;
							}
						}
					}
					return false;
				});
				
				if(indexMatch !== null) {
					movies[indexMatch].videos.push(e);
					i++;
					return parseMovies(arr, cb, i, movies);
				} else {
					//Call to allocine-api to gather infos
					release.getMovieInformations(e, function(err, infos) {
						movies.push({
							movieType : e.movieType,
							name : e.name,
							season : e.season,
							title : infos.title,
							synopsis : infos.synopsis,
							trailer : infos.trailer,
							picture : infos.picture,
							videos : [e],
							prevDir : e.prevDir,
							prevDirRelative : e.prevDir.replace(global.rootPath, '')
						});

						i++;
						return parseMovies(arr, cb, i, movies);
					});
				}

			}
		} else {
			i++;
			return parseMovies(arr,cb, i, movies);
		}

	}


	parseMovies(videos, function(movies) {
		callback(null, movies);
	});
}

/**
* Parses files, search if there is a movie / an audio file
* Another solution would be to check in the movies/albums if prevDir = prevDir,
* but after some tests it's faster to do this one
* @param files : fs.readDirSync(prevDir) - see processOthers
**/
var checkIsOther = function (files, i) {
	var i = i == undefined ? 0 : i;
		
	if( i < files.length ) {
		//no hidden files
		if(!/^\./.test(pathInfos.basename(files[i]))) {

			if(fs.existsSync(files[i])) {
				var stats = fs.statSync(files[i]);
				
				if(stats.isDirectory()) {
					var arr = _.map(fs.readdirSync(files[i]), function(p){ return pathInfos.join(files[i], p); });
					if(!checkIsOther(arr))
						return false;
					else
						return checkIsOther(files, i + 1);
				} else {
					var t = mime.lookup(files[i]).split('/')[0];

					if( (t == 'audio' || t == 'video'))
					{
						return false;
					} else
						return checkIsOther(files, i + 1);
				}
			} else {
				return checkIsOther(files, i + 1);
			}
		} else
			return checkIsOther(files, i + 1);
	} else 
		return true;
}

/**
* Main function to process files
* @param othersFiles : list of others files
* @param callback : the parallel callback (see async.parallel) 
* @return callback
**/
module.exports.processOthers = function(params, callback) {
	
	var others = [], indexMatch = null, name, othersFiles = params.others, pathToWatch = params.pathToWatch, single = false;

	_.each(othersFiles, function(e, i) {

		if(e.prevDir != pathToWatch) {
			e.prevDir = pathInfos.join(
				pathToWatch, 
				e.prevDir.replace(pathToWatch, '').split('/')[1]);
			
			indexMatch = findIndex(others, function(other) { return e.prevDir == other.prevDir; });
			name = pathInfos.basename(e.prevDir);
		} else {
			single = true;
			name = e.name;
		}

		var existingFile = _.where(params.existing, {prevDir : e.prevDir}), exists = false;

		if(existingFile.length) {
			for(var k in existingFile) {
				if(_.findWhere(existingFile[k].files, {path : e.path})) {
					exists = true;
					break;
				}
			}
		}

		if(!exists) {
			if(indexMatch !== null)
				others[indexMatch].files.push(e);
			else {
				if(!single) {
					var arr = _.map(fs.readdirSync(e.prevDir), function(p){ return pathInfos.join(e.prevDir, p); });
					if(checkIsOther(arr)) {
						others.push({
							name : name,
							files : [e],
							prevDir : e.prevDir,
							prevDirRelative : e.prevDir.replace(global.rootPath, '')
						});
					}
				} else {
					var t = mime.lookup(e.path).split('/')[0];

					if(e.prevDir == pathToWatch && t != 'audio' && t != 'video')
					{
						others.push({
							name : name,
							files : [e],
							prevDir : e.prevDir,
							prevDirRelative : e.prevDir.replace(global.rootPath, '')
						});
					}
				}
			}
		}
		
	});

	callback(null, others);
}