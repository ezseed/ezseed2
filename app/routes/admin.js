var db = require('../core/database.js')
  , _ = require('underscore')
  , fs = require('fs')
  , pretty = require('prettysize')
  , pathInfo = require('path')
  , jf = require('jsonfile');

var admin = {
	/*
	 * GET /admin
	 */
	index : function(req, res) {
		db.users.getAll(function(err, users) {
			// db.paths.getAll(function(err, paths) {
		console.log(users);
				res.render('admin', { title: 'Ezseed V2 - Administration', users:users }); //,paths: paths
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
					res.redirect('admin');
				});
			} else {
				req.session.error = "Le dossier n'existe pas";
				res.redirect('admin/path/'+req.body.username);
			}
		} else {
			req.session.error = "Veuillez entrer un chemin";
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
			availableSpace : pretty(req.body.disk*1024*1024),
			diskSpace : req.body.disk,
			videoPlayer : req.body.videoPlayer
		});

		jf.writeFileSync(global.config.root + '/config.json', conf);

		res.redirect('/admin');
	}

	/**
	 * Restrict on admin only based on the role
	 */
	, restrict : function (req, res, next) {

		require('./user').restrict(req, res, function() {
			if (req.session.user && req.session.user.role == 'admin') {
				next();
			} else {
				req.session.error = "L'accès à cette section n'est pas autorisé ! <i class='entypo-cross pullRight'></i>";
				res.redirect('/');
			}
		});
	}

	, editTransmissionConfiguration : function(req, res) {
		var transmissionConfig = jf.readFileSync(__dirname + '/../scripts/transmission/config/settings.'+req.params.username+'.json');

		res.render('admin/transmission', {config : transmissionConfig});
	}

	, saveTransmissionConfiguration : function(req, res) {
		var exec = require('child_process').exec;
		var username = req.params.username;

		exec('/etc/init.d/transmission-daemon-'+username + ' stop', function(err, stdout, sdterr) {
			jf.writeFileSync(__dirname + '/../scripts/transmission/config/settings.'+username+'.json', JSON.parse(req.body.config) );
			exec('/etc/init.d/transmission-daemon-'+username + ' start', function(err, stdout, sdterr) {
				res.redirect('/admin');
			});
		});
	}

}

module.exports = function(app) {
	app.get('/admin', admin.restrict, admin.index);
	app.post('/admin/config', admin.restrict, admin.config);
	app.get('/admin/path/:username', admin.restrict, admin.path);
	app.post('/admin/path', admin.restrict, admin.createPath);

	app.get('/admin/path/:uid/:id/delete', admin.restrict, admin.deletePath);

	app.get('/admin/user/transmission/:username', admin.restrict, admin.editTransmissionConfiguration);
	app.post('/admin/user/transmission/:username', admin.restrict, admin.saveTransmissionConfiguration);
}

