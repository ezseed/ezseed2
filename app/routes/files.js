var fs = require('fs')
	, archiver = require('archiver')
	, explorer = require('explorer')
	, async = require('async')
	, _ = require('underscore')
	, pathInfo = require('path')
	, db = require('../core/database.js')
	;


exports.download = function(req, res) {
	//to do add db Files search.
	var path = new Buffer(req.params.id, 'hex').toString(); 

	path = path.replace('../', __dirname.replace('routes', 'public') + '/');

	res.download(path);
}

exports.downloadArchive = function(req, res) {

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
				
}

//Take _id as archive name + no tmp/user only 1 tmp
//To be improved
exports.archive = function(req, res) {
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

				} else {

					var output = fs.createWriteStream(archive.zip);
					var zip = archiver('zip');
					
					zip.on('error', function(err) {
						console.log('Zip error : ' + err);
					  throw err;
					});

					zip.pipe(output);

					explorer.getFiles(archive.path, function(err, filePaths) {
						
						if(err)
							res.json({'error' : 'Aucun fichiers trouvés'});
						else {
							async.eachSeries(filePaths, function(item, cb) {
								zip.append(
									fs.createReadStream(pathInfo.normalize(item)), 
									{ name: pathInfo.basename(archive.path) + '/' + item.replace(archive.path, '') },  //, store: true
									function(err) {
										cb(err);
									}
								);
							}, function(err){
							   if(err) console.log(err);
							   zip.finalize(function(err, written) {
									if (err) {
										console.log(err);
									throw err;
									}

									var json = {'error':null, 'download':true};
									res.send(JSON.stringify(json));
							
								});
							});
						}
					});
					
				}
			});
		}
	});

},

exports.delete = function(req, res) {
	//only unlink folder recursive, watcher'll do the rest
	//users.paths(req.session.user.id, function(err, paths) {
		// removeFile({pathsKeys : paths.pathsKeys, f:new Buffer(req.params.id, 'hex').toString()}, function(err, key) {
		// 	if(err) console.log(err);
		// 	res.redirect('/');
		// });
	//});

}