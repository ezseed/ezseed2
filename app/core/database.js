//Requires all the modedl database
var mongoose = require('mongoose')
	, models = require('../models')
	, Paths = mongoose.model('Paths')
	, Users = mongoose.model('Users')
	, Movies = mongoose.model('Movies')
	, Albums = mongoose.model('Albums')
	, Others = mongoose.model('Others')
	, cache = require('memory-cache')
	, async = require('async');

var _ = require('underscore');

module.exports = {
	paths : {
		byUser : function (uid, cb) {
			 Users.findById(uid).populate('paths').exec(function (err, docs) {

			 	var paths = [], p = docs.paths;

			 	for(var i in p)
			 		if(p[i].path !== undefined && p[i].path !== 'paths')
				 		paths.push(p[i].path);
			

			    cb(err, {paths : paths, docs : docs.paths});
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

      var p = new Paths({
       'path' : path
      });

      p.save(function(err) {
       if(err) cb(err, {});
      });

      p.on('save', function(obj) {
        if(typeof username !== 'function') {
          Users.findOneAndUpdate({username: username}, { $addToSet: {paths: obj._id} }, function(err) { 
            cb(err, obj);
          });
        } else
          cb(null, obj);
      });
    },
    remove : function(id, uid, cb) {
      Paths.findByIdAndRemove(id, function(err) {
        Users.findByIdAndUpdate(uid, {$pull : {paths : id}}, function(err) {
          cb(err);
        });
      });
    }
	}, 
  file : {
    byId : function(obj, id) {
      var o = obj.songs || obj.videos || obj.files;

      return _.filter(o, function(o){ return o._id == id; })[0];
    }
  },
  files : {
  		byUser : function (uid, lastUpdate, cb) {

  			Users.findById(uid).lean().populate('paths').exec(function (err, docs) {
  				Paths.populate(docs, 
			  		[
			          { path: 'paths.movies', model: Movies, match: { dateAdded: {"$gt":lastUpdate} }, lean : true },
			          { path: 'paths.albums', model: Albums, match: { dateAdded: {"$gt":lastUpdate} }, lean : true },
			          { path: 'paths.others', model: Others, match: { dateAdded: {"$gt":lastUpdate} }, lean : true }
			        ],
			        function(err, docs) {
			          cb(err, docs);
			        
			        }
  				)
  			});
  		},
      byId : function(id, cb) {
        var result = [], errs = [];

        Movies.findById(id).lean().exec(function(err, docs) {
          if(docs !== null) result.push(docs);
          if(err !== null) errs.push(err);
          Albums.findById(id).lean().exec(function(err, docs) {
           if(docs !== null)result.push(docs);
           if(err !== null) errs.push(err);
            Others.findById(id).lean().exec(function(err, docs) {
              if(docs !== null)result.push(docs);
              if(err !== null) errs.push(err);
              cb(err, result[0]);
            });
          });
        });
      },
  		albums : {
  			delete : function(id, cb) {
  				Albums.findByIdAndRemove(id, function(err) {
  					cb(err);
  				});
  			},
        byId : function(id, cb) {
          Albums.findById(id).lean(true).exec(function(err, doc) {
            cb(err, doc);
          });
        },
  			save : function (obj, saveCallback) {
  				async.each(obj.albums, 
  					function(album, cb) {

  						album = new Albums(album);

  						album.save(function(err, album) {
  							Paths.findByIdAndUpdate(
		    					obj.id_path, 
		    					{ $addToSet : {'albums': album._id }, 'dateUpdated': Date.now() }, 
		    					function(err) { 
		    						return cb(err);
		    					}
		    				);
  						});

  					},
  					function (err) {
  						saveCallback(err, obj.albums);
  					}
  				);
	      }		
  		},
  		movies : {
  			delete : function(id, cb) {
  				Movies.findByIdAndRemove(id, function(err) {
  					cb(err);
  				});
  			},
        byId : function(id, cb) {
          Movies.findById(id).lean(true).exec(function(err, doc) {
            cb(err, doc);
          });
        },
  			save : function (obj, saveCallback) {
  				async.each(obj.movies, 
  					function(movie, cb) {

  						movie = new Movies(movie);

  						movie.save(function(err, movie) {
  							Paths.findByIdAndUpdate(
		    					obj.id_path, 
		    					{ $addToSet : {'movies': movie._id }, 'dateUpdated': Date.now() }, 
		    					function(err) { 
		    						return cb(err);
		    					}
		    				);
  						});

  					},
  					function (err) {
  						saveCallback(err, obj.movies);
  					}
  				);
  			}
  		},
  		others : {
  			delete : function(id, cb) {
  				Others.findByIdAndRemove(id, function(err) {
  					cb(err);
  				});
  			},
  			save : function(obj, saveCallback) {
  				async.each(obj.others, 
  					function(other, cb) {

  						other = new Others(other);

  						other.save(function(err, other) {
  							Paths.findByIdAndUpdate(
		    					obj.id_path, 
		    					{ $addToSet : {'others': other._id }, 'dateUpdated': Date.now() }, 
		    					function(err) { 
		    						return cb(err);
		    					}
		    				);
  						});

  					},
  					function (err) {
  						saveCallback(err, obj.others);
  					}
  				);
  			}
  		}
 	},
  users : {
    getAll : function(cb) {
      Users.find().lean().populate('paths').exec(function(err, docs) {
        cb(err, docs);
      });
    },
    //username, password, client, role
    create : function(u, done) {
      var password = u.password, username = u.username;

      var bcrypt = require('bcrypt-nodejs');

      //Generates the hash
      bcrypt.hash(password, null, null, function(err, hash) {

        //We save only the hash
        // var user = new Users ({
        //   username : username,
        //   role : 'admin',
        //   client : client,
        //   hash : hash
        // });

        Users.findOne({username : username}, function (err, doc){
          if(doc) {
            doc.role = u.role ? u.role : 'user';
            doc.hash = hash;
            doc.client = u.client ? u.client : 'aucun';
          } else {
            doc = new Users ({
              username : username,
              role : u.role ? u.role : 'user',
              hash : hash,
              client : u.client ? u.client : 'aucun'
            });
          }
          
          doc.save(function(err) {
            if(err) {
              //Checking for the username validation - see models/index.js
              if(_.isEqual(err.name, 'ValidationError'))
                done("Le nom d'utilisateur ne peut contenir que des caractères alphanumériques et des tirets", null);
              else
                done(err, null);
            } else
              done(null, doc);
          });
        });

      });
    },
    count : function(cb) {
      Users.count(cb);
    },
    delete : function(username, cb) {
      Users.findOneAndRemove({username: username}, cb);
    },
    update : function(username, update, cb) {
      if(update.password !== undefined) {
         var bcrypt = require('bcrypt-nodejs');

        //Generates the hash
        bcrypt.hash(password, null, null, function(err, hash) {
          update = _.extend(update, {hash : hash});
          delete update.password;
          Users.findOneAndUpdate({username:username}, update, null, cb);
        });
      } else {
        Users.findOneAndUpdate({username:username}, update, null, cb);
      }
    }
  }
};

