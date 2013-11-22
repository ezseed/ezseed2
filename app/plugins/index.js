var fs = require('fs')
    , _ = require('underscore')
    , path = require('path')
    , express = require('express');

var pluginsPath = path.join(global.config.root, "plugins");

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
        admin : plugin.admin(),
        enabled : plugin.enabled
    }
}


module.exports = function(app) {


    app.use(function(req, res, next) {

        var plugins = fs.readdirSync(pluginsPath), locals = [];

        //Parsing the plugins folder
        _.each(plugins, function(plugin) {

            //Plugin path
            plugin = path.join(pluginsPath, plugin);

            //Check if it's a directory, it's a plugin
            if(fs.statSync(plugin).isDirectory()) {

                //Require the plugin
                plugin = require(plugin).plugin;

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
                app.use(express.static(plugin.static));

                //Defining locals vars
                locals[plugin.name] = getLocals(plugin, req.user);
            }
        });

        res.locals.plugins = locals;

        next();
    });

	
}

module.exports.sockets = function(socket, sockets) {
	var plugins = fs.readdirSync(pluginsPath);

	_.each(plugins, function(plugin) {
    	plugin = path.join(pluginsPath, plugin);
    	if(fs.statSync(plugin).isDirectory()) {
    		var s = require(plugin).sockets;
    		if(typeof s == 'function')
	    		s(socket, sockets);
    	}
    });
}