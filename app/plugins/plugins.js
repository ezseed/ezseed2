var fs = require('fs'), _ = require('underscore');

var plugins = function(plugin) {
	return {
		user : null,
		middleware : function(req, res, next) {
			plugin.user = req.user;

			var html = [];

			for(var i in plugin.views) {
				var template = new Buffer(fs.readFileSync(plugin.views[i].path)).toString();
				html[plugin.views[i].name] = _.template(template, _.extend(plugin.views[i].datas, {user : req.user}));
			}

			res.locals.plugins[plugin.name] = {
				html : html, 
				css : plugin.stylesheets, 
				javascripts : plugin.javascripts, 
				admin : plugin.admin(),
				enabled : plugin.enabled,
			};

			next();
		}
	}
}


module.exports = function(plugin) {
	return plugins(plugin);
};