var db = require('../core/database.js')
  , _ = require('underscore')
  , pretty = require('prettysize')
  , jf = require('jsonfile');

/*
 * GET /admin
 */
exports.index = function(req, res) {
	db.users.getAll(function(err, users) {
		db.paths.getAll(function(err, paths) {
			res.render('admin', { title: 'Ezseed V2 - Administration', users:users, paths: paths });
		});
	});
}

/*
 * GET /admin/path
 */
exports.path = function(req, res) {
	res.render('admin/path', {title : 'Nouveau répertoire'});
}

exports.createPath = function(req, res) {
	
}

/*
 * POST /admin/config
 * Saves the configuration
 */
exports.config = function(req, res) {
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
exports.restrict = function (req, res, next) {
	if (req.session.user && req.session.user.role == 'admin') {
		next();
	} else {
		req.session.error = "L'accès à cette section n'est pas autorisé ! <i class='entypo-cross pullRight'></i>";
		res.redirect('/');
	}
}

