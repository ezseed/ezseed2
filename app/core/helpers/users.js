var _ = require('underscore')
  , cache = require('memory-cache')
  , pretty = require('prettysize')
  , jf = require('jsonfile')
  , fs = require('fs')
  , async = require('async')
  , pathInfo = require('path')
  , db = require('../database.js');

var directorySize = function(path, cb) {
  
  var exec = require('child_process').exec, child;

  child = exec('du -sk '+path,
      function (error, stdout, stderr) {

        var size = stdout.match(/([0-9]+)/);

        cb(null, size[0]*1024);
     
    }
  );
} 

var usedSize = function(paths, cb) {
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
} 

module.exports.usedSize = usedSize;


var countDatas = function(p, cb) {
  var count = 0;

  if(!_.isArray(p))
    p = [p];

  _.each(p, function(e, i) {
    count += e.albums.length + e.movies.length + e.others.length;
  });

  cb(count);
}

module.exports.fetchDatas = function(params) {

  var lastUpdate = cache.get('lastUpdate');

  if(lastUpdate === null)
   cache.put('lastUpdate', params.lastUpdate);
  
 console.log('Fetch', lastUpdate);

  var io = params.io;

  db.files.byUser(params.uid, cache.get('lastUpdate'), function(err, files) {
    if(files) {
      countDatas(files.paths, function(count) {

        console.log('nbDatas', count);

       if(count !== 0) {
          io.sockets.socket(params.sid).emit('files', JSON.stringify(files));
          cache.put('lastUpdate', new Date());

          usedSize({paths : params.paths}, function(size) {
              io.sockets.socket(params.sid).emit('size', size);
          });
        }
      });
    }
  });

}

module.exports.fetchRemoved = function(params) {
  var path = pathInfo.join(global.config.root, '/public/tmp/', params.uid+'.json');

  if(!fs.existsSync(path))
    jf.writeFileSync(path, []);

  var files = jf.readFileSync(path)
    , nb = files.length;

    console.log(files);

    while(nb--)
      io.sockets.socket(params.sid).emit('remove', files[nb]);
    
    jf.writeFileSync(path, []);
}