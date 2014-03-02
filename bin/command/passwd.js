var promptly = require('promptly');

module.exports = function (program) {
	program
	.command('password <username> ')
	.option('-p, --password [password]', 'specify password')
	.description('Change username password')
	.action(function(username, options) {

		username = username.toLowerCase();

		require('../lib/user').get_client(username, function(err, client) {

			var passwd = global.app_path + '/bin/client/' + client + '/password';

			if(options.password === undefined) {
				promptly.password('Mot de passe :', function(err, pw) {
					require(passwd)(username, pw, function() {
						process.exit(0);
					});
				});
			} else {
				require(passwd)(username, options.password, function() {
					process.exit(0);
				});
			}
		
		});

	});

}