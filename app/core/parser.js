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
	var audios = params.audios, pathToWatch = params.pathToWatch;

	// _.each(audios, function(e, i) {

	var parseAudios = function(arr, cb, i, albums) {

		i = i === undefined ? 0 : i;
		albums = albums === undefined ? [] : albums;

		if(i == arr.length) {
			delete arr;
			return cb(albums);
		}

		var e = arr[i];
		
		//Redifine prevDir
		var lastDir = e.prevDir.split('/'), dirsNb = lastDir.length - 1;
			lastDir = lastDir[dirsNb];

		var matches = /^(CD|DISC)\s?(\d+)$/ig.exec(lastDir);

		//catch CD/DISC
		if(matches) {
			e.disc = parseInt(matches[2]);
			e.prevDir = e.prevDir.split('/').splice(0, dirsNb).join('/');
		}

		var existingFile = _.where(params.existing, {prevDir : e.prevDir})
		  , nbExisting = existingFile.length
		  , exists = false, indexMatch = null;

		if(nbExisting)
			while(nbExisting-- && !exists)
				if(_.findWhere(existingFile[nbExisting].songs, {path : e.path}))
					exists = true;
		

		if(!exists) {

			if(e.prevDir != pathToWatch)
				indexMatch = findIndex(albums, function(album) { return e.prevDir == album.prevDir; });
			
			if(indexMatch !== null) {
				release.getTags.audio(e.path, false, function(err, infos) {

					if(infos.artist !== null && albums[indexMatch].album !== null && albums[indexMatch].artist !== 'VA') { 
						var a = _s.slugify(albums[indexMatch].artist);
						var b = _s.slugify(infos.artist);
						
						if(a.indexOf(b) === -1 && b.indexOf(a) === -1)
							albums[indexMatch].artist = 'VA';
					}

					albums[indexMatch].songs.push(e);
					i++;
					return parseAudios(arr, cb, i, albums);

				});
			} else {

			    release.getTags.audio(e.path, true, function(err, infos) {

			    	var e_album = _s.slugify(infos.album);

					//Index match album
					indexMatch = findIndex(albums, function(album) { 
						var a_album = _s.slugify(album.album);

						if(e_album == null && infos.artist == null)
							return false;
						else if(a_album !== null && a_album == e_album)
							return true;
						else
							return false;
					});
					
					if(indexMatch !== null) {
						albums[indexMatch].songs.push(e);
						i++;
						return parseAudios(arr, cb, i, albums);
					} else {
						//New album detected
						var a = {
								artist : infos.artist,
								album : infos.album,
								year : infos.year,
								genre : infos.genre,
								songs : [e],
								picture : infos.picture,
								prevDir : e.prevDir,
								prevDirRelative : e.prevDir.replace(global.rootPath, '')
							};

						if(a.picture === null) {
							//Call itunes
							release.getAlbumInformations(a, function(err, results) {
								if(!err)
									albums.push( _.extend(a, {picture: results.artworkUrl100.replace('100x100', '400x400')} ));
								else
									albums.push(a);

								i++;
								return parseAudios(arr, cb, i, albums);
							})
						} else {
							albums.push(a);
							i++;
							return parseAudios(arr, cb, i, albums);
						}
					}
				});
			}
		} else {
			i++;
			return parseAudios(arr, cb, i, albums);
		}
	}

	parseAudios(audios, function(albums) {
		delete audios;
		return callback(null, albums);
	});

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

		var existingFile = _.where(params.existing, {prevDir : e.prevDir}), exists = false, nbExisting = existingFile.length;

		if(nbExisting)
			while(nbExisting-- && !exists)
				if(_.findWhere(existingFile[nbExisting].videos, {path : e.path}))
					exists = true;

		//Do the test again with video name
		e = _.extend(e, release.getTags.video(e.path));

		if(e.movieType == 'tvseries') {
			existingFile = _.filter(params.existing, function(ex){ 
				var m_name = _s.slugify(e.name), m_title = _s.slugify(e.title),	ex_name = _s.slugify(ex.name);

				return (ex_name == m_name || ex == m_title) && ex.season == e.season; 
			}), nbExisting = existingFile.length;
			
			while(nbExisting-- && !exists)
				if(_.findWhere(existingFile[nbExisting].videos, {path : e.path}))
					exists = true;
				
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
				e = _.extend(e, release.getTags.video(e.path));

				//Movies types are the same, we look after the same name | same season
				indexMatch = findIndex(movies, function(movie) { 
					if(movie.movieType == e.movieType) {
						var m_name = _s.slugify(movie.name), m_title = _s.slugify(movie.title);
						var e_name = _s.slugify(e.name);

						if(e_name == m_name || e_name == m_title) {
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

							quality : infos.quality,
							subtitles : infos.subtitles,
							language : infos.language,
							audio : infos.audio,
							format : infos.format,

							allocine : infos.code,

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
		delete videos;
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
	
	var others = [], indexMatch = null, name, othersFiles = params.others, pathToWatch = params.pathToWatch, single;

	_.each(othersFiles, function(e, i) {

		if(e.prevDir != pathToWatch) {
			e.prevDir = pathInfos.join(
				pathToWatch, 
				e.prevDir.replace(pathToWatch, '').split('/')[1]);
			
			indexMatch = findIndex(others, function(other) { return e.prevDir == other.prevDir; });
			name = pathInfos.basename(e.prevDir);
			single = false;
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
			// console.log(name, 'doesn\'t exists and match', indexMatch, 'and is', single, 'single');

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