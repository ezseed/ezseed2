var db = require(global.app_path + '/app/core/database')

module.exports = function(username, done) {
	db.users.delete(username, function(err) {
 		console.log("Utilisateur "+ username + " supprimé".info);
 		done(null, 'aucun');
 	});
}