var console = require(global.config.root+'/core/logger');

var db = require(global.app_path + '/app/core/database')
	   , child_process = require('child_process')
	   , cache = require('memory-cache')
	   , path = require('path')
	   , spawn = child_process.spawn
	   , exec = child_process.exec;


var user = {
	//Simple wrapper for below
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

		self.add(username, password, function(err) {
			if(err) {
				console.log('error', err);

				console.log('info', "Mise à jour du client");

				db.user.setClient(username, cache.get('client'), function(err) {
					if(err)
						console.log('error', err);
					
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
				done("L'utilisateur existe déjà !", "aucun");
			else {

				db.users.create({username : username, password: password, client : cache.get('client'), role : cache.get('role')}, function(err, user) {
		    		console.log('info', "Utilisateur ajouté à la base de données d'ezseed");
		    		//cache.put('user', {username : username, password : password, client: client});
		    		done(null);
		    	});
			}
				
	    });
	},
	add_to_system: function(username, password, done) {

		var p = require('./helpers/path')();

	  	var user_path = path.join(p, username), self = user;

	  	exec('grep -c "^'+username+':" /etc/passwd',function(err, stdout, stderr) {
	  		
	  		if(err)
				console.log('error', err);
			
			if(stderr)
				console.log('error', stderr);

	  		if(stdout == '1') {
	  			done("L'utilisateur existe déjà !", user_path);
	  		} else {

				var cmd = 'mkdir -p '+user_path+' && useradd --home-dir '+user_path+' --groups users --password broken '+username+' && chown -R '+username+' '+user_path+'/ && usermod -p $(mkpasswd -H md5 "'+password+'") '+username;
				
				var running = exec(cmd, function (err, stdout, stderr) {
					if(err)
						console.log('error', err);
					
					if(stderr)
						console.log('error', stderr);

					done(err, user_path);
				});

	  		}
	  	});

	},
	save_path: function(user_path, username, done) {

		db.paths.save(user_path, username, function(err, p) {
			console.log('info', "Chemin "+ user_path + " sauvegardé en base de données");

			// require('./helpers/pm2').restart('watcher', function() {
				done(null, user_path);
			// });
		});
	},
	delete: function(username, done) {
		db.users.delete(username, function(err) {
			if(err)
				console.log("error", err);
			else
		 		console.log("info", "Utilisateur "+ username + " supprimé");
	
	 		done();
	 	});
	},
	password: function(username, password, done) {
		var cmd = 'usermod -p $(mkpasswd -H md5 "'+password+'") '+username;

		exec(cmd, function(err, stdout, stderr) {
			
			console.log('info', "System password changed");
			
			db.users.update(username, {password : password}, done);
		});
	},
	get_client: function(username, done) {
		db.user.byUsername(username, function(err, user) {

			if(err)
				console.error(err);
			
			if(!user)
				done('No user founded');

			if(global.config && global.config[user.client])
				done(err, user.client);
			else {
				console.log('error', "Le client "+user.client+" n'est pas installé")	
				done(err, user.client);
			}
		
		});
	}
};

module.exports = user;