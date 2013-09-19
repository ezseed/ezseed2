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
	  		
		// Users.findById(req.session.user.id).populate('pathes').exec(function(err, doc) {
		// 	var ps = doc.pathes
		// 		, paths = new Array()
		// 		, pathsKeys = new Array();

		// 	ps.forEach(function(e, i) {
		// 		pathsKeys.push(e.folderKey);
		// 		paths.push(new Buffer(e.folderKey, 'hex').toString());
		// 	});

			//Explore
			// require('../utils/explorer').explore({'path': paths, 'pathsKeys': pathsKeys, uid: req.session.id}, function(err, datas) {

			// });

			//watcher({'paths':paths, 'pathsKeys':pathsKeys,'firstWatch': true, 'allFiles':true, 'uid':req.session.id}); //now we might watch
		// });

		//Let the socket do the job, we can render safely
	  	res.render('desktop', { title: 'Ezseed V2 - Bureau' });

	}
};

