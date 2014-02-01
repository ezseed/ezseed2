var fs = require('fs')
  , db = require(global.app_path + '/app/core/database')
  , child_process = require('child_process')
  , spawn = child_process.spawn
  , exec = child_process.exec;

var useradd = {
	aucun : function(username, password, done) {
		db.user.exists(username, function(exists) {
			if(exists)
				done("L'utilisateur existe déjà !", "aucun");
			else
				db.users.create({username : username, password: password, client : 'aucun', role : cache.get('role')}, function(err, user) {
		    		console.log("Utilisateur ajouté à la base de données d'ezseed".info);
		    		cache.put('user', {username : username, password : password});
		    		done(null,"aucun");
		    	});
	    });
	},
	rutorrent : function(username, password, done) {
		var shell_path = global.app_path + '/app/scripts/rutorrent/useradd.sh';
		fs.chmodSync(shell_path, '775');

		var isInstall = cache.get('isinstall');

		var running = spawn(shell_path, [username, password])
		  , path = cache.get('path') ? cache.get('path') : '/home'
		  , userPath = pathInfo.join(path, username, 'downloads');

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.error(string.error);

		});

		running.on('exit', function (code) {
			db.user.exists(username, function(exists) {
				if(exists) {
					if(isInstall === true) {
						var u = cache.get('user');
						db.paths.save(userPath, u.username, function(err, p) {
							console.log("Chemin "+ userPath + " sauvegardé en base de données".info);
					 		done(null, 'rutorrent');
						});
					} else {
						console.log("L'utilisateur existe");
						done(null, 'rutorrent');
					}
				} else {
					db.users.create({username : username, password: password, client : 'rutorrent', role : cache.get('role')}, function(err, u) {
						db.paths.save(userPath, username, function(err, p) {
					 		console.log("Chemin "+ userPath + " sauvegardé en base de données".info);
					 		done(null, 'rutorrent');
					 	});
					});
				}
			});
		});
	},
	transmission : function(username, password, done) {
		var shell_path = global.app_path + '/app/scripts/transmission/useradd.sh';
		fs.chmodSync(shell_path, '775');

		var isInstall = cache.get('isinstall');

		var running = spawn(shell_path, [username, password])
		  , path = cache.get('path') ? cache.get('path') : '/home'
		  , userPath = pathInfo.join(path, username, 'downloads');

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();

			if(cache.get('force') === true)
				console.log(string.error);
			else
				throw string.error;
		});

		running.on('exit', function (code) {
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

					exec('/etc/init.d/transmission-daemon-'+username + ' start',
				    	function(err, stdout, sdterr) {
				    		db.user.exists(username, function(exists) {
								if(exists) {
									if(isInstall === true) {
										var u = cache.get('user');
										db.paths.save(userPath, u.username, function(err, p) {
											console.log("Chemin "+ userPath + " sauvegardé en base de données".info);
									 		done(null, 'transmission');
										});
									} else {
										console.log("L'utilisateur existe");
										done(null, 'transmission');
									}
								} else {
							    	db.users.create({username : username, password: password, client : 'transmission', role : cache.get('role')}, function(err, u) {
							    		db.paths.save(userPath, username, function(err, p) {
							    			if(err)
							    				console.log(err.error);

									 		console.log("Chemin "+ userPath + " sauvegardé en base de données".info);
									 		done(null,'transmission');
									 	});
									});
								}
							});
						}
					);

				});
			});

		});
	}
		   
};

module.exports = useradd;