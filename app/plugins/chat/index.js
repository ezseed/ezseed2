var socketio = require('socket.io')
	, http = require('http')
    , _ = require('underscore')
    , _s = require('underscore.string');

var express = require('express'), path = require('path');

var md = require("node-markdown").Markdown;

var chat = {
	name : "chat",
	stylesheets : ['/css/chat.css'],
	users : [],
	messages : [],
	sockets : function(socket) {
		if(chat.user) {
			socket.on('join', function(u) {
				u = _s.slugify(u);
				if(users.indexOf(u) === -1) {
					users.push(u);
					socket.emit('init', messages);
					socket.broadcast.emit('joined', u);
				}
			});

			socket.on('message', function(m) {
				m = md(m, true);
				messages.push(m);

				socket.broadcast.emit('message', m);
			});
		}
	},
	views : [
		{
			name : "global",
			path : path.join(__dirname, 'public', 'views', 'chat.ejs'),
			datas : {messages : this.messages, users : this.users }
		},
	]
};


var plugin = _.extend(chat, require('../plugins')(chat));

module.exports = function(app) {
    app.use(plugin.middleware);
	
	app.use(express.static(path.join(__dirname, 'public')));

	var app_chat = express();

  	var server = http.createServer(app_chat).listen('3002', function(){
		var io = socketio.listen(server, {secure: true});
	    io.set('log level', 1); //less log
	    io.sockets.on('connection', plugin.sockets );
  	});

}