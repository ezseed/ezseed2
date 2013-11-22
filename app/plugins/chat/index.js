var fs = require('fs')
    , _ = require('underscore')
    , _s = require('underscore.string')
    , path = require('path')
    , md = require("node-markdown").Markdown;

var plugin = {
	name : "chat",
	enabled : true,
	static : path.join(__dirname, 'public'),
	stylesheets : ['/css/chat.css'],
	javascripts : ['/js/chat.js'],
	admin : function() {
		var self = this;
		return _.template(new Buffer(fs.readFileSync(__dirname + '/public/views/admin.ejs')).toString(), {enabled : self.enabled})
	},
	users : [],
	usersBySID : [], //Store socket.id by users
	messages : [],
	views : [
		{
			name : "global",
			path : path.join(__dirname, 'public', 'views', 'chat.ejs'),
			datas : {}
		},
	],
	routes : [
		{
			type : 'GET',
			route : '/plugins/chat/disable',
			action :  function(req, res) {
				plugin.enabled = false;
				res.redirect('back');
			}
		},

		{ 
			type : 'GET',
			route : '/plugins/chat/enable', 
			action : function(req, res) {
				plugin.enabled = true;
				res.redirect('back');
			}
		}
	]
};

module.exports.plugin = plugin;

var sockets = function(socket, sockets) {
	socket.on('chat:join', function(u) {
		
		// console.log(u, 'chat:joined', chat.messages);

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
		plugin.messages.push({user : u, message : m});
		sockets.emit('chat:message', {user : u, message : m});
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

module.exports.sockets = sockets;

