var fs = require('fs')
  , db = require(global.app_path + '/app/core/database')
  , child_process = require('child_process')
  , spawn = child_process.spawn
  , user = require('../../lib/user');


var settings = function (username, password, next) {
	
	console.log("Ajout de l'utilisateur tranmsission terminé, remplacement des configurations".info);
	var settings = global.app_path + '/app/scripts/transmission/config/settings.'+username+'.json';

	fs.readFile(settings, function (err, data) {
		if (err) throw err;
		var d = JSON.parse(data);

		//Default settings replacement
		d['ratio-limit-enabled'] = true;
		d['incomplete-dir-enabled'] = true;
		d['incomplete-dir'] = pathInfo.join(path, username, 'incomplete');
		d['peer-port-random-on-start'] = true;
		d['lpd-enabled'] = true;
		d['peer-socket-tos'] = 'lowcost';
		d['rpc-password'] = password;
		d['rpc-enabled'] = true;
		d['rpc-whitelist-enabled'] = false;
		d['rpc-authentication-required'] = true;
		d['rpc-username'] = username;

		d['download-dir'] = userPath;

		db.users.count(function (err, count) {

			d['rpc-port'] = d['rpc-port'] + count + 1; //+1 because of transmission default, could be started on reboot by default

			fs.writeFileSync(settings, JSON.stringify(d));

			console.log('Démarage du daemon transmission'.info);

			fs.chmodSync(global.app_path +'/app/scripts/transmission/daemon.sh', '775');

			return require('../../lib/daemon.js')('transmission', 'start', username, next);
		

		});
	});
}

var useradd = function (username, password, next) {

	user.create(username, password, function(err) {
		if(err)
			console.log(err.error), console.trace(err);

		var shell_path = global.app_path + '/app/scripts/transmission/useradd.sh';
		fs.chmodSync(shell_path, '775');

		var running = spawn(shell_path, [username, password]);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();

			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();

			console.log(string.error);
		});

		running.on('exit', function (code) {

			return settings(username, password, next);

		});
	});
}

module.exports = useradd;