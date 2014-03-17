var mongoose = require('mongoose')
  , models = require('../../models')
  , Users = mongoose.model('Users')
  , _ = require('underscore')
  , bcrypt = require('bcrypt-nodejs');

var users = {
  getAll : function(cb) {
    Users.find().lean().populate('paths').exec(function(err, docs) {
      cb(err, docs);
    });
  },
  //Should be moved to user.create
  //username, password, client, role
  create : function(u, done) {
    var password = u.password, username = u.username;

    users.count(function(err, num) {
      
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

    });
  },
  count : function(cb) {
    Users.count(cb);
  },
  delete : function(username, cb) {
    Users.findOne({username : username}, function(err, doc) {
      //Hmm should be improved, only delete paths that aren't linked to another user !
      //commented atm need a fix !
      // var nbPaths = doc.paths.length;
      // if(nbPaths) {
      //   while(nbPaths--) {
      //     //Could be async but it isn't important
      //     Paths.findByIdAndRemove(doc.paths[nbPaths], function(err) {

      //     });
      //   }
      // }
      if(!err && doc) {
        Users.findByIdAndRemove(doc._id, cb);
      } else {
        cb('user ' + username + ' does not exists', null);
      }
    });
  },
  update : function(username, update, cb) {
    if(update.password !== undefined) {
      //Generates the hash
      bcrypt.hash(update.password, null, null, function(err, hash) {
        update = _.extend(update, {hash : hash});
        delete update.password;
        
        Users.findOneAndUpdate({username:username}, update, null, cb);
      });
    } else {
      Users.findOneAndUpdate({username:username}, update, null, cb);
    }
  }
}

module.exports = users;