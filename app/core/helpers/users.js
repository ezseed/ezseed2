var console = require('../logger');
var _ = require('underscore')
  , cache = require('memory-cache')
  , pretty = require('prettysize')
  , jf = require('jsonfile')
  , fs = require('fs')
  , async = require('async')
  , bcrypt = require('bcrypt-nodejs')
  , db = require('../database');


/**
 * Calcs the directory used size
 * @param  {absolute path}   path
 * @return  {Function} cb   async
 */
var directorySize = function(path, cb) {
  
  var exec = require('child_process').exec, child;

  child = exec('du -sk '+path.replace(' ', '\\ '),
      function (error, stdout, stderr) {

        if(error)
          console.log('error', error);

        var size = stdout.match(/([0-9]+)/);

        if(typeof size == 'object' || typeof size == 'array')
          cb(null, size[0]*1024);
        else
          cb(null, 0);      
    }
  );
} 

var helper = {
  usedSize : function(paths, cb) {
    
    var key = 'size_' + new Buffer(paths.paths.join('-')).toString('hex'), cachedSize = cache.get(key);

    if(cachedSize)
      cb({size : cachedSize, pretty : pretty(cachedSize)});
    else {
      async.map(paths.paths, directorySize, function(err, sizes){

          console.log('debug', 'User size', sizes);

          var size = _.reduce(sizes, function(memo, num){ return memo + num; }, 0);
          cache.put(key, size, 10000);
          cb({size : size, pretty : pretty(size)});
      });
    } 
  },
  /*
  * Authentication fonction
  */
  authenticate : function(name, pass, done) {
    db.user.byUsername(name, function (err, user) {
      //No user
      if (err || _.isEmpty(user)) return done("Cannot find user");
      
      bcrypt.compare(pass, user.hash, function(err, res){
        if (err) return done(err);
        //password is ok
        if (res === true) return done(null, user.session);

        done("Invalid password");
      })
    });
  },
  /*
  * Middleware is logged in
  */
  restrict : function (req, res, next) {
    if (req.session.user) {
      next();
    } else {
      req.session.error = "L'accès à cette section n'est pas autorisé ! <i class='entypo-cross pullRight'></i>";
      res.redirect('/login');
    }
  }
}

module.exports = helper;
