var console = require(global.config.root + '/core/logger');
var _ = require('underscore')
  , _s = require('underscore.string')
  , dummyName = require(global.config.root + '/watcher/release.js').dummyName;

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

var tmdb = require('tmdb-3')("7c5105894b0446bb59b01a30cf235f3b");

var search = function(movie, cb) {

	movie.search = movie.search !== undefined ? movie.search : dummyName(movie.name, movie);
	movie.title = movie.title == undefined ? _s.titleize(movie.name) : movie.title;

	console.log('info','Gathering infos on', movie.search);

	// console.time('infos');

  //searching in the allocine API (could be others)
  	tmdb.search(movie.movieType == 'tvseries' ? 'tv' : 'movie', {query: movie.search, language: 'fr'}, function(err, res) {

        // console.timeEnd('infos');

        if(err) console.log('error', 'Error TMDB call', err);

  		if(err) return cb(null, movie);

  		if(res.total_results > 0) {
      		var infos = res.results;

      		if(infos !== undefined) {

      			//Index allocine info
      			var index = false;

      			var m_name = _s.slugify(movie.search);

      			//Parse each infos founded, if title matchs, break
      			var nb_resultats = infos.length, i = 0;

      			//loop beginning with best match !
      			while(i < nb_resultats - 1 && index === false) {
      				
      				var e = infos[i],
      					//slugifying names - matches are better
      					e_title = _s.slugify(e.title), 
      					e_original = _s.slugify(e.originalTitle);

      				if(

      					( e.title !== undefined && e_title.indexOf(m_name) !== -1 ) 
      					||
      					( e.originalTitle !== undefined && e_original.indexOf(m_name) !== -1 )

      				)	{
      						index = i;
      					}

      				i++;
      			}

  				if(index === false)
  					index = 0;

          		movie.code = infos[index].id;

          		//Searching for a specific code
          		tmdb.infos(movie.movieType == 'tvseries' ? 'tv' : 'movie', movie.code, function(err, specific_infos) { 

          			if(specific_infos) {
                  if(movie.movieType == 'tvseries')
                    movie.title = specific_infos.name ? specific_infos.name : specific_infos.original_name;
                  else
            			 movie.title = specific_infos.title !== undefined ? specific_infos.title : specific_infos.original_title;

            			movie.synopsis = specific_infos.overview ? _s.trim(specific_infos.overview.replace(/(<([^>]+)>)/ig, '')) : '';
            			movie.picture = specific_infos.poster_path;

            		} else {
            			infos = infos[index];

            			movie.title = infos.title !== undefined ? infos.title : infos.original_title;
            			movie.picture = infos.poster_path !== undefined ? infos.poster_path : null;
            		}

          			return cb(err, movie);

          		});
          	} else {
          		//Too long
          	//	var words = _s.words(movie.search), num_words = words.length;

          		// if(num_words >= 3 && words[num_words - 1].length > 3) {
          			 
            //     words.pop();

          		// 	movie.search = words.join(' ');

          		//  	search(movie, cb);
          		// } else {
        			 //No movie founded
            		return cb(err, movie);  			
          		//}

          	}
      	} else {
      		return cb(err, movie);
      	}
  	});
};

module.exports.search = search;
