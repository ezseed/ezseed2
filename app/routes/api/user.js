var _ = require('underscore')
	, db = require('../../core/database')
	, userHelper = require('../../core/helpers/users.js')
    , cache = require('memory-cache')
    , fs = require('fs')
    , jf = require('jsonfile')
    , path = require('path')
    , pretty = require('prettysize')
    , api = require('../api').api;

module.exports = function(app) {

	app.get('/api/:uid/size', userHelper.restrict, api.parameters, user.getSize);
	app.get('/api/:uid/files/to_remove', userHelper.restrict, api.parameters, user.getFilesToRemove);
	app.get('/api/:uid/files', userHelper.restrict, api.parameters, user.getFiles);

}


var user = {
	getSize: function(req, res) {
		db.users.count(function(err, num) {

		      //Space left = disk / users
		      var spaceLeft = global.config.diskSpace / num;

		      db.paths.byUser(req.params.uid, function(err, results) {

			      userHelper.usedSize(results, function(size) {

			          //(/helpers/users)
			          var percent = size.size / 1024 / 1024;

			          percent = percent / spaceLeft * 100 + '%';

			          spaceLeft = pretty(spaceLeft * 1024 * 1024);

			          res.json({left : spaceLeft, percent : percent, pretty : size.pretty});
			          //io.sockets.socket(params.sid).emit('size', {left : spaceLeft, percent : percent, pretty : size.pretty});

			    });
			});
		});
	},
	getFilesToRemove: function(req, res) {
		if(req.params.uid) {
			db.paths.byUser(req.params.uid, function(err, results) {
	
				if(err)
					api.error(res, err);

				var tmp_dir = path.join(global.config.root, '/public/tmp/paths')
				  , to_remove = [];

				_.each(results.docs.paths, function(p) {

					var file = path.join(tmp_dir, p._id + '.json');

					if(fs.existsSync(file)) {
					
						to_remove.push(jf.readFileSync(file));
						jf.writeFileSync(file, []);

					}
				});

				res.json(_.flatten(to_remove));
			});
			//Get each paths
			// var tmp_dir = path.join(global.config.root, '/public/tmp/paths')
			//   , file = path.join(tmp_dir, id_path + '.json');

			// if(!fs.existsSync(tmp_dir))
			// 	mkdirp.sync(tmp_dir);
			
			// to_remove = fs.existsSync(file) ? _.extend(to_remove, jf.readFileSync(file)) : to_remove;

			// jf.writeFileSync(file, to_remove);

		}
	},
	getFiles: function(req, res) {

		if(req.params.uid) {
	 		db.files.byUser(req.params.uid, req.parameters.last_update, req.parameters.limit, function(err, files) {

	 			if(err)
	 				api.error(res, err);
	 			else if(files == null)
	 				api.error(res, 'User doesn\'t exists');
	 			else {
		 			//removing user passwd	
		 			delete files.hash;
		 			
		           	res.json(files);

		            // cache.put('lastUpdate_'+req.params.uid, new Date);
		        }

	        });
	 	} else
	 		api.error(res,'User is required');
	}
};