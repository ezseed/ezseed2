var fs = require('fs')
	, _ = require('underscore');

var db = require('../core/database.js');

exports.watch = function(req, res) {
	db.files.movies.byId(req.params.id, function(err, doc) {
		if(err) { 
			console.log(err);
			req.session.error = 'Aucun fichier trouvé';
			res.redirect('/');
		} else {

			var file;

			if(req.params.fid === undefined)
				file = doc.videos[0];
			else
				file = db.file.byId(doc, req.params.fid);
			
			path = file.path;

			doc.episode = file.episode;

			//current working dir
			var cwd = global.config.root.replace('/app', '');

			path = path.replace(cwd, '').replace(global.config.path, '/downloads');

			var fullUrl = 'http://' + req.host + path;

			if(doc.movieType == 'tvseries')
				res.render('watch', { title: 'Ezseed V2 - ' + doc.title , movie: doc, path: path, fullUrl: fullUrl, id:req.params.id, season : true  });
			else
				res.render('watch', { title: 'Ezseed V2 - ' + doc.title , movie: doc, path: path, fullUrl: fullUrl, id:req.params.id, season: null  });
			
		}
		
	});

},
exports.listen = function(req, res) {
	//var path = new Buffer(req.params.id, 'hex').toString(); 
	
	db.files.albums.byId(req.params.id, function(err, doc) {
		if(err) { 
			console.log(err);
			req.session.error = 'Aucun fichier trouvé';
			res.redirect('/');
		} else {

			var cwd = global.config.root.replace('/app', '');

			for(var i in doc.songs)			
				 doc.songs[i].fullUrl = 'http://' + req.host + doc.songs[i].path.replace(cwd, '').replace(global.config.path, '/downloads');
			

			res.render('listen', { title: 'Ezseed V2 - ' + doc.title , album: doc, id:doc._id });
			
		}
		
	});

}