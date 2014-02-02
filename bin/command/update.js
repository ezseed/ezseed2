var child_process = require('child_process')
	   , spawn = child_process.spawn;

var update = {
	rtorrent: function(cb) {
		var shell_path = global.app_path + '/scripts/rutorrent/update.sh';
		fs.chmodSync(shell_path, '775');
	
		var running = spawn(shell_path);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			global.log('info', string);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			global.log('error', string);			
		});

		running.on('exit', function (code) {
			global.log('info', 'Mise à jour de rutorrent terminée');
			var config = jf.readFileSync(global.app_path + '/app/config.json');
			
			config.rutorrent = true;

			jf.writeFileSync(global.app_path+'/app/config.json', config);

			cb(code);
		});
	},
	ezseed: function (cb) {
		var cmd = 'cd '+global.app_path+ ' && git pull https://github.com/soyuka/ezseed2 && npm install';

		var running = spawn(cmd);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			global.log('info', string);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			global.log('error', string);
			
		});

		running.on('exit', function (code) {
			global.log('info', 'Ezseed est à jour préparation des fichiers');

			require('../lib/deploy')(function(code) {
				cb(code);
			});

		});
	}
}


module.exports = function (program) {
	
	program
	.command('update')
	.description('Update ezseed')
	.option('--rtorrent', 'update rtorrent & libtorrent')
	.action(function(options) {

		if(options.rtorrent)

			update.rtorrent(function(code) {
				process.exit(code);
			});

		else 
			
			update.ezseed(function(code) {
				process.exit(code);
			});		

	});

}