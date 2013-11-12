var _ = require('underscore')
  , _s = require('underscore.string')
  , allocine = require('allocine-api')
  , fs = require('fs')
  , pathInfos = require('path')
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

//Tags (to be improved)
var qualities = ['720p', '1080p', 'cam', 'ts', 'dvdscr', 'r5', 'dvdrip', 'dvdr', 'tvrip', 'hdtvrip', 'hdtv']

  , subtitles = ['fastsub', 'proper', 'subforced', 'fansub']

  , languages = ['vf', 'vo', 'vostfr', 'multi', 'french']

  , audios = ['ac3', 'dts']

  , format = ['xvid', 'x264'];

//Dummy name by replacing the founded vars
var dummyName = function (name, obj) {
	if(name !== undefined)
		name = name.replace(obj.quality, '').replace(obj.subtitles, '').replace(obj.language, '').replace(obj.format, '');
	return _s.trim(name);
}


/**
* Searches for a cover in a directory
**/
var findCoverInDirectory = function(dir) {
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
	
	return cover === undefined ? null : pathInfos.join(dir, cover).replace(global.config.path, '/downloads');
}

module.exports.getTags  = {
	//Searches the video type
	//Algorithm from : https://github.com/muttsnutts/mp4autotag/issues/2
	video: function(path) {

		var basename = pathInfos.basename(path), prevDir = path.replace('/' + basename, '').split('/');

		console.log(prevDir, path);
		
		prevDir = prevDir[prevDir.length - 1];

		// if(prevDir.length > basename.length)
		// 	basename = prevDir;

		console.log(basename, prevDir);

		var err = null

		  , name = basename.replace(pathInfos.extname(basename), '').replace(/\-[\w\d]+$/i, '').replace(/\.|\-|_/g, ' ')

		  , array = _s.words(name)

		  , movie = {
				quality : _.find(array, function(v) { return _.contains(qualities, v.toLowerCase()) }),
				subtitles : _.find(array, function(v) { return _.contains(subtitles, v.toLowerCase()) }),
				language : _.find(array, function(v) { return _.contains(languages, v.toLowerCase()) }),
				audio : _.find(array, function(v) { return _.contains(audios, v.toLowerCase()) }),
				format : _.find(array, function(v) { return _.contains(format, v.toLowerCase()) }),
				movieType : 'movie',
			}
			
		  , r = new RegExp(/E[0-9]{1,2}|[0-9]{1,2}x[0-9]{1,2}/i) //searches for the tv show
		  , y = new RegExp(/([0-9]{4})/) //Year regex
		  ;

		//Found a tv show
		if(r.test(name)) {

			movie.movieType = 'tvseries';

			//Searches for the Season number + Episode number
			r = new RegExp(/(.+)S([0-9]+)E([0-9]+)/i);
			var r2 = new RegExp(/(.+)([0-9]+)x([0-9])+/i);

			var ar = name.match(r);

			//If it matches
			if(ar != null) {
				movie = _.extend(movie, {
					name : _s.trim(ar[1]),
					season : ar[2],
					episode : ar[3]
				});
			} else {
				ar = name.match(r2);
				if(ar) {
					movie = _.extend(movie, {
						name: _s.trim(ar[1]),
						season: ar[2],
						episode: ar[3]
					});
				} else {
					movie.name = dummyName(name, movie);
				}
			}
		} else if(y.test(name)) {

			movie.movieType = 'movie';

			var ar = name.match(y);

			//year > 1900
			if(ar != null && ar[0] > 1900) {
				var parts = name.split(ar[0]);
				movie : _.extend(movie, {
					name : _s.trim(parts[0]),
					year : ar[1]
				});
			} else {
				movie.name = dummyName(name, movie);
			}
		} else {
			movie.name = dummyName(name, movie);
		}

		return movie;
	}, 
	audio: function(filePath, picture) {

		picture = picture === undefined ? false : picture;

		var id3 = new ID3(fs.readFileSync(filePath));
		id3.parse();

		var tags = {
				"title" : id3.get("title"),
				"artist" :id3.get("artist"),
				"album"  :id3.get("album"),
				"year"   :id3.get("year"),
				"genre"  :id3.get("genre")
			};

		if(picture) {
			var datas = id3.get('picture'), pictureFounded = false;

			if(datas !== null && (datas.data !== undefined && datas.format !== undefined) ) {

				var coverName = new Buffer(tags.artist + tags.album).toString().replace(/[^a-zA-Z0-9]+/ig,'')

				  , file = pathInfos.join(global.config.root, '/public/tmp/') + _.uniqueId('cover' + coverName)

				  , type = datas.format.split('/');

				if(type[0] == 'image') {
					pictureFounded = true;

					file = file + '.' + type[1];

					fs.writeFileSync(file, datas.data);
					
					tags = _.extend(tags, {picture: file.replace(global.config.root + '/public', '')});
				}

			}
			
			if(!pictureFounded)
				_.extend(tags, {picture: findCoverInDirectory(pathInfos.dirname(filePath)) });
			
			
		}

		return tags;
	}
};

module.exports.getMovieInformations = function(movie, cb) {
	//searching in the allocine API (could be others)
  	allocine.api('search', { q:movie.name, filter: movie.movieType, count: '1'}, function(err, res) {
  		if(err) return cb(err, movie);

  		if(!_.isUndefined(res.feed)) {
      		var infos = Object.byString(res.feed, movie.movieType);

      		if(infos !== undefined) {
          		movie.code = infos[0].code;

          		//Searching for a specific code
          		allocine.api(movie.movieType, {code: movie.code}, function(err, result) { 
          			infos = Object.byString(result, movie.movieType);

          			movie.title = infos.title !== undefined ? infos.title : infos.originalTitle;
          			movie.synopsis = infos.synopsis.replace(/<\/?p>/ig, '');
          			movie.picture = infos.poster !== undefined ? infos.poster.href : '/images/cover/video.png';
          			movie.trailer = _.isEmpty(infos.trailer) ? null : infos.trailer.href;

          			return cb(err, movie);

          		});
          	} else {
          		return cb(err, movie);
          	}
      	} else {
      		return cb(err, movie);
      	}
  	});
}

