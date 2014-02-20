var fs = require('fs')
    , _ = require('underscore')
    , path = require('path');

var db = require('./database');

var md = require("node-markdown").Markdown;
var _s = require('underscore.string');

var console = require(global.config.root + '/core/logger');

var plugin = {
	inited: false,
	admin_template: null,
	init: function() {
		var self = this;

		if(!self.inited) {

			self.admin_template = fs.readFileSync(__dirname + '/public/views/admin.ejs');

			// db.get(function(err, chat) {
			// 	self.enabled = chat.active;
			// });

			self.inited = true;

			return self;

		} else
			return self;
	},
	name : "Chat",
	enabled : true,
	db: require('./database'),
	static : path.join(__dirname, 'public'),
	stylesheets : ['/css/chat.css'],
	javascripts : ['/js/chat.js'],
	admin : function() {
		var self = this;
		return _.template(new Buffer(self.admin_template).toString(), {enabled : self.enabled})
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
				
				// db.setStatus(false, function(err) {
					plugin.enabled = false;
				//	res.redirect('back');
				//});
			}
		},

		{ 
			type : 'GET',
			route : '/plugins/chat/enable', 
			action : function(req, res) {
				//db.setStatus(true, function(err) {
					plugin.enabled = true;
				//	res.redirect('back');
				//});
			}
		}
	]
};

var sockets = function(socket, sockets) {
	socket.on('chat:join', function(u) {
		
		u = _s.slugify(u);

		if(plugin.users.indexOf(u) === -1) {
			plugin.users.push(u);
			plugin.usersBySID.push({u : u, sid : socket.id});
		}
		
		sockets.emit('chat:joined', plugin.users);
		
		db.getMessages(function(err, messages) {
				
			console.log(messages);
			socket.emit('chat:init', messages);
		
		});

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


module.exports.plugin = plugin;

module.exports.sockets = sockets;
