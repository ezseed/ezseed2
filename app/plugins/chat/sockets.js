var md = require("node-markdown").Markdown;
var db = require('./database');

var console = require(global.config.root + '/app/core/logger');

var plugin = require('./plugin');

var sockets = function(socket, sockets) {
	socket.on('chat:join', function(u) {
		
		u = _s.slugify(u);

		if(plugin.users.indexOf(u) === -1) {
			plugin.users.push(u);
			plugin.usersBySID.push({u : u, sid : socket.id});
		}
		
		sockets.emit('chat:joined', plugin.users);

		socket.emit('chat:init', plugin.messages);
		
	});

	socket.on('chat:message', function(u, m) {
		m = md(m, true);

		db.saveMessage({user : u, message : m}, function(err) {
/*			plugin.messages.push({user : u, message : m});
*/			sockets.emit('chat:message', {user : u, message : m});
		});
	});

	socket.on('disconnect', function() {

		var u = _.findWhere(plugin.usersBySID, {sid : socket.id});

		if(u) {
			u = u.u;

			var i = plugin.users.indexOf(u);

			if (i > -1) {
	    		plugin.users.splice(i, 1);
				sockets.emit('chat:joined', plugin.users);
			}
		}

	});
};

module.exports = sockets;
