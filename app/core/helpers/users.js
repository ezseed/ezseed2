var _ = require('underscore')
  , cache = require('memory-cache')
  , pretty = require('prettysize')
  , jf = require('jsonfile')
  , fs = require('fs')
  , async = require('async')
  , pathInfo = require('path')
  , bcrypt = require('bcrypt-nodejs')
  , db = require('../database.js');


/**
 * Calcs the directory used size
 * @param  {absolute path}   path
 * @return  {Function} cb   async
 */
var directorySize = function(path, cb) {
  
  var exec = require('child_process').exec, child;

  child = exec('du -sk '+path,
      function (error, stdout, stderr) {

        var size = stdout.match(/([0-9]+)/);

        cb(null, size[0]*1024);
     
    }
  );
} 

/**
 * Count datas founded
 */
var countDatas = function(p, cb) {
  var count = 0;

  if(!_.isArray(p))
    p = [p];

  _.each(p, function(e, i) {
    count += e.albums.length + e.movies.length + e.others.length;
  });

  cb(count);
}

var helper = {
  usedSize : function(paths, cb) {
    var key = 'size_' + new Buffer(paths.paths.join('-')).toString('hex'), cachedSize = cache.get(key);

    if(cachedSize)
      cb({size : cachedSize, pretty : pretty(cachedSize)});
    else {
      async.map(paths.paths, directorySize, function(err, sizes){
          var size = _.reduce(sizes, function(memo, num){ return memo + num; }, 0);
          cache.put(key, size, 10000);
          cb({size : size, pretty : pretty(size)});
      });
    } 
  },
  fetchDatas : function(params) {

    var lastUpdate = cache.get('lastUpdate');

    if(lastUpdate === null)
     cache.put('lastUpdate', params.lastUpdate);
    
    var io = params.io;

    db.files.byUser(params.uid, cache.get('lastUpdate'), function(err, files) {
      if(files) {
        countDatas(files.paths, function(count) {

         if(count > 0) {
            io.sockets.socket(params.sid).emit('files', JSON.stringify(files));
            cache.put('lastUpdate', new Date());
            

            db.users.count(function(err, num) {

              //Space left = disk / users
              var spaceLeft = global.config.diskSpace / num;

              helper.usedSize(paths, function(size) {

                  //(/helpers/users)
                  var percent = size.size / 1024 / 1024;

                  percent = percent / spaceLeft * 100 + '%';

                  spaceLeft = pretty(spaceLeft * 1024 * 1024);

                  io.sockets.socket(socket.id).emit('size', {left : spaceLeft, percent : percent, pretty : size.pretty});

              });

            });

          }
        });
      }
    });

  },
  fetchRemoved : function(params) {
    var path = pathInfo.join(global.config.root, '/public/tmp/', params.uid+'.json');

    if(!fs.existsSync(path))
      jf.writeFileSync(path, []);

    var files = jf.readFileSync(path)
      , nb = files.length;

      while(nb--)
        io.sockets.socket(params.sid).emit('remove', files[nb]);
      
      jf.writeFileSync(path, []);
  },
  /*
  * Authentication fonction
  */
  authenticate : function(name, pass, done) {
    db.user.byUsername(name, function (err, user) {
      //No user
      if (err || _.isEmpty(user)) return done(new Error('cannot find user'));
      
      bcrypt.compare(pass, user.hash, function(err, res){
        if (err) return done(err);
        //password is ok
        if (res === true) return done(null, user.session);

        done(new Error('invalid password'));
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
