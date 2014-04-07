var exec = require('shelljs').exec
  , sh = require('shelljs')
  , fs = require('fs');


module.exports = {
	update: function(done) {
		this.configure();

		done();
	},
	configure: function(done) {
		exec("bash "+global.app_path+"/scripts/nginx/nginx.sh", {silent: true}, function(code, output) {
			
			if(code == 1)
				logger.error(output);

			done(null, {});
		});
	},

	move_keys: function(sslkeys) {
		if(!fs.existsSync(sslkeys[0].path) || !fs.existsSync(sslkeys[1].path)) {
			logger.error('No ssl keys founded, please make sure '+ sslkeys[0].path + ' and ' + sslkeys[1].path + ' exists');
		} else {
			//renaming keys
			sh.mv("mv " + sslkeys[0].path + " " + global.app_path + "/ezseed" + sslkeys[0].ext);
			sh.mv("mv " + sslkeys[1].path + " " + global.app_path + "/ezseed" + sslkeys[1].ext);

			sh.mv("mv *ezseed.key ezseed.pem* /usr/local/nginx/");
		}
	},
	/**
	 * Creating keys
	 * @param  {String}   sslkeys [ssl keys array]
	 * @param  {Function} done    [callback]
	 * @return {Function}           [callback]
	 */
	install: function(sslkeys, done) {

		var l = sslkeys.length, self = this;

		if(!fs.existsSync('/usr/local/nginx'))
			fs.mkdirSync('/usr/local/nginx', '755');

		//not getting some ssl keys to move in the right directory
		if(l != 2) {
			exec("openssl req -new -x509 -days 365 -nodes -out /usr/local/nginx/ezseed.pem -keyout /usr/local/nginx/ezseed.key -subj '/CN=ezseed/O=EzSeed/C=FR'");
		} else {
			this.move_keys(sslkeys);
		}

		self.configure(done);

	}
}