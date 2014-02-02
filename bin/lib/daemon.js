var fs = require('fs')
  , spawn = require('child_process').spawn
  , path = require('path')
  ;

var daemon = function(client, command, username, done) {
	var shell_path = path.join(app_path,'/scripts/', client,'/daemon.sh');
	fs.chmodSync(shell_path, '775');

	var running = spawn(shell_path, [command, username]);

	running.stdout.on('data', function (data) {
		var string = new Buffer(data).toString();
		console.log(string.info);
	});

	running.stderr.on('data', function (data) {
		var string = new Buffer(data).toString();
		console.log(string.error);
		
	});

	running.on('exit', function (code) {
		if(typeof done == 'function')
			done();
		else
			process.exit(code);
	});
}

module.exports = daemon;