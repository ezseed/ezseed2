var fs = require('fs')
  , child_process = require('child_process')
  , spawn = child_process.spawn
  , db = require(global.app_path + '/app/core/database');

var userdel = {
	rutorrent : function(username, done) {
		var shell_path = global.app_path + '/scripts/rutorrent/userdel.sh';
		fs.chmodSync(shell_path, '775');
		
		var running = spawn(shell_path, [username]);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			 console.log(string.error);
		});

		running.on('exit', function (code) {
			db.users.delete(username, function(err) {
		 		console.log("Utilisateur "+ username + " supprimé".info);
		 		done(null, 'rutorrent');
		 	});
		});
	},
	transmission: function(username, done) {
		var shell_path = global.app_path + '/scripts/transmission/userdel.sh';
		fs.chmodSync(shell_path, '775');

		var running = spawn(shell_path, [username]);

		running.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		running.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.error);
		});

		running.on('exit', function (code) {
			db.users.delete(username, function(err) {
		 		console.log("Utilisateur "+ username + " supprimé".info);
		 		done(null, 'transmission');
		 	});
		});
	},
	aucun: function(username, done) {
		db.users.delete(username, function(err) {
	 		console.log("Utilisateur "+ username + " supprimé".info);
	 		done(null, 'aucun');
	 	});
	}
};

module.exports = userdel;