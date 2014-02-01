var fs = require('fs')
  , db = require(global.app_path + '/app/core/database')
  , child_process = require('child_process')
  , spawn = child_process.spawn
  , exec = child_process.exec
  , user = require('../../lib/user');

var shell_path = global.app_path + '/app/scripts/rutorrent/useradd.sh';

var useradd = function (username, password, next) {

	user.create(username, password, function(err) {

		if(err)
			console.log(err.error), console.trace(err);

		fs.chmodSync(shell_path, '775');

		var running = spawn(shell_path, [username, password]);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.error(string.error);

		});

		running.on('exit', function (code) {
			next(code);
		});
	});
	
}

module.exports = useradd;
