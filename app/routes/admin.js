var db = require('../core/database')
  , _ = require('underscore')
  , fs = require('fs')
  , pretty = require('prettysize')
  , pathInfo = require('path')
  , jf = require('jsonfile')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec
  , userHelper = require('../core/helpers/users');

var console = require('../core/logger');

var admin = {
	/*
	 * GET /admin
	 */
	index : function(req, res) {
		db.users.getAll(function(err, users) {
			// db.paths.getAll(function(err, paths) {
				res.render('admin', { title: 'Ezseed V2 - Administration', users:users}); //,paths: paths
			// });
		});
	}

	/*
	 * GET /admin/path
	 */
	, path : function(req, res) {
		res.render('admin/path', {title : 'Nouveau répertoire', basePath : global.config.path, username : req.params.username});
	}

	, createPath : function(req, res) {
		if(req.body.path.length) {
			if(fs.existsSync(pathInfo.join(global.config.path, req.body.path) )) {
				db.paths.save(pathInfo.join(global.config.path, req.body.path), req.body.username, function(err, p) {
					req.session.success = "Chemin sauvegardé en base de données";
					exec('pm2', ['restart', 'watcher'], function() {
						res.redirect('admin');
					});
				});
			} else {
				req.session.error = "Le dossier n'existe pas";
				res.redirect('admin/path/'+req.body.username);
			}
		} else {
			req.session.error = "Veuillez entrer un chemin valide";
			res.redirect('admin/path/'+req.body.username);
		}
	}

	, deletePath : function(req, res) {
		db.paths.remove(req.params.id, req.params.uid, function(err) {
			if(err) req.session.error = err;
			else req.session.success = "Chemin supprimé de la base de données";

			res.redirect('admin');
		})
	}

	/*
	 * POST /admin/config
	 * Saves the configuration
	 */
	, config : function(req, res) {
		var conf = global.config;

		conf = _.extend(conf, {
			torrentLink : req.body.torrent,
			diskSpace : req.body.disk,
			scrapper : req.body.scrapper,
			archive_max_size: req.body.archive_max_size
		});

		jf.writeFileSync(global.config.root + '/config.json', conf);

		res.redirect('/admin');
	}

	/**
	 * Just a view for username + torrent + password
	 */
	, beginUserCreation : function(req, res) {
		res.render('admin/user', {title: 'Ajouter un utilisateur'});
	}

	/**
	 * Useradd
	 * Adds an user
	 */
	, useradd : function(req, res) {

		if(req.body.client == "transmission" || req.body.client == "rutorrent" || req.body.client == "aucun") {
			
			if(global.config[req.body.client] == true) {

				var shell_path = pathInfo.resolve(global.config.root, '..', 'bin/ezseed');
				
				var options = ['useradd', '-r', req.body.role,'-p', req.body.password, req.body.client, req.body.username];

				var running = spawn(shell_path, options);

				running.stdout.on('data', function (data) {
					var string = new Buffer(data).toString();
					console.log(string);
				});

				running.stderr.on('data', function (data) {
					var string = new Buffer(data).toString();
					console.error(string);
				});

				running.on('exit', function (code) {
					console.log(code);
					req.session.success = "Utilisateur créé"; 
					res.redirect('/admin');
				});
			} else {
				req.session.error = "Le client " + req.body.client + " n'est pas installé";
				res.redirect('/admin/user');
			}

		} else {
			req.session.error = "Le client torrent n'a pas été reconnu";
			res.redirect('/admin/user');
		}
	}

	/** 
	 * Deletes user with client scripts
	 * Must be run as root = bad.
	 */
	, userdel : function(req, res) {
		var shell_path = pathInfo.resolve(global.config.root, '..', 'bin/ezseed');

		db.user.byId(req.params.uid, function(err, user) {
			var running = spawn(shell_path, ['userdel', user.username]);

			running.stdout.on('data', function (data) {
				var string = new Buffer(data).toString();
				console.log(string);
			});

			running.stderr.on('data', function (data) {
				var string = new Buffer(data).toString();
				console.error(string);
			});

			running.on('exit', function (code) {
				req.session.success = "Utilisateur "+user.username+" supprimé avec succès"; 
				res.redirect('/admin');
			});
		});
	}

	, userPassword : function(req, res) {
		res.render('admin/password', {title: 'Modifier le mot de passe'});
	}

	, updatePassword : function(req, res) {
		db.user.byId(req.params.uid, function(err, user) {
			var shell_path = pathInfo.resolve(global.config.root, '..', 'bin/ezseed');
			
			var options = ['password', user.username, ,'-p', req.body.password];

			exec(shell_path, options, function(err, stderr, stdout) {
				if(err)
					console.log(err, stderr, stdout);

				req.session.success = "Mot de passe changé";

				res.redirect('/admin');
			});
		});
	}

	/**
	 * Restrict on admin only based on the role
	 */
	, restrict : function (req, res, next) {
		userHelper.restrict(req, res, function() {
			if (req.session.user && req.session.user.role == 'admin') {
				next();
			} else {
				req.session.error = "L'accès à cette section n'est pas autorisé ! <i class='entypo-cross pullRight'></i>";
				res.redirect('/');
			}
		});
	}

	, editTransmissionConfiguration : function(req, res) {
		var transmissionConfig = jf.readFileSync(global.config.root + '/../scripts/transmission/config/settings.'+req.params.username+'.json');

		res.render('admin/transmission', {title: "Editer la configuration transmission", config : transmissionConfig});
	}

	, saveTransmissionConfiguration : function(req, res) {
		var username = req.params.username;

		exec('/etc/init.d/transmission-daemon-'+username + ' stop', function(err, stdout, sdterr) {
			jf.writeFileSync(global.config.root + '/../scripts/transmission/config/settings.'+username+'.json', JSON.parse(req.body.config) );
			exec('/etc/init.d/transmission-daemon-'+username + ' start', function(err, stdout, sdterr) {
				res.redirect('/admin');
			});
		});
	}

	, changeTheme : function(req, res) {
		var configPath = pathInfo.join(global.config.root, 'config.json')
		  , config = jf.readFileSync(configPath);

		config.theme = req.body.theme;

		jf.writeFileSync(configPath, config);

		res.redirect('/');

		exec('ezseed restart', function() {
		});
	},
	userSpace: function(req, res) {

		var sizes = ['KB', 'MB', 'GB', 'TB'] //indexes matters
		  , size = req.body.size
		  , index = sizes.indexOf(req.body.size)
		  , allowed_space = req.body.disk;

		console.log(allowed_space, size, index)

		//convert size in MB
		if(size !== 'MB') {
		    if(index == 0)
		        index = 1;
		    
		    if(index <= 1)
		        allowed_space = allowed_space / Math.pow(1024, Math.abs(index));
		    else
		        allowed_space = allowed_space * Math.pow(1024, index - 1);
		}		


		console.log(allowed_space);

		db.user.setSpaceLeft(req.params.uid, allowed_space, function(err) {
			if(err)
				console.error(err);
		
			res.redirect('back');
		});
	}
}

module.exports = function(app) {
	app.get('/admin', admin.restrict, admin.index);
	app.post('/admin/config', admin.restrict, admin.config);
	app.get('/admin/path/:username', admin.restrict, admin.path);
	app.post('/admin/path', admin.restrict, admin.createPath);

	app.get('/admin/user', admin.restrict, admin.beginUserCreation);
	app.post('/admin/user', admin.restrict, admin.useradd);

	app.get('/admin/user/:uid/delete', admin.restrict, admin.userdel);

	app.get('/admin/user/:uid/:id/delete', admin.restrict, admin.deletePath); //?
	app.get('/admin/path/:uid/:id/delete', admin.restrict, admin.deletePath); //?

	app.get('/admin/user/:uid/password', admin.restrict, admin.userPassword);
	app.post('/admin/user/:uid/password', admin.restrict, admin.updatePassword);

	app.post('/admin/user/:uid/space', admin.restrict, admin.userSpace);

	app.post('/admin/theme', admin.restrict, admin.changeTheme);

	app.get('/admin/user/transmission/:username', admin.restrict, admin.editTransmissionConfiguration);
	app.post('/admin/user/transmission/:username', admin.restrict, admin.saveTransmissionConfiguration);

}

