var request = require('request');


// http://www.apple.com/itunes/affiliates/resources/documentation/itunes-store-web-service-search-api.html#searching
// options example:
// options = {
//    media: "movie" // options are: podcast, music, musicVideo, audiobook, shortFilm, tvShow, software, ebook, all
//  , entity: "movie"
//  , attribute: "movie"
//  , limit: 50
//  , explicit: "No" // explicit material
// }


//Method : search | lookup
var itunes = {
   search : function(method, options, callback) {

      var optionsString = "";

      for (item in options)
         optionsString += "&" + item + "=" + encodeURIComponent(options[item]);


      var url = method == 'search' ? "http://itunes.apple.com/search?country=fr" + optionsString : "http://itunes.apple.com/lookup?country=fr" + optionsString;

      request( url, function(err, response, body) {

         callback( JSON.parse(body) );

      });

   },

   lucky : function(search, callback) {

      var options = {
          media: "music"
        , limit: 1
        , entity: "album"
        , term: search
      };

      itunes.search('search', options, function(response) {
         if(response.resultCount) {
            callback(null, response.results[0]);
         } else {
            callback("Aucun résultat", {});
         }
      });

   }
}

module.exports = itunes;


/*
  
      _.extend(options, {
        num : response.resultCount, 
        results : response.results
      });
      
        var results = cache.get(id_cache);

        if(results === null) {

          itunes.search('search', options, function(response) {
          
            _.extend(renderOptions, {
              num : response.resultCount, 
              results : response.results
            });
            
            cache.put(id_cache, renderOptions, global.timeCache); 

            res.render('results', renderOptions);

          });
        } else
          res.render('results', results);



if(cachedResults.results[index].songs === undefined) {
            //Searches for the song list
            itunes.search( 'lookup', {'id' : cachedResults.results[index].collectionId, entity: "song" }, function(response) {
              
              var songs = [],
                tracks = response.results;

              for(var k in tracks)
                if(tracks[k].trackName != undefined)
                  songs.push(tracks[k].trackName);
              
              cachedResults.results[index].songs = songs;

              cache.put(code, cachedResults);

              cachedResults = cachedResults.results[index];


              res.render('sheet', {
                type:type, 
                typeForm : typeForm, 
                uploadForm : uploadForm,
                infos : cachedResults
              });

            });

 */