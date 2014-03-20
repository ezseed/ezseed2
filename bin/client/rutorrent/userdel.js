var fs = require('fs')
  , child_process = require('child_process')
  , spawn = child_process.spawn
  , db = require(global.app_path + '/app/core/database');

var userdel = function(username, done) {
	var shell_path = global.app_path + '/scripts/rutorrent/userdel.sh';
	fs.chmodSync(shell_path, '775');
	
	var running = spawn(shell_path, [username]);

	running.stdout.on('data', function (data) {
		var string = new Buffer(data).toString();
		logger.log(string.info);
	});

	running.stderr.on('data', function (data) {
		var string = new Buffer(data).toString();
		 logger.log(string.error);
	});

	running.on('exit', function (code) {
		require(global.app_path + '/bin/lib/user').delete(username, done);
	});
};

module.exports = userdel;
