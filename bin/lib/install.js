var fs = require('fs')
  , db = require(global.app_path + '/app/core/database')
  , child_process = require('child_process')
  , spawn = child_process.spawn
  , exec = child_process.exec
  , promptly = require('promptly')
  ;

/**
 * Main install wrapper
 * @type {Object}
 */
var install = {
	update_rc: function(callback) {
		console.log("Ajout du script de reboot automatique".info);
		exec("cp "+global.app_path+"/scripts/ezseed.sh /etc/init.d/ezseed.sh && chmod 755 /etc/init.d/ezseed.sh && update-rc.d ezseed.sh defaults", function(err, stdout, stderr) {
			callback(null, {});
		});
	},
	admin_creation: function(callback){
		if(cache.get('skipuser'))
			callback(null, {});
		else {
			console.log("Entrez les informations de l'admin".info);

			promptly.prompt('Username : ', {validator: validators.user}, function (err, username) {
			    promptly.password('Password : ', function(err, password) {
			    	db.users.create({username : username, password: password, client : 'aucun', role: 'admin'}, function(err, user) {
			    		console.log("Utilisateur ajouté à la base de données d'ezseed".info);
			    		cache.put('user', {username : username, password : password});
			    		callback(null,{});
			    	});
			    });
			});
		}
	},
	save_path: function(callback){
		
		console.log("Le dossier ci-dessous sert à partager les fichiers avec nodejs, si vous n'êtes pas sûr laissez par défaut.".warn);

		promptly.prompt('Chemin des dossiers à parser [/home] :', {validator : validators.path, default: '/home'}, function(err, path) {

			var config = {
					"path": path,
					"fetchTime": 5000,
					"root": "",
					"location": "",
					"torrentLink": "embed",
					"diskSpace": "1048576",
					"availableSpace": "1 TB",
					"transmission":false,
  					"rutorrent":false,
					"theme": "default"
				};

			jf.writeFileSync(global.app_path + '/app/config.json', config);

			console.log("Création d'un lien symbolique sur app/public/downloads".info);

			exec('ln -sfn '+ path +' ' + global.app_path + '/app/public/downloads',
			  	function (error, stdout, stderr) {
			  		cache.put('path', path);
				    callback(null, {});
				}
			);
		});


	},
	nginx_conf: function(callback) {

		if(cache.get('skipnginx'))
			callback(null, {})
		else {

			console.log("ex : ./ssl.pem ./ssl.key - séparé par un espace (ou laissez vide pour la générer)".info);
			promptly.prompt("Entrez une clé SSL :", {validator : validators.ssl, default: ""}, function(err, sslkeys) {
				var l = sslkeys.length;

				if(!fs.existsSync('/usr/local/nginx'))
					fs.mkdirSync('/usr/local/nginx', '755');

				if(l == 2) {	
					var cmd = new Buffer("\
							mv " + sslkeys[0].path + " " + global.app_path + "/ezseed" + sslkeys[0].ext + " && \
							mv " + sslkeys[1].path + " " + global.app_path + "/ezseed" + sslkeys[1].ext + " && \
							mv *ezseed.key ezseed.pem* /usr/local/nginx/").toString();

					exec(cmd, function(error, stdout, stderr) {
						if(cache.get('force') === true && !_.isEmpty(stderr))
							console.log(stderr.error);
						else if(!_.isEmpty(stderr))
							throw stderr.error;

						exec("cat "+global.app_path+"/scripts/nginx.conf > /etc/nginx/nginx.conf", function(error, stdout, stderr) {
							callback(null, {});
						});
					});
						 
				} else {
					var cmd = "openssl req -new -x509 -days 365 -nodes -out /usr/local/nginx/ezseed.pem -keyout /usr/local/nginx/ezseed.key -subj '/CN=ezseed/O=EzSeed/C=FR'";
					exec(cmd, function(error, stdout, stderr) {
						exec("cat "+global.app_path+"/scripts/nginx.conf > /etc/nginx/nginx.conf && service nginx restart", function(error, stdout, stderr) {
							callback(null, {});
						});
					});
				}

			});
		}

	},
	client_torrent: function(callback, client) {
		if(client) {
			require('./'+client+'/install')(function(err, results) {
				callback(null, results);
			});
		} else {

			var choose = function(callback) {
				promptly.choose('Choisissez le client torrent à installer {rutorrent|transmission|[aucun]} : ', ['rutorrent', 'transmission', 'aucun'], {default : 'aucun'}, function (err, client) {
					if(client == 'aucun') {
						promptly.confirm("Êtes vous sûr de ne pas vouloir installer de client ? (l'utilisateur système ne sera pas créé) Y/n", {default : 'y'}, function (err, value) {
						    if(value === true) {
						    	require('./'+client+'/install')(function(err, results) {
							    	callback(null, results);
							    });
							} else {
								choose();
							}
						});
					} else {
						if(cache.get('notorrent') === true)
							callback(null, client);
						else
						    require('./'+client+'/install')(function(err, results) {
						    	callback(null, results);
						    });
					}
				});
			}

			choose(callback);
			
		}
	}
};

module.exports = install;