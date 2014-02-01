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

						daemon('transmission', cmd, user.username, function() {

							console.info(user.username + " " + cmd + "ed");
							cb();

						});

					} else {
						console.info(user.username + "is using "+user.client+", skipping");
						cb();
					}

				},
				function(err) {

					if(err) console.error(err);

					console.info("Success");
					process.exit(0);

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