/*
* Database 
*/

// Persistent datastore
var Datastore = require('nedb');

db = {};
db.users = new Datastore('./db/users.db');
db.config = new Datastore('./db/config.db');
db.pathes = new Datastore('./db/pathes.db'); //memory only

db.users.loadDatabase(function(err) {
  if(err) throw err;
});

db.pathes.loadDatabase(function(err) {
  if(err) throw err;

  db.pathes.ensureIndex({ fieldName: 'userFolderKey', unique: true }, function (err) { if(err) throw err; });

});



module.exports = db;