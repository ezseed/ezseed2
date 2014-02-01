var promptly = require('promptly');

module.exports = function (program) {
	program
	.command('password <rutorrent|transmission> <username> ')
	.option('-p, --password [password]', 'specify password')
	.description('Change username password')
	.action(function(client, username, options) {

		var passwd = global.app_path + '/bin/client/' + client + '/password';

		if(options.password === undefined) {
			promptly.password('Mot de passe :', function(err, pw) {
				require(passwd)(username, pw, function() {
					cache.clear();
					process.exit(0);
				});
			});
		} else {
			require(passwd)(username, options.password, function() {
				cache.clear();
				process.exit(0);
			});
		}

	});

}