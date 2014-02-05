var _ = require('underscore');

var db = {
	paths: require('./paths.js'),
	files: require('./files.js'),
	file: {
		byId : function(obj, id) {
			var o = obj.songs || obj.videos || obj.files;

			return _.filter(o, function(o){ return o._id == id; })[0];
	    }
	},
	user: require('./user.js'),
	users: require('./users.js'),
	plugins: require('../../plugins').database,
	remove: require('./remove'),
}

module.exports = db;
