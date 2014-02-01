var spawn = require('child_process').spawn;

module.exports = function (username, password, done) {

	var cmd = 'python '+global.app_path+'scripts/rutorrent/htpasswd.py -b /usr/local/nginx/rutorrent_passwd '+username+' '+password;

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
		return require(global.app_path + '/bin/lib/user').password(username, password, done);
	});
}