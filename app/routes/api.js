var _ = require('underscore')
	, db = require('../core/database')
	, userHelper = require('../core/helpers/users.js')
    , cache = require('memory-cache');

var api = {
	//Parse req.query.t
	parameters: function(req, res, next) {
		req.parameters = {
				last_update: req.query.t ? new Date(parseInt(req.query.t)) : 0,
				limit: {
					start: req.query.start ? req.query.start : 0,
					limit: req.query.limit ? req.query.limit : 10,
					sort: req.query.sort ? req.query.sort : 'dateAdded'
				}
			};

		console.log(req.parameters);

		next();

	},
	getByUID: function(req, res) {

 		db.files.byUser(req.params.uid, req.parameters.last_update, req.parameters.limit, function(err, files) {

 			delete files.hash;
 			
           	res.json(files);

            cache.put('lastUpdate_'+req.params.uid, new Date);
        });

	}
};

module.exports = function(app) {
	app.get('/api/:uid', userHelper.restrict, api.parameters, api.getByUID);

}