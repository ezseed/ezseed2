var fs = require('fs')
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

var ffmpeg = require('fluent-ffmpeg');

exports.watch = function(req, res) {
	var path = new Buffer(req.params.id, 'hex').toString(); 
	
	Movies.findById(req.params.id).lean(true).exec(function(err, doc) {
		if(err) { 
			console.log(err);
			req.session.error = 'Aucun fichier trouvé';
			res.redirect('/');
		} else {

			var cwd = process.cwd().replace('/app', '');

			path = path.replace(cwd, '');

			var fullUrl = 'http://' + req.host + ':'+ req.app.settings.port + path;

			if(doc.type == 'tvseries') {
				Movies.find({title:doc.title, season: doc.season}).lean(true).exec(function(err, serie) {
					res.render('watch', { title: 'Ezseed V2 - ' + doc.title , movie: doc, path: path, fullUrl: fullUrl, id:req.params.id, season : serie  });
				});
			} else
				res.render('watch', { title: 'Ezseed V2 - ' + doc.title , movie: doc, path: path, fullUrl: fullUrl, id:req.params.id, season: null  });
			
		}
		
	});

},
exports.listen = function(req, res) {
	//var path = new Buffer(req.params.id, 'hex').toString(); 
	
	Albums.findById(req.params.id).lean(true).exec(function(err, doc) {
		if(err) { 
			console.log(err);
			req.session.error = 'Aucun fichier trouvé';
			res.redirect('/');
		} else {

			var cwd = process.cwd().replace('/app', '');

			for(var i in doc.files)			
				 doc.files[i].fullUrl = 'http://' + req.host + ':'+ req.app.settings.port + doc.files[i].path.replace(cwd, '');
			

			res.render('listen', { title: 'Ezseed V2 - ' + doc.title , album: doc, id:req.params.id });
			
		}
		
	});

},
exports.stream = function(req, res) {

	var path = new Buffer(req.params.id, 'hex').toString(); 
	
	Movies.findById(req.params.id).lean(true).exec(function(err, doc) {
		if(err) { 
			console.log(err);
			req.session.error = 'Aucun fichier trouvé';
			res.redirect('/');
		} else {

			res.contentType('m4v');
			// make sure you set the correct path to your video file storage
			var proc = new ffmpeg({ source: path, nolog: false })
			// use the 'flashvideo' preset (located in /lib/presets/flashvideo.js)
			.usingPreset('divx')
			// save to stream
			.writeToStream(res, function(retcode, error){
				console.log(error);
				console.log(retcode);
			  console.log('file has been converted succesfully');
			});
		}
		
	});

}