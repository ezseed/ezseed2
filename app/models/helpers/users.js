var mongoose = require('mongoose')
  , models = require('../')
  , Pathes = mongoose.model('Pathes')
  , Movies = mongoose.model('Movies')
  , Albums = mongoose.model('Albums')
  , Others = mongoose.model('Others')
  , Users = mongoose.model('Users')
  , F = mongoose.model('File')
  , _ = require('underscore');



module.exports.paths = function (uid, cb) {
	 Users.findById(uid).populate('pathes').exec(function(err, doc) {

	    var ps = doc.pathes
	      , paths = new Array()
	      , pathsKeys = new Array();

	    ps.forEach(function(e, i) {
	      pathsKeys.push(e.folderKey);
	      paths.push(new Buffer(e.folderKey, 'hex').toString());
	    });

	    cb(err, {paths: paths, pathsKeys: pathsKeys, uid: uid});

	});

}

module.exports.files = function(uid, lastUpdate, cb) {
	Users.findById(uid).lean(true).populate('pathes').exec(function(err, docs) {
      Pathes.populate(docs, 
        [
          { path: 'pathes.movies', model: Movies, match: { dateAdded: {$gt:lastUpdate} }, lean : true },
          { path: 'pathes.albums', model: Albums, match: { dateAdded: {$gt:lastUpdate} }, lean : true },
          { path: 'pathes.others', model: Others, match: { dateAdded: {$gt:lastUpdate} }, lean : true }
        ],
        function(err, docs) {
        	if(err) console.log(err);

        	//Fetching tvshows together
        	docs.pathes.movies = require('../../utils/release.js').seriesTogether(docs.pathes.movies);

          cb(docs);
        }
      );
    });
}