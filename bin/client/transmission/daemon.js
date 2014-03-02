var db = require(global.app_path + '/app/core/database')
  , async = require('async')
  , daemon = require('../../lib/daemon.js');

var transmission_daemon = function (cmd, options) {

	if(options.user) {

		daemon('transmission', cmd, options.user, function() {

			process.exit(0);

		});

	} else {

		db.users.getAll(function(err, users) {

			async.each(users,

				function(user, cb) {

					if(user.client == 'transmission') {

						daemon('transmission', cmd, user.username, cb);

					} else {
						cb();
					}

				},
				function(err) {

					if(err) console.error(err);

					setTimeout(function() {
						process.exit(0);
					}, 1000);

				}
			);

		});
	}

}

module.exports = function (program) {

	program
		.command('transmission <start|stop|restart>')
		.option('-u, --user <username>', 'username')
		.description('start|stop|restart transmission daemon(s)')
		.action(transmission_daemon);
}