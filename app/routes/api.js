var _ = require('underscore')
	, db = require('../core/database')
	, userHelper = require('../core/helpers/users.js')
    , cache = require('memory-cache');

var api = {
	error: function(res, err) {
		console.log('error', err);
		res.json({error: err});
	},
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

		next();

	}
};

module.exports.app = function(app) {
	require('./api/user.js')(app);
}

module.exports.api = api;