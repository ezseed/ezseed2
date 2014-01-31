var _ = require('underscore')
	, db = require('../core/database')
	, userHelper = require('../core/helpers/users.js')
    , cache = require('memory-cache');

var api = {

	getByUID: function(req, res) {

		var lastUpdate = req.query.t ? new Date(parseInt(req.query.t)) : 0;

 		db.files.byUser(req.params.uid, lastUpdate, function(err, files) {

           	res.json(files);

            cache.put('lastUpdate_'+req.params.uid, new Date);
        });

	}
};

module.exports = function(app) {
	app.get('/api/:uid', userHelper.restrict, api.getByUID);

}