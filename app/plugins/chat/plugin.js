var fs = require('fs')
    , _ = require('underscore')
    , path = require('path');

var db = require('./database');

var plugin = {
	inited: false,
	admin_template: null,
	init: function() {
		var self = this;

		if(!self.inited) {
			self.admin_template = fs.readFileSync(__dirname + '/public/views/admin.ejs');
			db.get(function(err, chat) {
				if(err)
					console.error(err);

				self.enabled = chat.active;
				self.messages = chat.messages;

				self.inited = true;

				return self;
			});

		} else
			return this;
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
				
				db.setStatus(false, function(err) {
					plugin.enabled = false;
					res.redirect('back');
				});
			}
		},

		{ 
			type : 'GET',
			route : '/plugins/chat/enable', 
			action : function(req, res) {
				db.setStatus(true, function(err) {
					plugin.enabled = true;
					res.redirect('back');
				});
			}
		}
	]
};

module.exports = plugin;