var async = require('async')
  , explorer = require('./core/explorer')
  , database = require('./core/database');

/*
 * Retrieving configuration
 */
var jf = require('jsonfile');
global.config = jf.readFileSync(__dirname + '/config.json');

//Writing conf file
if(global.config.root.length == 0) {
  global.config.root = __dirname;
  jf.writeFileSync(__dirname + '/config.json', global.config);
}

/*
 * Mongoose connection
 */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ezseed');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('DB opened successfuly !');
  require('./core/watcher.js').initFetch();

  async.whilst(
		function() { return true; },
		function(callback) {
			database.paths.getAll(function(err, docs) {
				var paths = [];

				if(docs)
					for(var p in docs)
						paths.push(docs[p].path);
		        
				console.log(paths);

				explorer.explore({docs : {paths : docs}, paths : paths}, function(err, update) {
					setTimeout(callback, global.config.fetchTime);
				});
			});
		},
		function(err) {
			console.log('Watcher ends', err);
		}
	);

});