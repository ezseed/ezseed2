var mongoose = require('mongoose')
  , models = require('../../models')
	, Paths = mongoose.model('Paths')
	, Users = mongoose.model('Users')
	, _ = require('underscore');

var paths = {
	byUser : function (uid, cb) {
		Users.findById(uid).populate('paths').exec(function (err, docs) {
			if (err)
				cb(err, {});
			else {

				if(docs) {

				 	var paths = [], p = docs.paths;

				 	for(var i in p)
				 		if(p[i].path !== undefined && p[i].path !== 'paths')
					 		paths.push(p[i].path);
					
					cb(err, {paths : paths, docs : docs});

				} else
					cb(err, {paths: [], docs : null});
				
			}
		});
	},
	getAll : function(cb) {
		Paths.find().lean().exec(function(err, docs) {
			cb(err, docs);
		});
	},
	find : function(id, cb) {
		Paths.findById(id).populate('movies albums others').lean().exec(function (err, docs) {
			cb(err, docs);
		});
	}, 
	save : function(path, username, cb) {
		cb = typeof username === 'function' ? user : cb;

		Paths.findOne({path : path}, function(e, p) {
			if(p) {
				if(typeof username !== 'function') {

					Users.findOneAndUpdate({username: username}, { $addToSet: {paths: p._id} }, function(err) { 
					  cb(err, p);
					});
				} else {
					cb(err, p);
				}
			} else {
				
				var p = new Paths({
					'path' : path
				});

				p.save(function(err) {
					if(err) console.log(err);
				});

				p.on('save', function(obj) {

					if(typeof username !== 'function') {

					    Users.findOneAndUpdate({username: username}, { $addToSet: {paths: obj._id} }, function(err) { 
					    	cb(err, obj);
					    });
					} else
					    cb(null, obj);
				});
			}
		});
	},
	removeByPath : function(path, cb) {
	  	Paths.remove({path : path}, cb);
	},
	remove : function(id, uid, cb) {
	  // If the path isn't user-related, it should not be buggy
	  // but we could count the Users that are watching the path to be removed
	  // if == 0, we can safely delete the path.
	  // Paths.findByIdAndRemove(id, function(err) {
	    Users.findByIdAndUpdate(uid, {$pull : {paths : id}}, function(err) {
	      cb(err);
	    });
	  // });
	},
	resetByFile : function(fid, done) {

		Paths.find().exec(function(err, docs) {

			var i = -1, update = false;

			_.each(docs, function(path, cursor) {

				i = path.albums.indexOf(fid);

				if(i !== -1) {
					docs[cursor].albums.splice(i, 1);
					update = true;
				}

				i = path.movies.indexOf(fid);

				if(i !== -1) {
					docs[cursor].movies.splice(i, 1);
					update = true;
				}

				i = path.others.indexOf(fid);
				if(i !== -1) {
					docs[cursor].others.splice(i, 1);
					update = true;
				}

				if(update) {
					Paths.findByIdAndUpdate(docs[cursor]._id, {movies : docs[cursor].movies, albums : docs[cursor].albums, others : docs[cursor].others }, function(err, num) {
					  console.log(err, num);
					});
					update = false;
				}

			});

			return done();
		});
	}
};

module.exports = paths;