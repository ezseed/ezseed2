var fs = require('fs')
    , _ = require('underscore')
    , path = require('path')
    , express = require('express')
    , cache = require('memory-cache');

var pluginsPath = path.join(global.config.root, "plugins");

var getPlugins = function() {

    var plugins = cache.get('plugins');
    if(!plugins) {

        plugins = [];

        var paths = fs.readdirSync(pluginsPath), plugin;

        _.each(paths, function(plugin) {

            plugin = path.join(pluginsPath, plugin);

            stats = fs.statSync(plugin);
            
            //Check if it's a directory, it's a plugin
            if(stats.isDirectory()) {

                plugins.push(plugin);
               
            }
        })
        
        cache.put('plugins', plugins);
        
        return plugins;
       // return typeof callback == 'function' ? callback(plugins) : plugins;

    } else {
        return plugins;
    }

   // return typeof callback == 'function' ? callback(plugins) : plugins;
}


var getLocals = function(plugin, user) {
    var html = [];

    //Templating
    for(var i in plugin.views) {
        var template = new Buffer(fs.readFileSync(plugin.views[i].path)).toString();
        html[plugin.views[i].name] = _.template(template, _.extend(plugin.views[i].datas, {user : user}));
    }

    var js = [];

    for(var j in plugin.javascripts)
        js.push('"' + plugin.javascripts[j] + '"'); //Adding quotes to the javascript plugin


    return {
        html : html, 
        css : plugin.stylesheets, 
        javascripts : js.join(','), //Join js files, see require (header.ejs)
        admin : typeof plugin.admin == 'function' ? plugin.admin() : null,
        enabled : plugin.enabled
    }
}


module.exports = function(app) {

    app.use(function(req, res, next) {

        var plugins = getPlugins();
        var locals = [], stats;

        //Parsing the plugins folder
        _.each(plugins, function(plugin) {

            //Require the plugin
            plugin = require(plugin).plugin;

            //Add some async call to see if it's enable to current user.

            if(typeof plugin.init == 'function')
                plugin.init();

            //Exporting the routes through app
            for(var i in plugin.routes) {
                var route = plugin.routes[i];

                switch(route.type) {
                    case "GET" : 
                        app.get(route.route, route.action);
                        break;
                    case "POST" : 
                        app.post(route.route, route.action);
                        break;
                    default:
                        break;
                }
            }

            //Adds the assets folder of each plugin
            if(typeof plugin.static == 'string')
                app.use(express.static(plugin.static));

            //Defining locals vars
            locals[plugin.name] = getLocals(plugin, req.user);
        
        });

        res.locals.plugins = locals;

        next();
    });
	
}

module.exports.database = function() {
    var plugins = getPlugins(), databases = {};

    _.each(plugins, function(plugin) {
        databases[plugin] = require(plugin).database;
    });

    return databases;
}

module.exports.sockets = function(socket, sockets) {
	var plugins = getPlugins();

	_.each(plugins, function(plugin) {
		var s = require(plugin).sockets;
		if(typeof s == 'function')
    		s(socket, sockets);
    });
}