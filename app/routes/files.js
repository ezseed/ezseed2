var fs = require('fs')
	, archiver = require('archiver')
	, explorer = require('explorer')
	, async = require('async')
	, _ = require('underscore')
	, pathInfo = require('path')
	, db = require('../core/database')
	, spawn = require('spawn-command')
	, userHelper = require('../core/helpers/users.js');
	;

var files = {
	download : function(req, res) {
		//to do add db Files search.
		db.files.byId(req.params.id, function(err, doc) {
			if(req.params.fid !== undefined) {
				var file = db.file.byId(doc, req.params.fid);

				res.download(file.path);
			} else {
				var files = doc.songs || doc.videos || doc.files;

				res.download(files[0].path);
			}
		});

	},

	downloadArchive : function(req, res) {

		db.files.byId(req.params.id, function(err, doc) {
			var name = '';

			if(doc.songs !== undefined) {
				name += (doc.artist !== undefined && doc.artist !== null) ? doc.artist : '';
				name += (doc.album !== undefined && doc.album !== null) ? ' - ' + doc.album : '';
				if(name.length == 0) {
					var t = doc.prevDir.split('/');
					t = t[t.length-1];

					name += t;
				}
			} else if(doc.videos !== undefined) {
				name += doc.name;
				name += !_.isEmpty(doc.season) ? ' S'+doc.season : '';
			} else {
				name += doc.name;
			}

			if(!name) {
				req.session.error = 'Aucun fichier trouvé';
				res.redirect('/');
			} else {
				res.download(global.conf.root + '/public/downloads/.tmp/' + req.params.id +'.zip', name + '.zip');
			}
		});
					
	},
	//a lot more to do here !
	delete : function(req, res) {
		db.paths.byUser(req.session.user._id, function(err, paths) {
			db.files.byId(req.params.id, function(err, doc) {

				var files = doc.files || doc.videos || doc.songs;

				db.files[req.params.type + 's'].delete(doc._id, function() {

					//Only unlink files, watcher'll do the rest
					_.each(files, function(e) {
						fs.unlinkSync(e.path);
					});

					//remove prevDir (safe?)
					if(typeof files.prevDir == "string" && paths.paths.indexOf(files.prevDir) === -1)
						fs.rmdirSync(files.prevDir);

					//remove tmp
					if(files.picture)
						fs.unlinkSync(files.picture);

					req.session.success = doc.name + " a été supprimé avec succès !";
					//res.redirect('/#'+doc._id);
					res.json({id : doc._id});
				});

			});
		});

	},
	// /**
	//  * Remove item from database
	//  */
	// reset : function(req, res) {
	// 	db.files[req.params.type + 's'].delete(req.params.id, function(err) {
	// 		db.paths.resetByFile(req.params.id, function(err) {
	// 			res.json({err : err});
	// 		});
	// 	});
	// }
}



module.exports = function(app) {
  //app.get('/archive/(:id)', files.archive); //removing restrict by user
  app.get('/download/archive/(:id)', files.downloadArchive);
  app.get('/download/(:id)', files.download);
  app.get('/download/(:id)/(:fid)', files.download);
  app.get('/delete/(:type)/(:id)', userHelper.restrict, files.delete);
  // app.get('/reset/(:type)/(:id)', userHelper.restrict, files.reset);
}