var fs = require('fs'), _ = require('underscore'), path = require('path');

var pluginsPath = path.join(global.config.root, "plugins");

module.exports = function(app, io) {

	var plugins = fs.readdirSync(pluginsPath);

    _.each(plugins, function(plugin) {
    	plugin = path.join(pluginsPath, plugin);
    	if(fs.statSync(plugin).isDirectory()) 
    		module.exports[path.basename(plugin)] = require(plugin)(app, io);
    });
}