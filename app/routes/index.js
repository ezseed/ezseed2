var _ = require('underscore')
   	, watcher = require('../utils/watcher.js').watcher
   	, mongoose = require('mongoose')
	, models = require('../models')
	, Users = mongoose.model('Users');


/*
 * GET home page.
 */

exports.index = function(req, res){
	//If user is logged - should not be necessary because we checked the user already
	if(req.session.user) {
		//load the config db
	  		
		Users.findById(req.session.user.id).populate('pathes').exec(function(err, doc) {
			var ps = doc.pathes
				, paths = new Array()
				, pathsKeys = new Array();

			ps.forEach(function(e, i) {
				pathsKeys.push(e.folderKey);
				paths.push(new Buffer(e.folderKey, 'hex').toString());
			});

			//watcher({'paths':paths, 'pathsKeys':pathsKeys,'firstWatch': true, 'allFiles':true, 'uid':req.session.id}); //now we might watch
		});

	  	res.render('desktop', { title: 'Ezseed V2 - Bureau' });

	}
};

