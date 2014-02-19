var console = require(global.config.root+'/core/logger');
var spawn = require('child_process').spawn;

var shortcut = function(cmd, cb) {
	var running = spawn('/etc/init.d/ezseed.sh', [cmd]);

	running.stdout.on('data', function (data) {
		var string = new Buffer(data).toString();
		console.log('info', string);
	});

	running.stderr.on('error', function (data) {
		var string = new Buffer(data).toString();
		console.log('error', string);
		
	});

	running.on('exit', function (code) {

		if(typeof cb == 'function')
			cb(code);
		else
			process.exit(code);

	});
}

module.exports.daemon = shortcut;

module.exports.program = function(program) {
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