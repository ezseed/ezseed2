/*
 * Retrieving configuration
 */
var jf = require('jsonfile'), fs = require('fs');

global.config = jf.readFileSync(__dirname + '/../app/config.json');

if(!fs.existsSync(global.config.root + '/public/tmp'))
	fs.mkdirSync(global.config.root + '/public/tmp', '0775');

global.log = require(global.config.root+'/core/logger');

var explorer = require(global.config.root + '/core/explorer')
  , database = require(global.config.root +'/core/database');

/*
 * Mongoose connection
 */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ezseed');

var db = mongoose.connection;

var watcher = {
	interval: null,
	setInterval: function(self) {
		var self = self ? self : this;

		self.interval = setInterval(function() {
			self.parse(self);
		}, global.config.fetchTime);
	},
	parse: function(self) {
		self = self ? self : this;

		clearInterval(self.interval);

		database.paths.getAll(function(err, docs) {
			var paths = [];

			if(docs) {
				for(var p in docs)
					paths.push(docs[p].path);
	        
				explorer.explore({docs : {paths : docs}, paths : paths}, function(err, update) {
					self.setInterval(self);
				});
			} else {
				self.setInterval(self);
			}
		});
	},
};

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  global.log('DB opened successfuly !');

	watcher.setInterval();

 //  console.log('DB opened successfuly !');
 //  //require('./core/watcher.js').initFetch();

 //  async.whilst(
	// 	function() { return true; },
	// 	function(callback) {
	// 		database.paths.getAll(function(err, docs) {
	// 			var paths = [];

	// 			if(docs)
	// 				for(var p in docs)
	// 					paths.push(docs[p].path);
		        
	// 			explorer.explore({docs : {paths : docs}, paths : paths}, function(err, update) {
	// 				setTimeout(callback, global.config.fetchTime);
	// 			});
	// 		});
	// 	},
	// 	function(err) {
	// 		console.log('Watcher ends', err);
	// 	}
	// );
	
	


});