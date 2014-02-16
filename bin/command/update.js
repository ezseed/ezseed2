var child_process = require('child_process')
	   , spawn = child_process.spawn
	   , jf = require('jsonfile');

var update = {
	rtorrent: function(cb) {
		var shell_path = global.app_path + '/scripts/rutorrent/update.sh';
		fs.chmodSync(shell_path, '775');
	
		var running = spawn(shell_path);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			global.log('info', string);
		});

		running.stderr.on('error', function (data) {
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
	ezseed: function (options, cb) {

		var running = spawn(global.app_path+'/scripts/update.sh');

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			global.log('info', string);
		});

		running.stderr.on('error', function (data) {
			var string = new Buffer(data).toString();
			global.log('error', string);
			
		});

		running.on('exit', function (code) {

			global.log('info', 'Enregistrement du scrapper');

			global.config.scrapper = options.scrapper ? options.scrapper : global.config.scrapper ? global.config.scrapper : 'tmdb';
			jf.writeFileSync(global.app_path+'/app/config.json', global.config);
			

			var next = function() {
				if(options['no-restart']) {
					global.log('info', 'Mise à jour terminée, lancez : ezseed start');
					cb(code);
				} else {
					require('./daemon').daemon('start',function(code) {
						cb(code);
					});
				
				}
			}

			if(options['no-deploy']) {
				next();
			} else {
				global.log('info', 'Ezseed est à jour déploiement des fichiers');

				require('../lib/deploy')(function(code) {
					next();
				});
			}

		});
	}
}


module.exports = function (program) {
	
	program
	.command('update')
	.description('Update ezseed')
	.option('--rtorrent', 'update rtorrent & libtorrent')

	.option('--scrapper <tmdb|allocine>')
	.option('--no-deploy', "doesn't deploy")
	.option('--no-restart', "doesn't restart ezseeed")
	.action(function(options) {

		if(options.rtorrent)

			update.rtorrent(function(code) {
				process.exit(code);
			});

		else 
			
			update.ezseed(options, function(code) {
				process.exit(code);
			});		

	});

}