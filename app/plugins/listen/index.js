var fs = require('fs')
    , _ = require('underscore')
    , _s = require('underscore.string')
    , path = require('path')
    , db = require(global.config.root + '/core/database');

var plugin = {
	name : "Audiocogs",
	enabled : true,
	static : path.join(__dirname, 'public'),
	stylesheets : ['/css/player.css'],
	javascripts : ['/audiocogs/aurora.min.js', '/js/classlist.js', '/js/DGAuroraPlayer.js', '/js/player.js', '/js/listen.js'],
	admin : function() {
		var self = this;
		return _.template(new Buffer(fs.readFileSync(__dirname + '/public/views/admin.ejs')).toString(), {enabled : self.enabled})
	},
	views : [
		{
			name : "global",
			path : path.join(__dirname, 'public', 'views', 'listen.ejs'),
			datas : {}
		},
	],
	routes : [
		{
			type : 'GET',
			route : '/plugins/listen/disable',
			action :  function(req, res) {
				plugin.enabled = false;
				res.redirect('back');
			}
		},

		{ 
			type : 'GET',
			route : '/plugins/listen/enable', 
			action : function(req, res) {
				plugin.enabled = true;
				res.redirect('back');
			}
		},

		{
			type: 'GET',
			route : '/plugins/listen/(:id)',
			action : function(req, res) {

				if(req.xhr) {
					if(req.params.id) {
						db.files.albums.byId(req.params.id, function(err, doc) {
							if(err) { 
								console.log(err);
								res.json({error : 'Aucun fichier trouvé'});
							} else {

								var cwd = global.config.root.replace('/app', '');

								var songs = [];

								for(var i in doc.songs) {

									//doc.songs[i].url = 'http://' + req.host + doc.songs[i].path.replace(cwd, '').replace(global.config.path, '/downloads');
									doc.songs[i].url = 'http://' + req.headers.host + doc.songs[i].path.replace(cwd, '').replace(global.config.path, '/downloads');
									
									if(doc.songs[i].ext != 'm3u')
										songs.push(doc.songs[i]);
								}								

								doc.songs = songs;
								delete songs;

								res.json( { album: doc, id:doc._id });
								
							}
							
						});
					} else {
						res.send(404, {});
					}
				}
			}

		}
	]
};

module.exports.plugin = plugin;
