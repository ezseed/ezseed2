var fs = require('fs')
	, archiver = require('archiver')
	, explorer = require('explorer')
	, async = require('async')
	, _ = require('underscore')
	, pathInfo = require('path')
	, users = require('../models/helpers/users.js')
	, fileManager = require('../models/helpers/files.js');

//Requires all the modedl database
var mongoose = require('mongoose')
	, models = require('../models')
	, Paths = mongoose.model('Paths')
	, Movies = mongoose.model('Movies')
	, Albums = mongoose.model('Albums')
	, Others = mongoose.model('Others')
	, Users = mongoose.model('Users');


exports.download = function(req, res) {
	var path = new Buffer(req.params.id, 'hex').toString(); 

	path = path.replace('../', __dirname.replace('routes', 'public') + '/');

	res.download(path);
}

exports.downloadArchive = function(req, res) {

	Users.findById(req.session.user.id).lean(true).populate('Paths').exec(function(err, docs) {
		Paths.populate(docs, 
			[
			  { path : 'Paths.movies', model: Movies, match: { _id: req.params.id} },
			  { path : 'Paths.albums', model: Albums, match: { _id: req.params.id} },
			  { path : 'Paths.others', model: Others, match: { _id: req.params.id} }
			],
			function(err, docs) {
				if(err) { console.log(err); }

				//../ without ../ cause it's forbidden by express download
				var dir = __dirname.replace('routes', 'public');
				var name;

				_.each(docs.paths, function(path, key) {
					if(_.isArray(path) && path.length > 0) {
						if (key == 'albums' && name == undefined) {
							name = path[0].title;
						} else if(key == 'movies' && name == undefined) {
							name = path[0].title;
						} else if(key == 'others' && name == undefined) {
							name = path[0].title;
						}
					}

					if(!_.isUndefined(name)) {
						return false;
					}
					
				});

				if(_.isUndefined(name)) {
					req.session.error = 'Aucun fichier trouvé';
					res.redirect('/');
				} else {
					res.download(dir + '/tmp/' + req.params.id +'.zip', name);
				}
			}
		);
	});
				
}

//Take _id as archive name + no tmp/user only 1 tmp
//To be improved
exports.archive = function(req, res) {
	var archive = {};

	Users.findById(req.session.user.id).lean(true).populate('Paths').exec(function(err, docs) {
		Paths.populate(docs, 
			[
			  { path : 'Paths.movies', model: Movies, match: { _id: req.params.id} },
			  { path : 'Paths.albums', model: Albums, match: { _id: req.params.id} },
			  { path : 'Paths.others', model: Others, match: { _id: req.params.id} }
			],
			function(err, docs) {
				if(err) { console.log(err); }

				//../ without ../ cause it's forbidden by express download
				var dir = __dirname.replace('routes', 'public');
				var appDir = process.cwd().replace('/app', '');

				_.each(docs.Paths, function(path, key) {
					if(_.isArray(path) && path.length > 0) {
						if (key == 'albums' && archive.path == undefined) {
							//archive.name = path[0].artist + ' - ' + path[0].album;
							archive.path = dir + path[0].path.replace(appDir, '');
						} else if(key == 'movies' && archive.path == undefined) {
							//archive.name = path[0].title;
							archive.path = dir + path[0].path.replace(appDir, '');
						} else if(key == 'others' && archive.path == undefined) {
							//archive.name = path[0]._id;
							archive.path = dir + new Buffer(path[0]._id, 'hex').toString().replace(appDir, '');
						}
					}

					if(!_.isUndefined(archive.path)) {
						return false;
					}
					
				});

				if(_.isUndefined(archive.path)) {
					//sends json error
					var json = {'error':'Aucun fichier trouvé'};
					res.send(JSON.stringify(json));
				} else {
					
					archive.zip = dir + '/tmp/' + req.params.id +'.zip';

					fs.exists(archive.zip, function (exists) {
						if(exists) {
							//sends json redirect download
							var json = {'error':null, 'download':true};
							res.send(JSON.stringify(json));

						} else {

							var output = fs.createWriteStream(archive.zip);
							var zip = archiver('zip');
							
							zip.on('error', function(err) {
								console.log('Zip error : ' + err);
							  throw err;
							});

							zip.pipe(output);

							explorer.getFiles(archive.path, function(err, filePaths) {
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

							});
							
						}
					});
				}
			}
		);
	});
},
//Improve files alone / folder !!
exports.delete = function(req, res) {
	//only unlink folder recursive, watcher'll do the rest
	users.paths(req.session.user.id, function(err, paths) {
		// removeFile({pathsKeys : paths.pathsKeys, f:new Buffer(req.params.id, 'hex').toString()}, function(err, key) {
		// 	if(err) console.log(err);
		// 	res.redirect('/');
		// });
	});

}