var fs = require('fs')
  , jf = require('jsonfile')
  , promptly = require('promptly');



module.exports = function(program) {
	program
		.command('useradd <rutorrent|transmission|aucun> <username>')
		.option('-p, --password [password]', 'specify password')
		.option('-r, --role <role>', '<admin|[user]>')
		.description("Ajout d'un utilisateur au client spécifié")
		.action(useradd.command);
}

var useradd = {

	role: function(options, next) {
		if(options.role) {
			if(options.role.length) {
				cache.put('role', options.role);
				next(options);
			} else {
				promptly.choose('Choisissez le role utilisateur {user|admin} : ', ['user', 'admin'], {default : 'user'}, function (err, role) {
					cache.put('role', role);
					next(options);
				});
			}
		} else {
			cache.put('role', 'user');
			next(options);
		}
	},
	password: function(options) {

		if(options.password === undefined) {
			promptly.password('Mot de passe :', function(err, pw) {
				options.password = pw;
				next(options);
			});
		} else {
			next(options);
		}
	},
	command: function(client, username, options) {
		var self = this;

		if(fs.existsSync(app_path + '/app/config.json')) {
			var config = jf.readFileSync(app_path + '/app/config.json');

			if(client == "aucun" || config[client] == true) {

				cache.put('client', client);
				
				self.role(options, function(options) {
					self.password(options, function(options) {

			    		require('../client/'+client+'/useradd')(username, password, next);

						process.exit(0);
					});
				});
			} else {
				console.log("Le client " + client + " n'est pas installé !".error);
				process.exit(1);
			}
		} else {
			console.log("Le fichier de configuration n'existe pas, lancez ./ezseed install".error);
			process.exit(1);
		}
	}
}
