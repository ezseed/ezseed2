var fs = require('fs')
    , _ = require('underscore')
    , _s = require('underscore.string')
    , express = require('express')
    , path = require('path')
    , md = require("node-markdown").Markdown;

var chat = {
	name : "chat",
	enabled : true,
	stylesheets : ['/css/chat.css'],
	javascripts : ['/js/chat.js'],
	admin : function() {
		var self = this;
		return _.template(new Buffer(fs.readFileSync(__dirname + '/public/views/admin.ejs')).toString(), {enabled : self.enabled})
	},
	routes : {
		disable : function(req, res) {
			chat.enabled = false;
			res.redirect('back');
		},
		enable : function(req, res) {
			chat.enabled = true;
			res.redirect('back');
		}
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
	]
};

var sockets = function(socket, sockets) {
	socket.on('chat:join', function(u) {
		
		// console.log(u, 'chat:joined', chat.messages);

		u = _s.slugify(u);

		if(chat.users.indexOf(u) === -1) {
			chat.users.push(u);
			chat.usersBySID.push({u : u, sid : socket.id});
		}
		
		sockets.emit('chat:joined', chat.users);

		socket.emit('chat:init', chat.messages);
		
	});

	socket.on('chat:message', function(u, m) {
		m = md(m, true);
		chat.messages.push({user : u, message : m});
		sockets.emit('chat:message', {user : u, message : m});
	});

	socket.on('disconnect', function() {

		var u = _.findWhere(chat.usersBySID, {sid : socket.id});


		if(u) {
			u = u.u;

			var i = chat.users.indexOf(u);

			if (i > -1) {
	    		chat.users.splice(i, 1);
				sockets.emit('chat:joined', chat.users);
			}
		}

	});
};

module.exports.sockets = sockets;


var plugin = _.extend(chat, require('../plugins')(chat));

module.exports.plugin = function(app) {
    app.use(plugin.middleware);
	
	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/plugins/chat/disable', chat.routes.disable);
	app.get('/plugins/chat/enable', chat.routes.enable);

}