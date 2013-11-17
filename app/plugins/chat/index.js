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
	views : [
		{
			name : "global",
			path : path.join(__dirname, 'public', 'views', 'chat.ejs'),
			datas : {port : 3001 }
		},
	]
};

var sockets = function(socket, sockets) {
	socket.on('chat:join', function(u) {
		
		console.log(u, 'chat:joined', chat.messages);

		u = _s.slugify(u);

		if(chat.users.indexOf(u) === -1)
			chat.users.push(u);
		
		sockets.emit('chat:joined', chat.users);

		socket.emit('chat:init', chat.messages);
		
	});

	socket.on('chat:message', function(u, m) {
		m = md(m, true);
		chat.messages.push({user : u, message : m});
		sockets.emit('chat:message', {user : u, message : m});
	});
};

module.exports.sockets = sockets;


var plugin = _.extend(chat, require('../plugins')(chat));

module.exports.plugin = function(app) {
    app.use(plugin.middleware);
	
	app.use(express.static(path.join(__dirname, 'public')));

	// var app_chat = express();

  // 	var server = http.createServer(app_chat).listen(chat.views[0].datas.port, function(){
		// var io = socketio.listen(server, {secure: true});
	 //    io.set('log level', 1); //less log
	 //    io.sockets.on('connection', plugin.sockets );
  // 	});

}