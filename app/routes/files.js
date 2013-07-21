var fs = require('fs')
	, archiver = require('archiver')
	, _ = require('underscore');

//Requires all the modedl database
var mongoose = require('mongoose')
	, models = require('../models')
	, Pathes = mongoose.model('Pathes')
	, Movies = mongoose.model('Movies')
	, Albums = mongoose.model('Albums')
	, Others = mongoose.model('Others')
	, Users = mongoose.model('Users')
	, F = mongoose.model('File');

exports.download = function(req, res) {
	var path = new Buffer(req.params.id, 'hex').toString(); 
	console.log(path );

	path = path.replace('../', __dirname.replace('routes', 'public') + '/');

	console.log(path);
	res.download(path);
}

exports.downloadArchive = function(req, res) {

	Users.findById(req.session.user.id).lean(true).populate('pathes').exec(function(err, docs) {
		Pathes.populate(docs, 
			[
			  { path : 'pathes.movies', model: Movies, match: { _id: req.params.id} },
			  { path : 'pathes.albums', model: Albums, match: { _id: req.params.id} },
			  { path : 'pathes.others', model: Others, match: { _id: req.params.id} }
			],
			function(err, docs) {
				if(err) { console.log(err); }

				//../ without ../ cause it's forbidden by express download
				var dir = __dirname.replace('routes', 'public');
				var name;

				_.each(docs.pathes, function(path, key) {
					if(_.isArray(path) && path.length > 0) {
						if (key == 'albums' && name == undefined) {
							name = path[0].title;
						} else if(key == 'movies' && name == undefined) {
							name = path[0].title;
						} else if(key == 'others' && name == undefined) {
							name = path[0]._id;
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
exports.archive = function(req, res) {
	var archive = {};

	Users.findById(req.session.user.id).lean(true).populate('pathes').exec(function(err, docs) {
		Pathes.populate(docs, 
			[
			  { path : 'pathes.movies', model: Movies, match: { _id: req.params.id} },
			  { path : 'pathes.albums', model: Albums, match: { _id: req.params.id} },
			  { path : 'pathes.others', model: Others, match: { _id: req.params.id} }
			],
			function(err, docs) {
				if(err) { console.log(err); }

				//../ without ../ cause it's forbidden by express download
				var dir = __dirname.replace('routes', 'public');
				
				_.each(docs.pathes, function(path, key) {
					if(_.isArray(path) && path.length > 0) {
						if (key == 'albums' && archive.path == undefined) {
							//archive.name = path[0].artist + ' - ' + path[0].album;
							archive.path = dir + path[0].path.replace('../', '/');
						} else if(key == 'movies' && archive.path == undefined) {
							//archive.name = path[0].title;
							archive.path =  dir + path[0].path.replace('../', '/');
						} else if(key == 'others' && archive.path == undefined) {
							//archive.name = path[0]._id;
							archive.path =  dir + path[0].path.replace('../', '/');											
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
								console.log(err);
							  throw err;
							});

							zip.pipe(output);

							//like a for loop 
							function addFolder (files, i) {

								var i = i == undefined ? 0 : i;
								
								//no hidden files
								if(!/^\./.test(files[i])) {
									zip.append(
										fs.createReadStream(archive.path + files[i]), 
										{ name: files[i], store: true }, 
										function() {
											//console.log('added', files[i], 'no', i);

											if(i < files.length - 1) {
												i++;
												return addFolder(files, i);
											} else
												return false;
										}
									);
								} else {
									i++;
									return addFolder(files, i);
								}
							
							}

							addFolder(
									fs.readdirSync(archive.path)
								);
							
							zip.finalize(function(err, written) {
								if (err) {
									console.log(err);
								throw err;
								}

								var json = {'error':null, 'download':true};
								res.send(JSON.stringify(json));
						
							});
						}
					});
				}
			}
		);
	});
}