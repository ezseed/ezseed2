/*
 * Retrieving configuration
 */
var colors = require('colors');
var jf = require('jsonfile'), fs = require('fs');

global.conf = jf.readFileSync(__dirname + '/config.json');

if(!fs.existsSync(global.conf.root + '/public/tmp'))
	fs.mkdirSync(global.conf.root + '/public/tmp', '0775');

var console = require(global.conf.root + '/core/logger');

var explorer = require('./watcher/explorer')
  , database = require('./core/database');

/*
 * Mongoose connection
 */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ezseed');

var db = mongoose.connection;
var init = false;

var watcher = {
	interval: null,
	setInterval: function() {
		var self =  this;

		self.interval = setInterval(function() {
			self.parse(self);
		}, !init ? 0 : global.conf.fetchTime);
		
		init = true;
	},
	parse: function() {
		self = this;

		clearInterval(self.interval);

		database.paths.getAll(function(err, docs) {

			var paths = [];

			if(docs) {
				for(var p in docs)
					paths.push(docs[p].path);

				explorer.explore({docs : {paths : docs}, paths : paths}, function(err, update) {
					self.setInterval();
				});
			} else {
				self.setInterval();
			}
		});
	},
};

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('DB opened successfuly !');

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
	// 				setTimeout(callback, global.conf.fetchTime);
	// 			});
	// 		});
	// 	},
	// 	function(err) {
	// 		console.log('Watcher ends', err);
	// 	}
	// );
	
	


});