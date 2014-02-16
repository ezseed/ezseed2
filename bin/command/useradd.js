var fs = require('fs')
  , jf = require('jsonfile')
  , cache = require('memory-cache')
  , promptly = require('promptly');



module.exports = function(program) {
	program
		.command('useradd <rutorrent|transmission|aucun> <username>')
		.option('-P, --path <path>', 'DO NOT USE, user home path should be /home')
		.option('-p, --password <password>', 'specify password')
		.option('-r, --role <role>', '<admin|[user]>')
		.description("Ajout d'un utilisateur au client spécifié")
		.action(useradd.command);
}

var useradd = {

	role: function(options, next) {

		if(options.role) {
			cache.put('role', options.role);
			next(options);
		} else {
			promptly.choose('Choisissez le role utilisateur {admin|[user]} : ', ['user', 'admin'], {default : 'user'}, function (err, role) {
				cache.put('role', role);
				next(options);
			});
		}
	},
	password: function(options, next) {

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

		var self = useradd;

		if(options.path)
			cache.put('path', options.path);

		if(global.config.client) {

			if(client == "aucun" || global.config[client] == true) {

				cache.put('client', client);
				
				self.role(options, function(options) {
					self.password(options, function(options) {

			    		require('../client/'+client+'/useradd')(username, options.password, function() {
			    			process.exit(0);
			    		});

					});
				});
			} else {
				log('error', "Le client " + client + " n'est pas installé !");
				process.exit(1);
			}

		} else {
			log('error', "Le fichier de configuration n'existe pas, lancez ezseed install");
			process.exit(1);
		}
	}
}
