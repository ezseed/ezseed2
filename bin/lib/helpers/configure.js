var console = require(global.config.root+'/core/logger');
var cache = require('memory-cache')
  , exec = require('child_process').exec
  , _ = require('underscore')
  , fs = require('fs')
  , jf = require('jsonfile');

var configure = {
	update_rc: function(done) {
		console.log('info', "Ajout du script de reboot automatique");
		exec("cp "+global.app_path+"/scripts/ezseed.sh /etc/init.d/ezseed.sh && chmod 755 /etc/init.d/ezseed.sh && update-rc.d ezseed.sh defaults", function(err, stdout, stderr) {
			done(null, {});
		});
	},
	/*
	 * Sets the config.json file
	 */
	set_config: function(path, done) {
		var config = {
					"path": path,
					"fetchTime": 5000,
					"root": global.app_path +'/app',
					"location": "",
					"torrentLink": "embed",
					"diskSpace": "1048576",
					"availableSpace": "1 TB",
					"transmission":false,
  					"rutorrent":false,
					"theme": "default",
					"scrapper": "allocine"
				};
		
		if(fs.existsSync(global.app_path+'/app/config.json')) {
			var cf = jf.readFileSync(global.app_path + '/app/config.json');

			_.each(config, function(e, i) {
				if(cf[i])
					config[i] = e;
			});
		}
		
		global.config = config;

		//Writes the config
		jf.writeFileSync(global.app_path + '/app/config.json', config);

		console.log('info', "Création d'un lien symbolique sur app/public/downloads");

		if(!fs.existsSync(global.app_path + '/app/public/downloads')) {
			//Symlink on the path
			exec('ln -sfn '+ path +' ' + global.app_path + '/app/public/downloads',
			  	function (error, stdout, stderr) {
			  		cache.put('path', path); //?
				    done(null, {});
				}
			);
		} else {
			console.log('warn', "Le lien symbolique existe");
			done(null, {});
		}
	},
	nginx_copy_config: function(done) {
		//Should be a spawn
		exec("cat "+global.app_path+"/scripts/nginx.conf > /etc/nginx/nginx.conf && service nginx restart", function(error, stdout, stderr) {
			done(null, {});
		});
	},
	/**
	 * Creating keys
	 * @param  {String}   sslkeys [ssl keys array]
	 * @param  {Function} done    [callback]
	 * @return {Function}           [callback]
	 */
	nginx: function(sslkeys, done) {

		var l = sslkeys.length, self = this;

		if(!fs.existsSync('/usr/local/nginx'))
			fs.mkdirSync('/usr/local/nginx', '755');

		//Getting some ssl keys to move in the right directory
		if(l == 2) {	
			var cmd = new Buffer("\
					mv " + sslkeys[0].path + " " + global.app_path + "/ezseed" + sslkeys[0].ext + " && \
					mv " + sslkeys[1].path + " " + global.app_path + "/ezseed" + sslkeys[1].ext + " && \
					mv *ezseed.key ezseed.pem* /usr/local/nginx/").toString();

			exec(cmd, function(error, stdout, stderr) {
				
				if(error) {
					console.log('error', error);
				}


				self.nginx_copy_config(done);
			});
				 
		} else {
			var cmd = "openssl req -new -x509 -days 365 -nodes -out /usr/local/nginx/ezseed.pem -keyout /usr/local/nginx/ezseed.key -subj '/CN=ezseed/O=EzSeed/C=FR'";
			exec(cmd, function(error, stdout, stderr) {

				self.nginx_copy_config(done);
			});
		}

	}
};

module.exports = configure;
