var db = require(global.app_path + '/app/core/database')
	, async = require('async')
	, daemon = require('../lib/daemon');
	
var reboot = function() {
	var start = function(user, cb) {
		daemon(user.client, 'start', user.username, function() {
			global.log('info', user.username + " " + user.client + " started");
			cb();
		});
	}

	db.users.getAll(function(err, users) {
		async.each(users, start, function(err){
			process.exit(0);
		});
	});
};

module.exports = function (program) {

	program
		.command('reboot')
		.description('Restart all daemons')
		.action(reboot);

}
