var fs = require('fs')
	, archiver = require('archiver')
	, explorer = require('explorer')
	, async = require('async')
	, _ = require('underscore')
	, pathInfo = require('path')
	, db = require('../core/database.js')
	, userHelper = require('../core/helpers/users.js');
	;

//To be moved
var archiveFiles = function(archive, filePaths, callback) {
	var output = fs.createWriteStream(archive.zip);
	var zip = archiver('zip');
	
	zip.on('error', function(err) {
		callback(err);
	});

	zip.pipe(output);


	async.each(filePaths, function(item, cb) {

		zip.append(
			fs.createReadStream(pathInfo.normalize(item)), 
			{ name: pathInfo.basename(pathInfo.dirname(item)) + '/' + pathInfo.basename(item) },  //, store: true
			function(err) {
				cb(err);
			}
		);
	}, function(err){
	   if(err) callback(err);
	   zip.finalize(function(err, written) {
			if (err) callback(err);

			callback(null);
		});
	});

}

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

			if(_.isUndefined(name)) {
				req.session.error = 'Aucun fichier trouvé';
				res.redirect('/');
			} else {
				res.download(global.config.root + '/public/tmp/' + req.params.id +'.zip', name);
			}
		});
					
	},
	//Take _id as archive name + no tmp/user only 1 tmp
	//To be improved
	archive : function(req, res) {
		var archive = {};


		db.files.byId(req.params.id, function(err, doc) {

			archive.path = doc.prevDir;

			if(_.isUndefined(archive.path)) {
				//sends json error
				res.json({'error':'Aucun fichier trouvé'});
			} else {
				
				archive.zip = pathInfo.join(global.config.root, 'public/tmp/', req.params.id +'.zip');

				fs.exists(archive.zip, function (exists) {
					if(exists) {
						//sends json redirect download
						res.json({'error':null, 'download':true});

					//If it's a tvserie we need the videos paths
					} else if(!_.isEmpty(doc.season)) {
						
						var filePaths = [];

						for(var k in doc.videos)
							filePaths.push(doc.videos[k].path);

						archive.path = doc.name + ' - ' + doc.season;

						archiveFiles(archive, filePaths, function(err) {
							if(err)
								res.json({'error' : 'Erreur zip :' + err});
							else
								res.json({'error':null, 'download':true});
						});

					} else {

						explorer.getFiles(archive.path, function(err, filePaths) {
							if(err)
								res.json({'error' : 'Aucun fichiers trouvés'});
							else {
								archiveFiles(archive, filePaths, function(err) {
									res.json({'error':null, 'download':true});
								});
							}
						});
						
					}
				});
			}
		});

	},

	delete : function(req, res) {

		db.files.byId(req.params.id, function(err, file) {
			console.log(file);
		});
		//only unlink folder recursive, watcher'll do the rest
		//users.paths(req.session.user.id, function(err, paths) {
			// removeFile({pathsKeys : paths.pathsKeys, f:new Buffer(req.params.id, 'hex').toString()}, function(err, key) {
			// 	if(err) console.log(err);
			// 	res.redirect('/');
			// });
		//});

	}
}



module.exports = function(app) {
  app.get('/archive/(:id)', userHelper.restrict, files.archive);
  app.get('/download/archive/(:id)', files.downloadArchive);
  app.get('/download/(:id)', files.download);
  app.get('/download/(:id)/(:fid)', files.download);
  app.get('/delete/(:type)/(:id)', userHelper.restrict, files.delete);
}