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

var db = mongoose.connection, t = 0;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	t++;
  console.log('DB opened successfuly !', t);
  require('./core/watcher.js').initFetch();
});