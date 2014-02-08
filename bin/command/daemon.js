var spawn = require('child_process').spawn;

var shortcut = function(cmd) {
	var running = spawn('/etc/init.d/ezseed.sh', [cmd]);

	running.stdout.on('data', function (data) {
		var string = new Buffer(data).toString();
		global.log('info', string);
	});

	running.stderr.on('error', function (data) {
		var string = new Buffer(data).toString();
		global.log('error', string);
		
	});

	running.on('exit', function (code) {
		process.exit(code);

	});
}

module.exports = function(program) {
	program
		.command('start')
		.action(function() {
			shortcut('start');
		});

	program
		.command('stop')
		.action(function() {
			shortcut('stop');
		});

	program
		.command('restart')
		.action(function() {
			shortcut('restart');
		});
}