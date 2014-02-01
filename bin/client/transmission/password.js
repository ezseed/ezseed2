var daemon = require(global.app_path + '/bin/lib/daemon')
  , user = require(global.app_path + '/bin/lib/user.js');

module.exports = function (username, password, done) {

	daemon('transmission', 'stop', username, function() {

		user.password(username, {password : password}, function() {

			var settings = global.app_path + '/scripts/transmission/config/settings.'+username+'.json';

			var d = jf.readFileSync(settings);

			d['rpc-password'] = password;

			jf.writeFileSync(settings, d);

			//restarting daemon
			daemon('transmission', 'start', username, done);

		});

			
	});

};