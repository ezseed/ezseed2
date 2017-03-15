var cache = require('memory-cache')
  , exec = require('shelljs').exec
  , _ = require('underscore')
  , fs = require('fs')
  , jf = require('jsonfile');

var configure = {
	update_rc: function(done) {
		logger.log('info', "Ajout du script de reboot automatique");
		exec("cp "+global.app_path+"/scripts/ezseed.sh /etc/init.d/ezseed.sh && chmod 755 /etc/init.d/ezseed.sh && update-rc.d ezseed.sh defaults", function(code, output) {
			if(code == 1)
				logger.error(output);
			done(null, {});
		});
	},
	/*
	 * Sets the config.json file
	 */
	set_config: function(path, done) {

		done = typeof path == 'function' ? path : done;
		var replace_symlink = false;

		if(typeof path == 'string') {

			if(path !== global.conf.path)
				replace_symlink = true;
				
			logger.info('Ecriture du fichier de configuration app/config.json');

			var config = {
					"path": path,
					"fetchTime": 5000,
					"root": global.app_path +'/app',
					"location": "",
					"torrentLink": "embed",
					"transmission":false,
					"rutorrent":false,
					"theme": "default",
					"scrapper": "tmdb"
				};
			
			//replaces with existing configuration file
			if(fs.existsSync(global.app_path+'/app/config.json')) {
				var cf = jf.readFileSync(global.app_path + '/app/config.json');

				_.each(config, function(e, i) {
					if(cf[i])
						config[i] = e;
				});
			}

			global.conf = config;

			//Writes the config
			jf.writeFileSync(global.app_path + '/app/config.json', config);
		} else {
			path = global.conf.path;
		}

		logger.log('info', "Paramétrage du lanceur");

		jf.writeFileSync(global.app_path + '/ezseed.json', 

			[{
			    "name"      : "watcher",
			    "script"    : global.app_path + "/app/watcher.js",
			    "error_file": global.app_path + "/logs/watcher-err.log",
			    "out_file"  : global.app_path + "/logs/watcher-out.log",
			    "env": {
					"NODE_ENV": "production"
			    }
			},{
			    "name"      : "ezseed",
			    "script"    : global.app_path + "/app/app.js",
			    "error_file": global.app_path + "/logs/ezseed-err.log",
			    "out_file"  : global.app_path + "/logs/ezseed-out.log",
			    "env": {
					"NODE_ENV": "production"
			    }
			}]

		);

		logger.log('info', "Création d'un lien symbolique de "+path+" sur "+global.app_path+"/app/public/downloads");

		if(replace_symlink) {
			
			if(fs.existsSync(global.app_path + '/app/public/downloads') ) {
				var running = exec('rm '+global.app_path + '/app/public/downloads');

				if(running.code == 1)
					logger.error('Error while removing symlink', running.output);
			}
			
			exec('ln -sf '+ path +' ' + global.app_path + '/app/public/downloads');				
			cache.put('path', path); //?
		    done(null, {});
			
		} else {
			logger.log('warn', "Le lien symbolique existe");
			done(null, {});
		}
	},
	nginx_copy_config: function(done) {
		//Should be a spawn
			exec("bash "+global.app_path+"/scripts/serveurweb.sh", {silent: true}, function(code, output) {
			
			if(code == 1)
				logger.error(output);

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

			exec(cmd, function(code, output) {
				
				if(code == 1) {
					logger.log('error', output);
				}

				self.nginx_copy_config(done);
			});
				 
		} else {
			var cmd = "openssl req -new -x509 -days 365 -nodes -out /usr/local/nginx/ezseed.pem -keyout /usr/local/nginx/ezseed.key -subj '/CN=ezseed/O=EzSeed/C=FR'";
			exec(cmd, function(code, output) {

				if(code == 1) {
					logger.log('error', output);
				}

				self.nginx_copy_config(done);
			});
		}

	}
};

module.exports = configure;
