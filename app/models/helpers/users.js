var mongoose = require('mongoose')
  , models = require('../')
  , Pathes = mongoose.model('Pathes')
  , Movies = mongoose.model('Movies')
  , Albums = mongoose.model('Albums')
  , Others = mongoose.model('Others')
  , Users = mongoose.model('Users')
  , F = mongoose.model('File')
  , _ = require('underscore');

var cache = require('memory-cache'), pretty = require('prettysize'), async = require('async');


var directorySize = function(path, cb) {

  var exec = require('child_process').exec, child;

  child = exec('du -sk '+path,
      function (error, stdout, stderr) {

        var size = stdout.match(/([0-9]+)/);

        cb(error, size[0]*1024);
    }
  );
} 

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

module.exports.usedSize = function(paths, cb) {

  async.map(paths.paths, directorySize, function(err, sizes){
      var size = _.reduce(sizes, function(memo, num){ return memo + num; }, 0);
      cb(pretty(size));
  });
 
} 