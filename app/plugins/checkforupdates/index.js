var fs = require('fs')
    , _ = require('underscore')
    , path = require('path')
    , jf = require('jsonfile')
    , request = require('request');

var plugin = {
	name : "Updates notifier",
	static : path.join(__dirname, 'public'),
	enabled : true,
	interval : null,
	version : 'v' + jf.readFileSync(global.config.root + '/..' + '/package.json').version,
	update : 1000 * 3600, //1 hour
	stylesheets : [],
	javascripts : ['/js/checkforupdates.js'],
	checkForUpdates : function(socket, cb) {
		request('https://api.github.com/repos/soyuka/ezseed2/releases', function(err, resp, body) {
			var current = JSON.parse(body)[0].tag_name;

			if(current != plugin.version && socket)
				socket.emit('checker:available', current);
			else if(current != plugin.version)
				return typeof cb === 'function' ? cb(true) : true;
			else
				return typeof cb === 'function' ? cb(false) : false;

		});

	},
	admin : function() {
		var self = this;
		return _.template(new Buffer(fs.readFileSync(__dirname + '/public/views/admin.ejs')).toString(), {enabled : self.enabled})
	},
	routes : [

		{
			type : 'GET',
			route : '/plugins/checkforupdates/disable',
			action : function(req, res) {
				plugin.enabled = false;
				res.redirect('back');
			}
		},
		{
			type : 'GET',
			route : '/plugins/checkforupdates/enable',
			action : function(req, res) {
				plugin.enabled = true;
				res.redirect('back');
			}
		},
		{
			type : 'GET',
			route : '/plugins/checkforupdates/manual',
			action : function(req, res) {
				plugin.checkForUpdates(null, function(upToDate) {
					if(upToDate)
						req.session.success = "Ezseed est à jour !";
					else
						req.session.error = "Une nouvelle version est sortie !";

					res.redirect('back');
				});
			}
		}
	],
	views : []
};

module.exports.plugin = plugin;

var sockets = function(socket, sockets) {

	socket.on('disconnect', function() {

		if(plugin.interval !== null)
			clearInterval(plugin.interval);

	});

	socket.on('ckecker:launch', function(u) {
		if(plugin.interval === null)
			
			plugin.interval = setInterval(function() {
				plugin.checkForUpdates(socket);
			}, plugin.update);
		
	});
	
};

module.exports.sockets = sockets;
