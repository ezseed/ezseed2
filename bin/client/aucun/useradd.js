var fs = require('fs');

module.exports = function (username, password, next) {
	require(global.app_path + '/bin/lib/user').create(username, password, function (err) {
		var download_path = require(global.app_path + '/bin/lib/helpers/path')() + '/' + username + '/downloads';
		
		if(!fs.existsSync(download_path))
			fs.mkdirSync(download_path, '775');

		next(null);
	});
};
