var spawn = require('child_process').spawn;

var shortcut = function(cmd) {
	var running = spawn(global.app_path+'/scripts/update.sh');

	running.stdout.on('data', function (data) {
		var string = new Buffer(data).toString();
		global.log('info', string);
	});

	running.stderr.on('data', function (data) {
		var string = new Buffer(data).toString();
		global.log('error', string);
		
	});

	running.on('exit', function (code) {
		process.exit(code);

	});
}

module.exports = function(program) {
	program.command('start', function() {
		shortcut('service ezseed start');
	});
	program.command('stop', function() {
		shortcut('service ezseed stop');
	});
	program.command('restart', function() {
		shortcut('service ezseed restart');
	});
}