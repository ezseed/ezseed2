//Watch for files and than launch watcher (in real time)
//use ObjectID in urls

var _ = require('underscore')
  , explorer = require('explorer')
  , pathInfo = require('path')
  , async = require('async')
  , addFile = require('./addFile.js').addFile;

var configuration = require(process.cwd() + '/configuration');

exports.explore = function(params, cb) {
	
	var explorePath = function(path, callback) {
		//Todo
		var pathsKeys = [new Buffer(path).toString('hex')];


		explorer.getDirectories (path, function(err, directoryPaths) {

			var i = directoryPaths.length - 1, prevDirs = [i];

			//Find each prevDir (key of a db schema)
			do {
				var prevDir = pathInfo.normalize(directoryPaths[i]).replace(path, '').split('/');
				
				prevDirs[i] = path + prevDir[0];

			} while(i--)
			
			prevDirs = _.unique(prevDirs); //unique array

			//Find the nb of files of each dir
			async.map(prevDirs, explorer.countFiles, function(err, filesNb){
			    prevDirs = _.object(prevDirs, filesNb);


			    explorer.getFiles(path, {ignoreVersionControl : true, sort: true },function(err, filePaths) {

			    	var limitedDirectories = [];

			    	 _.each(prevDirs, function(e, i) {
				    	if(e > configuration.maxFilesLimit)
				    		limitedDirectories.push(i);
				    });

					var files = [], cursor = 0, limited = [];


					_.each(filePaths, function(e, i) {
						e = pathInfo.normalize(e);
					

						if(e != path
							&&
							!/^\./.test(pathInfo.basename(e))
						) {
							if(	
								_.every(limitedDirectories, function(v) { return e.indexOf(v) === -1})
							) {
								files[cursor] = {};
								files[cursor].pathsKeys = pathsKeys;
								files[cursor].path = path;
								files[cursor].f = pathInfo.normalize(e);
								cursor++;
							} else if(_.every(limited, function(v) { return e.indexOf(v) === -1})) {

								var limitedDirectory = _.find(limitedDirectories, function(v){ return e.indexOf(v) !== -1 });

								files[cursor] = {};
								files[cursor].pathsKeys = pathsKeys;
								files[cursor].path = path;
								files[cursor].f = e;
								cursor++;

								limited.push(limitedDirectory);

							}
						}

					});

					async.eachSeries(files, addFile, function(err){
						if(err) console.log(err);

						console.log('Each files done.');
					    // if any of the saves produced an error, err would equal that error
					    callback(err);
					});
				});
			    
				
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