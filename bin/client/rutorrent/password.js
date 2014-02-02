var exec = require('child_process').exec;

module.exports = function (username, password, done) {

	var cmd = 'python '+global.app_path+'scripts/rutorrent/htpasswd.py -b /usr/local/nginx/rutorrent_passwd '+username+' '+password;

	exec(cmd, function (err, stdout, stderr) {
		return require(global.app_path + '/bin/lib/user').password(username, password, done);
	});

};