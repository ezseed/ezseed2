//Watch for files and than launch watcher (in real time)
//use ObjectID in urls

var _ = require('underscore')
  , explorer = require('explorer')
  , pathInfo = require('path')
  , async = require('async')
  , addFile = require('./addFile.js').addFile;

exports.explore = function(params, cb) {
	
	var explorePath = function(path, callback) {
		//Todo
		var pathsKeys = [new Buffer(path).toString('hex')];

		explorer.getFiles(path, {ignoreVersionControl : true, sort: true },function(err, filePaths) {


			var files = [];

			_.each(filePaths, function(e, i) {
				files[i] = {};
				files[i].pathsKeys = pathsKeys;
				//Todo check this one
				files[i].f = pathInfo.normalize(e);

			});

			async.eachSeries(files, addFile, function(err){
				if(err) console.log(err);

				console.log('Each files done.');
			    // if any of the saves produced an error, err would equal that error
			    callback(err);
			});
		});

	}

	async.each(params.paths, explorePath, function(err){
		if(err) console.log(err);

		console.log('Each paths done.');
	    // if any of the saves produced an error, err would equal that error
	    cb(err, false);
	});
}