var mime = require('mime')
, release = require('./release.js')
, id3 = require('id3') //to move
, fs = require('fs')
, pathInfo = require('path')
, filesManager = require('../models/helpers/files.js')
, _ = require('underscore');

//Cache
// var NodeCache = require( "node-cache" );
// var cache = new NodeCache( { stdTTL: 0, checkperiod: 0 } );
var cache = require('memory-cache');

module.exports.addFile = function(filesPaths, callback) {

	var f = filesPaths.f;
	var currentPath = filesPaths.path, pathKey = new Buffer(currentPath).toString('hex');

	//No hidden files
	if(!/^\./.test(pathInfo.basename(f))) {

		var prevDir = f.replace(pathInfo.basename(f), ''); //previous directory
		  
		
		var prev = f.replace(currentPath, '').split('/');

		if(prev.length > 1)
			prevDir = filesPaths.path + prev[0] + '/';
		
		var prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
		  	fileKey = new Buffer(f).toString('hex'); //file hex path

		  	// console.log(prevDir);

		// prev = filesPaths.path + prev.split('/')[0];
		// console.log(prev, prevDir);

		//If cache isn't empty
		if(_.isEmpty(cache.get(fileKey))) {
			
	    	//Sets the file infos
	      	var file = {
	      		mime : mime.lookup(f),
	      		size : fs.statSync(f).size,
	      		path : f,
	      		name : pathInfo.basename(f),
	      		ext : pathInfo.extname(f)
	      	};    	

	        var type = file.mime.split('/');//speed type from mime

	        file._id = fileKey;

	        //If it isn't the path we're watching
	        //it's a folder having content
	        if(currentPath.indexOf(prevDir) === -1) {

	        	var params = {key : prevDirKey, pathKey: pathKey, pathKey: pathKey, file: file};

		        if(type[0] == 'video') {

					filesManager.addToDB.movie(params, false,
					function(err) {
						cache.put(fileKey, 'video');
								
						callback(null);
					});
	        
		        } else if (type[0] == 'audio') {
					filesManager.addToDB.album(params, false,
					function(err) {
						cache.put(fileKey, 'audio');
							
						callback(null);
					});
				} else {

					var prevFiles = fs.readdirSync(prevDir);

					//Sync fct
					var checkIsOther = function (files, i) {
						var i = i == undefined ? 0 : i;
						
						if( i < files.length ) {
							//no hidden files
							if(!/^\./.test(pathInfo.basename(files[i]))) {
								
								var m = mime.lookup(files[i]), t = m.split('/');

								if( (t[0] == 'audio' || t[0]== 'video'))
								{
									return false;
								} else
									return checkIsOther(files, i + 1);
				
							} else
								return checkIsOther(files,i + 1);
						} else 
							return true;
					
					}

					var isOther = checkIsOther(prevFiles);

					if (isOther) {

						filesManager.addToDB.other(params,false,
							function() {
								cache.put(fileKey, 'other');
										
								callback(null);
							}
						);
					} else
						callback(null);

				}
			//We founded a file in the watch dir, it seems to be alone
			} else {
				var params = {key : fileKey, pathKey : prevDirKey, file: file};				
				if(type[0] == 'video') {
					
					filesManager.addToDB.movie(params, true,
					function() {
						cache.put(fileKey, 'video');
								
						callback(null);
					});

				} else if(type[0] == 'audio') {

					filesManager.addToDB.album(params, true,
					function() {
						cache.put( fileKey, 'audio');
								
						callback(null);
					});

				} else {
					filesManager.addToDB.other(params, true,
					function() {
						cache.put(fileKey, 'other');
								
						callback(null);
					});
				}
			}
			
		//Cache founded
		} else {
			// console.log('Cached : ', fileKey, value);
			callback(null);
		}
	} else { //End hidden file 
		callback(null);
	}
}