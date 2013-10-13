var _ = require('underscore')
  , cache = require('memory-cache')
  , pretty = require('prettysize')
  , async = require('async');

var directorySize = function(path, cb) {

  var exec = require('child_process').exec, child;

  child = exec('du -sk '+path,
      function (error, stdout, stderr) {

        var size = stdout.match(/([0-9]+)/);

        cb(error, size[0]*1024);
    }
  );
} 

module.exports.usedSize = function(paths, cb) {
  var key = 'size_' + new Buffer(paths.paths.join('-')).toString('hex'), cachedSize = cache.get(key);

  if(cachedSize)
    cb(pretty(cachedSize));
  else {
    async.map(paths.paths, directorySize, function(err, sizes){
        var size = _.reduce(sizes, function(memo, num){ return memo + num; }, 0);
        cache.put(key, size, 10000);
        cb(pretty(size));
    });
  } 
} 