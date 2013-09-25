var mime = require('mime')
, fs = require('fs')
, pathInfo = require('path')
, filesManager = require('../models/helpers/files.js')
, _ = require('underscore');

//Cache
// var NodeCache = require( "node-cache" );
// var cache = new NodeCache( { stdTTL: 0, checkperiod: 0 } );
var cache = require('memory-cache');

/*

          var dirSize = cache.get(pathsKeys[0]);
          if(dirSize) {
            cache.del(pathsKeys[0]);
            cache.put(pathsKeys[0], dirSize + file.size)
          } else
            cache.put(pathsKeys[0], file.size);
*/

module.exports.removeFile = function(params, callback) {
	var f = params.f;

	var file = {
  		mime : mime.lookup(f),
  		path : f,
  	};


    var type = file.mime.split('/') ,//speed type from mime
	prevDir = f.replace(pathInfo.basename(f), ''), //previous directory
  	prevDirKey = new Buffer(prevDir).toString('hex'), //to hex
  	fileKey = new Buffer(f).toString('hex'),
  	pathsKeys = params.pathsKeys;

  	if(_.indexOf(pathsKeys, prevDirKey) === -1) {

    	//Retrieving the current watched folder
    	var pathKey,
    	 	l = prevDirKey.length; //check the prevdir length

    	_.each(pathsKeys,function(e, i) {
    		var tmp = prevDirKey.replace(e, ''); //by replacing it in the pathKey

    		if(l != tmp.length) //If something has been replaced, it's the one
    			pathKey = e;
    	});

    	filesManager.removeFromDB.byType(
    		{type:type[0], key: prevDirKey, pathKey: pathKey}, 
    		function(err) {
    			if(err) console.log(err);

          if(params.unlink !== false) {
  					fs.rmdir(prevDir, function() {
              cache.del(fileKey);
  						callback(null, prevDirKey);
  					});
          } else {
            cache.del(fileKey);
            callback(null, prevDirKey);
          }
    		}
    	);
			
    } else {
    	filesManager.removeFromDB.byType(
    		{type:type[0], key: fileKey, pathKey: prevDirKey}, 
    		function(err) {
    			if(err) console.log(err);
          
          if(params.unlink !== false) {
  					fs.unlink(file.path, function() {
              cache.del(fileKey);
  						callback(null, fileKey);
  					});
          } else {
            cache.del(fileKey);
            callback(null, fileKey);
          }
    		}
    	);
			
    }
};
