var db = require(global.app_path + '/app/core/database')
	   , child_process = require('child_process')
	   , spawn = child_process.spawn
	   , exec = child_process.exec;


var user = {
	create: function(username, password, done) {
		var self = this;

		self.add(username, password, function(err) {
			self.add_to_system(username, password, function(err, user_path) {
				self.save_path(user_path, username, function(err, user_path) {
					done(null);
				});
			});
		});
	
	},
	add: function(username, password, done) {
		db.user.exists(username, function(exists) {
			if(exists)
				done("L'utilisateur existe déjà !", "aucun");
			else {

				db.users.create({username : username, password: password, client : cache.get('client'), role : cache.get('role')}, function(err, user) {
		    		console.log("Utilisateur ajouté à la base de données d'ezseed".info);
		    		//cache.put('user', {username : username, password : password, client: client});
		    		done(null);
		    	});
			}
				
	    });
	},
	add_to_system: function(username, password, done) {

	  	var user_path = path.join(require('./helpers/path'), username, 'downloads'), self = this;


	  	exec('grep -c "^'+username+':" /etc/passwd',function(err, stdout, stderr) {
	  		
	  		if(stdout == '1') {
	  			done("L'utilisateur existe déjà !", user_path);
	  		} else {

				var cmd = 'mkdir '+user_path+' && useradd --home-dir '+user_path+' --groups users --password broken '+username+' && \

					    chown -R '+username+' '+user_path+'/ && usermod -p $(mkpasswd -H md5 "'+password+'") '+username+ ' && exit 0';

				var running = spawn(cmd);

				running.stdout.on('data', function (data) {
					var string = new Buffer(data).toString();
					console.log(string.info);
				});

				running.stderr.on('data', function (data) {
					var string = new Buffer(data).toString();
					console.log(string.error);
					
				});

				running.on('exit', function (code) {
					done(code, user_path);
				});
	  		}
	  	});

	},
	save_path: function(user_path, username, done) {

		db.paths.save(user_path, username, function(err, p) {
			console.log("Chemin "+ user_path + " sauvegardé en base de données".info);

			require('./helpers/pm2').restart('watcher', function() {
				done(null, user_path);
			});
		});
	},
	password: function(username, password, done) {
		var cmd = 'usermod -p $(mkpasswd -H md5 "'+password+'") '+username;

		var running = spawn(cmd);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.error);
			
		});

		running.on('exit', function (code) {
			db.users.update(username, {password : password}, done);
		});
	}
};

module.exports = user;