var mime = require('mime')
, release = require('./release.js')
, id3 = require('id3') //to move
, fs = require('fs')
, pathInfo = require('path')
, filesManager = require('../models/helpers/files.js')
, _ = require('underscore');

//Cache
var NodeCache = require( "node-cache" );
var cache = new NodeCache( { stdTTL: 0, checkperiod: 0 } );

module.exports.addFile = function(filesPaths, callback) {

	var f = filesPaths.f;
	var pathsKeys = filesPaths.pathsKeys;

	//No hidden files
	if(!/^\./.test(pathInfo.basename(f))) {


		var prevDir = f.replace(pathInfo.basename(f), ''), //previous directory
		  	prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
		  	fileKey = new Buffer(f).toString('hex'); //file hex path

		cache.get( fileKey, function( err, value ){
			
			//If cache isn't empty
			if(_.isEmpty(value)) {

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
		        if(pathsKeys.indexOf(prevDirKey) === -1) {

		        	var pathKey = pathsKeys[0];

			        if(type[0] == 'video') {

						filesManager.addToDB.movie({'key' : prevDirKey, 'pathKey' : pathKey, 'file': file}, false,
						function(err) {
							cache.set( fileKey, 'video', function( err, success ){
								if(err) console.log(err);
									
							  	callback(null);
							});
						});
		        
			        } else if (type[0] == 'audio') {
						
						filesManager.addToDB.album(
							{'key' : prevDirKey, 
							'pathKey' : pathKey, 
							'prevDir' : prevDir, 
							'file' : file}, false,
							function() {
								cache.set( fileKey, 'audio', function( err, success ){
									if(err) console.log(err);
										
								  	callback(null);
								});
							});

					} else {

						var prevFiles = fs.readdirSync(prevDir);

						//Sync fct
						function isOther (files, i) {
							var i = i == undefined ? 0 : i;
							
							if( i < files.length ) {
								//no hidden files
								if(!/^\./.test(pathInfo.basename(files[i]))) {
									
									var m = mime.lookup(files[i]), t = m.split('/');

										if( (t[0] == 'audio' || t[0]== 'video') && isOther)
									{
										return false;
									} else
										return isOther(files, i + 1);
					
								} else
									return isOther(files,i + 1);
							} else 
								return true;
						
						}

						var isOther = isOther(prevFiles);


						if (isOther) {
							filesManager.addToDB.other({'key':prevDirKey,'pathKey': pathKey,'prevDir':prevDir,'file':file},false,
								function() {
									cache.set( fileKey, 'other', function( err, success ){
										if(err) console.log(err);
											
									  	callback(null);
									});
								}
							);
						} else
							callback(null);

					}
				//We founded a file in the watch dir, it seems to be alone
				} else {				
					if(type[0] == 'video') {
						
						filesManager.addToDB.movie({'key' : fileKey, 'pathKey' : prevDirKey, 'file': file}, true,
						function() {
							cache.set( fileKey, 'video', function( err, success ){
								if(err) console.log(err);
									
							  	callback(null);
							});
						});

					} else if(type[0] == 'audio') {

						filesManager.addToDB.album(
						{'key' : fileKey, 
						'pathKey' : prevDirKey, 
						'prevDir' : prevDir, 
						'file' : file}, true,
						function() {
							cache.set( fileKey, 'audio', function( err, success ){
								if(err) console.log(err);
									
							  	callback(null);
							});
						});

					} else {
						filesManager.addToDB.other({'key':fileKey,'pathKey':prevDirKey,'prevDir':prevDir,'file':file}, true,
						function() {
							cache.set( fileKey, 'other', function( err, success ){
								if(err) console.log(err);
									
							  	callback(null);
							});
						});
					}
				}
			
			//Cache founded
			} else {
				//console.log('Cached : ', value);
				callback(null);
			}
		});
	} else { //End hidden file 
		callback(null);
	}
}