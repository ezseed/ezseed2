var db = require(global.app_path + '/app/core/database')
	   , cache = require('memory-cache')
	   , path = require('path')
	   , exec = require('shelljs').exec;


var user = {
	//Simple wrapper for below could be an async waterfall
	create_next: function(username, password, done) {
		var self = user;

		self.add_to_system(username, password, function(err, user_path) {
			self.save_path(user_path + '/downloads', username, function(err, user_path) {
				done(null);
			});
		});
	},
	create: function(username, password, done) {
		var self = user;

		self.add(username, password, function(err, message) {
			if(err) {
				done(err);
			} else if (message) {
				logger.log('warn', message);

				logger.log('info', "Mise à jour du client sur la base de données");

				db.user.setClient(username, cache.get('client'), function(err) {
					if(err)
						logger.log('error', err);
					
					self.create_next(username, password, done);

				});
			} else {
				self.create_next(username, password, done);
			}
			
		});
	
	},
	add: function(username, password, done) {
		db.user.exists(username, function(exists) {
			if(exists)
				done(null, "L'utilisateur existe déjà !");
			else {
				db.users.create({username : username, password: password, client : cache.get('client'), role : cache.get('role')}, function(err, user) {

					if(err) {
						logger.error('Error adding user to database', err);
						done(err);
					} else {
						logger.log('info', "Utilisateur ajouté à la base de données d'ezseed");
						done(null);
					}
				});
			}
				
	    });
	},
	add_to_system: function(username, password, done) {

		var p = require('./helpers/path')();

		var user_path = path.join(p, username), self = user;

		var exists = exec('grep -c "^'+username+':" /etc/passwd');

		if(exists.output == 1) {
			done("L'utilisateur existe déjà !", user_path);
		} else {

			var create_user = exec('mkdir -p '+user_path+' &&'+
				 'useradd --home-dir '+user_path+' --groups users --password broken '+username+' &&'+
				 ' chown -R '+username+' '+user_path+'/ &&'+
				 ' usermod -p $(mkpasswd -H md5 "'+password+'") '+username, function(code, output) {
					if(code === 0)
						logger.error(output);

					done(null, user_path);
				 });


		}
	},
	save_path: function(user_path, username, done) {

		db.paths.save(user_path, username, function(err, p) {
			logger.log('info', "Chemin "+ user_path + " sauvegardé en base de données");

			// require('./helpers/pm2').restart('watcher', function() {
				done(null, user_path);
			// });
		});
	},
	delete: function(username, done) {
		db.users.delete(username, function(err) {
			if(err)
				logger.log("error", err);
			else
				logger.log("info", "Utilisateur "+ username + " supprimé");
	
			done();
		});
	},
	password: function(username, password, done) {
		var cmd = 'usermod -p $(mkpasswd -H md5 "'+password+'") '+username;

		exec(cmd, function(code, output) {
			
			logger.log('debug', code, output);
			logger.log('info', "System password changed");
			
			db.users.update(username, {password : password}, done);
		});
	},
	get_client: function(username, done) {
		db.user.byUsername(username, function(err, user) {

			if(err)
				logger.error(err);
			
			if(!user)
				done('No user founded');

			if(global.config && global.config[user.client])
				done(err, user.client);
			else {
				logger.log('error', "Le client "+user.client+" n'est pas installé")	
				done(err, user.client);
			}
		
		});
	}
};

module.exports = user;