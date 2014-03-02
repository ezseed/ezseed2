var console = require('../../core/logger');
var _ = require('underscore')
	, db = require('../../core/database')
	, userHelper = require('../../core/helpers/users.js')
    , cache = require('memory-cache')
    , fs = require('fs')
    , jf = require('jsonfile')
    , path = require('path')
    , async = require('async')
    , pretty = require('prettysize')
    , api = require('../api').api;

module.exports = function(app) {

	app.get('/api/:uid/size', userHelper.restrict, api.parameters, user.getSize);
	app.get('/api/:uid/files/to_remove', userHelper.restrict, api.parameters, user.getFilesToRemove);
	app.get('/api/:uid/files', userHelper.restrict, api.parameters, user.getFiles);

}


var user = {
	getSize: function(req, res) {

		db.user.byId(req.params.uid, function(err, user) {

	      //Space left = disk / users
	      //var spaceLeft = global.config.diskSpace / num;
	      var spaceLeft = user.spaceLeft;

	      	db.paths.byUser(req.params.uid, function(err, results) {

		      	userHelper.usedSize(results, function(size) {

			          //(/helpers/users)
			          var percent = size.size / 1024 / 1024;

			          percent = percent / spaceLeft * 100 + '%';

			          spaceLeft = pretty(spaceLeft * 1024 * 1024);

			          res.json({left : spaceLeft, percent : percent, pretty : size.pretty});

			    });
			}, true); //only user direct paths

	     });

	},
	getFilesToRemove: function(req, res) {
		var to_remove = [];

		if(req.params.uid) {
			db.paths.byUser(req.params.uid, function(err, results) {
	
				if(err)
					api.error(res, err);

				async.map(results.docs.paths, function(p, cb) {
					
					db.remove.get(p._id, cb);
					
				}, function(err, results) {
					// console.log('debug', 'API', results);

					res.json(_.flatten(results));
				});

			
			});

		}
	},
	getFiles: function(req, res) {

		if(req.params.uid) {
	 		db.files.byUser(req.params.uid, req.parameters.last_update, req.parameters.limit, function(err, files) {
	 			
	 			console.log('debug', 'API getFiles', req.parameters);

	 			if(err)
	 				api.error(res, err);
	 			else if(files == null)
	 				api.error(res, 'User doesn\'t exists');
	 			else {
		 			//removing user passwd	
		 			delete files.hash;
		 			
		           	res.json(files);
		        }

	        });
	 	} else
	 		api.error(res,'User is required');
	}
};