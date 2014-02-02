var jf = require('jsonfile')
  , spawn = require('child_process').spawn
  , path = require('path')
  , _ = require('underscore')
  , fs = require('fs');

/**
 * Replacing the transformed configuration from require-config.json to main.build.js
 * to be optimized with plugins
 * @param  {[type]}   to_require [plugins to require]
 * @return  {Function} cb         [callback]
 */
var populateRequire = function(to_require, cb) {
	
	var main = global.app_path+'/app/public/javascripts/main.js';

	fs.readFile(main, 'utf8', function (err,data) {
	  
		if (err)
			return cb(err.error);
	  
		var result = data
					.replace(/CONFIG_HERE/g, fs.readFileSync(global.app_path+'/app/public/javascripts/require-config.json'))
					.replace(/REQUIRE_PLUGINS/g, JSON.stringify(to_require).replace('[', '').replace(']', ''));

		fs.writeFile(main.replace('main.js', 'main.build.js'), result, 'utf8', function (err) {
			if (err) return cb(err.error);

			cb(null);
		});
	});
}

/**
 * Add plugins to the require-config.json
 * based on directories
 */
var addPlugins = function() {
	var pluginsPath = path.join(global.app_path, "/app/plugins");

    var plugins = fs.readdirSync(pluginsPath), to_require = [], stats, name;

    var require_config_path = global.app_path+ '/app/public/javascripts/require-config.json'
      , require_config = jf.readFileSync(require_config_path);

    //Parsing the plugins folder
    _.each(plugins, function(plugin) {

        //Plugin path
        pluginPath = path.join(pluginsPath, plugin);

        stats = fs.statSync(pluginPath);
        
        //Check if it's a directory, it's a plugin
        if(stats.isDirectory()) {

        	var plugin = require(pluginPath);

        	_.each(plugin.plugin.javascripts, function(file) {
        		file = path.join(pluginPath, 'public', file);

        		if(path.extname(file) == '.js') {
	    			var p = {}, name = path.basename(pluginPath) + '-' + path.basename(file, '.js');

	    			to_require.push(name);

	    			p[name] = path.join(file.replace(path.basename(file), path.basename(file, '.js')));

	    			_.extend(require_config.paths, p);
	    		}

        	});
		}
	});

    jf.writeFileSync(require_config_path, require_config);
    
    return to_require;
}

/**
 * Execs the deploy.sh (which is optimizing, doing symlinks)
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
var deploy = function(cb) {

	populateRequire(addPlugins(), function(err){
		if(err)
			console.error(err.error);

		var deploy = spawn(global.app_path + '/scripts/deploy.sh', [config.theme]);

		deploy.stdout.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.info);
		});

		deploy.stderr.on('data', function (data) {
			var string = new Buffer(data).toString();
			console.log(string.error);
			
		});

		deploy.on('exit', function (code) {

			console.log("Deploiement terminé.".info)

			return cb !== undefined && typeof cb == 'function' ? cb(code) : process.exit(code);
		});

	});
	
}

module.exports = deploy;