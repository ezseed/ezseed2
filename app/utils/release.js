var _ = require('underscore')
  , _s = require('underscore.string')
  , allocine = require('allocine-api')
  , fs = require('fs')
  , mime = require('mime');

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

var qualities = ['720p', '1080p', 'cam', 'ts', 'dvdscr', 'r5', 'dvdrip', 'dvdr', 'tvrip', 'hdtvrip', 'hdtv'];

var subtitles = ['fastsub', 'proper', 'subforced', 'fansub'];

var languages = ['vf', 'vo', 'vostfr', 'multi'];

var audios = ['ac3', 'dts'];

//Dummy name by replacing the founded vars
function dummyName(name, obj) {
	name = name.replace(obj.quality, '').replace(obj.subtitles, '').replace(obj.language, '');
	return name;
}

//Searches the video type
//Algorithm from : https://github.com/muttsnutts/mp4autotag/issues/2
function whatVideo(file, callback) {
	var err = null;
	
	object = {};
	var name = file.name;

	var r = new RegExp(/E[0-9]{1,2}|[0-9]{1,2}x[0-9]{1,2}/); //searches for the tv show
	var y = new RegExp(/([0-9]{4})/); //Year regex

	//Found a tv show
	if(r.test(name)) {

		object.type = 'tvseries';

		//Searches for the Season number + Episode number
		r = new RegExp(/(.+)S([0-9]+)E([0-9]+)/);
		var r2 = new RegExp(/(.+)([0-9]+)x([0-9])+/);

		var ar = name.match(r);
		//If it matches
		if(ar != null) {
			file.name = ar[1];
			object.season = ar[2];
			object.episode = ar[3];
		} else {
			ar = name.match(r2);
			if(ar) {
				file.name = ar[1];
				object.season = ar[2];
				object.episode = ar[3];
			} else {
				file.name = dummyName(name, object);
			}
		}
	} else if(y.test(name)) {

		object.type = 'movie';

		var ar = name.match(y);

		//year > 1900
		if(ar != null && ar[0] > 1900) {
			var parts = name.split(ar[0]);
			file.name = parts[0];
			object.year = ar[1];
		} else {
			file.name = dummyName(name, object);
		}
	} else {
		file.name = dummyName(name, object);
	}

	//Return callback
	return callback(err, object, file);
}

function parseQuality (array) {
	return _.find(array, function(v) { return _.contains(qualities, v.toLowerCase()); });
}

function parseSubtitles(array) {
	return _.find(array, function(v) { return _.contains(subtitles, v.toLowerCase()); });
}

function parseLanguages(array) {
	return _.find(array, function(v) { return _.contains(languages, v.toLowerCase()); });
}

function parseAudios(array) {
	return _.find(array, function(v) { return _.contains(audios, v.toLowerCase()); });
}

exports.parseVideoName = function(file, cb) {
	
	file.name = file.name.replace(file.ext, '').split('.').join(" ").split('_').join(" ").split('-').join(" ");

	var array = _s.words(file.name);

	var movie = {};

	movie.quality = parseQuality(array);
	movie.subtitles = parseSubtitles(array);
	movie.language = parseLanguages(array);
	movie.audio = parseAudios(array);


	whatVideo(file, function(err, obj, f) {

		//Adds the founded things to the file
		_.extend(movie, obj);
		file.name = f.name;

		//searching in the allocine API (could be others)
      	allocine.api('search', { q:file.name, filter: movie.type, count: '10'}, function(err, res) {
      		if(err) return cb(err, movie, file);

      		if(!_.isUndefined(res.feed)) {
          		var infos = Object.byString(res.feed, movie.type);

          		if(infos != undefined) {
	          		movie.code = infos[0].code;

	          		//Searching for a specific code
	          		allocine.api(movie.type, {code: movie.code}, function(err, result) { 
	          			infos = Object.byString(result, movie.type);

	          			movie.title = infos.title;
	          			movie.synopsis = infos.synopsis;
	          			movie.poster = infos.poster.href;
	          			movie.trailer = _.isEmpty(infos.trailer) ? null : infos.trailer.href;

	          			return cb(err, movie, file);

	          		});
	          	} else {
	          		movie.title = dummyName(file.name, movie);
	          		return cb(err, movie, file);
	          	}
          	}
      	});

	});

}

exports.findCover = function(dir) {
	var files = fs.readdirSync(dir);
	
	var m, type, cover;

	for(var i in files) {
		m = mime.lookup(files[i]);
		type = m.split('/');
		if(type[0] == 'image') {
			cover = files[i];
			break;
		}
	}

	return cover;
}