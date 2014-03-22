var spawn = require('child_process').spawn
  , exec = require('shelljs').exec
  , _s = require('underscore.string');

var shortcut = function(cmd, cb) {
	var running = spawn('/etc/init.d/ezseed.sh', [cmd]);

	running.stdout.on('data', function (data) {
		var string = new Buffer(data).toString();
		logger.info(string);
	});

	running.stderr.on('error', function (data) {
		var string = new Buffer(data).toString();
		logger.error(string);
	});

	running.on('exit', function (code) {


		if(cmd == 'start' || cmd == 'restart') {
		
			//check if ezseed has been started
			logger.warn('Vérification qu\'ezseed est démarré, Patientez...');

			setTimeout(function() {

				var running = exec('ps -ef | grep "pm2: ezseed" | grep -v grep');
					
				logger.log('debug', 'Running', running);

				running = _s.trim(running.output);

				if(running.length !== 0) {
					logger.log('ezseed est démarré');

					if(typeof cb == 'function')
						cb(code);
					else
						process.exit(0);
				} else {
					//if not start it manually
					logger.log('ezseed démarre pour la première fois...');

					c = 'pm2 start '+global.app_path+'/ezseed.json';

					exec(c, function(code, output) {

						logger.debug(output);

						if(typeof cb == 'function')
							cb(err);
						else
							process.exit(code);
					});
				}

			}, 1000);

		} else {

			if(typeof cb == 'function')
				cb(code);
			else
				process.exit(code);
		}
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