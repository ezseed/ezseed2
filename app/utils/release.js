var _ = require('underscore')
  , _s = require('underscore.string')
  , allocine = require('allocine-api')
  , fs = require('fs')
  , mime = require('mime')
  , ID3 = require('id3');

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
	if(name !== undefined)
		name = name.replace(obj.quality, '').replace(obj.subtitles, '').replace(obj.language, '');
	return name;
}

//Searches the video type
//Algorithm from : https://github.com/muttsnutts/mp4autotag/issues/2
function whatVideo(file, callback) {
	var err = null;
	
	object = {};
	var name = file.name;
	
	var r = new RegExp(/E[0-9]{1,2}|[0-9]{1,2}x[0-9]{1,2}/i); //searches for the tv show
	var y = new RegExp(/([0-9]{4})/); //Year regex

	//Found a tv show
	if(r.test(name)) {

		object.type = 'tvseries';

		//Searches for the Season number + Episode number
		r = new RegExp(/(.+)S([0-9]+)E([0-9]+)/i);
		var r2 = new RegExp(/(.+)([0-9]+)x([0-9])+/i);

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

          		if(infos !== undefined) {
	          		movie.code = infos[0].code;

	          		//Searching for a specific code
	          		allocine.api(movie.type, {code: movie.code}, function(err, result) { 
	          			infos = Object.byString(result, movie.type);

	          			movie.title = infos.title;
	          			movie.synopsis = infos.synopsis.replace(/<\/?p>/ig, '');
	          			movie.poster = infos.poster.href;
	          			movie.trailer = _.isEmpty(infos.trailer) ? null : infos.trailer.href;

	          			return cb(err, movie, file);

	          		});
	          	} else {
	          		movie.title = dummyName(file.name, movie);
	          		return cb(err, movie, file);
	          	}
          	} else {
          		movie.title = file.name;
          		return cb(err, movie, file);
          	}
      	});

	});

}

//Crap function but extends doesn't work ?
var addEpisodeToFile = function(file, episode, id) {
  var file2 = {};

  file2.mime = file.mime;
  file2.size = file.size;
  file2.path = file.path;
  file2.name = file.name;
  file2.ext = file.ext;
  file2._id = id;
  file2.episode = episode;

  return file2;
}

exports.seriesTogether = function(movies) {
	var series = _.where(movies, {type: "tvseries"}), tvshows = [];

	for (var i = 0; i < series.length; i++)
		if(tvshows.indexOf(series[i].title) === -1)
    		tvshows.push(series[i].title);

    var seriesOrdered = [], seriesByTVShow, serieByTVShow;
	
	for (var j = 0; j < tvshows.length; j++) {
    
		seriesByTVShow = _.where(series, {title: tvshows[j]});
		serieByTVShow = _.findWhere(series, {title: tvshows[j]});
    
    	var files = [];

		for (var k = 0; k < seriesByTVShow.length; k++) {
      
			if(seriesByTVShow[k].files.length === 1) 
				seriesByTVShow[k].files[0] = addEpisodeToFile(seriesByTVShow[k].files[0] ,seriesByTVShow[k].episode, seriesByTVShow[k]._id);

			for(var l = 0; l < seriesByTVShow[k].files.length; l++)
	        	files.push(seriesByTVShow[k].files[l]);

	    }

    	serieByTVShow.files = _.extend( serieByTVShow.files, files);

		seriesOrdered.push(serieByTVShow);
		
	}

	return _.extend( 
		_.reject(movies, function(movie){ return movie.type == 'tvseries'; })
		, seriesOrdered
	); 
}

exports.getTags = function(file, picture) {
	var id3 = new ID3(file);
	id3.parse();

	var tags = {
			"title" : id3.get("title"),
			"artist" :id3.get("artist"),
			"album"  :id3.get("album"),
			"year"   :id3.get("year"),
			"genre"  :id3.get("genre")
		};

	if(picture) {
		var datas = id3.get('picture');
		if(datas !== null) {
			if(datas.data !== undefined && datas.format !== undefined) {

				var coverName = tags.artist + tags.album; 
					coverName = coverName.replace(/[^a-zA-Z0-9]+/ig,'');

				var file = process.cwd() + '/public/tmp/' + _.uniqueId('cover' + coverName);

				var type = datas.format.split('/');

				if(type[0] == 'image') {
					file = file + '.' + type[1];

					fs.writeFileSync(file, datas.data);
					
					tags = _.extend(tags, {'picture': file.replace(process.cwd() + '/public', '')});
				}
			}
		}
	}

	return tags;
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